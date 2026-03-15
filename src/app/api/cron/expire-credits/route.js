import { supabaseAdmin } from '@/lib/supabase/admin'
import { sendCreditExpiryWarning } from '@/lib/email'
import { NextResponse } from 'next/server'

/**
 * GET /api/cron/expire-credits — Expire old credits + warn users with credits expiring in 3 days
 * Run daily at midnight (Asia/Bangkok)
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

    // 1. Zero out credits that have expired
    const { data: expired } = await supabaseAdmin
      .from('user_credits')
      .update({ credits_remaining: 0 })
      .lt('expires_at', now.toISOString())
      .gt('credits_remaining', 0)
      .select('id')

    const expiredCount = expired?.length || 0

    // 2. Warn users with credits expiring in 3 days
    const threeDays = new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000)
    const { data: expiring } = await supabaseAdmin
      .from('user_credits')
      .select('id, tenant_id, credits_remaining, expires_at, expiry_warned, users(email, name), class_packs(name)')
      .gt('credits_remaining', 0)
      .gte('expires_at', now.toISOString())
      .lte('expires_at', threeDays.toISOString())
      .eq('expiry_warned', false)

    let warned = 0

    if (expiring && expiring.length > 0) {
      for (const credit of expiring) {
        if (!credit.users?.email) continue
        try {
          await sendCreditExpiryWarning({
            to: credit.users.email,
            name: credit.users.name,
            packName: credit.class_packs?.name || 'Class Pack',
            creditsRemaining: credit.credits_remaining,
            expiresAt: new Date(credit.expires_at).toLocaleDateString('en-US', {
              weekday: 'long',
              month: 'long',
              day: 'numeric',
              timeZone: 'Asia/Bangkok',
            }),
            tenantId: credit.tenant_id,
          })

          await supabaseAdmin
            .from('user_credits')
            .update({ expiry_warned: true })
            .eq('id', credit.id)

          warned++
        } catch (err) {
          console.error(`[cron/expire-credits] Warning failed for credit ${credit.id}:`, err)
        }
      }
    }

    // 3. Cancel expired class invitations (class already started)
    const { data: expiredInvitations } = await supabaseAdmin
      .from('bookings')
      .select('id, class_schedule!inner(starts_at)')
      .eq('status', 'invited')
      .lt('class_schedule.starts_at', now.toISOString())

    if (expiredInvitations?.length) {
      await supabaseAdmin
        .from('bookings')
        .update({ status: 'cancelled', cancelled_at: now.toISOString() })
        .in('id', expiredInvitations.map((b) => b.id))
    }

    return NextResponse.json({ expired: expiredCount, warned, expiredInvitations: expiredInvitations?.length || 0 })
  } catch (error) {
    console.error('[cron/expire-credits] Error:', error)
    return NextResponse.json({ error: 'Cron failed' }, { status: 500 })
  }
}
