'use client'

import { useState } from 'react'
import { useCartStore } from '@/store/cartStore'
import { useAuthStore } from '@/store/authStore'
import { createClient } from '@/lib/supabase/client'
import { formatCurrency } from '@/utils/formatCurrency'
import { useShiftStore } from '@/store/shiftStore'
import { useConnectivity } from '@/components/shared/ConnectivityProvider'
import { db } from '@/lib/dexie/db'
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
import { Banknote, CreditCard, Smartphone, Check, Loader2, DollarSign, QrCode, ExternalLink } from 'lucide-react'
import { toast } from 'react-hot-toast'
import { useEffect, useCallback } from 'react'
import { ReceiptModal } from './ReceiptModal'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

interface PaymentEntry {
  method: 'CASH' | 'MOBILE_MONEY' | 'CARD' | 'STORE_BALANCE' | 'PAYSTACK'
  amount: number
  details: any
}

interface PaymentModalProps {
  isOpen: boolean
  onClose: () => void
}

export function PaymentModal({ isOpen, onClose }: PaymentModalProps) {
  const { items, customerId, discount, discountType, coupon, clearCart, calculateTotals } = useCartStore()
  const { profile } = useAuthStore()
  const [currentMethod, setCurrentMethod] = useState('CASH')
  const [isLoading, setIsLoading] = useState(false)
  const [amountInput, setAmountInput] = useState('')
  const [momoNetwork, setMomoNetwork] = useState('MTN')
  const [momoRef, setMomoRef] = useState('')
  const [cardRef, setCardRef] = useState('')
  const [showReceipt, setShowReceipt] = useState(false)
  const [lastSaleId, setLastSaleId] = useState<string | null>(null)
  
  const [payments, setPayments] = useState<PaymentEntry[]>([])
  
  // Paystack States
  const [paystackUrl, setPaystackUrl] = useState<string | null>(null)
  const [paystackRef, setPaystackRef] = useState<string | null>(null)
  const [isPaystackInitializing, setIsPaystackInitializing] = useState(false)
  const [isPaystackPaid, setIsPaystackPaid] = useState(false)
  const [paystackPhone, setPaystackPhone] = useState('')
  const [paystackProvider, setPaystackProvider] = useState('mtn')
  const [paystackVoucher, setPaystackVoucher] = useState('')

  const supabase = createClient()
  
  // Reset all states when modal opens/closes
  useEffect(() => {
    if (!isOpen) {
      setAmountInput('')
      setMomoRef('')
      setCardRef('')
      setPayments([])
      setCurrentMethod('CASH')
      setPaystackUrl(null)
      setPaystackRef(null)
      setIsPaystackPaid(false)
      setPaystackPhone('')
      setPaystackProvider('mtn')
      setPaystackVoucher('')
    }
  }, [isOpen])

  // Pre-fill customer phone if available
  useEffect(() => {
    if (isOpen && customerId) {
      const fetchCustomerPhone = async () => {
        const { data } = await supabase.from('customers').select('phone').eq('id', customerId).single()
        if (data?.phone) setPaystackPhone(data.phone)
      }
      fetchCustomerPhone()
    }
  }, [isOpen, customerId, supabase])

  // Auto-detect mobile provider based on Ghana prefixes
  useEffect(() => {
    if (!paystackPhone) return
    
    let cleaned = paystackPhone.replace(/\s+/g, '')
    // Normalize +233 or 233 to 0 for prefix checking
    if (cleaned.startsWith('+233')) cleaned = '0' + cleaned.substring(4)
    else if (cleaned.startsWith('233')) cleaned = '0' + cleaned.substring(3)
    
    if (cleaned.length >= 3) {
      const prefix = cleaned.substring(0, 3)
      const mtnPrefixes = ['024', '054', '055', '059', '025', '053']
      const telecelPrefixes = ['020', '050']
      const tigoPrefixes = ['026', '027', '056', '057', '023']

      if (mtnPrefixes.includes(prefix)) setPaystackProvider('mtn')
      else if (telecelPrefixes.includes(prefix)) setPaystackProvider('telecel')
      else if (tigoPrefixes.includes(prefix)) setPaystackProvider('tigo')
    }
  }, [paystackPhone])
  const { isOnline } = useConnectivity()
  const { subtotal, discountAmount, taxAmount, total } = calculateTotals()
  
  const paidAmount = payments.reduce((sum, p) => sum + p.amount, 0)
  const remainingBalance = Math.max(0, total - paidAmount)
  const change = Math.max(0, (currentMethod === 'CASH' ? (parseFloat(amountInput) || 0) : 0) - remainingBalance)

  const handleTabChange = (val: string) => {
    setCurrentMethod(val)
    setAmountInput(remainingBalance.toString())
    
    // Clear Paystack states when switching away
    if (val !== 'PAYSTACK') {
      setPaystackUrl(null)
      setPaystackRef(null)
      setIsPaystackPaid(false)
    }
  }

  const initPaystack = async () => {
    if (remainingBalance <= 0) return
    if (!paystackPhone) {
      toast.error('Please enter customer phone number')
      return
    }
    if (paystackProvider === 'Telecel' && !paystackVoucher) {
      toast.error('Please enter Telecel Voucher Code (Dial *110#)')
      return
    }
    setIsPaystackInitializing(true)
    try {
      // Find customer email or use fallback
      let customerEmail = 'customer@pos-system.com'
      if (customerId) {
        const { data: cust } = await supabase.from('customers').select('email').eq('id', customerId).single()
        if (cust?.email) customerEmail = cust.email
      }

      const response = await fetch('/api/paystack/charge', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount: remainingBalance,
          email: customerEmail,
          phone: paystackPhone,
          provider: paystackProvider.toLowerCase(), // frontend now sends raw 'mtn', 'telecel', or 'tigo'
          metadata: {
            customerId,
            itemsCount: items.length,
          }
        })
      })

      const data = await response.json()
      if (data.status) {
        const ref = data.data.reference

        // If Telecel/Vodafone and we have a voucher, submit it immediately
        if (paystackProvider.toLowerCase() === 'telecel' && paystackVoucher) {
          const otpResponse = await fetch('/api/paystack/submit-otp', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ reference: ref, otp: paystackVoucher })
          })
          const otpData = await otpResponse.json()
          if (!otpData.status) {
             toast.error(otpData.message || 'Voucher submission failed')
             setIsPaystackInitializing(false)
             return
          }
        }

        setPaystackRef(ref)
        toast.success(paystackProvider === 'Telecel' ? 'Voucher submitted! Verifying...' : 'Payment request sent!')
      } else {
        toast.error(data.message || 'Failed to initiate Paystack')
      }
    } catch (err) {
      toast.error('Error connecting to Paystack')
    } finally {
      setIsPaystackInitializing(false)
    }
  }

  // Polling for Paystack Payment
  useEffect(() => {
    let interval: any
    if (paystackRef && !isPaystackPaid && currentMethod === 'PAYSTACK') {
      interval = setInterval(async () => {
        try {
          const res = await fetch(`/api/paystack/verify?reference=${paystackRef}`)
          const data = await res.json()
          if (data.status && data.data.status === 'success') {
            setIsPaystackPaid(true)
            clearInterval(interval)
            toast.success('Payment Verified!')
            
            // Auto add to payments
            const newPayment: PaymentEntry = {
              method: 'PAYSTACK',
              amount: remainingBalance,
              details: { reference: paystackRef, channel: data.data.channel }
            }
            setPayments([...payments, newPayment])
          }
        } catch (err) {
          console.error('Polling error:', err)
        }
      }, 3000)
    }
    return () => clearInterval(interval)
  }, [paystackRef, isPaystackPaid, currentMethod, payments, remainingBalance])

  const addPayment = () => {
    const amount = parseFloat(amountInput)
    if (!amount || amount <= 0) {
      toast.error('Please enter a valid amount')
      return
    }

    if (amount > remainingBalance && currentMethod !== 'CASH') {
      toast.error('Amount exceeds remaining balance')
      return
    }

    const actualAppliedAmount = Math.min(amount, remainingBalance)

    let details = {}
    if (currentMethod === 'MOBILE_MONEY') {
      if (!momoRef) { toast.error('Enter reference'); return }
      details = { network: momoNetwork, reference: momoRef }
    } else if (currentMethod === 'CARD') {
      if (!cardRef) { toast.error('Enter reference'); return }
      details = { reference: cardRef }
    } else if (currentMethod === 'STORE_BALANCE') {
      details = { customer_id: customerId }
    } else {
      details = { amount_tendered: amount, change: amount > remainingBalance ? amount - remainingBalance : 0 }
    }

    const newPayment: PaymentEntry = {
      method: currentMethod as any,
      amount: actualAppliedAmount,
      details
    }

    setPayments([...payments, newPayment])
    setAmountInput('')
    setMomoRef('')
    setCardRef('')
    toast.success('Payment added')
  }

  const removePayment = (index: number) => {
    setPayments(payments.filter((_, i) => i !== index))
  }

  const handleCheckout = async () => {
    if (!profile) return
    
    const activeShift = useShiftStore.getState().currentShift
    if (!activeShift) {
      toast.error('You must open a shift before making a sale!')
      return
    }
    
    if (paidAmount < total) {
      if (payments.length === 0 && parseFloat(amountInput) >= total) {
        // Handled auto-payment logic here
      } else {
        toast.error('Balance not fully paid')
        return
      }
    }

    setIsLoading(true)
    try {
      const finalPayments = payments.length > 0 ? payments : [{
        method: currentMethod as any,
        amount: total,
        details: currentMethod === 'CASH' 
          ? { amount_tendered: parseFloat(amountInput), change } 
          : (currentMethod === 'MOBILE_MONEY' ? { network: momoNetwork, reference: momoRef } : { reference: cardRef })
      }]

      if (!isOnline) {
        // Handle Offline Checkout
        const pendingSale = {
          saleData: {
            customer_id: customerId,
            user_id: profile.id,
            subtotal,
            discount_amount: discountAmount,
            discount_type: discountType,
            tax_amount: taxAmount,
            total_amount: total,
            status: 'COMPLETED' as any,
            shift_id: activeShift.id,
          },
          items: items.map(item => ({
            product_id: item.id,
            quantity: item.cartQuantity,
            unit_price: item.price,
            subtotal: item.price * item.cartQuantity,
            product_name: item.name,
            quantity_returned: 0
          } as any)),
          createdAt: new Date().toISOString(),
          status: 'pending' as const
        }

        await db.pendingSales.add(pendingSale)

        // Update local stock in Dexie
        for (const item of items) {
          const localProduct = await db.products.get(item.id)
          if (localProduct) {
            await db.products.update(item.id, { 
              quantity: localProduct.quantity - item.cartQuantity 
            })
          }
        }

        toast.success('Saved offline! Will sync when online.', { icon: '💾' })
        resetAndClose()
        return
      }

      // Online Checkout (Existing Logic)
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
          shift_id: activeShift.id,
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

      // 3. Create Payments
      for (const p of finalPayments) {
        const { error: paymentError } = await supabase.from('payments').insert({
          sale_id: sale.id,
          amount: p.amount,
          method: p.method,
          provider_reference: p.details.reference || null,
          details: p.details,
        })
        if (paymentError) throw paymentError

        // Handle Store Balance Specific Logic
        if (p.method === 'STORE_BALANCE' && customerId) {
          const { data: cust } = await supabase.from('customers').select('store_balance').eq('id', customerId).single()
          const currentBal = cust?.store_balance || 0
          if (currentBal < p.amount) throw new Error('Insufficient store balance')
          
          await supabase.from('customers').update({ store_balance: currentBal - p.amount }).eq('id', customerId)
          await supabase.from('balance_transactions').insert({
            customer_id: customerId,
            amount: p.amount,
            type: 'WITHDRAWAL',
            reference_id: sale.id
          })
        }
      }

      // 4. Update Product Stock
      for (const item of items) {
        if (item.variantId && item.variants) {
          const updatedVariants = item.variants.map(v => {
            if (v.id === item.variantId) {
              return { ...v, quantity: v.quantity - item.cartQuantity }
            }
            return v
          })
          const targetVariant = item.variants.find(v => v.id === item.variantId)
          const newVQty = (targetVariant?.quantity || 0) - item.cartQuantity
          await supabase.from('products').update({ variants: updatedVariants }).eq('id', item.id)
          
          if (newVQty <= item.low_stock_threshold) {
             await supabase.from('notifications').insert({
               title: 'Low Stock Alert',
               message: `${item.name} (${targetVariant?.name}) is low (${newVQty} remaining)`,
               type: 'LOW_STOCK'
             })
          }
        } else {
          const newQuantity = item.quantity - item.cartQuantity
          await supabase.from('products').update({ quantity: newQuantity }).eq('id', item.id)
          if (newQuantity <= item.low_stock_threshold) {
            await supabase.from('notifications').insert({
              title: 'Low Stock Alert',
              message: `${item.name} is low (${newQuantity} remaining)`,
              type: 'LOW_STOCK'
            })
          }
        }
      }

      // 5. Update Loyalty & Coupon
      if (customerId) {
        const pointsEarned = Math.floor(total / 10)
        const { data: cust } = await supabase.from('customers').select('loyalty_points').eq('id', customerId).single()
        const newPoints = (cust?.loyalty_points || 0) + pointsEarned
        const tier = newPoints >= 1000 ? 'GOLD' : (newPoints >= 500 ? 'SILVER' : 'BRONZE')
        await supabase.from('customers').update({ loyalty_points: newPoints, tier }).eq('id', customerId)
      }

      if (coupon) {
        const { data: c } = await supabase.from('coupons').select('used_count').eq('id', coupon.id).single()
        await supabase.from('coupons').update({ used_count: (c?.used_count || 0) + 1 }).eq('id', coupon.id)
      }

      // 6. Audit Log
      await supabase.from('audit_logs').insert({
        user_id: profile.id,
        action: 'CREATE_SALE',
        entity_type: 'SALE',
        entity_id: sale.id,
        new_data: { sale, payments: finalPayments },
      })

      setLastSaleId(sale.id)
      setShowReceipt(true)
      toast.success('Sale completed successfully')
    } catch (error: any) {
      console.error(error)
      toast.error('Checkout failed: ' + error.message)
    } finally {
      setIsLoading(false)
    }
  }

  const resetAndClose = () => {
    setAmountInput('')
    setMomoRef('')
    setCardRef('')
    setPayments([])
    setShowReceipt(false)
    setPaystackUrl(null)
    setPaystackRef(null)
    setIsPaystackPaid(false)
    setPaystackPhone('')
    setPaystackProvider('mtn')
    setPaystackVoucher('')
    setCurrentMethod('CASH')
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
      <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Finalize Payment</DialogTitle>
          <DialogDescription>Split payments or use promo codes</DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-2 gap-4 py-4 border-b">
          <div className="text-center border-r">
            <p className="text-[10px] text-muted-foreground uppercase font-bold">Total Due</p>
            <h2 className="text-xl font-black">{formatCurrency(total)}</h2>
          </div>
          <div className="text-center">
            <p className="text-[10px] text-muted-foreground uppercase font-bold">Remaining</p>
            <h2 className={`text-xl font-black ${remainingBalance > 0 ? 'text-red-600' : 'text-green-600'}`}>
              {formatCurrency(remainingBalance)}
            </h2>
          </div>
        </div>

        {payments.length > 0 && (
          <div className="space-y-2 py-2">
            <p className="text-[10px] text-muted-foreground uppercase font-bold">Applied Payments</p>
            {payments.map((p, i) => (
              <div key={i} className="flex items-center justify-between bg-muted/50 p-2 rounded-md border">
                <div className="flex items-center gap-2">
                  {p.method === 'CASH' && <Banknote className="h-3 w-3" />}
                  {p.method === 'MOBILE_MONEY' && <Smartphone className="h-3 w-3" />}
                  {p.method === 'CARD' && <CreditCard className="h-3 w-3" />}
                  {p.method === 'STORE_BALANCE' && <DollarSign className="h-3 w-3" />}
                  {p.method === 'PAYSTACK' && <QrCode className="h-3 w-3" />}
                  <span className="text-sm font-medium">{p.method.replace('_', ' ')}</span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-sm font-bold">{formatCurrency(p.amount)}</span>
                  <Button variant="ghost" size="icon" className="h-6 w-6 text-destructive" onClick={() => removePayment(i)}>
                    <Check className="h-3 w-3 rotate-45" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}

        {remainingBalance > 0 && (
          <div className="mt-2 p-4 bg-primary/5 rounded-xl border border-primary/10">
            <Tabs value={currentMethod} onValueChange={handleTabChange} className="w-full">
              <TabsList className={`grid w-full h-10 mb-4 ${customerId ? 'grid-cols-4' : 'grid-cols-3'}`}>
                <TabsTrigger value="CASH">Cash</TabsTrigger>
                <TabsTrigger value="MOBILE_MONEY">MoMo</TabsTrigger>
                <TabsTrigger value="CARD">Card</TabsTrigger>
                <TabsTrigger value="PAYSTACK">Paystack</TabsTrigger>
                {customerId && <TabsTrigger value="STORE_BALANCE">Balance</TabsTrigger>}
              </TabsList>

              <div className="space-y-4">
                <div className="space-y-2">
                  <Label className="text-xs">Amount to Apply</Label>
                  <div className="relative">
                    <Input
                      type="number"
                      className="text-xl h-12 pl-10 font-bold"
                      value={amountInput}
                      onChange={(e) => setAmountInput(e.target.value)}
                    />
                    <div className="absolute left-3 top-1/2 -translate-y-1/2 font-bold text-muted-foreground">₵</div>
                  </div>
                </div>

                <TabsContent value="MOBILE_MONEY" className="mt-0 space-y-4">
                  <div className="grid grid-cols-2 gap-2">
                    <div className="space-y-1">
                      <Label className="text-[10px]">Network</Label>
                      <Select value={momoNetwork} onValueChange={setMomoNetwork}>
                        <SelectTrigger className="h-8 text-xs">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="MTN">MTN</SelectItem>
                          <SelectItem value="Telecel">Telecel</SelectItem>
                          <SelectItem value="AirtelTigo">AirtelTigo</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-1">
                      <Label className="text-[10px]">Reference</Label>
                      <Input
                        className="h-8 text-xs"
                        placeholder="ID"
                        value={momoRef}
                        onChange={(e) => setMomoRef(e.target.value)}
                      />
                    </div>
                  </div>
                </TabsContent>

                <TabsContent value="CARD" className="mt-0 space-y-2">
                  <Label className="text-[10px]">POS Approval Ref</Label>
                  <Input
                    className="h-8 text-xs"
                    value={cardRef}
                    onChange={(e) => setCardRef(e.target.value)}
                  />
                </TabsContent>

                <TabsContent value="STORE_BALANCE" className="mt-0">
                   <div className="bg-yellow-50 p-2 rounded border border-yellow-200 text-[10px] text-yellow-800">
                     Using customer's prepaid balance. Ensure they have enough funds.
                   </div>
                </TabsContent>

                <TabsContent value="PAYSTACK" className="mt-0">
                  <div className="flex flex-col items-center gap-4 py-2">
                    {!paystackRef ? (
                      <div className="space-y-4 w-full">
                        <div className="grid grid-cols-2 gap-2">
                          <div className="space-y-1">
                            <Label className="text-[10px]">Customer Phone</Label>
                            <Input
                              className="h-9 text-sm"
                              placeholder="024XXXXXXX"
                              value={paystackPhone}
                              onChange={(e) => setPaystackPhone(e.target.value)}
                            />
                          </div>
                          <div className="space-y-1">
                            <Label className="text-[10px]">Provider</Label>
                            <Select value={paystackProvider} onValueChange={setPaystackProvider}>
                              <SelectTrigger className="h-9 text-sm">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="mtn">MTN</SelectItem>
                                <SelectItem value="telecel">Telecel (Vodafone)</SelectItem>
                                <SelectItem value="tigo">AirtelTigo</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                        </div>

                        {paystackProvider.toLowerCase() === 'telecel' && (
                          <div className="space-y-1 w-full animate-in slide-in-from-top-2 duration-300">
                            <Label className="text-[10px] text-primary font-bold">Voucher Code (Dial *110# on customer phone)</Label>
                            <Input
                              className="h-9 text-sm border-primary/40 focus:border-primary shadow-sm"
                              placeholder="Enter 6-digit code"
                              value={paystackVoucher}
                              onChange={(e) => setPaystackVoucher(e.target.value)}
                            />
                          </div>
                        )}

                        <Button 
                          type="button" 
                          className="w-full bg-[#09A5DB] hover:bg-[#09A5DB]/90 text-white" 
                          onClick={initPaystack}
                          disabled={isPaystackInitializing || remainingBalance <= 0}
                        >
                          {isPaystackInitializing ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Smartphone className="mr-2 h-4 w-4" />}
                          Send Payment Prompt
                        </Button>
                        <p className="text-[10px] text-center text-muted-foreground">
                          This will send a Push/USSD prompt to the customer's phone for authorization.
                        </p>
                      </div>
                    ) : isPaystackPaid ? (
                      <div className="flex flex-col items-center justify-center p-8 gap-4 w-full bg-green-50 rounded-xl border border-green-100">
                        <div className="w-16 h-16 bg-green-500 rounded-full flex items-center justify-center text-white shadow-lg animate-bounce">
                          <Check className="h-10 w-10 stroke-[4px]" />
                        </div>
                        <div className="text-center">
                          <h3 className="text-lg font-bold text-green-700">Payment Received!</h3>
                          <p className="text-xs text-green-600">You can now complete the sale.</p>
                        </div>
                      </div>
                    ) : (
                      <div className="flex flex-col items-center gap-6 w-full py-4">
                        <div className="relative">
                          <div className="w-24 h-24 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
                          <div className="absolute inset-0 flex items-center justify-center">
                            <Smartphone className="h-10 w-10 text-primary animate-pulse" />
                          </div>
                        </div>
                        <div className="text-center space-y-2">
                          <h4 className="font-bold text-primary animate-pulse uppercase tracking-widest">Waiting for Customer...</h4>
                          <p className="text-xs text-muted-foreground px-6">
                            A payment prompt has been sent to <span className="font-bold">{paystackPhone}</span>. 
                            Ask the customer to enter their PIN to authorize the transaction.
                          </p>
                        </div>
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          className="text-[10px] text-destructive hover:bg-destructive/10"
                          onClick={() => { setPaystackRef(null); setPaystackUrl(null); }}
                        >
                          Cancel and try another number
                        </Button>
                      </div>
                    )}
                  </div>
                </TabsContent>

                {currentMethod === 'CASH' && change > 0 && (
                  <div className="flex justify-between items-center px-2 py-1 bg-green-50 rounded text-green-700">
                    <span className="text-[10px] font-bold">Change:</span>
                    <span className="text-xs font-black">{formatCurrency(change)}</span>
                  </div>
                )}

                <Button type="button" className="w-full h-10" variant="secondary" onClick={addPayment}>
                  Apply {currentMethod.replace('_', ' ')} Payment
                </Button>
              </div>
            </Tabs>
          </div>
        )}

        <div className="mt-6 flex gap-3">
          <Button variant="outline" className="flex-1 h-12" onClick={onClose} disabled={isLoading}>
            Cancel
          </Button>
          <Button 
            className="flex-[2] h-12 font-bold text-lg" 
            onClick={handleCheckout} 
            disabled={isLoading || (remainingBalance > 0 && payments.length > 0) || (payments.length === 0 && (parseFloat(amountInput) || 0) < total)}
          >
            {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Check className="mr-2 h-5 w-5" />}
            {remainingBalance === 0 ? 'Complete Sale' : 'Pay in Full'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
