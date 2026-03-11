import { supabaseAdmin } from '@/lib/supabase/admin'
import { NextResponse } from 'next/server'

/**
 * GET /api/cron/agent-cleanup — Delete agent conversations older than 7 days
 * Run daily via Vercel cron
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
    const cutoff = new Date()
    cutoff.setDate(cutoff.getDate() - 7)

    const { data: old, error: fetchError } = await supabaseAdmin
      .from('agent_conversations')
      .select('id')
      .lt('updated_at', cutoff.toISOString())

    if (fetchError || !old?.length) {
      return NextResponse.json({ deleted: 0 })
    }

    const { error } = await supabaseAdmin
      .from('agent_conversations')
      .delete()
      .in('id', old.map((c) => c.id))

    if (error) {
      console.error('[cron/agent-cleanup] Error:', error)
      return NextResponse.json({ error: 'Cleanup failed' }, { status: 500 })
    }

    return NextResponse.json({ deleted: old.length })
  } catch (error) {
    console.error('[cron/agent-cleanup] Error:', error)
    return NextResponse.json({ error: 'Something went wrong.' }, { status: 500 })
  }
}
