import { auth } from '@/lib/auth'
import { supabaseAdmin } from '@/lib/supabase/admin'
import { NextResponse } from 'next/server'
import { z } from 'zod'

/**
 * GET /api/admin/members/:id — Full member detail
 */
export async function GET(request, { params }) {
  try {
    const session = await auth()
    if (!session || (session.user.role !== 'owner' && session.user.role !== 'admin' && session.user.role !== 'employee')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    if (!supabaseAdmin) {
      return NextResponse.json({ error: 'Database unavailable' }, { status: 500 })
    }

    const { id } = await params

    const [userRes, bookingsRes, creditsRes, waitlistRes] = await Promise.all([
      supabaseAdmin
        .from('users')
        .select('id, email, name, phone, avatar_url, bio, role, google_id, created_at')
        .eq('id', id)
        .single(),
      supabaseAdmin
        .from('bookings')
        .select('id, status, late_cancel, credit_returned, created_at, cancelled_at, class_schedule(id, starts_at, class_types(name, color), instructors(name))')
        .eq('user_id', id)
        .order('created_at', { ascending: false })
        .limit(50),
      supabaseAdmin
        .from('user_credits')
        .select('id, credits_total, credits_remaining, expires_at, status, purchased_at, class_packs(name), stripe_payment_id')
        .eq('user_id', id)
        .order('purchased_at', { ascending: false }),
      supabaseAdmin
        .from('waitlist')
        .select('id, position, created_at, class_schedule(id, starts_at, class_types(name))')
        .eq('user_id', id)
        .order('created_at', { ascending: false }),
    ])

    if (!userRes.data) {
      return NextResponse.json({ error: 'Member not found' }, { status: 404 })
    }

    // Compute stats
    const bookings = bookingsRes.data || []
    const totalBookings = bookings.filter((b) => b.status === 'confirmed').length
    const cancelledBookings = bookings.filter((b) => b.status === 'cancelled').length
    const lastBooking = bookings.find((b) => b.status === 'confirmed')

    const credits = creditsRes.data || []
    const activeCredits = credits
      .filter((c) => c.status === 'active' && new Date(c.expires_at) > new Date())
      .reduce((sum, c) => sum + (c.credits_remaining ?? 0), 0)

    return NextResponse.json({
      member: userRes.data,
      bookings,
      credits,
      waitlist: waitlistRes.data || [],
      stats: {
        totalBookings,
        cancelledBookings,
        activeCredits,
        lastVisit: lastBooking?.class_schedule?.starts_at || null,
      },
    })
  } catch (error) {
    console.error('[admin/members/id] Error:', error)
    return NextResponse.json({ error: 'Something went wrong.' }, { status: 500 })
  }
}

const editMemberSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  email: z.string().email().optional(),
  phone: z.string().max(20).nullable().optional(),
  role: z.enum(['member', 'admin', 'employee', 'frozen', 'owner']).optional(),
})

/**
 * PUT /api/admin/members/:id — Edit member profile
 */
export async function PUT(request, { params }) {
  try {
    const session = await auth()
    if (!session || (session.user.role !== 'owner' && session.user.role !== 'admin' && session.user.role !== 'employee')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    if (!supabaseAdmin) {
      return NextResponse.json({ error: 'Database unavailable' }, { status: 500 })
    }

    const { id } = await params
    const body = await request.json()
    const parsed = editMemberSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid input' }, { status: 400 })
    }

    // Employees cannot change roles
    if (session.user.role === 'employee' && parsed.data.role !== undefined) {
      return NextResponse.json({ error: 'Employees cannot change member roles' }, { status: 403 })
    }

    // Block employees from editing admin/owner accounts (prevents email-based account takeover)
    const { data: targetUser } = await supabaseAdmin
      .from('users')
      .select('role')
      .eq('id', id)
      .single()

    if (!targetUser) {
      return NextResponse.json({ error: 'Member not found' }, { status: 404 })
    }

    if (session.user.role === 'employee' && (targetUser.role === 'admin' || targetUser.role === 'owner')) {
      return NextResponse.json({ error: 'Cannot edit admin accounts' }, { status: 403 })
    }

    // Admins cannot edit other admins or the owner
    if (session.user.role === 'admin' && (targetUser.role === 'admin' || targetUser.role === 'owner')) {
      if (id !== session.user.id) {
        return NextResponse.json({ error: 'Admins cannot edit other admin accounts' }, { status: 403 })
      }
    }

    // Only owner can assign admin/owner roles or freeze admins/owners
    if (parsed.data.role === 'admin' || parsed.data.role === 'owner') {
      if (session.user.role !== 'owner') {
        return NextResponse.json({ error: 'Only the owner can assign admin roles' }, { status: 403 })
      }
    }
    if (parsed.data.role === 'frozen' && (targetUser.role === 'admin' || targetUser.role === 'owner')) {
      if (session.user.role !== 'owner') {
        return NextResponse.json({ error: 'Only the owner can freeze admin accounts' }, { status: 403 })
      }
    }

    const updates = {}
    if (parsed.data.name !== undefined) updates.name = parsed.data.name
    if (parsed.data.email !== undefined) updates.email = parsed.data.email.toLowerCase()
    if (parsed.data.phone !== undefined) updates.phone = parsed.data.phone
    if (parsed.data.role !== undefined) updates.role = parsed.data.role

    const { error } = await supabaseAdmin
      .from('users')
      .update(updates)
      .eq('id', id)

    if (error) {
      if (error.code === '23505') {
        return NextResponse.json({ error: 'Email already in use' }, { status: 409 })
      }
      console.error('[admin/members/id] Update error:', error)
      return NextResponse.json({ error: 'Failed to update member' }, { status: 500 })
    }

    // Get updated member info for audit details
    const { data: updatedMember } = await supabaseAdmin
      .from('users')
      .select('name, email')
      .eq('id', id)
      .single()

    await supabaseAdmin.from('admin_audit_log').insert({
      admin_id: session.user.id,
      action: 'edit_member',
      target_type: 'user',
      target_id: id,
      details: { memberName: updatedMember?.name, memberEmail: updatedMember?.email, changes: updates },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('[admin/members/id] Error:', error)
    return NextResponse.json({ error: 'Something went wrong.' }, { status: 500 })
  }
}

/**
 * DELETE /api/admin/members/:id — Freeze member
 * Preserves all data but blocks login. Cancels future bookings and removes from waitlists.
 * Reversible by admin via PUT (set role back to 'member').
 */
export async function DELETE(request, { params }) {
  try {
    const session = await auth()
    if (!session || (session.user.role !== 'owner' && session.user.role !== 'admin' && session.user.role !== 'employee')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    if (!supabaseAdmin) {
      return NextResponse.json({ error: 'Database unavailable' }, { status: 500 })
    }

    // Employees cannot freeze members
    if (session.user.role === 'employee') {
      return NextResponse.json({ error: 'Employees cannot freeze members' }, { status: 403 })
    }

    const { id } = await params

    if (id === session.user.id) {
      return NextResponse.json({ error: 'Cannot freeze your own account' }, { status: 400 })
    }

    // Check current status
    const { data: user } = await supabaseAdmin
      .from('users')
      .select('role')
      .eq('id', id)
      .single()

    if (!user) {
      return NextResponse.json({ error: 'Member not found' }, { status: 404 })
    }

    if (user.role === 'frozen') {
      return NextResponse.json({ error: 'Member is already frozen' }, { status: 400 })
    }

    // Only owner can freeze admins or other owners
    if ((user.role === 'admin' || user.role === 'owner') && session.user.role !== 'owner') {
      return NextResponse.json({ error: 'Only the owner can freeze admin accounts' }, { status: 403 })
    }

    // Cancel future confirmed bookings (return credits)
    const { data: futureBookings } = await supabaseAdmin
      .from('bookings')
      .select('id, class_schedule_id, user_credit_id')
      .eq('user_id', id)
      .eq('status', 'confirmed')

    const futureIds = []
    if (futureBookings) {
      for (const b of futureBookings) {
        // Check if class is in the future
        const { data: schedule } = await supabaseAdmin
          .from('class_schedule')
          .select('starts_at')
          .eq('id', b.class_schedule_id)
          .single()

        if (schedule && new Date(schedule.starts_at) > new Date()) {
          futureIds.push(b.id)
          // Return credit
          if (b.user_credit_id) {
            await supabaseAdmin.rpc('increment_credits', { credit_id: b.user_credit_id, amount: 1 }).catch(() => {
              // Fallback: direct update
              supabaseAdmin
                .from('user_credits')
                .update({ credits_remaining: supabaseAdmin.raw('credits_remaining + 1') })
                .eq('id', b.user_credit_id)
            })
          }
        }
      }

      if (futureIds.length > 0) {
        await supabaseAdmin
          .from('bookings')
          .update({ status: 'cancelled', credit_returned: true })
          .in('id', futureIds)
      }
    }

    // Remove from waitlists
    await supabaseAdmin.from('waitlist').delete().eq('user_id', id)

    // Freeze: set role to 'frozen' — preserves all data
    const { error } = await supabaseAdmin
      .from('users')
      .update({ role: 'frozen' })
      .eq('id', id)

    if (error) {
      console.error('[admin/members/id] Freeze error:', error)
      return NextResponse.json({ error: 'Failed to freeze member' }, { status: 500 })
    }

    // Get member info for audit details
    const { data: frozenMember } = await supabaseAdmin
      .from('users')
      .select('name, email')
      .eq('id', id)
      .single()

    await supabaseAdmin.from('admin_audit_log').insert({
      admin_id: session.user.id,
      action: 'freeze_member',
      target_type: 'user',
      target_id: id,
      details: { memberName: frozenMember?.name, memberEmail: frozenMember?.email, cancelled_bookings: futureIds.length },
    })

    return NextResponse.json({ success: true, cancelled_bookings: futureIds.length })
  } catch (error) {
    console.error('[admin/members/id] Error:', error)
    return NextResponse.json({ error: 'Something went wrong.' }, { status: 500 })
  }
}
