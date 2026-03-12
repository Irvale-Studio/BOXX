import { supabaseAdmin } from '@/lib/supabase/admin'
import { sendClassReminder } from '@/lib/email'
import { NextResponse } from 'next/server'

/**
 * GET /api/cron/reminders — Send reminders for classes starting in ~1 hour
 * Run every 15 minutes via Vercel Cron
 */
export async function GET(request) {
  // Verify cron secret
  const authHeader = request.headers.get('authorization')
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  if (!supabaseAdmin) {
    return NextResponse.json({ error: 'Database unavailable' }, { status: 500 })
  }

  try {
    const now = new Date()
    const oneHourFromNow = new Date(now.getTime() + 60 * 60 * 1000)
    const windowStart = new Date(oneHourFromNow.getTime() - 10 * 60 * 1000) // 50 min
    const windowEnd = new Date(oneHourFromNow.getTime() + 10 * 60 * 1000) // 70 min

    // Find classes starting in 50-70 minutes
    const { data: classes } = await supabaseAdmin
      .from('class_schedule')
      .select('id, starts_at, class_types(name), instructors(name)')
      .eq('status', 'active')
      .gte('starts_at', windowStart.toISOString())
      .lte('starts_at', windowEnd.toISOString())

    if (!classes || classes.length === 0) {
      return NextResponse.json({ sent: 0 })
    }

    let sent = 0

    for (const cls of classes) {
      // Get confirmed bookings for this class
      const { data: bookings } = await supabaseAdmin
        .from('bookings')
        .select('user_id, users(email, name)')
        .eq('class_schedule_id', cls.id)
        .eq('status', 'confirmed')
        .eq('reminder_2h_sent', false)

      if (!bookings || bookings.length === 0) continue

      const time = new Date(cls.starts_at).toLocaleTimeString('en-US', {
        hour: 'numeric',
        minute: '2-digit',
        timeZone: 'Asia/Bangkok',
      })

      for (const b of bookings) {
        if (!b.users?.email) continue
        try {
          await sendClassReminder({
            to: b.users.email,
            name: b.users.name,
            className: cls.class_types?.name || 'Class',
            instructor: cls.instructors?.name,
            time,
          })

          // Mark reminder as sent
          await supabaseAdmin
            .from('bookings')
            .update({ reminder_2h_sent: true })
            .eq('class_schedule_id', cls.id)
            .eq('user_id', b.user_id)
            .eq('status', 'confirmed')

          sent++
        } catch (err) {
          console.error(`[cron/reminders] Failed for ${b.users.email}:`, err)
        }
      }
    }

    return NextResponse.json({ sent })
  } catch (error) {
    console.error('[cron/reminders] Error:', error)
    return NextResponse.json({ error: 'Cron failed' }, { status: 500 })
  }
}
