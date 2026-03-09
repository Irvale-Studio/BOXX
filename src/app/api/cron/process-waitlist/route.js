import { supabaseAdmin } from '@/lib/supabase/admin'
import { sendWaitlistPromotion } from '@/lib/email'
import { NextResponse } from 'next/server'

/**
 * GET /api/cron/process-waitlist — Auto-book waitlisted users when spots open
 * Run every 5 minutes via Vercel Cron
 */
export async function GET(request) {
  const authHeader = request.headers.get('authorization')
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  if (!supabaseAdmin) {
    return NextResponse.json({ error: 'Database unavailable' }, { status: 500 })
  }

  try {
    const now = new Date()
    let promoted = 0

    // Get active future classes that have waitlisted users
    const { data: waitlisted } = await supabaseAdmin
      .from('waitlist')
      .select('id, user_id, position, class_schedule_id, class_schedule(id, capacity, starts_at, status, class_types(name), instructors(name))')
      .order('position', { ascending: true })

    if (!waitlisted || waitlisted.length === 0) {
      return NextResponse.json({ promoted: 0 })
    }

    // Group by class_schedule_id
    const byClass = {}
    for (const w of waitlisted) {
      if (!w.class_schedule) continue
      if (w.class_schedule.status !== 'active') continue
      if (new Date(w.class_schedule.starts_at) <= now) continue
      if (!byClass[w.class_schedule_id]) byClass[w.class_schedule_id] = []
      byClass[w.class_schedule_id].push(w)
    }

    for (const [classId, entries] of Object.entries(byClass)) {
      // Count confirmed bookings
      const { count } = await supabaseAdmin
        .from('bookings')
        .select('id', { count: 'exact', head: true })
        .eq('class_schedule_id', classId)
        .eq('status', 'confirmed')

      const cls = entries[0].class_schedule
      const spotsAvailable = cls.capacity - (count || 0)

      if (spotsAvailable <= 0) continue

      // Promote waitlisted users (in position order)
      const toPromote = entries.slice(0, spotsAvailable)

      for (const entry of toPromote) {
        // Check user has credits
        const { data: credits } = await supabaseAdmin
          .from('user_credits')
          .select('id, credits_remaining')
          .eq('user_id', entry.user_id)
          .gt('credits_remaining', 0)
          .gt('expires_at', now.toISOString())
          .order('expires_at', { ascending: true })
          .limit(1)

        if (!credits || credits.length === 0) {
          // No credits — skip, leave on waitlist
          continue
        }

        // Deduct credit
        await supabaseAdmin
          .from('user_credits')
          .update({ credits_remaining: credits[0].credits_remaining - 1 })
          .eq('id', credits[0].id)

        // Create booking
        await supabaseAdmin
          .from('bookings')
          .insert({
            user_id: entry.user_id,
            class_schedule_id: classId,
            user_credit_id: credits[0].id,
            status: 'confirmed',
          })

        // Remove from waitlist
        await supabaseAdmin
          .from('waitlist')
          .delete()
          .eq('id', entry.id)

        // Send email
        const { data: user } = await supabaseAdmin
          .from('users')
          .select('email, name')
          .eq('id', entry.user_id)
          .single()

        if (user?.email) {
          const date = new Date(cls.starts_at).toLocaleDateString('en-US', {
            weekday: 'long',
            month: 'long',
            day: 'numeric',
            timeZone: 'Asia/Bangkok',
          })
          const time = new Date(cls.starts_at).toLocaleTimeString('en-US', {
            hour: 'numeric',
            minute: '2-digit',
            timeZone: 'Asia/Bangkok',
          })

          try {
            await sendWaitlistPromotion({
              to: user.email,
              name: user.name,
              className: cls.class_types?.name || 'BOXX Class',
              date,
              time,
            })
          } catch (err) {
            console.error(`[cron/process-waitlist] Email failed for ${user.email}:`, err)
          }
        }

        promoted++
      }

      // Reorder remaining waitlist positions
      const { data: remaining } = await supabaseAdmin
        .from('waitlist')
        .select('id, position')
        .eq('class_schedule_id', classId)
        .order('position', { ascending: true })

      if (remaining) {
        for (let i = 0; i < remaining.length; i++) {
          if (remaining[i].position !== i + 1) {
            await supabaseAdmin
              .from('waitlist')
              .update({ position: i + 1 })
              .eq('id', remaining[i].id)
          }
        }
      }
    }

    return NextResponse.json({ promoted })
  } catch (error) {
    console.error('[cron/process-waitlist] Error:', error)
    return NextResponse.json({ error: 'Cron failed' }, { status: 500 })
  }
}
