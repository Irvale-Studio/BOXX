import { requireAdmin } from '@/lib/api-helpers'
import { getStripeAsync } from '@/lib/stripe'
import { supabaseAdmin } from '@/lib/supabase/admin'
import { NextResponse } from 'next/server'
import { z } from 'zod'

/**
 * Resolve a Stripe input (price ID, product ID, or product URL) to { priceId, productId }.
 * Accepts: price_xxx, prod_xxx, or https://dashboard.stripe.com/.../products/prod_xxx
 */
async function resolveStripeInput(input) {
  if (!input) return { priceId: null, productId: null }
  const trimmed = input.trim()
  if (!trimmed) return { priceId: null, productId: null }

  const stripe = await getStripeAsync()
  if (!stripe) {
    throw new Error('Stripe is not configured. Set up your Stripe key in Settings first.')
  }

  // Already a price ID — look up the product it belongs to
  if (trimmed.startsWith('price_')) {
    const price = await stripe.prices.retrieve(trimmed)
    return { priceId: trimmed, productId: price.product }
  }

  // Extract product ID from URL or direct input
  let productId = null
  if (trimmed.startsWith('prod_')) {
    productId = trimmed
  } else {
    const match = trimmed.match(/prod_[A-Za-z0-9]+/)
    if (match) productId = match[0]
  }

  if (!productId) {
    throw new Error('Invalid Stripe ID. Paste a Product ID (prod_...), Price ID (price_...), or Stripe product URL.')
  }

  // Look up the default price for this product
  const product = await stripe.products.retrieve(productId)
  if (!product || !product.default_price) {
    throw new Error(`Product "${product?.name || productId}" has no default price. Add a price in Stripe Dashboard first.`)
  }

  const priceId = typeof product.default_price === 'string'
    ? product.default_price
    : product.default_price.id

  return { priceId, productId }
}

/**
 * GET /api/admin/packs — Get all class packs (admin)
 */
export async function GET(request) {
  try {
    const result = await requireAdmin(request)
    if (result.response) return result.response
    const { session, tenantId } = result

    if (!supabaseAdmin) {
      return NextResponse.json({ error: 'Database unavailable' }, { status: 500 })
    }

    const { data, error } = await supabaseAdmin
      .from('class_packs')
      .select('*')
      .eq('tenant_id', tenantId)
      .order('display_order', { ascending: true })

    if (error) {
      console.error('[admin/packs] Error:', error)
      return NextResponse.json({ error: 'Failed to load packs' }, { status: 500 })
    }

    return NextResponse.json({ packs: data || [] })
  } catch (error) {
    console.error('[admin/packs] Error:', error)
    return NextResponse.json({ error: 'Something went wrong.' }, { status: 500 })
  }
}

const createPackSchema = z.object({
  name: z.string().min(1),
  description: z.string().optional(),
  credits: z.number().int().min(1).nullable(),
  validity_days: z.number().int().min(1),
  price_thb: z.number().int().min(0),
  is_membership: z.boolean().optional(),
  is_intro: z.boolean().optional(),
  badge_text: z.string().nullable().optional(),
  display_order: z.number().int().optional(),
  stripe_price_id: z.string().nullable().optional(),
})

/**
 * POST /api/admin/packs — Create a new pack
 */
export async function POST(request) {
  try {
    const result = await requireAdmin(request)
    if (result.response) return result.response
    const { session, tenantId } = result

    if (!supabaseAdmin) {
      return NextResponse.json({ error: 'Database unavailable' }, { status: 500 })
    }

    const body = await request.json()
    const parsed = createPackSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid input', details: parsed.error.flatten() }, { status: 400 })
    }

    // Check platform pack limit
    const { checkPackLimit, checkTenantPlanLimit } = await import('@/lib/platform-limits')
    const { allowed: packAllowed, reason: packReason } = await checkPackLimit()
    if (!packAllowed) {
      return NextResponse.json({ error: packReason }, { status: 403 })
    }

    // Check plan-level pack limit
    const packLimit = await checkTenantPlanLimit(tenantId, 'max_packs')
    if (!packLimit.allowed) {
      return NextResponse.json({ error: `Pack limit reached (${packLimit.current}/${packLimit.limit} on ${packLimit.plan} plan)` }, { status: 403 })
    }

    // Resolve Stripe input (product ID, URL, or price ID) to actual price ID
    const insertData = { ...parsed.data, tenant_id: tenantId, active: true }
    if (insertData.stripe_price_id) {
      try {
        const { priceId, productId } = await resolveStripeInput(insertData.stripe_price_id)
        insertData.stripe_price_id = priceId
        if (productId) insertData.stripe_product_id = productId
      } catch (err) {
        return NextResponse.json({ error: err.message }, { status: 400 })
      }
    }

    const { data: pack, error } = await supabaseAdmin
      .from('class_packs')
      .insert(insertData)
      .select()
      .single()

    if (error) {
      console.error('[admin/packs] Create error:', error)
      return NextResponse.json({ error: 'Failed to create pack' }, { status: 500 })
    }

    return NextResponse.json({ pack })
  } catch (error) {
    console.error('[admin/packs] Error:', error)
    return NextResponse.json({ error: 'Something went wrong.' }, { status: 500 })
  }
}

const deletePackSchema = z.object({
  id: z.string().regex(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i, 'Invalid ID'),
})

/**
 * DELETE /api/admin/packs — Permanently delete a class pack
 */
export async function DELETE(request) {
  try {
    const result = await requireAdmin(request)
    if (result.response) return result.response
    const { session, tenantId } = result

    if (!supabaseAdmin) {
      return NextResponse.json({ error: 'Database unavailable' }, { status: 500 })
    }

    const body = await request.json()
    const parsed = deletePackSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid input' }, { status: 400 })
    }

    const { id } = parsed.data

    // Block if any user credits (active or expired) reference this pack
    const { count } = await supabaseAdmin
      .from('user_credits')
      .select('id', { count: 'exact', head: true })
      .eq('tenant_id', tenantId)
      .eq('class_pack_id', id)

    if (count > 0) {
      return NextResponse.json(
        { error: `Cannot delete: ${count} credit record${count !== 1 ? 's' : ''} reference this pack. Deactivate it instead.` },
        { status: 409 }
      )
    }

    const { error } = await supabaseAdmin
      .from('class_packs')
      .delete()
      .eq('tenant_id', tenantId)
      .eq('id', id)

    if (error) {
      console.error('[admin/packs] Delete error:', error)
      return NextResponse.json({ error: 'Failed to delete pack' }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('[admin/packs] Error:', error)
    return NextResponse.json({ error: 'Something went wrong.' }, { status: 500 })
  }
}

const updatePackSchema = z.object({
  id: z.string().regex(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i, 'Invalid ID'),
  name: z.string().min(1).optional(),
  description: z.string().optional(),
  credits: z.number().int().min(1).nullable().optional(),
  validity_days: z.number().int().min(1).optional(),
  price_thb: z.number().int().min(0).optional(),
  is_membership: z.boolean().optional(),
  is_intro: z.boolean().optional(),
  badge_text: z.string().nullable().optional(),
  active: z.boolean().optional(),
  display_order: z.number().int().optional(),
  stripe_price_id: z.string().nullable().optional(),
})

/**
 * PUT /api/admin/packs — Update a pack
 */
export async function PUT(request) {
  try {
    const result = await requireAdmin(request)
    if (result.response) return result.response
    const { session, tenantId } = result

    if (!supabaseAdmin) {
      return NextResponse.json({ error: 'Database unavailable' }, { status: 500 })
    }

    const body = await request.json()
    const parsed = updatePackSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid input' }, { status: 400 })
    }

    const { id, ...updates } = parsed.data

    // Resolve Stripe input (product ID, URL, or price ID) to actual price ID
    if (updates.stripe_price_id) {
      try {
        const { priceId, productId } = await resolveStripeInput(updates.stripe_price_id)
        updates.stripe_price_id = priceId
        if (productId) updates.stripe_product_id = productId
      } catch (err) {
        return NextResponse.json({ error: err.message }, { status: 400 })
      }
    }

    // K4: Prevent deactivating if members have active credits from this pack
    if (updates.active === false) {
      const { count } = await supabaseAdmin
        .from('user_credits')
        .select('id', { count: 'exact', head: true })
        .eq('tenant_id', tenantId)
        .eq('class_pack_id', id)
        .eq('status', 'active')
        .gt('expires_at', new Date().toISOString())
        .gt('credits_remaining', 0)

      if (count > 0) {
        return NextResponse.json(
          { error: `Cannot deactivate: ${count} member${count !== 1 ? 's' : ''} still ${count !== 1 ? 'have' : 'has'} active credits from this pack.` },
          { status: 409 }
        )
      }
    }

    const { data: pack, error } = await supabaseAdmin
      .from('class_packs')
      .update(updates)
      .eq('tenant_id', tenantId)
      .eq('id', id)
      .select()
      .single()

    if (error) {
      console.error('[admin/packs] Update error:', error)
      return NextResponse.json({ error: 'Failed to update pack' }, { status: 500 })
    }

    return NextResponse.json({ pack })
  } catch (error) {
    console.error('[admin/packs] Error:', error)
    return NextResponse.json({ error: 'Something went wrong.' }, { status: 500 })
  }
}
