import { auth } from '@/lib/auth'
import { supabaseAdmin } from '@/lib/supabase/admin'
import { NextResponse } from 'next/server'

/**
 * GET /api/admin/emails/log?page=1&limit=50&status=failed&type=welcome
 * Returns paginated email log entries
 */
export async function GET(request) {
  try {
    const session = await auth()
    if (!session || !['admin', 'employee'].includes(session.user.role)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    if (!supabaseAdmin) {
      return NextResponse.json({ error: 'Database unavailable' }, { status: 500 })
    }

    const { searchParams } = new URL(request.url)
    const page = Math.max(1, parseInt(searchParams.get('page') || '1'))
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get('limit') || '50')))
    const statusFilter = searchParams.get('status')
    const typeFilter = searchParams.get('type')
    const offset = (page - 1) * limit

    let query = supabaseAdmin
      .from('email_log')
      .select('*', { count: 'exact' })
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1)

    if (statusFilter) query = query.eq('status', statusFilter)
    if (typeFilter) query = query.eq('email_type', typeFilter)

    const { data, error, count } = await query

    if (error) {
      console.error('[admin/emails/log] Error:', error)
      return NextResponse.json({ error: 'Failed to load email log' }, { status: 500 })
    }

    return NextResponse.json({
      logs: data || [],
      total: count || 0,
      page,
      pages: Math.ceil((count || 0) / limit),
    })
  } catch (error) {
    console.error('[admin/emails/log] Error:', error)
    return NextResponse.json({ error: 'Something went wrong.' }, { status: 500 })
  }
}
