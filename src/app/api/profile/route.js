import { auth } from '@/lib/auth'
import { supabaseAdmin } from '@/lib/supabase/admin'
import { NextResponse } from 'next/server'
import { z } from 'zod'

const profileSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  phone: z.string().max(20).optional(),
  bio: z.string().max(120).optional(),
  show_in_roster: z.boolean().optional(),
})

/**
 * PUT /api/profile — Update user profile
 */
export async function PUT(request) {
  try {
    const session = await auth()
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const parsed = profileSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid input' }, { status: 400 })
    }

    if (!supabaseAdmin) {
      return NextResponse.json({ error: 'Database unavailable' }, { status: 500 })
    }

    const { error } = await supabaseAdmin
      .from('users')
      .update(parsed.data)
      .eq('id', session.user.id)

    if (error) {
      console.error('[profile] Update error:', error)
      return NextResponse.json({ error: 'Failed to update profile' }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('[profile] Error:', error)
    return NextResponse.json({ error: 'Something went wrong.' }, { status: 500 })
  }
}

/**
 * DELETE /api/profile — Delete account and all associated data
 */
export async function DELETE(request) {
  try {
    const session = await auth()
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { confirmation } = body

    if (confirmation !== 'DELETE') {
      return NextResponse.json({ error: 'Please type DELETE to confirm' }, { status: 400 })
    }

    if (!supabaseAdmin) {
      return NextResponse.json({ error: 'Database unavailable' }, { status: 500 })
    }

    const userId = session.user.id

    // Cancel future bookings
    await supabaseAdmin
      .from('bookings')
      .update({ status: 'cancelled' })
      .eq('user_id', userId)
      .eq('status', 'confirmed')

    // Remove from waitlists
    await supabaseAdmin
      .from('waitlist')
      .delete()
      .eq('user_id', userId)

    // Void remaining credits
    await supabaseAdmin
      .from('user_credits')
      .update({ credits_remaining: 0 })
      .eq('user_id', userId)

    // Anonymize user record (keep for booking history integrity)
    const { error } = await supabaseAdmin
      .from('users')
      .update({
        email: `deleted-${userId}@removed.local`,
        name: 'Deleted User',
        phone: null,
        bio: null,
        avatar_url: null,
        google_id: null,
        password_hash: null,
      })
      .eq('id', userId)

    if (error) {
      console.error('[profile] Delete error:', error)
      return NextResponse.json({ error: 'Failed to delete account' }, { status: 500 })
    }

    return NextResponse.json({ message: 'Account deleted' })
  } catch (error) {
    console.error('[profile] Delete error:', error)
    return NextResponse.json({ error: 'Something went wrong.' }, { status: 500 })
  }
}
