'use client'

import { createContext, useContext, useEffect, useState } from 'react'

const ThemeContext = createContext(null)

export function useTheme() {
  return useContext(ThemeContext) || { theme: null }
}

/**
 * ThemeProvider — fetches tenant theme and injects CSS variables + Google Fonts.
 * Shows a branded loading screen while theme loads, then fades in content.
 */
export default function ThemeProvider({ children }) {
  const [theme, setTheme] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/tenant/theme')
      .then(r => r.json())
      .then(data => {
        if (data.theme) setTheme(data.theme)
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  // Inject CSS variables when theme loads
  useEffect(() => {
    if (!theme) return

    const root = document.documentElement

    const varMap = {
      background: '--background',
      surface: '--card',
      primary: '--accent',
      foreground: '--foreground',
      muted: '--muted',
      border: '--card-border',
    }

    for (const [key, cssVar] of Object.entries(varMap)) {
      if (theme[key]) {
        root.style.setProperty(cssVar, theme[key])
      }
    }

    if (theme.primaryHover) root.style.setProperty('--accent-dim', theme.primaryHover)
    if (theme.accent) root.style.setProperty('--cta', theme.accent)
    if (theme.borderHover) root.style.setProperty('--cta-hover', theme.borderHover)

    if (theme.bodyFont) {
      root.style.setProperty('--font-tenant-body', `"${theme.bodyFont}", sans-serif`)
    }
    if (theme.titleFont) {
      root.style.setProperty('--font-tenant-title', `"${theme.titleFont}", sans-serif`)
    }

    return () => {
      for (const cssVar of Object.values(varMap)) {
        root.style.removeProperty(cssVar)
      }
      root.style.removeProperty('--accent-dim')
      root.style.removeProperty('--cta')
      root.style.removeProperty('--cta-hover')
      root.style.removeProperty('--font-tenant-body')
      root.style.removeProperty('--font-tenant-title')
    }
  }, [theme])

  // Load Google Fonts
  useEffect(() => {
    if (!theme) return
    const fonts = new Set()
    if (theme.titleFont && theme.titleFont !== 'Inter') fonts.add(theme.titleFont)
    if (theme.bodyFont && theme.bodyFont !== 'Inter') fonts.add(theme.bodyFont)
    if (fonts.size === 0) return

    const families = Array.from(fonts).map(f => f.replace(/ /g, '+')).join('&family=')
    const link = document.createElement('link')
    link.rel = 'stylesheet'
    link.href = `https://fonts.googleapis.com/css2?family=${families}:wght@300;400;500;600;700&display=swap`
    document.head.appendChild(link)

    return () => { link.remove() }
  }, [theme?.titleFont, theme?.bodyFont])

  const studioName = theme?.studioName || ''

  return (
    <ThemeContext.Provider value={{ theme, loading }}>
      {theme?.bodyFont && (
        <style>{`
          .tenant-body { font-family: var(--font-tenant-body, inherit); }
          .tenant-title { font-family: var(--font-tenant-title, var(--font-tenant-body, inherit)); }
        `}</style>
      )}

      {/* Loading screen */}
      {loading && (
        <div className="fixed inset-0 z-[100] bg-background flex flex-col items-center justify-center gap-6">
          {/* Spinner */}
          <div className="relative">
            <div className="w-10 h-10 rounded-full border-2 border-card-border border-t-accent animate-spin" />
          </div>

          {/* Branding */}
          <div className="flex flex-col items-center gap-2">
            {studioName && (
              <p className="text-sm font-semibold text-foreground tracking-wide tenant-title">{studioName}</p>
            )}
            <div className="flex items-center gap-1.5 text-muted">
              <span className="text-[10px] tracking-widest uppercase">Powered by</span>
              <span className="text-[10px] font-bold tracking-widest uppercase text-accent">Zatrovo</span>
            </div>
          </div>
        </div>
      )}

      {/* Content — fades in after theme loads */}
      <div
        className={theme?.bodyFont ? 'tenant-body' : ''}
        style={{
          opacity: loading ? 0 : 1,
          transition: 'opacity 0.2s ease-in',
        }}
      >
        {children}
      </div>
    </ThemeContext.Provider>
  )
}
