'use client'

import { useEffect, useRef } from 'react'
import JsBarcode from 'jsbarcode'
import { Button } from '@/components/ui/button'
import { Printer, Download } from 'lucide-react'

interface BarcodeDisplayProps {
  value: string
  format?: 'CODE128' | 'EAN13' | 'UPC'
  width?: number
  height?: number
  displayValue?: boolean
}

export function BarcodeDisplay({
  value,
  format = 'CODE128',
  width = 2,
  height = 50,
  displayValue = true,
}: BarcodeDisplayProps) {
  const barcodeRef = useRef<SVGSVGElement>(null)

  useEffect(() => {
    if (barcodeRef.current && value) {
      try {
        JsBarcode(barcodeRef.current, value, {
          format,
          width,
          height,
          displayValue,
          fontSize: 12,
          margin: 10,
        })
      } catch (error) {
        console.error('Barcode generation error:', error)
      }
    }
  }, [value, format, width, height, displayValue])

  const handlePrint = () => {
    const printWindow = window.open('', '_blank')
    if (printWindow) {
      const svg = barcodeRef.current?.outerHTML
      printWindow.document.write(`
        <html>
          <head><title>Print Barcode</title></head>
          <body style="display:flex;justify-content:center;align-items:center;height:100vh;margin:0;">
            ${svg}
            <script>window.onload = () => { window.print(); window.close(); }</script>
          </body>
        </html>
      `)
      printWindow.document.close()
    }
  }

  return (
    <div className="flex flex-col items-center gap-4 p-4 border border-border rounded-lg bg-card text-card-foreground">
      <svg ref={barcodeRef}></svg>
      <div className="flex gap-2">
        <Button variant="outline" size="sm" onClick={handlePrint}>
          <Printer className="mr-2 h-4 w-4" /> Print
        </Button>
      </div>
    </div>
  )
}
