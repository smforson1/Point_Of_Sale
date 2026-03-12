'use client'

import { useState } from 'react'
import { useCartStore } from '@/store/cartStore'
import { CartItem } from './CartItem'
import { CustomerSelector } from './CustomerSelector'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { formatCurrency } from '@/utils/formatCurrency'
import { ShoppingCart, Trash2, CreditCard, Percent, Tag } from 'lucide-react'
import { Separator } from '@/components/ui/separator'
import { PaymentModal } from './PaymentModal'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'

export function CartPanel() {
  const { items, clearCart, discount, discountType, setDiscount, calculateTotals } = useCartStore()
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false)
  const [showDiscountInput, setShowDiscountInput] = useState(false)
  const [tempDiscount, setTempDiscount] = useState(discount.toString())

  const { subtotal, discountAmount, taxAmount, total } = calculateTotals()

  const handleApplyDiscount = () => {
    const val = parseFloat(tempDiscount) || 0
    setDiscount(val, discountType)
    setShowDiscountInput(false)
  }

  return (
    <Card className="flex flex-col h-full shadow-md border-none rounded-none md:rounded-lg">
      <CardHeader className="p-4 flex flex-row items-center justify-between border-b bg-gray-50/50">
        <div className="flex items-center gap-2">
          <ShoppingCart className="h-5 w-5 text-primary" />
          <CardTitle className="text-lg">Shopping Cart</CardTitle>
          <Badge variant="secondary" className="ml-1 rounded-full">{items.length}</Badge>
        </div>
        <Button
          variant="ghost"
          size="icon"
          className="text-muted-foreground hover:text-red-500 hover:bg-red-50"
          onClick={clearCart}
          disabled={items.length === 0}
        >
          <Trash2 className="h-4 w-4" />
        </Button>
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

      <CardFooter className="flex flex-col p-4 bg-gray-50/50 border-t gap-4">
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

        <Button
          className="w-full h-12 text-lg font-bold shadow-lg"
          disabled={items.length === 0}
          onClick={() => setIsPaymentModalOpen(true)}
        >
          <CreditCard className="mr-2 h-5 w-5" />
          Checkout
        </Button>
      </CardFooter>

      <PaymentModal
        isOpen={isPaymentModalOpen}
        onClose={() => setIsPaymentModalOpen(false)}
      />
    </Card>
  )
}
