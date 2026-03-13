import { auth } from '@/lib/auth'
import { supabaseAdmin } from '@/lib/supabase/admin'
import { NextResponse } from 'next/server'

const DEFAULT_TENANT_ID = process.env.DEFAULT_TENANT_ID || 'a0000000-0000-0000-0000-000000000001'

/**
 * GET /api/tenant/theme — Returns tenant branding (colors, fonts, logo, name)
 * Used by ThemeProvider to apply tenant-specific styling.
 */
export async function GET(request) {
  try {
    const session = await auth()
    // Prefer middleware-resolved tenant (from subdomain), then session, then default
    const headerTenantId = request.headers.get('x-tenant-id')
    const tenantId = headerTenantId || session?.user?.tenantId || DEFAULT_TENANT_ID

    if (!supabaseAdmin) {
      return NextResponse.json({ theme: null })
    }

    // Fetch tenant record (logo, primary_color, name, vertical)
    const { data: tenant } = await supabaseAdmin
      .from('tenants')
      .select('name, slug, logo_url, primary_color, currency, vertical')
      .eq('id', tenantId)
      .single()

    // Fetch theme settings + social links + studio name from studio_settings
    const { data: settings } = await supabaseAdmin
      .from('studio_settings')
      .select('key, value')
      .eq('tenant_id', tenantId)
      .or('key.like.theme_%,key.eq.studio_name,key.like.social_%')

    const theme = {}
    const socials = {}
    let studioNameSetting = null
    if (settings) {
      for (const row of settings) {
        if (row.key.startsWith('theme_')) {
          theme[row.key.replace('theme_', '')] = row.value
        } else if (row.key.startsWith('social_')) {
          socials[row.key] = row.value
        } else if (row.key === 'studio_name') {
          studioNameSetting = row.value
        }
      }
    }

    return NextResponse.json({
      theme: {
        studioName: studioNameSetting || tenant?.name || 'Studio',
        logoUrl: tenant?.logo_url || null,
        primaryColor: tenant?.primary_color || '#c8a750',
        currency: tenant?.currency || 'USD',
        vertical: tenant?.vertical || 'fitness',
        ...theme,
        ...socials,
      },
    }, {
      headers: {
        'Cache-Control': 'private, s-maxage=60, stale-while-revalidate=300',
      },
    })
  } catch (error) {
    console.error('[tenant/theme] Error:', error)
    return NextResponse.json({ theme: null })
  }
}
