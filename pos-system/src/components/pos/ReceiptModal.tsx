'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { formatCurrency } from '@/utils/formatCurrency'
import { formatDate } from '@/utils/formatDate'
import { exportToPDF } from '@/utils/exportPDF'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Printer, Download, RefreshCw, Loader2 } from 'lucide-react'
import { Separator } from '@/components/ui/separator'

interface ReceiptModalProps {
  isOpen: boolean
  onClose: () => void
  saleId: string
}

export function ReceiptModal({ isOpen, onClose, saleId }: ReceiptModalProps) {
  const [sale, setSale] = useState<any>(null)
  const [items, setItems] = useState<any[]>([])
  const [payment, setPayment] = useState<any>(null)
  const [settings, setSettings] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true)
      const [
        { data: saleData },
        { data: itemsData },
        { data: paymentData },
        { data: settingsData }
      ] = await Promise.all([
        supabase.from('sales').select('*, profiles(full_name), customers(full_name)').eq('id', saleId).single(),
        supabase.from('sale_items').select('*, products(name)').eq('sale_id', saleId),
        supabase.from('payments').select('*').eq('sale_id', saleId).single(),
        supabase.from('settings').select('*').limit(1).single()
      ])

      if (saleData) setSale(saleData)
      if (itemsData) setItems(itemsData)
      if (paymentData) setPayment(paymentData)
      if (settingsData) setSettings(settingsData)
      setLoading(false)
    }

    if (saleId) fetchData()
  }, [saleId, supabase])

  const handleDownloadPDF = () => {
    if (!sale) return
    const headers = [['Product', 'Qty', 'Unit Price', 'Total']]
    const data = items.map(item => [
      item.products.name,
      item.quantity.toString(),
      formatCurrency(item.unit_price),
      formatCurrency(item.subtotal)
    ])
    
    // Summing totals for the PDF extra info
    data.push(['', '', 'Subtotal', formatCurrency(sale.subtotal)])
    data.push(['', '', 'Discount', `-${formatCurrency(sale.discount_amount)}`])
    data.push(['', '', 'VAT (15%)', formatCurrency(sale.tax_amount)])
    data.push(['', '', 'Total', formatCurrency(sale.total_amount)])

    exportToPDF(
      `${settings?.store_name || 'POS'} - Receipt`,
      headers,
      data,
      `receipt-${saleId.slice(0, 8)}.pdf`
    )
  }

  const handlePrint = () => {
    window.print()
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-sm p-0 overflow-hidden bg-white">
        {loading ? (
          <div className="h-96 flex items-center justify-center">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : (
          <div className="flex flex-col">
            <div id="receipt-content" className="p-6 text-sm font-mono print:p-0">
              <div className="text-center mb-4">
                <h2 className="text-xl font-bold uppercase">{settings?.store_name || 'POS SYSTEM'}</h2>
                <p className="text-xs text-muted-foreground">{settings?.store_address}</p>
                <p className="text-xs text-muted-foreground">Tel: {settings?.store_phone}</p>
              </div>

              <Separator className="my-3 border-dashed" />

              <div className="space-y-1 mb-4">
                <div className="flex justify-between">
                  <span className="text-muted-foreground text-xs uppercase">Receipt #:</span>
                  <span className="font-bold">{saleId.slice(0, 8).toUpperCase()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground text-xs uppercase">Date:</span>
                  <span>{formatDate(sale.created_at)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground text-xs uppercase">Cashier:</span>
                  <span>{sale.profiles?.full_name || 'Staff'}</span>
                </div>
                {sale.customers && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground text-xs uppercase">Customer:</span>
                    <span>{sale.customers.full_name}</span>
                  </div>
                )}
              </div>

              <Separator className="my-3 border-dashed" />

              <div className="space-y-2 mb-4">
                {items.map((item, idx) => (
                  <div key={idx} className="flex flex-col">
                    <div className="flex justify-between font-bold">
                      <span>{item.products.name}</span>
                      <span>{formatCurrency(item.subtotal)}</span>
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {item.quantity} x {formatCurrency(item.unit_price)}
                    </div>
                  </div>
                ))}
              </div>

              <Separator className="my-3 border-dashed" />

              <div className="space-y-1 text-sm">
                <div className="flex justify-between">
                  <span>Subtotal</span>
                  <span>{formatCurrency(sale.subtotal)}</span>
                </div>
                <div className="flex justify-between text-red-500">
                  <span>Discount</span>
                  <span>-{formatCurrency(sale.discount_amount)}</span>
                </div>
                <div className="flex justify-between">
                  <span>VAT (15%)</span>
                  <span>{formatCurrency(sale.tax_amount)}</span>
                </div>
                <div className="flex justify-between text-lg font-bold border-t border-black pt-1 mt-1">
                  <span>TOTAL</span>
                  <span>{formatCurrency(sale.total_amount)}</span>
                </div>
              </div>

              <Separator className="my-3 border-dashed" />

              <div className="text-xs space-y-1">
                <div className="flex justify-between">
                  <span className="uppercase">Payment Method:</span>
                  <span className="font-bold">{payment?.method.replace('_', ' ')}</span>
                </div>
                {payment?.method === 'CASH' && (
                  <>
                    <div className="flex justify-between">
                      <span className="uppercase">Amount Tendered:</span>
                      <span>{formatCurrency(payment.details?.amount_tendered || 0)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="uppercase">Change:</span>
                      <span>{formatCurrency(payment.details?.change || 0)}</span>
                    </div>
                  </>
                )}
                {payment?.provider_reference && (
                  <div className="flex justify-between">
                    <span className="uppercase">Reference:</span>
                    <span className="font-mono">{payment.provider_reference}</span>
                  </div>
                )}
              </div>

              <div className="mt-8 text-center">
                <p className="text-xs italic">{settings?.receipt_footer || 'Thank you for your business!'}</p>
                <div className="mt-4 opacity-30 flex justify-center grayscale">
                   {/* Barcode would go here in physical receipt */}
                </div>
              </div>
            </div>

            <div className="p-4 bg-gray-50 flex gap-2 border-t print:hidden">
              <Button variant="outline" className="flex-1" onClick={handlePrint}>
                <Printer className="mr-2 h-4 w-4" /> Print
              </Button>
              <Button variant="outline" className="flex-1" onClick={handleDownloadPDF}>
                <Download className="mr-2 h-4 w-4" /> PDF
              </Button>
            </div>
            <div className="p-4 pt-0 bg-gray-50 flex print:hidden">
              <Button className="w-full h-11 font-bold" onClick={onClose}>
                <RefreshCw className="mr-2 h-4 w-4" /> New Sale
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
