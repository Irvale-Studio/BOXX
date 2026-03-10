import { supabaseAdmin } from '@/lib/supabase/admin'
import { rateLimit } from '@/lib/rate-limit'
import { NextResponse } from 'next/server'
import { z } from 'zod'
import crypto from 'crypto'
import bcrypt from 'bcryptjs'

const schema = z.object({
  email: z.string().email(),
})

/**
 * POST /api/auth/forgot-password — Request a password reset link
 * Always returns success (don't reveal if email exists)
 */
export async function POST(request) {
  try {
    const ip = request.headers.get('x-forwarded-for')?.split(',')[0] || 'unknown'
    const { limited } = rateLimit(`forgot:${ip}`, 3, 15 * 60 * 1000) // 3 per 15 min
    if (limited) {
      return NextResponse.json({ error: 'Too many requests. Please try again later.' }, { status: 429 })
    }

    const body = await request.json()
    const parsed = schema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid email' }, { status: 400 })
    }

    if (!supabaseAdmin) {
      return NextResponse.json({ success: true }) // Don't reveal DB issues
    }

    const email = parsed.data.email.toLowerCase()

    // Find user (only password-auth users can reset)
    const { data: user } = await supabaseAdmin
      .from('users')
      .select('id, name, email, password_hash, role')
      .eq('email', email)
      .single()

    // Always return success to prevent email enumeration
    if (!user || !user.password_hash || user.role === 'frozen') {
      return NextResponse.json({ success: true })
    }

    // Invalidate any existing tokens for this user
    await supabaseAdmin
      .from('password_reset_tokens')
      .update({ used: true })
      .eq('user_id', user.id)
      .eq('used', false)

    // Generate secure token
    const rawToken = crypto.randomBytes(32).toString('hex')
    const tokenHash = await bcrypt.hash(rawToken, 10)
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000) // 1 hour

    await supabaseAdmin
      .from('password_reset_tokens')
      .insert({
        user_id: user.id,
        token_hash: tokenHash,
        expires_at: expiresAt.toISOString(),
      })

    // Send reset email
    const baseUrl = process.env.NEXTAUTH_URL || 'https://boxxthailand.com'
    const resetUrl = `${baseUrl}/reset-password/${rawToken}?email=${encodeURIComponent(email)}`

    try {
      const { sendPasswordResetEmail } = await import('@/lib/email')
      await sendPasswordResetEmail({ to: email, name: user.name, resetUrl })
    } catch (err) {
      console.error('[forgot-password] Email failed:', err)
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('[forgot-password] Error:', error)
    return NextResponse.json({ success: true }) // Don't reveal errors
  }
}
