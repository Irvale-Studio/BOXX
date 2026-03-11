import { requireAuth } from '@/lib/api-helpers'
import { supabaseAdmin } from '@/lib/supabase/admin'
import { NextResponse } from 'next/server'

/**
 * GET /api/profile/export — Export all user data (PDPA/GDPR compliance)
 */
export async function GET() {
  try {
    const authResult = await requireAuth()
    if (authResult.response) return authResult.response
    const { session, tenantId } = authResult

    if (!supabaseAdmin) {
      return NextResponse.json({ error: 'Database unavailable' }, { status: 500 })
    }

    const userId = session.user.id

    // Fetch all user data in parallel
    const [userRes, bookingsRes, creditsRes, waitlistRes] = await Promise.all([
      supabaseAdmin
        .from('users')
        .select('id, email, name, phone, bio, avatar_url, role, created_at')
        .eq('tenant_id', tenantId)
        .eq('id', userId)
        .single(),
      supabaseAdmin
        .from('bookings')
        .select('id, status, created_at, class_schedule(starts_at, class_types(name))')
        .eq('tenant_id', tenantId)
        .eq('user_id', userId)
        .order('created_at', { ascending: false }),
      supabaseAdmin
        .from('user_credits')
        .select('id, credits_total, credits_remaining, expires_at, created_at, class_packs(name)')
        .eq('tenant_id', tenantId)
        .eq('user_id', userId)
        .order('created_at', { ascending: false }),
      supabaseAdmin
        .from('waitlist')
        .select('id, position, created_at, class_schedule(starts_at, class_types(name))')
        .eq('tenant_id', tenantId)
        .eq('user_id', userId)
        .order('created_at', { ascending: false }),
    ])

    const exportData = {
      exported_at: new Date().toISOString(),
      profile: userRes.data,
      bookings: bookingsRes.data || [],
      credits: creditsRes.data || [],
      waitlist: waitlistRes.data || [],
    }

    return new NextResponse(JSON.stringify(exportData, null, 2), {
      headers: {
        'Content-Type': 'application/json',
        'Content-Disposition': `attachment; filename="boxx-data-export-${new Date().toISOString().split('T')[0]}.json"`,
      },
    })
  } catch (error) {
    console.error('[profile/export] Error:', error)
    return NextResponse.json({ error: 'Something went wrong.' }, { status: 500 })
  }
}
