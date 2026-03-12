import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase/admin'
import { rateLimit } from '@/lib/rate-limit'
import { sendWelcomeEmail } from '@/lib/email'
import bcrypt from 'bcryptjs'
import { z } from 'zod'

const DEFAULT_TENANT_ID = process.env.DEFAULT_TENANT_ID || 'a0000000-0000-0000-0000-000000000001'

const registerSchema = z.object({
  name: z.string().min(1, 'Name is required').max(100),
  email: z.string().email('Invalid email'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  consent: z.literal(true, { message: 'You must agree to the Privacy Policy and Terms of Service' }),
  tenantId: z.string().min(1).optional(),
})

export async function POST(request) {
  try {
    const ip = request.headers.get('x-forwarded-for')?.split(',')[0] || 'unknown'
    const { limited } = rateLimit(`register:${ip}`, 5, 15 * 60 * 1000) // 5 per 15 min
    if (limited) {
      return NextResponse.json({ error: 'Too many attempts. Please try again later.' }, { status: 429 })
    }

    if (!supabaseAdmin) {
      return NextResponse.json({ error: 'Database not configured' }, { status: 503 })
    }

    const body = await request.json()
    const parsed = registerSchema.safeParse(body)

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0].message },
        { status: 400 }
      )
    }

    const { name, email, password, tenantId: bodyTenantId } = parsed.data
    const tenantId = bodyTenantId || DEFAULT_TENANT_ID
    const emailLower = email.toLowerCase()

    // Check platform member limit
    try {
      const { checkMemberLimit, checkTenantPlanLimit } = await import('@/lib/platform-limits')
      const { allowed, reason } = await checkMemberLimit()
      if (!allowed) {
        return NextResponse.json({ error: 'Registration is temporarily unavailable. Please try again later.' }, { status: 503 })
      }

      // Check plan-level member limit
      const memberLimit = await checkTenantPlanLimit(tenantId, 'max_members')
      if (!memberLimit.allowed) {
        return NextResponse.json({ error: 'This studio has reached its member limit. Please contact the studio.' }, { status: 403 })
      }
    } catch {
      // Don't block registration if limit check fails
    }

    // Check if email already exists within this tenant
    const { data: existing } = await supabaseAdmin
      .from('users')
      .select('id')
      .eq('email', emailLower)
      .eq('tenant_id', tenantId)
      .single()

    if (existing) {
      return NextResponse.json(
        { error: 'An account with this email already exists' },
        { status: 409 }
      )
    }

    // Hash password (cost factor 12)
    const passwordHash = await bcrypt.hash(password, 12)

    const { error } = await supabaseAdmin
      .from('users')
      .insert({
        name,
        email: emailLower,
        password_hash: passwordHash,
        role: 'member',
        tenant_id: tenantId,
      })

    if (error) {
      console.error('[auth/register] Insert error:', error.message)
      return NextResponse.json(
        { error: 'Something went wrong. Please try again.' },
        { status: 500 }
      )
    }

    // Send welcome email (non-blocking)
    sendWelcomeEmail({ to: emailLower, name }).catch((err) =>
      console.error('[auth/register] Welcome email failed:', err)
    )

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('[auth/register] Error:', error)
    return NextResponse.json(
      { error: 'Something went wrong. Please try again.' },
      { status: 500 }
    )
  }
}
