import { auth } from '@/lib/auth'
import { supabaseAdmin } from '@/lib/supabase/admin'
import { NextResponse } from 'next/server'
import { z } from 'zod'

const deleteSchema = z.object({
  classScheduleId: z.string().regex(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i, 'Invalid ID'),
})

/**
 * POST /api/admin/schedule/delete — Permanently delete a cancelled class
 *
 * Only classes with status='cancelled' can be deleted.
 *
 * Cascading deletes:
 * 1. Delete all bookings for this class
 * 2. Delete all waitlist entries for this class
 * 3. Delete the class_schedule row
 * 4. Log in admin_audit_log
 */
export async function POST(request) {
  try {
    const session = await auth()
    if (!session || (session.user.role !== 'owner' && session.user.role !== 'admin' && session.user.role !== 'employee')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    if (!supabaseAdmin) {
      return NextResponse.json({ error: 'Database unavailable' }, { status: 500 })
    }

    const body = await request.json()
    const parsed = deleteSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid input' }, { status: 400 })
    }

    const { classScheduleId } = parsed.data

    // Verify the class exists and is cancelled
    const { data: cls, error: clsError } = await supabaseAdmin
      .from('class_schedule')
      .select('id, status, starts_at, recurring_id, class_types(name)')
      .eq('id', classScheduleId)
      .single()

    if (clsError || !cls) {
      return NextResponse.json({ error: 'Class not found' }, { status: 404 })
    }

    if (cls.status !== 'cancelled') {
      return NextResponse.json({ error: 'Only cancelled classes can be permanently deleted' }, { status: 400 })
    }

    // 1. Delete all bookings for this class
    const { data: deletedBookings, error: bookingsError } = await supabaseAdmin
      .from('bookings')
      .delete()
      .eq('class_schedule_id', classScheduleId)
      .select('id')

    if (bookingsError) {
      console.error('[admin/schedule/delete] Bookings delete error:', bookingsError)
      return NextResponse.json({ error: 'Failed to delete associated bookings' }, { status: 500 })
    }

    // 2. Delete all waitlist entries for this class
    const { data: deletedWaitlist, error: waitlistError } = await supabaseAdmin
      .from('waitlist')
      .delete()
      .eq('class_schedule_id', classScheduleId)
      .select('id')

    if (waitlistError) {
      console.error('[admin/schedule/delete] Waitlist delete error:', waitlistError)
      return NextResponse.json({ error: 'Failed to delete associated waitlist entries' }, { status: 500 })
    }

    // 3. Delete the class_schedule row
    const { error: deleteError } = await supabaseAdmin
      .from('class_schedule')
      .delete()
      .eq('id', classScheduleId)

    if (deleteError) {
      console.error('[admin/schedule/delete] Class delete error:', deleteError)
      return NextResponse.json({ error: 'Failed to delete class' }, { status: 500 })
    }

    // 4. Audit log
    await supabaseAdmin.from('admin_audit_log').insert({
      admin_id: session.user.id,
      action: 'delete_cancelled_class',
      target_type: 'class_schedule',
      target_id: classScheduleId,
      details: {
        className: cls.class_types?.name,
        startsAt: cls.starts_at,
        recurringId: cls.recurring_id || null,
        bookingsDeleted: deletedBookings?.length || 0,
        waitlistDeleted: deletedWaitlist?.length || 0,
      },
    })

    return NextResponse.json({
      success: true,
      bookingsDeleted: deletedBookings?.length || 0,
      waitlistDeleted: deletedWaitlist?.length || 0,
    })
  } catch (error) {
    console.error('[admin/schedule/delete] Error:', error)
    return NextResponse.json({ error: 'Something went wrong.' }, { status: 500 })
  }
}
