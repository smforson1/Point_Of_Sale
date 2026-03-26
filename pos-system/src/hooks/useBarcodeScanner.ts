'use client'

import { useEffect, useCallback, useRef } from 'react'
import { toast } from 'react-hot-toast'

interface UseBarcodeScannerProps {
  onScan: (barcode: string) => void
  disabled?: boolean
  timeoutMs?: number 
}

export function useBarcodeScanner({ onScan, disabled = false, timeoutMs = 100 }: UseBarcodeScannerProps) {
  const barcodeChars = useRef<string>('')
  const lastKeyTime = useRef<number>(0)

  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (disabled) return

      // Skip if modern elements like dialogs or overlays are open and not focused here
      // But we generally want to catch hardware scans globally.
      
      const activeTag = document.activeElement?.tagName.toLowerCase()
      // If user is focused on an input, we only want to "catch" the scan if it's very fast
      // But for simplicity, we'll stick to the "not in input" rule for global auto-add,
      // and let inputs handle their own Enter key.
      if (activeTag === 'input' || activeTag === 'textarea') {
         // Some scanners prefix with a specific character or sequence.
         // For now, we'll let inputs handle it themselves to avoid double-entry.
         return
      }

      const currentTime = Date.now()

      if (e.key === 'Enter') {
        if (barcodeChars.current.length >= 3) {
           e.preventDefault()
           e.stopPropagation()
           onScan(barcodeChars.current.trim())
           barcodeChars.current = ''
        }
        return
      }

      // If the time between keystrokes is too long, it's definitely human typing
      if (currentTime - lastKeyTime.current > timeoutMs) {
        barcodeChars.current = ''
      }

      // Add valid characters (alphanumeric for most barcodes)
      if (e.key.length === 1 && /^[a-zA-Z0-9.\-_/]$/.test(e.key)) {
        barcodeChars.current += e.key
        lastKeyTime.current = currentTime
      }
    },
    [onScan, disabled, timeoutMs]
  )

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown)
    return () => {
      window.removeEventListener('keydown', handleKeyDown)
    }
  }, [handleKeyDown])
}
