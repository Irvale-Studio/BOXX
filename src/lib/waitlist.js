import { supabaseAdmin } from '@/lib/supabase/admin'
import { sendWaitlistPromotion } from '@/lib/email'

/**
 * Promote the first eligible waitlisted user into a class.
 * Call this whenever a spot opens (member cancel, admin remove, etc).
 *
 * @param {string} classScheduleId — The class to check
 * @returns {{ promoted: boolean, userId?: string }} — Whether someone was promoted
 */
export async function promoteFromWaitlist(classScheduleId) {
  if (!supabaseAdmin) return { promoted: false }

  try {
    // Get class info
    const { data: cls } = await supabaseAdmin
      .from('class_schedule')
      .select('id, capacity, starts_at, status, tenant_id, class_types(name), instructors(name)')
      .eq('id', classScheduleId)
      .single()

    if (!cls || cls.status !== 'active' || new Date(cls.starts_at) <= new Date()) {
      return { promoted: false }
    }

    // Count confirmed bookings
    const { count } = await supabaseAdmin
      .from('bookings')
      .select('id', { count: 'exact', head: true })
      .eq('class_schedule_id', classScheduleId)
      .eq('status', 'confirmed')

    if ((count || 0) >= cls.capacity) {
      return { promoted: false }
    }

    // Get first waitlisted user (by position)
    const { data: entries } = await supabaseAdmin
      .from('waitlist')
      .select('id, user_id, position')
      .eq('class_schedule_id', classScheduleId)
      .order('position', { ascending: true })

    if (!entries || entries.length === 0) {
      return { promoted: false }
    }

    // Try each waitlisted user in order until one has credits
    let promotedUserId = null

    for (const entry of entries) {
      const now = new Date()

      // Check user has valid credits
      const { data: credits } = await supabaseAdmin
        .from('user_credits')
        .select('id, credits_remaining')
        .eq('user_id', entry.user_id)
        .gt('credits_remaining', 0)
        .gt('expires_at', now.toISOString())
        .order('expires_at', { ascending: true })
        .limit(1)

      if (!credits || credits.length === 0) {
        continue // No credits — skip, try next
      }

      // Deduct credit
      await supabaseAdmin
        .from('user_credits')
        .update({ credits_remaining: credits[0].credits_remaining - 1 })
        .eq('id', credits[0].id)

      // Create booking
      const { error: bookingError } = await supabaseAdmin
        .from('bookings')
        .insert({
          user_id: entry.user_id,
          class_schedule_id: classScheduleId,
          credit_id: credits[0].id,
          status: 'confirmed',
          tenant_id: cls.tenant_id,
        })

      if (bookingError) {
        // Restore credit on failure
        await supabaseAdmin
          .from('user_credits')
          .update({ credits_remaining: credits[0].credits_remaining })
          .eq('id', credits[0].id)
        console.error('[waitlist] Booking insert failed:', bookingError)
        continue
      }

      // Remove from waitlist
      await supabaseAdmin
        .from('waitlist')
        .delete()
        .eq('id', entry.id)

      promotedUserId = entry.user_id

      // Send email (non-blocking)
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
          console.error(`[waitlist] Email failed for ${user.email}:`, err)
        }
      }

      break // Only promote one person per spot
    }

    // Reorder remaining waitlist positions
    const { data: remaining } = await supabaseAdmin
      .from('waitlist')
      .select('id, position')
      .eq('class_schedule_id', classScheduleId)
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

    return { promoted: !!promotedUserId, userId: promotedUserId }
  } catch (error) {
    console.error('[waitlist] promoteFromWaitlist error:', error)
    return { promoted: false }
  }
}
