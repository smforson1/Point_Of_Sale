import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { createClient } from '@/lib/supabase/client'

export interface Settings {
  id?: string
  store_name: string
  store_address?: string
  store_phone?: string
  store_email?: string
  store_logo_url?: string
  currency_code: string
  tax_rate: number
  receipt_footer?: string
  updated_at?: string
}

interface SettingsState {
  settings: Settings | null
  isLoading: boolean
  error: string | null
  fetchSettings: () => Promise<void>
  updateSettings: (newSettings: Partial<Settings>) => void
  setSettings: (settings: Settings) => void
}

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set, get) => ({
      settings: null,
      isLoading: false,
      error: null,

      fetchSettings: async () => {
        const supabase = createClient()
        set({ isLoading: true, error: null })
        try {
          const { data, error } = await supabase.from('settings').select('*').single()
          if (error && error.code !== 'PGRST116') throw error
          
          if (data) {
            set({ settings: data })
          }
        } catch (error: any) {
          set({ error: error.message })
        } finally {
          set({ isLoading: false })
        }
      },

      updateSettings: (newSettings) => {
        const currentSettings = get().settings
        if (currentSettings) {
          set({ settings: { ...currentSettings, ...newSettings } })
        }
      },

      setSettings: (settings) => {
        set({ settings })
      },
    }),
    {
      name: 'pos-settings-storage',
    }
  )
)
