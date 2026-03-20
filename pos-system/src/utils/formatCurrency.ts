import { useSettingsStore } from '@/store/settingsStore'

export const formatCurrency = (amount: number) => {
  const currency = useSettingsStore.getState().settings?.currency_code || 'GHS'
  
  return new Intl.NumberFormat('en-GH', {
    style: 'currency',
    currency: currency,
  }).format(amount)
}
