'use client'

import { createContext, useContext, useState, useEffect } from 'react'

const SettingsContext = createContext({})

const DEFAULTS = {
  studio_name: 'BOXX',
  studio_address: '89/2 Bumruang Road, Wat Ket, Chiang Mai 50000',
  studio_phone: '+66 93 497 2306',
  studio_email: 'hello@boxxthailand.com',
  studio_website: 'https://boxxthailand.com',
  social_instagram: 'https://instagram.com/boxxthailand',
  social_tiktok: 'https://tiktok.com/@boxxthailand',
  social_facebook: '',
  social_line: '@boxxthailand',
  social_youtube: '',
}

export function SettingsProvider({ children }) {
  const [settings, setSettings] = useState(DEFAULTS)

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch('/api/settings/public')
        if (res.ok) {
          const { settings: s } = await res.json()
          setSettings((prev) => ({ ...prev, ...s }))
        }
      } catch {
        // Keep defaults
      }
    }
    load()
  }, [])

  return (
    <SettingsContext.Provider value={settings}>
      {children}
    </SettingsContext.Provider>
  )
}

export function useSettings() {
  return useContext(SettingsContext)
}
