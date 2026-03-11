import { auth } from '@/lib/auth'
import { NextResponse } from 'next/server'

const memberRoutes = ['/dashboard', '/book', '/profile', '/buy-classes', '/my-bookings', '/confirmation']

/**
 * Resolve tenant from the request host.
 * Returns tenantId string or null.
 */
function resolveTenantFromHost(req) {
  const host = req.headers.get('host') || ''
  const baseDomain = process.env.NEXT_PUBLIC_BASE_DOMAIN || 'localhost:3000'

  // Subdomain match: slug.basedomain.com
  if (host.endsWith(`.${baseDomain}`)) {
    const slug = host.replace(`.${baseDomain}`, '').split('.')[0]
    if (slug && slug !== 'www') {
      return { type: 'slug', value: slug }
    }
  }

  // Custom domain match (not baseDomain, not www, not localhost)
  if (host !== baseDomain && host !== `www.${baseDomain}` && !host.includes('localhost')) {
    return { type: 'custom_domain', value: host }
  }

  return null
}

export default auth((req) => {
  const { pathname } = req.nextUrl
  const session = req.auth

  // Resolve tenant and inject header for downstream API routes
  const response = NextResponse.next()
  const tenantMatch = resolveTenantFromHost(req)

  if (tenantMatch) {
    // Pass tenant match info for API routes to resolve
    response.headers.set('x-tenant-match-type', tenantMatch.type)
    response.headers.set('x-tenant-match-value', tenantMatch.value)
  }

  // If user is authenticated, their tenantId from JWT is the source of truth
  if (session?.user?.tenantId) {
    response.headers.set('x-tenant-id', session.user.tenantId)
  }

  // Check member routes
  const isProtected = memberRoutes.some((r) => pathname.startsWith(r))
  if (isProtected && !session) {
    const loginUrl = new URL('/login', req.url)
    loginUrl.searchParams.set('callbackUrl', pathname + req.nextUrl.search)
    return NextResponse.redirect(loginUrl)
  }

  // Block frozen users from accessing member routes
  if (isProtected && session?.user?.role === 'frozen') {
    return NextResponse.redirect(new URL('/login?error=frozen', req.url))
  }

  // Check admin routes — allow admin and employee roles
  if (pathname.startsWith('/admin')) {
    if (!session) {
      const loginUrl = new URL('/login', req.url)
      loginUrl.searchParams.set('callbackUrl', pathname)
      return NextResponse.redirect(loginUrl)
    }
    const role = session.user.role
    if (role !== 'owner' && role !== 'admin' && role !== 'employee') {
      return NextResponse.redirect(new URL('/dashboard', req.url))
    }

    // Employee restrictions — block admin-only pages
    if (role === 'employee') {
      const adminOnlyPaths = ['/admin/settings', '/admin/packs']
      if (adminOnlyPaths.some((p) => pathname.startsWith(p))) {
        return NextResponse.redirect(new URL('/admin', req.url))
      }
    }
  }

  return response
})

export const config = {
  matcher: [
    '/dashboard/:path*',
    '/book/:path*',
    '/profile/:path*',
    '/buy-classes/:path*',
    '/my-bookings/:path*',
    '/confirmation/:path*',
    '/admin/:path*',
    '/api/:path*',
  ],
}
