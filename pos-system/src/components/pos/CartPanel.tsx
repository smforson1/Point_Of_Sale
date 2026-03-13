'use client'

import { useState } from 'react'
import { useCartStore } from '@/store/cartStore'
import { CartItem } from './CartItem'
import { CustomerSelector } from './CustomerSelector'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { formatCurrency } from '@/utils/formatCurrency'
import { ShoppingCart, Trash2, CreditCard, Percent, Tag, PauseCircle, ShoppingBag } from 'lucide-react'
import { Separator } from '@/components/ui/separator'
import { PaymentModal } from './PaymentModal'
import { useHoldStore } from '@/store/holdStore'
import { HeldOrdersModal } from './HeldOrdersModal'
import { toast } from 'react-hot-toast'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'

export function CartPanel() {
  const { items, clearCart, discount, discountType, setDiscount, coupon, setCoupon, calculateTotals, customerId } = useCartStore()
  const { holdCurrentCart, heldCarts } = useHoldStore()
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false)
  const [isHeldOrdersOpen, setIsHeldOrdersOpen] = useState(false)
  const [showDiscountInput, setShowDiscountInput] = useState(false)
  const [tempDiscount, setTempDiscount] = useState(discount.toString())
  const [couponCode, setCouponCode] = useState('')
  const [isApplyingCoupon, setIsApplyingCoupon] = useState(false)

  const supabase = createClient()

  const handleHold = () => {
    if (items.length === 0) return
    const label = prompt('Enter a label for this order (optional):') || `Order #${heldCarts.length + 1}`
    holdCurrentCart(items, customerId, discount, discountType, label)
    clearCart()
    toast.success('Order held successfully')
  }

  const { subtotal, discountAmount, taxAmount, total } = calculateTotals()

  const handleApplyDiscount = () => {
    const val = parseFloat(tempDiscount) || 0
    setDiscount(val, discountType)
    setShowDiscountInput(false)
  }

  const handleApplyCoupon = async () => {
    if (!couponCode) return
    setIsApplyingCoupon(true)
    try {
      const { data, error } = await supabase
        .from('coupons')
        .select('*')
        .eq('code', couponCode.toUpperCase())
        .eq('is_active', true)
        .single()

      if (error || !data) {
        toast.error('Invalid or expired coupon')
        return
      }

      if (data.expiry_date && new Date(data.expiry_date) < new Date()) {
        toast.error('Coupon has expired')
        return
      }

      if (data.usage_limit && data.used_count >= data.usage_limit) {
        toast.error('Coupon usage limit reached')
        return
      }

      if (subtotal < data.min_purchase) {
        toast.error(`Minimum purchase of ${formatCurrency(data.min_purchase)} required`)
        return
      }

      setCoupon(data)
      setCouponCode('')
      toast.success(`Coupon "${data.code}" applied!`)
    } catch (err) {
      toast.error('Error applying coupon')
    } finally {
      setIsApplyingCoupon(false)
    }
  }

  return (
    <Card className="flex flex-col h-full shadow-md border-none rounded-none md:rounded-lg">
      <CardHeader className="p-4 flex flex-row items-center justify-between border-b bg-muted/30">
        <div className="flex items-center gap-2">
          <ShoppingCart className="h-5 w-5 text-primary" />
          <CardTitle className="text-lg">Shopping Cart</CardTitle>
          <Badge variant="secondary" className="ml-1 rounded-full">{items.length}</Badge>
        </div>
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="icon"
            className="text-muted-foreground hover:text-primary hover:bg-primary/10 relative"
            onClick={() => setIsHeldOrdersOpen(true)}
          >
            <ShoppingBag className="h-4 w-4" />
            {heldCarts.length > 0 && (
              <span className="absolute -top-1 -right-1 bg-primary text-primary-foreground text-[10px] w-4 h-4 rounded-full flex items-center justify-center border-2 border-background">
                {heldCarts.length}
              </span>
            )}
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="text-muted-foreground hover:text-red-500 hover:bg-red-500/10"
            onClick={clearCart}
            disabled={items.length === 0}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </CardHeader>

      <div className="p-4 border-b">
        <CustomerSelector />
      </div>

      <CardContent className="flex-1 overflow-y-auto p-0 min-h-0">
        {items.length > 0 ? (
          <div className="flex flex-col">
            {items.map((item) => (
              <CartItem key={item.id} item={item} />
            ))}
          </div>
        ) : (
          <div className="h-full flex flex-col items-center justify-center text-muted-foreground p-8">
            <ShoppingCart className="h-12 w-12 mb-4 opacity-10" />
            <p className="text-sm font-medium">Your cart is empty</p>
            <p className="text-xs mt-1">Add some products to get started</p>
          </div>
        )}
      </CardContent>

      <CardFooter className="flex flex-col p-4 bg-muted/30 border-t gap-4">
        <div className="w-full space-y-2 text-sm">
          <div className="flex justify-between items-center">
            <span className="text-muted-foreground">Subtotal</span>
            <span className="font-medium">{formatCurrency(subtotal)}</span>
          </div>

          <div className="flex justify-between items-center group">
            <div className="flex items-center gap-2">
              <span className="text-muted-foreground">Discount</span>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity">
                    {discountType === 'PERCENTAGE' ? <Percent className="h-3 w-3" /> : <Tag className="h-3 w-3" />}
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start">
                  <DropdownMenuItem onClick={() => setDiscount(discount, 'FIXED')}>Fixed Amount</DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setDiscount(discount, 'PERCENTAGE')}>Percentage</DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
            <div className="flex items-center gap-2">
              {showDiscountInput ? (
                <div className="flex items-center gap-1">
                  <Input
                    type="number"
                    value={tempDiscount}
                    onChange={(e) => setTempDiscount(e.target.value)}
                    className="h-7 w-16 text-right px-2"
                    autoFocus
                  />
                  <Button size="sm" className="h-7 px-2" onClick={handleApplyDiscount}>Apply</Button>
                </div>
              ) : (
                <span
                  className="text-red-500 font-medium cursor-pointer hover:underline"
                  onClick={() => setShowDiscountInput(true)}
                >
                  -{formatCurrency(discountAmount)}
                </span>
              )}
            </div>
          </div>

          <div className="flex justify-between items-center group">
            <div className="flex items-center gap-2">
              <span className="text-muted-foreground">Promo Code</span>
            </div>
            <div className="flex items-center gap-2">
              {coupon ? (
                <Badge variant="outline" className="bg-green-500/10 text-green-600 dark:text-green-400 border-green-500/20 gap-1 pr-1">
                  {coupon.code}
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    className="h-4 w-4 hover:bg-green-500/20 rounded-full"
                    onClick={() => setCoupon(null)}
                  >
                    <Trash2 className="h-2 w-2" />
                  </Button>
                </Badge>
              ) : (
                <div className="flex items-center gap-1">
                  <Input
                    placeholder="Enter code"
                    className="h-7 w-24 text-[10px] uppercase"
                    value={couponCode}
                    onChange={(e) => setCouponCode(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleApplyCoupon()}
                  />
                  <Button 
                    size="sm" 
                    className="h-7 px-2 text-[10px]" 
                    onClick={handleApplyCoupon}
                    disabled={isApplyingCoupon || !couponCode}
                  >
                    Apply
                  </Button>
                </div>
              )}
            </div>
          </div>

          <div className="flex justify-between items-center">
            <span className="text-muted-foreground">VAT (15%)</span>
            <span className="font-medium">{formatCurrency(taxAmount)}</span>
          </div>

          <Separator className="my-2" />

          <div className="flex justify-between items-center text-lg font-bold">
            <span>Total</span>
            <span className="text-primary">{formatCurrency(total)}</span>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-2 w-full">
          <Button
            variant="outline"
            className="h-12 border-dashed border-primary/30 hover:border-primary text-primary"
            disabled={items.length === 0}
            onClick={handleHold}
          >
            <PauseCircle className="h-5 w-5" />
          </Button>
          <Button
            className="col-span-2 h-12 text-lg font-bold shadow-lg"
            disabled={items.length === 0}
            onClick={() => setIsPaymentModalOpen(true)}
          >
            <CreditCard className="mr-2 h-5 w-5" />
            Checkout
          </Button>
        </div>
      </CardFooter>

      <PaymentModal
        isOpen={isPaymentModalOpen}
        onClose={() => setIsPaymentModalOpen(false)}
      />
      <HeldOrdersModal
        isOpen={isHeldOrdersOpen}
        onClose={() => setIsHeldOrdersOpen(false)}
      />
    </Card>
  )
}
