import { auth } from '@/lib/auth'
import { supabaseAdmin } from '@/lib/supabase/admin'
import { NextResponse } from 'next/server'

/**
 * GET /api/admin/agent/conversations/[id] — Get conversation with messages
 */
export async function GET(request, { params }) {
  try {
    const session = await auth()
    if (!session || (session.user.role !== 'admin' && session.user.role !== 'owner')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params

    const { data: conversation } = await supabaseAdmin
      .from('agent_conversations')
      .select('id, title, created_at, updated_at')
      .eq('id', id)
      .eq('user_id', session.user.id)
      .single()

    if (!conversation) {
      return NextResponse.json({ error: 'Conversation not found' }, { status: 404 })
    }

    const { data: messages } = await supabaseAdmin
      .from('agent_messages')
      .select('id, role, content, tool_results, created_at')
      .eq('conversation_id', id)
      .order('created_at', { ascending: true })

    return NextResponse.json({ conversation, messages: messages || [] })
  } catch (error) {
    console.error('[agent/conversations] Error:', error)
    return NextResponse.json({ error: 'Something went wrong.' }, { status: 500 })
  }
}

/**
 * PATCH /api/admin/agent/conversations/[id] — Update title
 */
export async function PATCH(request, { params }) {
  try {
    const session = await auth()
    if (!session || (session.user.role !== 'admin' && session.user.role !== 'owner')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params
    const body = await request.json()

    const { error } = await supabaseAdmin
      .from('agent_conversations')
      .update({ title: body.title, updated_at: new Date().toISOString() })
      .eq('id', id)
      .eq('user_id', session.user.id)

    if (error) {
      return NextResponse.json({ error: 'Failed to update' }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('[agent/conversations] Error:', error)
    return NextResponse.json({ error: 'Something went wrong.' }, { status: 500 })
  }
}

/**
 * DELETE /api/admin/agent/conversations/[id] — Delete conversation
 */
export async function DELETE(request, { params }) {
  try {
    const session = await auth()
    if (!session || (session.user.role !== 'admin' && session.user.role !== 'owner')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params

    // Verify ownership
    const { data: convo } = await supabaseAdmin
      .from('agent_conversations')
      .select('id')
      .eq('id', id)
      .eq('user_id', session.user.id)
      .single()

    if (!convo) {
      return NextResponse.json({ error: 'Conversation not found' }, { status: 404 })
    }

    await supabaseAdmin
      .from('agent_conversations')
      .delete()
      .eq('id', id)

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('[agent/conversations] Error:', error)
    return NextResponse.json({ error: 'Something went wrong.' }, { status: 500 })
  }
}
