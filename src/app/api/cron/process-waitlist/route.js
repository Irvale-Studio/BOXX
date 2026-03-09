import { supabaseAdmin } from '@/lib/supabase/admin'
import { promoteFromWaitlist } from '@/lib/waitlist'
import { NextResponse } from 'next/server'

/**
 * GET /api/cron/process-waitlist — Auto-book waitlisted users when spots open
 * Run every 5 minutes via Vercel Cron (safety net — real-time promotion
 * happens inline in cancel/remove routes via promoteFromWaitlist)
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

    // Get distinct class IDs that have waitlisted users in active future classes
    const { data: waitlisted } = await supabaseAdmin
      .from('waitlist')
      .select('class_schedule_id, class_schedule(starts_at, status)')

    if (!waitlisted || waitlisted.length === 0) {
      return NextResponse.json({ promoted: 0 })
    }

    // Deduplicate class IDs, filter to active future classes
    const classIds = [...new Set(
      waitlisted
        .filter((w) => w.class_schedule?.status === 'active' && new Date(w.class_schedule.starts_at) > now)
        .map((w) => w.class_schedule_id)
    )]

    for (const classId of classIds) {
      const result = await promoteFromWaitlist(classId)
      if (result.promoted) promoted++
    }

    return NextResponse.json({ promoted })
  } catch (error) {
    console.error('[cron/process-waitlist] Error:', error)
    return NextResponse.json({ error: 'Cron failed' }, { status: 500 })
  }
}
