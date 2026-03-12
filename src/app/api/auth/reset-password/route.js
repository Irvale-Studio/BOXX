import { supabaseAdmin } from '@/lib/supabase/admin'
import { rateLimit } from '@/lib/rate-limit'
import { NextResponse } from 'next/server'
import { z } from 'zod'
import bcrypt from 'bcryptjs'

const DEFAULT_TENANT_ID = process.env.DEFAULT_TENANT_ID || 'a0000000-0000-0000-0000-000000000001'

const schema = z.object({
  email: z.string().email(),
  token: z.string().min(1),
  password: z.string().min(8, 'Password must be at least 8 characters').max(128),
  tenantId: z.string().min(1).optional(),
})

/**
 * POST /api/auth/reset-password — Set new password using reset token
 */
export async function POST(request) {
  try {
    const ip = request.headers.get('x-forwarded-for')?.split(',')[0] || 'unknown'
    const { limited } = rateLimit(`reset:${ip}`, 5, 15 * 60 * 1000) // 5 per 15 min
    if (limited) {
      return NextResponse.json({ error: 'Too many attempts. Please try again later.' }, { status: 429 })
    }

    const body = await request.json()
    const parsed = schema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 })
    }

    if (!supabaseAdmin) {
      return NextResponse.json({ error: 'Service unavailable' }, { status: 503 })
    }

    const { email, token, password, tenantId: bodyTenantId } = parsed.data
    const tenantId = bodyTenantId || DEFAULT_TENANT_ID

    // Find user
    const { data: user } = await supabaseAdmin
      .from('users')
      .select('id, role')
      .eq('email', email.toLowerCase())
      .eq('tenant_id', tenantId)
      .single()

    if (!user || user.role === 'frozen') {
      return NextResponse.json({ error: 'Invalid or expired reset link' }, { status: 400 })
    }

    // Find valid (unused, not expired) tokens for this user
    const { data: tokens } = await supabaseAdmin
      .from('password_reset_tokens')
      .select('id, token_hash, expires_at')
      .eq('user_id', user.id)
      .eq('used', false)
      .gt('expires_at', new Date().toISOString())
      .order('created_at', { ascending: false })
      .limit(5)

    if (!tokens || tokens.length === 0) {
      return NextResponse.json({ error: 'Invalid or expired reset link' }, { status: 400 })
    }

    // Check token against all valid tokens (bcrypt compare)
    let matchedTokenId = null
    for (const t of tokens) {
      const valid = await bcrypt.compare(token, t.token_hash)
      if (valid) {
        matchedTokenId = t.id
        break
      }
    }

    if (!matchedTokenId) {
      return NextResponse.json({ error: 'Invalid or expired reset link' }, { status: 400 })
    }

    // Hash new password and update user
    const passwordHash = await bcrypt.hash(password, 12)

    const { error: updateError } = await supabaseAdmin
      .from('users')
      .update({ password_hash: passwordHash })
      .eq('id', user.id)

    if (updateError) {
      console.error('[reset-password] Update error:', updateError)
      return NextResponse.json({ error: 'Failed to reset password' }, { status: 500 })
    }

    // Mark token as used
    await supabaseAdmin
      .from('password_reset_tokens')
      .update({ used: true })
      .eq('id', matchedTokenId)

    // Invalidate all other tokens for this user
    await supabaseAdmin
      .from('password_reset_tokens')
      .update({ used: true })
      .eq('user_id', user.id)
      .eq('used', false)

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('[reset-password] Error:', error)
    return NextResponse.json({ error: 'Something went wrong' }, { status: 500 })
  }
}
