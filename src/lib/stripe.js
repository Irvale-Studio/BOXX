import Stripe from 'stripe'
import { supabaseAdmin } from '@/lib/supabase/admin'

// Cache the Stripe instance and settings to avoid repeated DB lookups
let _stripe = null
let _stripeKeySource = null // track which key was used

/**
 * Get Stripe secret key — checks studio_settings first, falls back to env var
 */
async function getStripeSecretKey() {
  if (supabaseAdmin) {
    const { data } = await supabaseAdmin
      .from('studio_settings')
      .select('value')
      .eq('key', 'stripe_secret_key')
      .single()

    if (data?.value) return data.value
  }

  return process.env.STRIPE_SECRET_KEY || null
}

/**
 * Get Stripe webhook secret — checks studio_settings first, falls back to env var
 */
export async function getWebhookSecret() {
  if (supabaseAdmin) {
    const { data } = await supabaseAdmin
      .from('studio_settings')
      .select('value')
      .eq('key', 'stripe_webhook_secret')
      .single()

    if (data?.value) return data.value
  }

  return process.env.STRIPE_WEBHOOK_SECRET || null
}

/**
 * Get a Stripe instance (async — checks DB settings first)
 */
export async function getStripeAsync() {
  const key = await getStripeSecretKey()
  if (!key) return null

  // Reuse cached instance if same key
  if (_stripe && _stripeKeySource === key) return _stripe

  _stripe = new Stripe(key, { apiVersion: '2024-12-18.acacia' })
  _stripeKeySource = key
  return _stripe
}

/**
 * Sync getter — uses env var only (for webhook signature verification)
 */
export function getStripe() {
  if (!_stripe && process.env.STRIPE_SECRET_KEY) {
    _stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
      apiVersion: '2024-12-18.acacia',
    })
  }
  return _stripe
}

/**
 * Check if Stripe is configured (has a secret key in DB or env)
 */
export async function isStripeConfigured() {
  const key = await getStripeSecretKey()
  return !!key
}
