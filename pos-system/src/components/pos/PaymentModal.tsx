'use client'

import { useState } from 'react'
import { useCartStore } from '@/store/cartStore'
import { useAuthStore } from '@/store/authStore'
import { createClient } from '@/lib/supabase/client'
import { formatCurrency } from '@/utils/formatCurrency'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Banknote, CreditCard, Smartphone, Check, Loader2 } from 'lucide-react'
import { toast } from 'react-hot-toast'
import { ReceiptModal } from './ReceiptModal'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

interface PaymentModalProps {
  isOpen: boolean
  onClose: () => void
}

export function PaymentModal({ isOpen, onClose }: PaymentModalProps) {
  const { items, customerId, discount, discountType, clearCart, calculateTotals } = useCartStore()
  const { profile } = useAuthStore()
  const [activeTab, setActiveTab] = useState('CASH')
  const [isLoading, setIsLoading] = useState(false)
  const [amountTendered, setAmountTendered] = useState('')
  const [momoNetwork, setMomoNetwork] = useState('MTN')
  const [momoRef, setMomoRef] = useState('')
  const [cardRef, setCardRef] = useState('')
  const [showReceipt, setShowReceipt] = useState(false)
  const [lastSaleId, setLastSaleId] = useState<string | null>(null)

  const supabase = createClient()
  const { subtotal, discountAmount, taxAmount, total } = calculateTotals()
  
  const change = Math.max(0, (parseFloat(amountTendered) || 0) - total)

  const handleCheckout = async () => {
    if (!profile) return

    if (activeTab === 'CASH' && (parseFloat(amountTendered) || 0) < total) {
      toast.error('Insufficient amount tendered')
      return
    }

    setIsLoading(true)
    try {
      // 1. Create Sale
      const { data: sale, error: saleError } = await supabase
        .from('sales')
        .insert({
          customer_id: customerId,
          user_id: profile.id,
          subtotal,
          discount_amount: discountAmount,
          discount_type: discountType,
          tax_amount: taxAmount,
          total_amount: total,
          status: 'COMPLETED',
        })
        .select()
        .single()

      if (saleError) throw saleError

      // 2. Create Sale Items
      const saleItems = items.map((item) => ({
        sale_id: sale.id,
        product_id: item.id,
        quantity: item.cartQuantity,
        unit_price: item.price,
        subtotal: item.price * item.cartQuantity,
      }))

      const { error: itemsError } = await supabase.from('sale_items').insert(saleItems)
      if (itemsError) throw itemsError

      // 3. Create Payment
      let details = {}
      if (activeTab === 'MOBILE_MONEY') {
        details = { network: momoNetwork, reference: momoRef }
      } else if (activeTab === 'CARD') {
        details = { reference: cardRef }
      } else {
        details = { amount_tendered: parseFloat(amountTendered), change }
      }

      const { error: paymentError } = await supabase.from('payments').insert({
        sale_id: sale.id,
        amount: total,
        method: activeTab as any,
        provider_reference: activeTab === 'CASH' ? null : (activeTab === 'CARD' ? cardRef : momoRef),
        details,
      })
      if (paymentError) throw paymentError

      // 4. Update Product Stock & Create Low Stock Notifications
      for (const item of items) {
        const newQuantity = item.quantity - item.cartQuantity
        
        // Update stock
        await supabase
          .from('products')
          .update({ quantity: newQuantity })
          .eq('id', item.id)

        // Create notification if low stock
        if (newQuantity <= item.low_stock_threshold) {
          await supabase.from('notifications').insert({
            title: 'Low Stock Alert',
            message: `${item.name} is low on stock (${newQuantity} remaining)`,
            type: newQuantity <= 0 ? 'OUT_OF_STOCK' : 'LOW_STOCK',
          })
        }
      }

      // 5. Update Customer Loyalty Points
      if (customerId) {
        // Simple logic: 1 point for every 10 GHS
        const pointsEarned = Math.floor(total / 10)
        
        const { data: cust } = await supabase.from('customers').select('loyalty_points').eq('id', customerId).single()
        const newPoints = (cust?.loyalty_points || 0) + pointsEarned
        
        let tier: 'BRONZE' | 'SILVER' | 'GOLD' = 'BRONZE'
        if (newPoints >= 1000) tier = 'GOLD'
        else if (newPoints >= 500) tier = 'SILVER'

        await supabase.from('customers').update({ loyalty_points: newPoints, tier }).eq('id', customerId)
      }

      // 6. Log Audit Trail
      await supabase.from('audit_logs').insert({
        user_id: profile.id,
        action: 'CREATE_SALE',
        entity_type: 'SALE',
        entity_id: sale.id,
        new_data: sale,
      })

      setLastSaleId(sale.id)
      setShowReceipt(true)
      toast.success('Sale completed successfully')
    } catch (error: any) {
      console.error(error)
      toast.error('Failed to complete sale: ' + error.message)
    } finally {
      setIsLoading(false)
    }
  }

  const resetAndClose = () => {
    setAmountTendered('')
    setMomoRef('')
    setCardRef('')
    setShowReceipt(false)
    clearCart()
    onClose()
  }

  if (showReceipt && lastSaleId) {
    return (
      <ReceiptModal
        isOpen={showReceipt}
        onClose={resetAndClose}
        saleId={lastSaleId}
      />
    )
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Finalize Payment</DialogTitle>
          <DialogDescription>
            Select payment method and enter details
          </DialogDescription>
        </DialogHeader>

        <div className="text-center py-4">
          <p className="text-muted-foreground text-sm uppercase tracking-wider font-semibold">Total Amount Due</p>
          <h2 className="text-4xl font-black text-primary mt-1">{formatCurrency(total)}</h2>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid grid-cols-3 w-full h-12">
            <TabsTrigger value="CASH" className="flex items-center gap-2">
              <Banknote className="h-4 w-4" /> Cash
            </TabsTrigger>
            <TabsTrigger value="MOBILE_MONEY" className="flex items-center gap-2">
              <Smartphone className="h-4 w-4" /> MoMo
            </TabsTrigger>
            <TabsTrigger value="CARD" className="flex items-center gap-2">
              <CreditCard className="h-4 w-4" /> Card
            </TabsTrigger>
          </TabsList>

          <div className="mt-6 min-h-[160px]">
            <TabsContent value="CASH" className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="amount_tendered">Amount Tendered</Label>
                <div className="relative">
                  <Input
                    id="amount_tendered"
                    type="number"
                    placeholder="0.00"
                    className="text-2xl h-14 pl-12 font-bold"
                    value={amountTendered}
                    onChange={(e) => setAmountTendered(e.target.value)}
                    autoFocus
                  />
                  <div className="absolute left-4 top-1/2 -translate-y-1/2 text-2xl font-bold text-muted-foreground">₵</div>
                </div>
              </div>

              <div className="flex justify-between items-center p-4 bg-gray-50 rounded-lg">
                <span className="font-semibold text-muted-foreground">Change Due:</span>
                <span className="text-2xl font-bold text-green-600">{formatCurrency(change)}</span>
              </div>
            </TabsContent>

            <TabsContent value="MOBILE_MONEY" className="space-y-4">
              <div className="space-y-2">
                <Label>Network</Label>
                <Select value={momoNetwork} onValueChange={setMomoNetwork}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="MTN">MTN Mobile Money</SelectItem>
                    <SelectItem value="Telecel">Telecel (Vodafone)</SelectItem>
                    <SelectItem value="AirtelTigo">AirtelTigo Money</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="momo_ref">Transaction Reference</Label>
                <Input
                  id="momo_ref"
                  placeholder="Enter Transaction ID"
                  value={momoRef}
                  onChange={(e) => setMomoRef(e.target.value)}
                />
              </div>
            </TabsContent>

            <TabsContent value="CARD" className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="card_ref">Approval Code / Reference</Label>
                <Input
                  id="card_ref"
                  placeholder="Enter POS Reference"
                  value={cardRef}
                  onChange={(e) => setCardRef(e.target.value)}
                  autoFocus
                />
              </div>
              <p className="text-xs text-muted-foreground text-center">
                Please process payment on the external card terminal before confirming here.
              </p>
            </TabsContent>
          </div>
        </Tabs>

        <div className="mt-6 flex gap-3">
          <Button variant="outline" className="flex-1 h-12" onClick={onClose} disabled={isLoading}>
            Cancel
          </Button>
          <Button className="flex-[2] h-12 font-bold" onClick={handleCheckout} disabled={isLoading}>
            {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Check className="mr-2 h-5 w-5" />}
            Confirm Payment
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
