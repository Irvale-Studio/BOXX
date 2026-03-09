import { auth } from '@/lib/auth'
import { supabaseAdmin } from '@/lib/supabase/admin'
import { NextResponse } from 'next/server'
import { z } from 'zod'

const notifySchema = z.object({
  classId: z.string().min(1),
})

/**
 * POST /api/admin/schedule/notify — Notify booked members about class changes
 * Stub: will send emails once Resend is configured
 */
export async function POST(request) {
  try {
    const session = await auth()
    if (!session || session.user.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    if (!supabaseAdmin) {
      return NextResponse.json({ error: 'Database unavailable' }, { status: 500 })
    }

    const body = await request.json()
    const parsed = notifySchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid input' }, { status: 400 })
    }

    const { classId } = parsed.data

    // Get class details
    const { data: cls } = await supabaseAdmin
      .from('class_schedule')
      .select('*, class_types(name), instructors(name)')
      .eq('id', classId)
      .single()

    if (!cls) {
      return NextResponse.json({ error: 'Class not found' }, { status: 404 })
    }

    // Get booked members
    const { data: bookings } = await supabaseAdmin
      .from('bookings')
      .select('users(id, name, email)')
      .eq('class_schedule_id', classId)
      .eq('status', 'confirmed')

    const members = (bookings || []).map((b) => b.users).filter(Boolean)

    if (members.length === 0) {
      return NextResponse.json({ sent: 0, message: 'No members to notify' })
    }

    // TODO: Send emails via Resend once configured
    // For now, just log and audit
    console.log(`[notify] Would email ${members.length} members about class ${cls.class_types?.name} changes`)

    await supabaseAdmin.from('admin_audit_log').insert({
      admin_id: session.user.id,
      action: 'notify_class_change',
      target_type: 'class_schedule',
      target_id: classId,
      details: { memberCount: members.length, emails: members.map((m) => m.email) },
    })

    return NextResponse.json({
      sent: members.length,
      message: `Notification queued for ${members.length} member${members.length !== 1 ? 's' : ''}`,
    })
  } catch (error) {
    console.error('[admin/schedule/notify] Error:', error)
    return NextResponse.json({ error: 'Something went wrong.' }, { status: 500 })
  }
}
