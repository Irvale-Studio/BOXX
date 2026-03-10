'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

const TABS = [
  { id: 'hero', label: 'Hero & Branding' },
  { id: 'social', label: 'Social Links' },
  { id: 'contact', label: 'Contact Info' },
  { id: 'gallery', label: 'Gallery' },
]

const SOCIAL_FIELDS = [
  { key: 'social_instagram', label: 'Instagram URL', placeholder: 'https://instagram.com/boxxthailand' },
  { key: 'social_tiktok', label: 'TikTok URL', placeholder: 'https://tiktok.com/@boxxthailand' },
  { key: 'social_facebook', label: 'Facebook URL', placeholder: 'https://facebook.com/boxxthailand' },
  { key: 'social_line', label: 'LINE ID', placeholder: '@boxxthailand' },
  { key: 'social_youtube', label: 'YouTube URL', placeholder: 'https://youtube.com/@boxxthailand' },
]

const HERO_FIELDS = [
  { key: 'hero_heading', label: 'Hero Heading', placeholder: 'BOXX' },
  { key: 'hero_subheading', label: 'Hero Subheading', placeholder: 'Chiang Mai\'s Premier Boxing Studio' },
  { key: 'hero_cta_text', label: 'CTA Button Text', placeholder: 'Start Your Journey' },
  { key: 'hero_cta_url', label: 'CTA Button Link', placeholder: '#contact' },
]

const CONTACT_FIELDS = [
  { key: 'studio_name', label: 'Studio Name', placeholder: 'BOXX' },
  { key: 'studio_address', label: 'Address', placeholder: '89/2 Bumruang Road, Wat Ket, Chiang Mai 50000' },
  { key: 'studio_phone', label: 'Phone', placeholder: '+66 93 497 2306' },
  { key: 'studio_email', label: 'Email', placeholder: 'hello@boxxthailand.com' },
  { key: 'studio_website', label: 'Website URL', placeholder: 'https://boxxthailand.com' },
  { key: 'studio_google_maps', label: 'Google Maps Embed URL', placeholder: 'https://maps.google.com/...' },
]

export default function AdminDesignPage() {
  const [activeTab, setActiveTab] = useState('hero')
  const [settings, setSettings] = useState({})
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [galleryUrls, setGalleryUrls] = useState(['', '', '', '', ''])

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch('/api/admin/settings')
        if (res.ok) {
          const { settings: s } = await res.json()
          setSettings(s || {})
          // Parse gallery URLs
          try {
            const parsed = JSON.parse(s?.gallery_images || '[]')
            const urls = Array.isArray(parsed) ? parsed : []
            setGalleryUrls([...urls, ...Array(5 - urls.length).fill('')].slice(0, 5))
          } catch {
            setGalleryUrls(['', '', '', '', ''])
          }
        }
      } catch (err) {
        console.error('Failed to load settings:', err)
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  const updateField = (key, value) => {
    setSettings((prev) => ({ ...prev, [key]: value }))
    setSaved(false)
  }

  const saveSettings = async (fields) => {
    setSaving(true)
    setSaved(false)
    try {
      const updates = {}
      fields.forEach((f) => {
        updates[f.key] = settings[f.key] || ''
      })
      const res = await fetch('/api/admin/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates),
      })
      if (res.ok) setSaved(true)
    } catch (err) {
      console.error('Save failed:', err)
    } finally {
      setSaving(false)
    }
  }

  const saveGallery = async () => {
    setSaving(true)
    setSaved(false)
    try {
      const filtered = galleryUrls.filter((u) => u.trim())
      const res = await fetch('/api/admin/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ gallery_images: JSON.stringify(filtered) }),
      })
      if (res.ok) setSaved(true)
    } catch (err) {
      console.error('Save failed:', err)
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div>
        <h1 className="text-2xl font-bold text-foreground mb-6">Design & Content</h1>
        <div className="h-64 bg-card border border-card-border rounded-lg animate-pulse" />
      </div>
    )
  }

  const renderFields = (fields) => (
    <div className="space-y-4">
      {fields.map((field) => (
        <div key={field.key}>
          <Label htmlFor={field.key} className="text-sm text-foreground mb-1.5 block">{field.label}</Label>
          <Input
            id={field.key}
            value={settings[field.key] || ''}
            onChange={(e) => updateField(field.key, e.target.value)}
            placeholder={field.placeholder}
          />
        </div>
      ))}
    </div>
  )

  return (
    <div>
      <h1 className="text-2xl font-bold text-foreground mb-6">Design & Content</h1>

      {/* Tabs */}
      <div className="flex gap-1 mb-6 overflow-x-auto pb-1">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            onClick={() => { setActiveTab(tab.id); setSaved(false) }}
            className={cn(
              'px-4 py-2 text-sm font-medium rounded-md transition-colors whitespace-nowrap',
              activeTab === tab.id
                ? 'bg-accent/10 text-accent'
                : 'text-muted hover:text-foreground hover:bg-white/5'
            )}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Hero & Branding */}
      {activeTab === 'hero' && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Hero Section</CardTitle>
            <p className="text-xs text-muted">Customize the main hero section on your homepage.</p>
          </CardHeader>
          <CardContent className="space-y-6">
            {renderFields(HERO_FIELDS)}
            <div className="flex items-center gap-3 pt-2">
              <Button onClick={() => saveSettings(HERO_FIELDS)} disabled={saving}>
                {saving ? 'Saving...' : 'Save Changes'}
              </Button>
              {saved && <span className="text-xs text-green-400">Saved</span>}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Social Links */}
      {activeTab === 'social' && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Social Media Links</CardTitle>
            <p className="text-xs text-muted">These appear in the footer, contact section, and email templates.</p>
          </CardHeader>
          <CardContent className="space-y-6">
            {renderFields(SOCIAL_FIELDS)}
            <div className="flex items-center gap-3 pt-2">
              <Button onClick={() => saveSettings(SOCIAL_FIELDS)} disabled={saving}>
                {saving ? 'Saving...' : 'Save Changes'}
              </Button>
              {saved && <span className="text-xs text-green-400">Saved</span>}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Contact Info */}
      {activeTab === 'contact' && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Contact Information</CardTitle>
            <p className="text-xs text-muted">Displayed on the contact section and footer.</p>
          </CardHeader>
          <CardContent className="space-y-6">
            {renderFields(CONTACT_FIELDS)}
            <div className="flex items-center gap-3 pt-2">
              <Button onClick={() => saveSettings(CONTACT_FIELDS)} disabled={saving}>
                {saving ? 'Saving...' : 'Save Changes'}
              </Button>
              {saved && <span className="text-xs text-green-400">Saved</span>}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Gallery */}
      {activeTab === 'gallery' && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Gallery Images</CardTitle>
            <p className="text-xs text-muted">Enter image URLs for the homepage gallery. Use paths like /images/studio/photo.webp for local images.</p>
          </CardHeader>
          <CardContent className="space-y-4">
            {galleryUrls.map((url, i) => (
              <div key={i} className="flex items-start gap-3">
                <div className="flex-1">
                  <Label className="text-sm text-foreground mb-1.5 block">Image {i + 1}</Label>
                  <Input
                    value={url}
                    onChange={(e) => {
                      const updated = [...galleryUrls]
                      updated[i] = e.target.value
                      setGalleryUrls(updated)
                      setSaved(false)
                    }}
                    placeholder="/images/studio/photo.webp"
                  />
                </div>
                {url && (
                  <div className="w-16 h-16 rounded border border-card-border overflow-hidden shrink-0 mt-6">
                    <img src={url} alt="" className="w-full h-full object-cover" onError={(e) => { e.target.style.display = 'none' }} />
                  </div>
                )}
              </div>
            ))}
            <div className="flex items-center gap-3 pt-2">
              <Button onClick={saveGallery} disabled={saving}>
                {saving ? 'Saving...' : 'Save Gallery'}
              </Button>
              {saved && <span className="text-xs text-green-400">Saved</span>}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
