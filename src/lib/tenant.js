import { supabaseAdmin } from '@/lib/supabase/admin'

/**
 * Resolve tenant from request context.
 *
 * Resolution order:
 * 1. x-tenant-id header (set by middleware)
 * 2. Subdomain match against tenants.slug
 * 3. Custom domain match against tenants.custom_domain
 *
 * Returns tenant object or null.
 */
export async function resolveTenant(request) {
  // 1. Check header (already resolved by middleware)
  const headerTenantId = request.headers.get('x-tenant-id')
  if (headerTenantId) {
    const { data } = await supabaseAdmin
      .from('tenants')
      .select('*')
      .eq('id', headerTenantId)
      .eq('is_active', true)
      .single()
    return data || null
  }

  const host = request.headers.get('host') || ''
  const baseDomain = process.env.NEXT_PUBLIC_BASE_DOMAIN || 'localhost:3000'

  // 2. Subdomain match
  if (host.endsWith(`.${baseDomain}`)) {
    const slug = host.replace(`.${baseDomain}`, '').split('.')[0]
    if (slug && slug !== 'www') {
      const { data } = await supabaseAdmin
        .from('tenants')
        .select('*')
        .eq('slug', slug)
        .eq('is_active', true)
        .single()
      return data || null
    }
  }

  // 3. Custom domain match
  if (host !== baseDomain && host !== `www.${baseDomain}` && !host.includes('localhost')) {
    const { data } = await supabaseAdmin
      .from('tenants')
      .select('*')
      .eq('custom_domain', host)
      .eq('is_active', true)
      .single()
    return data || null
  }

  return null
}

/**
 * Get tenant by ID (cached-friendly).
 */
export async function getTenantById(tenantId) {
  if (!tenantId) return null
  const { data } = await supabaseAdmin
    .from('tenants')
    .select('*')
    .eq('id', tenantId)
    .eq('is_active', true)
    .single()
  return data || null
}
