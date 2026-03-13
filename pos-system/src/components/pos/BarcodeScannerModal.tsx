'use client'

import { useState } from 'react'
import BarcodeScanner from 'react-qr-barcode-scanner'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Camera, X } from 'lucide-react'

interface BarcodeScannerModalProps {
  isOpen: boolean
  onClose: () => void
  onScan: (barcode: string) => void
}

export function BarcodeScannerModal({
  isOpen,
  onClose,
  onScan,
}: BarcodeScannerModalProps) {
  const [error, setError] = useState<string | null>(null)

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md bg-black border-none p-0 overflow-hidden">
        <DialogHeader className="p-4 bg-gray-900 absolute top-0 left-0 right-0 z-10 bg-opacity-80">
          <DialogTitle className="text-white flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Camera className="h-5 w-5 text-primary" />
              Scan Barcode
            </div>
            <Button variant="ghost" size="icon" onClick={onClose} className="text-white hover:bg-black/50 h-8 w-8">
              <X className="h-4 w-4" />
            </Button>
          </DialogTitle>
        </DialogHeader>

        <div className="relative aspect-square sm:aspect-video flex items-center justify-center bg-black">
          {isOpen && (
            <BarcodeScanner
              width="100%"
              height="100%"
              onUpdate={(err, result) => {
                if (result) {
                  onScan(result.getText())
                  onClose()
                }
                if (err) {
                  // Small errors are expected during scanning
                  console.debug(err)
                }
              }}
            />
          )}
          
          <div className="absolute inset-0 border-2 border-primary/50 pointer-events-none">
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-3/4 h-1/2 border-2 border-primary rounded-lg shadow-[0_0_20px_rgba(var(--primary),0.5)]">
               <div className="absolute top-0 bottom-0 left-0 right-0 bg-primary/10 animate-pulse" />
            </div>
          </div>
          
          {error && (
            <div className="absolute bottom-4 left-4 right-4 bg-destructive/90 text-destructive-foreground p-3 rounded text-sm text-center">
              {error}
            </div>
          )}
        </div>
        
        <div className="p-6 bg-gray-900 text-center text-white/70 text-sm">
          Align the barcode within the central frame to scan.
        </div>
      </DialogContent>
    </Dialog>
  )
}
