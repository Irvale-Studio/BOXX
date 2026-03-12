import { headers } from 'next/headers'
import { redirect } from 'next/navigation'
import Link from 'next/link'

export default async function Home() {
  const headersList = await headers()
  const host = headersList.get('host') || ''
  const baseDomain = process.env.NEXT_PUBLIC_BASE_DOMAIN || 'localhost:3000'

  // If on a tenant subdomain or legacy vercel URL, redirect to login
  const isSubdomain = host.endsWith(`.${baseDomain}`) && !host.startsWith('www.')
  const isLegacy = host.includes('vercel.app')
  if (isSubdomain || isLegacy) {
    redirect('/login')
  }

  // Platform root — show Zatrovo landing
  return (
    <div className="min-h-screen bg-[#0a0a0a] flex flex-col">
      {/* Nav */}
      <nav className="flex items-center justify-between px-6 sm:px-10 py-5">
        <span className="text-xl font-bold tracking-wide text-white">
          zatrovo
        </span>
        <Link
          href="/login"
          className="text-sm text-[#888] hover:text-white transition-colors"
        >
          Sign in
        </Link>
      </nav>

      {/* Hero */}
      <main className="flex-1 flex items-center justify-center px-6">
        <div className="max-w-2xl text-center">
          <h1 className="text-4xl sm:text-6xl font-bold text-white tracking-tight leading-tight">
            Your studio,{' '}
            <span className="text-[#c8a750]">your platform</span>
          </h1>
          <p className="mt-6 text-lg sm:text-xl text-[#888] max-w-lg mx-auto leading-relaxed">
            Everything you need to run your fitness studio — scheduling, bookings, payments, and member management. All under your own brand.
          </p>

          <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              href="/onboarding"
              className="w-full sm:w-auto px-8 py-4 rounded-lg bg-[#c8a750] text-[#0a0a0a] font-semibold text-base hover:bg-[#a08535] transition-colors"
            >
              Create Your Studio
            </Link>
          </div>

          {/* Quick studio access */}
          <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3">
            <span className="text-xs text-[#555]">Sign in to:</span>
            <Link
              href="https://boxx.zatrovo.com/login"
              className="px-5 py-2.5 rounded-lg border border-[#1a1a1a] text-white text-sm font-medium hover:border-[#333] hover:bg-[#111] transition-colors"
            >
              BOXX
            </Link>
            <Link
              href="https://tenanttest.zatrovo.com/login"
              className="px-5 py-2.5 rounded-lg border border-[#1a1a1a] text-white text-sm font-medium hover:border-[#333] hover:bg-[#111] transition-colors"
            >
              TenantTest
            </Link>
          </div>

          {/* Feature highlights */}
          <div className="mt-20 grid grid-cols-1 sm:grid-cols-3 gap-6 text-left">
            <div className="p-5 rounded-lg border border-[#1a1a1a] bg-[#111]">
              <div className="w-8 h-8 rounded-full bg-[#c8a750]/10 flex items-center justify-center mb-3">
                <svg className="w-4 h-4 text-[#c8a750]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </div>
              <h3 className="text-sm font-semibold text-white">Smart Scheduling</h3>
              <p className="text-xs text-[#888] mt-1.5 leading-relaxed">
                Drag-and-drop calendar, recurring classes, waitlists, and automatic reminders.
              </p>
            </div>
            <div className="p-5 rounded-lg border border-[#1a1a1a] bg-[#111]">
              <div className="w-8 h-8 rounded-full bg-[#c8a750]/10 flex items-center justify-center mb-3">
                <svg className="w-4 h-4 text-[#c8a750]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
              </div>
              <h3 className="text-sm font-semibold text-white">Stripe Payments</h3>
              <p className="text-xs text-[#888] mt-1.5 leading-relaxed">
                Sell class packs, manage credits, and track revenue — all connected to your Stripe account.
              </p>
            </div>
            <div className="p-5 rounded-lg border border-[#1a1a1a] bg-[#111]">
              <div className="w-8 h-8 rounded-full bg-[#c8a750]/10 flex items-center justify-center mb-3">
                <svg className="w-4 h-4 text-[#c8a750]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01" />
                </svg>
              </div>
              <h3 className="text-sm font-semibold text-white">Your Brand</h3>
              <p className="text-xs text-[#888] mt-1.5 leading-relaxed">
                Custom colors, logo, and fonts. Your members see your studio, not ours.
              </p>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="px-6 sm:px-10 py-6 text-center">
        <p className="text-xs text-[#555]">
          &copy; {new Date().getFullYear()} Zatrovo. All rights reserved.
        </p>
      </footer>
    </div>
  )
}
