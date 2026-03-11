import { requireStaff } from '@/lib/api-helpers'
import { supabaseAdmin } from '@/lib/supabase/admin'
import { sendAdminDirectEmail } from '@/lib/email'
import { NextResponse } from 'next/server'
import { z } from 'zod'

const composeSchema = z.object({
  to: z.string().email(),
  subject: z.string().min(1).max(200),
  body: z.string().min(1).max(5000),
})

/**
 * POST /api/admin/emails — Send a direct email to a member
 */
export async function POST(request) {
  try {
    const result = await requireStaff(request)
    if (result.response) return result.response
    const { session, tenantId } = result

    const body = await request.json()
    const parsed = composeSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 })
    }

    const { to, subject, body: emailBody } = parsed.data

    // Restrict to registered member emails only
    if (supabaseAdmin) {
      const { data: targetUser } = await supabaseAdmin
        .from('users')
        .select('id')
        .eq('tenant_id', tenantId)
        .eq('email', to)
        .single()

      if (!targetUser) {
        return NextResponse.json({ error: 'Recipient must be a registered member' }, { status: 400 })
      }
    }

    await sendAdminDirectEmail({ to, subject, body: emailBody })

    // Audit log
    if (supabaseAdmin) {
      await supabaseAdmin.from('admin_audit_log').insert({
        tenant_id: tenantId,
        admin_id: session.user.id,
        action: 'send_direct_email',
        target_type: 'user',
        target_id: null,
        details: { to, subject },
      })
    }

    return NextResponse.json({ success: true, message: 'Email sent successfully' })
  } catch (error) {
    console.error('[admin/emails] Error:', error)
    return NextResponse.json({ error: 'Failed to send email' }, { status: 500 })
  }
}
