import { requireAdmin } from '@/lib/api-helpers'
import { isStripeConfigured } from '@/lib/stripe'
import { NextResponse } from 'next/server'

/**
 * GET /api/settings/stripe-status — Check if Stripe is configured
 */
export async function GET() {
  try {
    const authResult = await requireAdmin()
    if (authResult.response) return authResult.response
    // tenantId available via authResult.tenantId if needed in future

    const configured = await isStripeConfigured()

    return NextResponse.json({ configured })
  } catch (error) {
    console.error('[settings/stripe-status] Error:', error)
    return NextResponse.json({ error: 'Something went wrong.' }, { status: 500 })
  }
}
