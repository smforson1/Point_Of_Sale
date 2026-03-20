'use client'

import { useEffect } from 'react'
import { useSettingsStore } from '@/store/settingsStore'

export function SettingsInitializer() {
  const fetchSettings = useSettingsStore((state) => state.fetchSettings)

  useEffect(() => {
    fetchSettings()
  }, [fetchSettings])

  return null
}
