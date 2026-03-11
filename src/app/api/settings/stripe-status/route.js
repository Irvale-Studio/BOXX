import { auth } from '@/lib/auth'
import { isStripeConfigured } from '@/lib/stripe'
import { NextResponse } from 'next/server'

/**
 * GET /api/settings/stripe-status — Check if Stripe is configured
 */
export async function GET() {
  try {
    const session = await auth()
    if (!session || (session.user.role !== 'owner' && session.user.role !== 'admin')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const configured = await isStripeConfigured()

    return NextResponse.json({ configured })
  } catch (error) {
    console.error('[settings/stripe-status] Error:', error)
    return NextResponse.json({ error: 'Something went wrong.' }, { status: 500 })
  }
}
