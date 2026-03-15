'use client'

import { useState, useEffect, useRef, useMemo, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import { useSession } from 'next-auth/react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Switch } from '@/components/ui/switch'
import { cn } from '@/lib/utils'
import {
  CreditCard, Building2, Link2, Search, ClipboardList, Bell, Palette,
  Moon, Flame, Sun, Crown, Trees, Waves, Check, ChevronDown, Upload, X,
} from 'lucide-react'

export default function SettingsPage() {
  return (
    <Suspense fallback={<div className="animate-pulse h-96 bg-card rounded-lg" />}>
      <SettingsContent />
    </Suspense>
  )
}

const TABS = [
  { id: 'payments', label: 'Payments', icon: CreditCard },
  { id: 'branding', label: 'Branding', icon: Palette },
  { id: 'studio', label: 'Studio', icon: Building2 },
  { id: 'social', label: 'Social Links', icon: Link2 },
  { id: 'seo', label: 'SEO', icon: Search },
  { id: 'booking', label: 'Booking', icon: ClipboardList },
  { id: 'reminders', label: 'Reminders', icon: Bell },
]

function SettingsContent() {
  const searchParams = useSearchParams()
  const defaultTab = searchParams.get('tab') || 'payments'
  const [activeTab, setActiveTab] = useState(defaultTab)

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Settings</h1>
        <p className="text-sm text-muted mt-1">Configure your studio</p>
      </div>

      {/* Tab buttons — horizontal scroll on mobile */}
      <div className="flex gap-1.5 mb-5 overflow-x-auto pb-1 -mx-4 px-4 sm:mx-0 sm:px-0 sm:flex-wrap">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={cn(
              'flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors shrink-0',
              activeTab === tab.id
                ? 'bg-accent/10 text-accent'
                : 'text-muted hover:text-foreground hover:bg-white/5'
            )}
          >
            <tab.icon className="w-4 h-4 shrink-0" />
            <span>{tab.label}</span>
          </button>
        ))}
      </div>

      {/* Tab content */}
      {activeTab === 'payments' && <PaymentsTab />}
      {activeTab === 'branding' && <BrandingTab />}
      {activeTab === 'studio' && <StudioInfoTab />}
      {activeTab === 'social' && <SocialLinksTab />}
      {activeTab === 'seo' && <SeoTab />}
      {activeTab === 'booking' && <BookingRulesTab />}
      {activeTab === 'reminders' && <RemindersTab />}
    </div>
  )
}

// ─── Theme presets (shared with onboarding) ─────────────────────────────────

const THEMES = [
  { id: 'midnight', name: 'Midnight', description: 'Dark & modern', icon: Moon, background: '#0a0a0b', surface: '#141416', surfaceHover: '#1c1c1f', primary: '#6366f1', primaryHover: '#5558e8', secondary: '#818cf8', accent: '#a78bfa', foreground: '#f0f0f5', muted: '#71717a', border: '#27272a', borderHover: '#3f3f46', titleFont: 'Inter', titleFontType: 'sans-serif', bodyFont: 'Inter', bodyFontType: 'sans-serif' },
  { id: 'ember', name: 'Ember', description: 'Warm & energetic', icon: Flame, background: '#0c0a09', surface: '#1c1917', surfaceHover: '#262220', primary: '#f97316', primaryHover: '#ea6c0e', secondary: '#fb923c', accent: '#fbbf24', foreground: '#fafaf9', muted: '#a8a29e', border: '#292524', borderHover: '#3d3835', titleFont: 'DM Sans', titleFontType: 'sans-serif', bodyFont: 'DM Sans', bodyFontType: 'sans-serif' },
  { id: 'ivory', name: 'Ivory', description: 'Light & clean', icon: Sun, background: '#fafafa', surface: '#ffffff', surfaceHover: '#f4f4f5', primary: '#0d9488', primaryHover: '#0b7f74', secondary: '#2dd4bf', accent: '#5eead4', foreground: '#18181b', muted: '#71717a', border: '#e4e4e7', borderHover: '#d4d4d8', titleFont: 'Plus Jakarta Sans', titleFontType: 'sans-serif', bodyFont: 'Plus Jakarta Sans', bodyFontType: 'sans-serif' },
  { id: 'royal', name: 'Royal', description: 'Bold & luxurious', icon: Crown, background: '#09090b', surface: '#141417', surfaceHover: '#1c1c20', primary: '#c8a750', primaryHover: '#b89640', secondary: '#d4af37', accent: '#e8c547', foreground: '#fafaf5', muted: '#a1a1aa', border: '#27272a', borderHover: '#3a3a3f', titleFont: 'Playfair Display', titleFontType: 'serif', bodyFont: 'Inter', bodyFontType: 'sans-serif' },
  { id: 'forest', name: 'Forest', description: 'Natural & calm', icon: Trees, background: '#f8faf5', surface: '#f0f7ec', surfaceHover: '#e5f0df', primary: '#16a34a', primaryHover: '#138a3e', secondary: '#4ade80', accent: '#86efac', foreground: '#1a2e1a', muted: '#6b8f6b', border: '#d1e7d1', borderHover: '#b8d9b8', titleFont: 'Nunito', titleFontType: 'sans-serif', bodyFont: 'Nunito', bodyFontType: 'sans-serif' },
  { id: 'ocean', name: 'Ocean', description: 'Fresh & professional', icon: Waves, background: '#f8fafc', surface: '#ffffff', surfaceHover: '#f1f5f9', primary: '#0ea5e9', primaryHover: '#0c93cf', secondary: '#38bdf8', accent: '#7dd3fc', foreground: '#0f172a', muted: '#64748b', border: '#e2e8f0', borderHover: '#cbd5e1', titleFont: 'Poppins', titleFontType: 'sans-serif', bodyFont: 'Inter', bodyFontType: 'sans-serif' },
]

const FONT_OPTIONS = [
  { value: 'Inter', label: 'Inter', type: 'Sans-serif' },
  { value: 'DM Sans', label: 'DM Sans', type: 'Sans-serif' },
  { value: 'Plus Jakarta Sans', label: 'Plus Jakarta Sans', type: 'Sans-serif' },
  { value: 'Poppins', label: 'Poppins', type: 'Sans-serif' },
  { value: 'Nunito', label: 'Nunito', type: 'Rounded' },
  { value: 'Playfair Display', label: 'Playfair Display', type: 'Serif' },
  { value: 'Roboto', label: 'Roboto', type: 'Sans-serif' },
  { value: 'Open Sans', label: 'Open Sans', type: 'Sans-serif' },
  { value: 'Montserrat', label: 'Montserrat', type: 'Sans-serif' },
  { value: 'Lato', label: 'Lato', type: 'Sans-serif' },
  { value: 'Raleway', label: 'Raleway', type: 'Sans-serif' },
  { value: 'Outfit', label: 'Outfit', type: 'Sans-serif' },
  { value: 'Manrope', label: 'Manrope', type: 'Sans-serif' },
  { value: 'Space Grotesk', label: 'Space Grotesk', type: 'Sans-serif' },
  { value: 'Sora', label: 'Sora', type: 'Sans-serif' },
  { value: 'Merriweather', label: 'Merriweather', type: 'Serif' },
  { value: 'Lora', label: 'Lora', type: 'Serif' },
  { value: 'Libre Baskerville', label: 'Libre Baskerville', type: 'Serif' },
  { value: 'Cormorant Garamond', label: 'Cormorant Garamond', type: 'Serif' },
  { value: 'DM Serif Display', label: 'DM Serif Display', type: 'Serif' },
]

// ─── Color utilities ─────────────────────────────────────────────────────────

function hexToHsl(hex) {
  const r = parseInt(hex.slice(1, 3), 16) / 255
  const g = parseInt(hex.slice(3, 5), 16) / 255
  const b = parseInt(hex.slice(5, 7), 16) / 255
  const max = Math.max(r, g, b), min = Math.min(r, g, b)
  let h = 0, s = 0, l = (max + min) / 2
  if (max !== min) {
    const d = max - min
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min)
    if (max === r) h = ((g - b) / d + (g < b ? 6 : 0)) / 6
    else if (max === g) h = ((b - r) / d + 2) / 6
    else h = ((r - g) / d + 4) / 6
  }
  return [h * 360, s * 100, l * 100]
}

function hslToHex(h, s, l) {
  h /= 360; s /= 100; l /= 100
  const hue2rgb = (p, q, t) => { if (t < 0) t += 1; if (t > 1) t -= 1; if (t < 1/6) return p + (q - p) * 6 * t; if (t < 1/2) return q; if (t < 2/3) return p + (q - p) * (2/3 - t) * 6; return p }
  let r2, g2, b2
  if (s === 0) { r2 = g2 = b2 = l } else { const q = l < 0.5 ? l * (1 + s) : l + s - l * s; const p = 2 * l - q; r2 = hue2rgb(p, q, h + 1/3); g2 = hue2rgb(p, q, h); b2 = hue2rgb(p, q, h - 1/3) }
  return '#' + [r2, g2, b2].map(v => Math.round(v * 255).toString(16).padStart(2, '0')).join('')
}

// ─── Color Picker component ─────────────────────────────────────────────────

function ColorPicker({ label, value, onChange }) {
  const [open, setOpen] = useState(false)
  const [hexInput, setHexInput] = useState(value)
  const ref = useRef(null)

  useEffect(() => { setHexInput(value) }, [value])
  useEffect(() => {
    const handler = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false) }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const [h, s, l] = hexToHsl(value)
  const handleHexChange = (str) => {
    setHexInput(str)
    if (/^#[0-9a-fA-F]{6}$/.test(str)) onChange(str.toLowerCase())
  }

  const swatches = [
    hslToHex(h, Math.min(100, s + 10), 30),
    hslToHex(h, s, 40),
    hslToHex(h, s, 50),
    hslToHex(h, s, 65),
    hslToHex(h, Math.max(0, s - 20), 85),
  ]

  return (
    <div ref={ref} className="relative">
      <button type="button" onClick={() => setOpen(!open)} className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg border border-card-border bg-card hover:border-accent/30 transition-colors text-left">
        <div className="w-8 h-8 rounded-lg border border-card-border shrink-0" style={{ backgroundColor: value }} />
        <div className="min-w-0">
          <span className="text-xs text-foreground font-medium block">{label}</span>
          <span className="text-[10px] font-mono text-muted">{value}</span>
        </div>
      </button>
      {open && (
        <div className="absolute z-50 mt-1 left-0 w-56 rounded-lg border border-card-border bg-card shadow-xl shadow-black/20 p-3 space-y-3">
          <div>
            <input type="range" min="0" max="360" value={Math.round(h)} onChange={e => onChange(hslToHex(Number(e.target.value), s, l))} className="w-full h-3 rounded-full appearance-none cursor-pointer" style={{ background: 'linear-gradient(to right, #ff0000, #ffff00, #00ff00, #00ffff, #0000ff, #ff00ff, #ff0000)' }} />
            <span className="text-[10px] text-muted">Hue</span>
          </div>
          <div>
            <input type="range" min="0" max="100" value={Math.round(s)} onChange={e => onChange(hslToHex(h, Number(e.target.value), l))} className="w-full h-3 rounded-full appearance-none cursor-pointer" style={{ background: `linear-gradient(to right, ${hslToHex(h, 0, l)}, ${hslToHex(h, 100, l)})` }} />
            <span className="text-[10px] text-muted">Saturation</span>
          </div>
          <div>
            <input type="range" min="0" max="100" value={Math.round(l)} onChange={e => onChange(hslToHex(h, s, Number(e.target.value)))} className="w-full h-3 rounded-full appearance-none cursor-pointer" style={{ background: `linear-gradient(to right, #000000, ${hslToHex(h, s, 50)}, #ffffff)` }} />
            <span className="text-[10px] text-muted">Lightness</span>
          </div>
          <div className="flex gap-1.5">
            {swatches.map((sw, i) => (
              <button key={i} type="button" onClick={() => onChange(sw)} className={`w-8 h-8 rounded-lg border transition-all ${sw === value ? 'border-accent ring-1 ring-accent' : 'border-card-border hover:border-accent/40'}`} style={{ backgroundColor: sw }} />
            ))}
          </div>
          <div className="flex gap-2">
            <div className="w-8 h-8 rounded-lg border border-card-border shrink-0" style={{ backgroundColor: value }} />
            <input type="text" value={hexInput} onChange={e => handleHexChange(e.target.value)} placeholder="#000000" maxLength={7} className="flex-1 px-2 py-1.5 rounded-md bg-background border border-card-border text-sm font-mono text-foreground placeholder-muted/50 focus:outline-none focus:border-accent transition-colors" />
          </div>
        </div>
      )}
    </div>
  )
}

// ─── Font Select component ──────────────────────────────────────────────────

function FontSelect({ value, onChange, label }) {
  const [open, setOpen] = useState(false)
  const [search, setSearch] = useState('')
  const ref = useRef(null)
  const inputRef = useRef(null)

  useEffect(() => {
    const handler = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false) }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])
  useEffect(() => { if (open && inputRef.current) inputRef.current.focus() }, [open])

  const filtered = FONT_OPTIONS.filter(f =>
    f.label.toLowerCase().includes(search.toLowerCase()) || f.type.toLowerCase().includes(search.toLowerCase())
  )
  const current = FONT_OPTIONS.find(f => f.value === value)

  return (
    <div>
      <label className="block text-xs text-muted mb-2">{label}</label>
      <div ref={ref} className="relative">
        <button type="button" onClick={() => { setOpen(!open); setSearch('') }} className="w-full flex items-center justify-between px-3 py-2.5 rounded-lg border border-card-border bg-card text-left hover:border-accent/30 transition-colors">
          <span className="text-sm text-foreground" style={{ fontFamily: current ? `"${current.value}", ${current.type.toLowerCase()}` : 'inherit' }}>
            {current?.label || value || 'Select font...'}
          </span>
          <ChevronDown className={`w-4 h-4 text-muted transition-transform ${open ? 'rotate-180' : ''}`} />
        </button>
        {open && (
          <div className="absolute z-50 mt-1 w-full rounded-lg border border-card-border bg-card shadow-xl shadow-black/20 overflow-hidden">
            <div className="p-2 border-b border-card-border">
              <div className="relative">
                <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-muted" />
                <input ref={inputRef} type="text" value={search} onChange={e => setSearch(e.target.value)} placeholder="Search fonts..." className="w-full pl-8 pr-3 py-2 rounded-md bg-background border border-card-border text-sm text-foreground placeholder-muted/50 focus:outline-none focus:border-accent transition-colors" />
              </div>
            </div>
            <div className="max-h-48 overflow-y-auto py-1">
              {filtered.length === 0 ? (
                <div className="px-3 py-4 text-xs text-muted text-center">No fonts match</div>
              ) : filtered.map(f => (
                <button key={f.value} type="button" onClick={() => { onChange(f.value); setOpen(false); setSearch('') }}
                  className={`w-full flex items-center justify-between px-3 py-2 text-left hover:bg-accent/10 transition-colors ${value === f.value ? 'bg-accent/10' : ''}`}>
                  <span className="text-sm text-foreground" style={{ fontFamily: `"${f.value}", ${f.type.toLowerCase()}` }}>{f.label}</span>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] text-muted">{f.type}</span>
                    {value === f.value && <Check className="w-3.5 h-3.5 text-accent" />}
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

// ─── Theme Preview component ────────────────────────────────────────────────

function ThemePreview({ theme, businessName, logoUrl }) {
  const isDark = theme.background.replace('#', '').split('').reduce((sum, c) => sum + parseInt(c, 16), 0) < 24
  const titleFontCSS = `"${theme.titleFont}", ${theme.titleFontType}`
  const bodyFontCSS = `"${theme.bodyFont}", ${theme.bodyFontType}`

  return (
    <div className="rounded-xl overflow-hidden border shadow-lg" style={{ borderColor: theme.border, backgroundColor: theme.background, fontFamily: bodyFontCSS }}>
      <div className="flex items-center gap-1.5 px-3 py-2" style={{ backgroundColor: theme.surface, borderBottom: `1px solid ${theme.border}` }}>
        <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: '#ef4444' }} />
        <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: '#f59e0b' }} />
        <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: '#22c55e' }} />
        <div className="flex-1 mx-4 h-5 rounded-md text-center text-[10px] leading-5 truncate" style={{ backgroundColor: theme.background, color: theme.muted }}>
          {businessName ? `${businessName.toLowerCase().replace(/\s/g, '')}.zatrovo.com` : 'yourstudio.zatrovo.com'}
        </div>
      </div>
      <div className="flex items-center justify-between px-4 py-2.5" style={{ backgroundColor: theme.surface, borderBottom: `1px solid ${theme.border}` }}>
        <div className="flex items-center gap-2">
          {logoUrl ? (
            <img src={logoUrl} alt="" className="w-5 h-5 rounded object-contain" />
          ) : (
            <div className="w-5 h-5 rounded flex items-center justify-center text-[8px] font-bold" style={{ backgroundColor: theme.primary, color: isDark ? '#ffffff' : theme.background }}>
              {(businessName || 'S')[0].toUpperCase()}
            </div>
          )}
          <span className="text-xs font-semibold truncate max-w-[100px]" style={{ color: theme.foreground, fontFamily: titleFontCSS }}>{businessName || 'Your Studio'}</span>
        </div>
        <div className="flex gap-2">
          <span className="text-[8px]" style={{ color: theme.muted }}>Classes</span>
          <span className="text-[8px]" style={{ color: theme.secondary }}>Login</span>
        </div>
      </div>
      <div className="px-5 py-6 text-center">
        <div className="text-base font-bold mb-1" style={{ color: theme.foreground, fontFamily: titleFontCSS }}>Welcome</div>
        <div className="text-[10px] mb-4" style={{ color: theme.muted }}>Book your next session today</div>
        <div className="flex items-center justify-center gap-2">
          <div className="px-5 py-1.5 rounded-lg text-[10px] font-semibold" style={{ backgroundColor: theme.primary, color: isDark ? '#ffffff' : theme.background }}>Book Now</div>
          <div className="px-5 py-1.5 rounded-lg text-[10px] font-semibold" style={{ border: `1px solid ${theme.secondary}`, color: theme.secondary }}>View Schedule</div>
        </div>
      </div>
      <div className="px-4 pb-3 grid grid-cols-2 gap-2">
        {['Morning Flow', 'HIIT Session'].map((label, i) => (
          <div key={i} className="rounded-lg p-2.5" style={{ backgroundColor: theme.surface, border: `1px solid ${theme.border}` }}>
            <div className="w-full h-6 rounded mb-2" style={{ backgroundColor: theme.accent, opacity: 0.12 }} />
            <div className="text-[9px] font-semibold mb-0.5" style={{ color: theme.foreground, fontFamily: titleFontCSS }}>{label}</div>
            <div className="text-[8px] mb-1.5" style={{ color: theme.muted }}>9:00 AM — 60 min</div>
            <span className="text-[8px] font-semibold" style={{ color: theme.primary }}>Book</span>
          </div>
        ))}
      </div>
      <div className="h-1" style={{ background: `linear-gradient(to right, ${theme.primary}, ${theme.secondary}, ${theme.accent})` }} />
    </div>
  )
}

// ─── Branding Tab ───────────────────────────────────────────────────────────

function BrandingTab() {
  const { data: session } = useSession()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState(null)
  useEffect(() => { if (!message) return; const t = setTimeout(() => setMessage(null), 4000); return () => clearTimeout(t) }, [message])
  const [logoUrl, setLogoUrl] = useState(null)
  const [studioName, setStudioName] = useState('')
  const [uploading, setUploading] = useState(false)
  const fileInputRef = useRef(null)

  // Theme state — defaults match the app's dark theme
  const [selectedThemeId, setSelectedThemeId] = useState(null)
  const [colors, setColors] = useState({
    background: '#0a0a0a', surface: '#111111', surfaceHover: '#1a1a1a',
    primary: '#c8a750', primaryHover: '#a08535', secondary: '#c8a750',
    accent: '#c8a750', foreground: '#f5f5f5', muted: '#888888',
    border: '#1a1a1a', borderHover: '#232323',
  })
  const [titleFont, setTitleFont] = useState('Inter')
  const [bodyFont, setBodyFont] = useState('Inter')
  const [showCustomize, setShowCustomize] = useState(false)
  const [initialState, setInitialState] = useState(null)

  const effectiveTheme = useMemo(() => ({
    ...colors,
    titleFont,
    titleFontType: FONT_OPTIONS.find(f => f.value === titleFont)?.type?.toLowerCase() || 'sans-serif',
    bodyFont,
    bodyFontType: FONT_OPTIONS.find(f => f.value === bodyFont)?.type?.toLowerCase() || 'sans-serif',
  }), [colors, titleFont, bodyFont])

  // Load existing theme from API
  useEffect(() => {
    async function load() {
      try {
        const res = await fetch('/api/tenant/theme')
        if (res.ok) {
          const { theme } = await res.json()
          if (theme) {
            setStudioName(theme.studioName || '')
            setLogoUrl(theme.logoUrl || null)
            // Find matching preset
            const matchedPreset = THEMES.find(t => t.primary === theme.primary && t.background === theme.background)
            if (matchedPreset) setSelectedThemeId(matchedPreset.id)
            // Load all colors
            const pc = theme.primaryColor || '#c8a750'
            setColors({
              background: theme.background || '#0a0a0a',
              surface: theme.surface || '#111111',
              surfaceHover: theme.surfaceHover || '#1a1a1a',
              primary: theme.primary || pc,
              primaryHover: theme.primaryHover || '#a08535',
              secondary: theme.secondary || pc,
              accent: theme.accent || pc,
              foreground: theme.foreground || '#f5f5f5',
              muted: theme.muted || '#888888',
              border: theme.border || '#1a1a1a',
              borderHover: theme.borderHover || '#232323',
            })
            if (theme.titleFont) setTitleFont(theme.titleFont)
            if (theme.bodyFont) setBodyFont(theme.bodyFont)
            // Save initial state for dirty checking
            setInitialState(JSON.stringify({
              colors: {
                background: theme.background || '#0a0a0a',
                surface: theme.surface || '#111111',
                surfaceHover: theme.surfaceHover || '#1a1a1a',
                primary: theme.primary || pc,
                primaryHover: theme.primaryHover || '#a08535',
                secondary: theme.secondary || pc,
                accent: theme.accent || pc,
                foreground: theme.foreground || '#f5f5f5',
                muted: theme.muted || '#888888',
                border: theme.border || '#1a1a1a',
                borderHover: theme.borderHover || '#232323',
              },
              titleFont: theme.titleFont || 'Inter',
              bodyFont: theme.bodyFont || 'Inter',
            }))
          }
        }
      } catch (err) {
        console.error('Failed to load theme:', err)
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  function applyPreset(preset) {
    setSelectedThemeId(preset.id)
    setColors({
      background: preset.background, surface: preset.surface, surfaceHover: preset.surfaceHover,
      primary: preset.primary, primaryHover: preset.primaryHover, secondary: preset.secondary,
      accent: preset.accent, foreground: preset.foreground, muted: preset.muted,
      border: preset.border, borderHover: preset.borderHover,
    })
    setTitleFont(preset.titleFont)
    setBodyFont(preset.bodyFont)
  }

  async function handleSave() {
    setSaving(true)
    setMessage(null)
    try {
      const themeData = {}
      for (const [key, val] of Object.entries(colors)) {
        themeData[`theme_${key}`] = val
      }
      themeData.theme_titleFont = titleFont
      themeData.theme_bodyFont = bodyFont

      const res = await fetch('/api/admin/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(themeData),
      })
      if (res.ok) {
        setMessage({ type: 'success', text: 'Branding saved. Changes will appear on next page load.' })
      } else {
        setMessage({ type: 'error', text: 'Failed to save branding.' })
      }
    } catch {
      setMessage({ type: 'error', text: 'Failed to save branding.' })
    } finally {
      setSaving(false)
    }
  }

  async function handleLogoUpload(e) {
    const file = e.target.files?.[0]
    if (!file) return
    if (file.size > 2 * 1024 * 1024) {
      setMessage({ type: 'error', text: 'Logo must be under 2MB' })
      return
    }
    setUploading(true)
    try {
      const fd = new FormData()
      fd.append('file', file)
      // Use a dedicated admin logo upload route that gets tenantId from auth
      const res = await fetch('/api/admin/logo', { method: 'POST', body: fd })
      const data = await res.json().catch(() => ({}))
      if (res.ok && data.url) {
        setLogoUrl(data.url)
        setMessage({ type: 'success', text: 'Logo uploaded!' })
      } else {
        setMessage({ type: 'error', text: data.error || 'Failed to upload logo' })
      }
    } catch {
      setMessage({ type: 'error', text: 'Failed to upload logo.' })
    } finally {
      setUploading(false)
    }
  }

  if (loading) {
    return (
      <Card>
        <CardContent className="py-8">
          <div className="animate-pulse space-y-4">
            <div className="h-6 bg-card-border rounded w-48" />
            <div className="h-40 bg-card-border rounded w-full" />
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      {/* Save at top — only when changes made */}
      {message && (
        <div className={cn('fixed bottom-4 left-4 right-4 sm:left-auto sm:right-6 sm:bottom-6 z-50 px-4 py-3 rounded-lg border flex items-center gap-3 shadow-lg backdrop-blur-sm sm:max-w-sm', message.type === 'error' ? 'bg-red-500/10 border-red-500/20 text-red-400' : 'bg-green-500/10 border-green-500/20 text-green-400')}>
          <span className="text-sm flex-1">{message.text}</span>
          <button onClick={() => setMessage(null)} className="opacity-60 hover:opacity-100 shrink-0"><X className="w-3.5 h-3.5" /></button>
        </div>
      )}
      {(initialState && JSON.stringify({ colors, titleFont, bodyFont }) !== initialState) && (
        <div className="flex gap-2">
          <button onClick={() => window.location.reload()} className="flex-1 h-10 rounded-lg border border-card-border text-muted hover:text-foreground hover:bg-white/[0.03] text-sm transition-colors flex items-center justify-center gap-2"><X className="w-4 h-4" /> Cancel</button>
          <button onClick={handleSave} disabled={saving} className={cn('flex-1 h-10 rounded-lg bg-green-500/10 text-green-400 hover:bg-green-500/20 text-sm font-medium transition-colors flex items-center justify-center gap-2', saving && 'opacity-50 cursor-not-allowed')}><Check className="w-4 h-4" /> {saving ? 'Saving...' : 'Save Branding'}</button>
        </div>
      )}

      {/* Logo */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Logo</CardTitle>
          <CardDescription>Shown in navigation, emails, and member pages. Max 2MB, JPEG/PNG/WebP/SVG.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4">
            <input ref={fileInputRef} type="file" accept="image/jpeg,image/png,image/webp,image/svg+xml" onChange={handleLogoUpload} className="hidden" />
            {logoUrl ? (
              <div className="relative group cursor-pointer" onClick={() => fileInputRef.current?.click()}>
                <img src={logoUrl} alt="Studio logo" className="h-16 w-auto max-w-[200px] object-contain rounded border border-card-border" />
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 rounded flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all">
                  <Upload className="w-4 h-4 text-white" />
                </div>
                <button onClick={(e) => { e.stopPropagation(); setLogoUrl(null) }} className="absolute -top-2 -right-2 w-5 h-5 rounded-full bg-red-500 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                  <X className="w-3 h-3" />
                </button>
              </div>
            ) : (
              <div onClick={() => fileInputRef.current?.click()} className="h-20 w-40 rounded border-2 border-dashed border-card-border flex flex-col items-center justify-center text-muted hover:text-foreground hover:border-accent/30 cursor-pointer transition-colors gap-1">
                <Upload className="w-5 h-5" />
                <span className="text-[10px]">{uploading ? 'Uploading...' : 'Upload logo'}</span>
                <span className="text-[9px] text-muted/40">JPEG, PNG, WebP, SVG · max 2MB</span>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Theme Presets */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Theme Presets</CardTitle>
          <CardDescription>Quick-start with a preset, then fine-tune below</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {THEMES.map((t) => {
              const Icon = t.icon
              const isSelected = selectedThemeId === t.id
              return (
                <button
                  key={t.id}
                  onClick={() => applyPreset(t)}
                  className={cn(
                    'relative flex items-center gap-2.5 px-3 py-3 rounded-lg border text-left transition-all',
                    isSelected ? 'border-accent ring-1 ring-accent' : 'border-card-border hover:border-accent/40'
                  )}
                >
                  <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0" style={{ backgroundColor: t.primary }}>
                    <Icon className="w-4 h-4" style={{ color: t.background }} />
                  </div>
                  <div className="min-w-0">
                    <div className="text-sm font-medium text-foreground">{t.name}</div>
                    <div className="text-[10px] text-muted">{t.description}</div>
                  </div>
                  {isSelected && <Check className="w-4 h-4 text-accent absolute top-2 right-2" />}
                </button>
              )
            })}
          </div>
        </CardContent>
      </Card>

      {/* Colors & Fonts */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Colors & Fonts</CardTitle>
          <CardDescription>Fine-tune your theme</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
            {/* Colors */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <ColorPicker label="Primary" value={colors.primary} onChange={(v) => setColors(c => ({ ...c, primary: v }))} />
              <ColorPicker label="Secondary" value={colors.secondary} onChange={(v) => setColors(c => ({ ...c, secondary: v }))} />
              <ColorPicker label="Background" value={colors.background} onChange={(v) => setColors(c => ({ ...c, background: v }))} />
              <ColorPicker label="Surface/Card" value={colors.surface} onChange={(v) => setColors(c => ({ ...c, surface: v }))} />
              <ColorPicker label="Text" value={colors.foreground} onChange={(v) => setColors(c => ({ ...c, foreground: v }))} />
              <ColorPicker label="Border" value={colors.border} onChange={(v) => setColors(c => ({ ...c, border: v }))} />
            </div>

            {/* Fonts */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <FontSelect label="Title Font" value={titleFont} onChange={setTitleFont} />
              <FontSelect label="Body Font" value={bodyFont} onChange={setBodyFont} />
            </div>
          </CardContent>
        </Card>

      {/* Preview */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Preview</CardTitle>
          <CardDescription>How your member pages will look</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="max-w-sm mx-auto">
            <ThemePreview theme={effectiveTheme} businessName={studioName} logoUrl={logoUrl} />
          </div>
        </CardContent>
      </Card>

    </div>
  )
}

// ─── Studio Info Tab (B1) ────────────────────────────────────────────────────

function StudioInfoTab() {
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState(null)
  useEffect(() => { if (!message) return; const t = setTimeout(() => setMessage(null), 4000); return () => clearTimeout(t) }, [message])
  const [form, setForm] = useState({
    studio_name: '',
    studio_address: '',
    studio_phone: '',
    studio_email: '',
    studio_website: '',
  })

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch('/api/admin/settings')
        if (res.ok) {
          const { settings } = await res.json()
          setForm({
            studio_name: settings.studio_name || '',
            studio_address: settings.studio_address || '',
            studio_phone: settings.studio_phone || '',
            studio_email: settings.studio_email || '',
            studio_website: settings.studio_website || '',
          })
        }
      } catch (err) {
        console.error('Failed to load settings:', err)
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  async function handleSave(e) {
    e.preventDefault()
    setSaving(true)
    setMessage(null)
    try {
      const res = await fetch('/api/admin/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      if (res.ok) {
        setMessage({ type: 'success', text: 'Studio info saved.' })
      } else {
        setMessage({ type: 'error', text: 'Failed to save.' })
      }
    } catch {
      setMessage({ type: 'error', text: 'Failed to save.' })
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <Card>
        <CardContent className="py-8">
          <div className="animate-pulse space-y-4">
            <div className="h-6 bg-card-border rounded w-48" />
            <div className="h-10 bg-card-border rounded w-full" />
            <div className="h-10 bg-card-border rounded w-full" />
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Studio Information</CardTitle>
        <CardDescription>Public contact details for your studio</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSave} className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="studio_name">Studio Name</Label>
            <Input id="studio_name" value={form.studio_name} onChange={(e) => setForm({ ...form, studio_name: e.target.value })} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="studio_address">Address</Label>
            <Input id="studio_address" value={form.studio_address} onChange={(e) => setForm({ ...form, studio_address: e.target.value })} />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="studio_phone">Phone</Label>
              <Input id="studio_phone" value={form.studio_phone} onChange={(e) => setForm({ ...form, studio_phone: e.target.value })} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="studio_email">Email</Label>
              <Input id="studio_email" type="email" value={form.studio_email} onChange={(e) => setForm({ ...form, studio_email: e.target.value })} />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="studio_website">Website</Label>
            <Input id="studio_website" value={form.studio_website} onChange={(e) => setForm({ ...form, studio_website: e.target.value })} />
          </div>

          {message && (
            <p className={cn('text-sm', message.type === 'success' ? 'text-green-400' : 'text-red-400')}>
              {message.text}
            </p>
          )}

          <Button type="submit" disabled={saving}>
            {saving ? 'Saving...' : 'Save Studio Info'}
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}

// ─── Social Links Tab ────────────────────────────────────────────────────────

function SocialLinksTab() {
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState(null)
  useEffect(() => { if (!message) return; const t = setTimeout(() => setMessage(null), 4000); return () => clearTimeout(t) }, [message])
  const [form, setForm] = useState({
    social_instagram: '',
    social_tiktok: '',
    social_facebook: '',
    social_line: '',
    social_youtube: '',
  })

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch('/api/admin/settings')
        if (res.ok) {
          const { settings } = await res.json()
          setForm({
            social_instagram: settings.social_instagram || '',
            social_tiktok: settings.social_tiktok || '',
            social_facebook: settings.social_facebook || '',
            social_line: settings.social_line || '',
            social_youtube: settings.social_youtube || '',
          })
        }
      } catch (err) {
        console.error('Failed to load settings:', err)
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  async function handleSave(e) {
    e.preventDefault()
    setSaving(true)
    setMessage(null)
    try {
      const res = await fetch('/api/admin/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      if (res.ok) {
        setMessage({ type: 'success', text: 'Social links saved. Changes are live on the website.' })
      } else {
        setMessage({ type: 'error', text: 'Failed to save.' })
      }
    } catch {
      setMessage({ type: 'error', text: 'Failed to save.' })
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <Card>
        <CardContent className="py-8">
          <div className="animate-pulse space-y-4">
            <div className="h-6 bg-card-border rounded w-48" />
            <div className="h-10 bg-card-border rounded w-full" />
            <div className="h-10 bg-card-border rounded w-full" />
          </div>
        </CardContent>
      </Card>
    )
  }

  const fields = [
    { key: 'social_instagram', label: 'Instagram URL', placeholder: 'https://instagram.com/yourstudio' },
    { key: 'social_tiktok', label: 'TikTok URL', placeholder: 'https://tiktok.com/@yourstudio' },
    { key: 'social_facebook', label: 'Facebook URL', placeholder: 'https://facebook.com/yourstudio' },
    { key: 'social_line', label: 'LINE ID', placeholder: '@yourstudio' },
    { key: 'social_youtube', label: 'YouTube URL', placeholder: 'https://youtube.com/@yourstudio' },
  ]

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Social Media Links</CardTitle>
        <CardDescription>These appear in the footer, contact section, and email templates. Changes go live immediately.</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSave} className="space-y-4">
          {fields.map((field) => (
            <div key={field.key} className="space-y-1.5">
              <Label htmlFor={field.key}>{field.label}</Label>
              <Input
                id={field.key}
                value={form[field.key]}
                onChange={(e) => setForm({ ...form, [field.key]: e.target.value })}
                placeholder={field.placeholder}
              />
            </div>
          ))}

          {message && (
            <p className={cn('text-sm', message.type === 'success' ? 'text-green-400' : 'text-red-400')}>
              {message.text}
            </p>
          )}

          <Button type="submit" disabled={saving}>
            {saving ? 'Saving...' : 'Save Social Links'}
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}

// ─── SEO Tab ────────────────────────────────────────────────────────────────

function SeoTab() {
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState(null)
  useEffect(() => { if (!message) return; const t = setTimeout(() => setMessage(null), 4000); return () => clearTimeout(t) }, [message])
  const [form, setForm] = useState({
    seo_title: '',
    seo_description: '',
    seo_keywords: '',
    seo_og_title: '',
    seo_og_description: '',
    seo_og_image: '',
    seo_url: '',
  })

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch('/api/admin/settings')
        if (res.ok) {
          const { settings } = await res.json()
          setForm({
            seo_title: settings.seo_title || '',
            seo_description: settings.seo_description || '',
            seo_keywords: settings.seo_keywords || '',
            seo_og_title: settings.seo_og_title || '',
            seo_og_description: settings.seo_og_description || '',
            seo_og_image: settings.seo_og_image || '',
            seo_url: settings.seo_url || '',
          })
        }
      } catch (err) {
        console.error('Failed to load settings:', err)
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  async function handleSave(e) {
    e.preventDefault()
    setSaving(true)
    setMessage(null)
    try {
      const res = await fetch('/api/admin/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      if (res.ok) {
        setMessage({ type: 'success', text: 'SEO settings saved. Changes take effect on next page load.' })
      } else {
        setMessage({ type: 'error', text: 'Failed to save.' })
      }
    } catch {
      setMessage({ type: 'error', text: 'Failed to save.' })
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <Card>
        <CardContent className="py-8">
          <div className="animate-pulse space-y-4">
            <div className="h-6 bg-card-border rounded w-48" />
            <div className="h-10 bg-card-border rounded w-full" />
            <div className="h-10 bg-card-border rounded w-full" />
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Page Title & Meta</CardTitle>
          <CardDescription>Controls how your site appears in Google search results</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSave} className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="seo_title">Page Title</Label>
              <Input
                id="seo_title"
                value={form.seo_title}
                onChange={(e) => setForm({ ...form, seo_title: e.target.value })}
                placeholder="Your Studio | Page Title"
              />
              <p className="text-xs text-muted">{form.seo_title.length}/60 characters — keep under 60 for best results</p>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="seo_description">Meta Description</Label>
              <textarea
                id="seo_description"
                value={form.seo_description}
                onChange={(e) => setForm({ ...form, seo_description: e.target.value })}
                rows={3}
                className="flex w-full rounded-md border border-card-border bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-accent"
                placeholder="A short description of your business for search engines"
              />
              <p className="text-xs text-muted">{form.seo_description.length}/160 characters — keep under 160 for best results</p>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="seo_keywords">Keywords</Label>
              <Input
                id="seo_keywords"
                value={form.seo_keywords}
                onChange={(e) => setForm({ ...form, seo_keywords: e.target.value })}
                placeholder="fitness, personal training, classes, studio"
              />
              <p className="text-xs text-muted">Comma-separated keywords</p>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="seo_url">Site URL</Label>
              <Input
                id="seo_url"
                value={form.seo_url}
                onChange={(e) => setForm({ ...form, seo_url: e.target.value })}
                placeholder="https://www.yourstudio.com"
              />
            </div>

            {message && (
              <p className={cn('text-sm', message.type === 'success' ? 'text-green-400' : 'text-red-400')}>
                {message.text}
              </p>
            )}

            <Button type="submit" disabled={saving}>
              {saving ? 'Saving...' : 'Save SEO Settings'}
            </Button>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Social Sharing (Open Graph)</CardTitle>
          <CardDescription>Controls how your site appears when shared on social media</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSave} className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="seo_og_title">Share Title</Label>
              <Input
                id="seo_og_title"
                value={form.seo_og_title}
                onChange={(e) => setForm({ ...form, seo_og_title: e.target.value })}
                placeholder="Your Studio | Social Share Title"
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="seo_og_description">Share Description</Label>
              <textarea
                id="seo_og_description"
                value={form.seo_og_description}
                onChange={(e) => setForm({ ...form, seo_og_description: e.target.value })}
                rows={2}
                className="flex w-full rounded-md border border-card-border bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-accent"
                placeholder="Short description for social media shares"
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="seo_og_image">Share Image URL</Label>
              <Input
                id="seo_og_image"
                value={form.seo_og_image}
                onChange={(e) => setForm({ ...form, seo_og_image: e.target.value })}
                placeholder="https://www.yourstudio.com/images/og-image.jpg"
              />
              <p className="text-xs text-muted">Recommended: 1200x630px. Leave blank to use auto-generated image.</p>
              {form.seo_og_image && (
                <div className="mt-2 rounded border border-card-border overflow-hidden max-w-xs">
                  <img src={form.seo_og_image} alt="OG preview" className="w-full" onError={(e) => { e.target.style.display = 'none' }} />
                </div>
              )}
            </div>

            {/* Preview */}
            <div className="mt-4 p-4 rounded-lg bg-background/50 border border-card-border/50">
              <p className="text-[10px] uppercase tracking-wider text-muted mb-2">Social Share Preview</p>
              <div className="rounded border border-card-border overflow-hidden max-w-sm">
                {form.seo_og_image ? (
                  <img src={form.seo_og_image} alt="Share preview" className="w-full aspect-[1200/630] object-cover" onError={(e) => { e.target.style.display = 'none' }} />
                ) : (
                  <div className="h-32 bg-card-border flex items-center justify-center text-muted text-xs">
                    Auto-generated image
                  </div>
                )}
                <div className="p-3 bg-card">
                  <p className="text-xs text-muted truncate">{form.seo_url || 'yourstudio.com'}</p>
                  <p className="text-sm font-semibold text-foreground mt-0.5 truncate">{form.seo_og_title || 'Page title'}</p>
                  <p className="text-xs text-muted mt-0.5 line-clamp-2">{form.seo_og_description || 'Page description'}</p>
                </div>
              </div>
            </div>

            <Button type="submit" disabled={saving}>
              {saving ? 'Saving...' : 'Save Social Sharing'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}

// ─── Booking Rules Tab (B2) ──────────────────────────────────────────────────

function BookingRulesTab() {
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState(null)
  useEffect(() => { if (!message) return; const t = setTimeout(() => setMessage(null), 4000); return () => clearTimeout(t) }, [message])
  const [form, setForm] = useState({
    default_capacity: '6',
    cancellation_window_hours: '24',
    max_advance_booking_days: '28',
  })

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch('/api/admin/settings')
        if (res.ok) {
          const { settings } = await res.json()
          setForm({
            default_capacity: settings.default_capacity || '6',
            cancellation_window_hours: settings.cancellation_window_hours || '24',
            max_advance_booking_days: settings.max_advance_booking_days || '28',
          })
        }
      } catch (err) {
        console.error('Failed to load settings:', err)
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  async function handleSave(e) {
    e.preventDefault()
    setSaving(true)
    setMessage(null)
    try {
      const res = await fetch('/api/admin/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      if (res.ok) {
        setMessage({ type: 'success', text: 'Booking rules saved.' })
      } else {
        setMessage({ type: 'error', text: 'Failed to save.' })
      }
    } catch {
      setMessage({ type: 'error', text: 'Failed to save.' })
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <Card>
        <CardContent className="py-8">
          <div className="animate-pulse space-y-4">
            <div className="h-6 bg-card-border rounded w-48" />
            <div className="h-10 bg-card-border rounded w-full" />
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Booking Rules</CardTitle>
        <CardDescription>Configure default booking behavior and policies</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSave} className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="default_capacity">Default Class Capacity</Label>
            <Input
              id="default_capacity"
              type="number"
              min="1"
              max="50"
              value={form.default_capacity}
              onChange={(e) => setForm({ ...form, default_capacity: e.target.value })}
            />
            <p className="text-xs text-muted">Maximum number of members per class (default for new classes)</p>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="cancellation_window_hours">Cancellation Window (hours)</Label>
            <Input
              id="cancellation_window_hours"
              type="number"
              min="0"
              max="168"
              value={form.cancellation_window_hours}
              onChange={(e) => setForm({ ...form, cancellation_window_hours: e.target.value })}
            />
            <p className="text-xs text-muted">Members must cancel at least this many hours before class to receive a credit refund</p>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="max_advance_booking_days">Max Advance Booking (days)</Label>
            <Input
              id="max_advance_booking_days"
              type="number"
              min="1"
              max="90"
              value={form.max_advance_booking_days}
              onChange={(e) => setForm({ ...form, max_advance_booking_days: e.target.value })}
            />
            <p className="text-xs text-muted">How far in advance members can book classes</p>
          </div>

          {message && (
            <p className={cn('text-sm', message.type === 'success' ? 'text-green-400' : 'text-red-400')}>
              {message.text}
            </p>
          )}

          <Button type="submit" disabled={saving}>
            {saving ? 'Saving...' : 'Save Booking Rules'}
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}

// ─── Reminders Tab (B3) ──────────────────────────────────────────────────────

function RemindersTab() {
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState(null)
  useEffect(() => { if (!message) return; const t = setTimeout(() => setMessage(null), 4000); return () => clearTimeout(t) }, [message])
  const [reminder1h, setReminder1h] = useState(true)
  const [reminder24h, setReminder24h] = useState(false)

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch('/api/admin/settings')
        if (res.ok) {
          const { settings } = await res.json()
          setReminder1h(settings.reminder_1h !== 'false')
          setReminder24h(settings.reminder_24h === 'true')
        }
      } catch (err) {
        console.error('Failed to load settings:', err)
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  async function handleSave() {
    setSaving(true)
    setMessage(null)
    try {
      const res = await fetch('/api/admin/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          reminder_1h: reminder1h.toString(),
          reminder_24h: reminder24h.toString(),
        }),
      })
      if (res.ok) {
        setMessage({ type: 'success', text: 'Reminder settings saved.' })
      } else {
        setMessage({ type: 'error', text: 'Failed to save.' })
      }
    } catch {
      setMessage({ type: 'error', text: 'Failed to save.' })
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <Card>
        <CardContent className="py-8">
          <div className="animate-pulse space-y-4">
            <div className="h-6 bg-card-border rounded w-48" />
            <div className="h-10 bg-card-border rounded w-full" />
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Class Reminders</CardTitle>
        <CardDescription>Configure automated email reminders sent before classes</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="flex items-center justify-between p-4 rounded-lg bg-background/50 border border-card-border/50">
          <div>
            <p className="text-sm font-medium text-foreground">1-Hour Reminder</p>
            <p className="text-xs text-muted mt-0.5">Send reminder email 1 hour before class starts</p>
          </div>
          <Switch
            checked={reminder1h}
            onCheckedChange={setReminder1h}
          />
        </div>

        <div className="flex items-center justify-between p-4 rounded-lg bg-background/50 border border-card-border/50">
          <div>
            <p className="text-sm font-medium text-foreground">24-Hour Reminder</p>
            <p className="text-xs text-muted mt-0.5">Send reminder email 24 hours before class starts</p>
          </div>
          <Switch
            checked={reminder24h}
            onCheckedChange={setReminder24h}
          />
        </div>

        <div className="p-3 bg-amber-600/10 border border-amber-600/20 rounded-lg">
          <p className="text-xs text-amber-400/80">Reminders require the RESEND_API_KEY environment variable to be configured. The 1-hour reminder runs via a cron job every 15 minutes.</p>
        </div>

        {message && (
          <p className={cn('text-sm', message.type === 'success' ? 'text-green-400' : 'text-red-400')}>
            {message.text}
          </p>
        )}

        <Button onClick={handleSave} disabled={saving}>
          {saving ? 'Saving...' : 'Save Reminder Settings'}
        </Button>
      </CardContent>
    </Card>
  )
}

// ─── Payments Tab (existing) ─────────────────────────────────────────────────

function PaymentsTab() {
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [saveMessage, setSaveMessage] = useState(null)
  const [stripeConfigured, setStripeConfigured] = useState(false)
  const [secretKey, setSecretKey] = useState('')

  useEffect(() => {
    fetchData()
  }, [])

  async function fetchData() {
    try {
      const [settingsRes, stripeRes] = await Promise.all([
        fetch('/api/admin/settings'),
        fetch('/api/settings/stripe-status'),
      ])

      if (settingsRes.ok) {
        const { settings } = await settingsRes.json()
        if (settings.stripe_secret_key) setSecretKey('sk_•••••••••••••••••')
      }

      if (stripeRes.ok) {
        const data = await stripeRes.json()
        setStripeConfigured(data.configured)
      }
    } catch (err) {
      console.error('Failed to load settings:', err)
    } finally {
      setLoading(false)
    }
  }

  async function handleSaveKey() {
    if (!secretKey || secretKey.includes('•')) {
      setSaveMessage({ type: 'error', text: 'Enter your Stripe secret key.' })
      return
    }

    setSaving(true)
    setSaveMessage(null)

    try {
      const res = await fetch('/api/admin/stripe-setup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ secretKey: secretKey.trim() }),
      })
      const data = await res.json()

      if (!res.ok) {
        setSaveMessage({ type: 'error', text: data.error || 'Failed to save.' })
        return
      }

      setStripeConfigured(true)
      setSecretKey('sk_•••••••••••••••••')

      if (data.webhookConfigured) {
        setSaveMessage({ type: 'success', text: 'Stripe connected! Webhook configured automatically.' })
      } else {
        setSaveMessage({ type: 'success', text: 'Key saved but webhook could not be auto-configured. Set it up manually in Stripe.' })
      }
    } catch (err) {
      setSaveMessage({ type: 'error', text: 'Failed to connect Stripe.' })
    } finally {
      setSaving(false)
    }
  }

  async function handleClearKeys() {
    if (!confirm('Disconnect Stripe? Payments will stop working until a new key is added.')) return
    setSaving(true)
    try {
      await fetch('/api/admin/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ stripe_secret_key: '', stripe_webhook_secret: '' }),
      })
      setSecretKey('')
      setStripeConfigured(false)
      setSaveMessage({ type: 'success', text: 'Stripe disconnected.' })
    } catch {
      setSaveMessage({ type: 'error', text: 'Failed to disconnect.' })
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <Card>
        <CardContent className="py-8">
          <div className="animate-pulse space-y-4">
            <div className="h-6 bg-card-border rounded w-48" />
            <div className="h-12 bg-card-border rounded w-full sm:w-64" />
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Stripe Card */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <CreditCard className="w-4 h-4" /> Stripe Payments
          </CardTitle>
          <CardDescription>
            Paste your Stripe Secret Key to enable payments. Webhooks are configured automatically.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-2 mb-2">
            {stripeConfigured ? (
              <Badge variant="success">Active</Badge>
            ) : (
              <Badge variant="destructive">Not Connected</Badge>
            )}
          </div>

          <div>
            <Label htmlFor="stripe-sk">Secret Key</Label>
            <Input
              id="stripe-sk"
              type="password"
              placeholder="sk_test_... or sk_live_..."
              value={secretKey}
              onFocus={() => { if (secretKey.includes('•')) setSecretKey('') }}
              onChange={(e) => setSecretKey(e.target.value)}
              className="mt-1 font-mono text-xs"
            />
            <p className="text-[11px] text-muted mt-1">
              From{' '}
              <a href="https://dashboard.stripe.com/apikeys" target="_blank" rel="noopener noreferrer" className="text-accent hover:underline">
                Stripe Dashboard → Developers → API Keys
              </a>
            </p>
          </div>

          {saveMessage && (
            <p className={cn('text-sm', saveMessage.type === 'success' ? 'text-green-400' : 'text-red-400')}>
              {saveMessage.text}
            </p>
          )}

          <div className="flex flex-col sm:flex-row gap-2 pt-1">
            <Button onClick={handleSaveKey} disabled={saving} className="w-full sm:w-auto">
              {saving ? 'Connecting...' : stripeConfigured ? 'Update Key' : 'Connect Stripe'}
            </Button>
            {stripeConfigured && (
              <>
                <Button variant="outline" size="sm" className="w-full sm:w-auto" asChild>
                  <a href="https://dashboard.stripe.com/apikeys" target="_blank" rel="noopener noreferrer">
                    API Keys ↗
                  </a>
                </Button>
                <Button variant="outline" size="sm" className="w-full sm:w-auto" asChild>
                  <a href="https://dashboard.stripe.com/webhooks" target="_blank" rel="noopener noreferrer">
                    Webhooks ↗
                  </a>
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full sm:w-auto text-red-400 border-red-400/30 hover:bg-red-400/10"
                  onClick={handleClearKeys}
                  disabled={saving}
                >
                  Disconnect
                </Button>
              </>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Setup instructions — always visible */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">{stripeConfigured ? 'Linking Products' : 'Setup Guide'}</CardTitle>
          <CardDescription>
            {stripeConfigured
              ? 'Link each of your class packs to a Stripe product so customers can pay.'
              : 'Follow these steps to start accepting payments.'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ol className="space-y-3 text-sm text-muted list-decimal list-inside">
            {!stripeConfigured && (
              <>
                <li>Create a <a href="https://dashboard.stripe.com/register" target="_blank" rel="noopener noreferrer" className="text-accent hover:underline">Stripe account</a> (or sign in to your existing one)</li>
                <li>Go to <a href="https://dashboard.stripe.com/apikeys" target="_blank" rel="noopener noreferrer" className="text-accent hover:underline">Developers → API Keys</a> and copy your <strong className="text-foreground">Secret Key</strong></li>
                <li>Paste it above and click <strong className="text-foreground">Connect Stripe</strong> — webhooks are set up automatically</li>
              </>
            )}
            <li>
              Go to your <a href="https://dashboard.stripe.com/products" target="_blank" rel="noopener noreferrer" className="text-accent hover:underline">Stripe Product Catalogue</a> and create a <strong className="text-foreground">Product</strong> for each class pack (e.g. &quot;5 Class Pack&quot;). Set the price when creating the product.
            </li>
            <li>
              Copy the <strong className="text-foreground">product URL</strong> from your browser address bar (it looks like <code className="text-xs bg-white/5 px-1.5 py-0.5 rounded">https://dashboard.stripe.com/products/prod_...</code>)
            </li>
            <li>
              Go to the <a href="/admin/packs" className="text-accent hover:underline">Class Packs</a> page, edit each pack, and paste the URL into the <strong className="text-foreground">Stripe Product</strong> field. The system will automatically link it.
            </li>
          </ol>
          {stripeConfigured && (
            <div className="mt-4 flex gap-2">
              <Button variant="outline" size="sm" asChild>
                <a href="https://dashboard.stripe.com/products" target="_blank" rel="noopener noreferrer">
                  Product Catalogue ↗
                </a>
              </Button>
              <Button variant="outline" size="sm" asChild>
                <a href="/admin/packs">
                  Class Packs →
                </a>
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
