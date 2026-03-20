'use client'

import { useEffect } from 'react'
import { useSettingsStore } from '@/store/settingsStore'

export function useSettings() {
  const { settings, fetchSettings, isLoading, error } = useSettingsStore()

  useEffect(() => {
    // Only fetch if we don't have settings yet and aren't already loading
    if (!settings && !isLoading) {
      fetchSettings()
    }
  }, [settings, isLoading, fetchSettings])

  return {
    settings,
    isLoading,
    error,
    refreshSettings: fetchSettings
  }
}
