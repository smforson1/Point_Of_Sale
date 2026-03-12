'use client'

import { CartItem as CartItemType } from '@/types'
import { useCartStore } from '@/store/cartStore'
import { formatCurrency } from '@/utils/formatCurrency'
import { Button } from '@/components/ui/button'
import { Minus, Plus, Trash2 } from 'lucide-react'
import { Input } from '@/components/ui/input'

interface CartItemProps {
  item: CartItemType
}

export function CartItem({ item }: CartItemProps) {
  const { updateQuantity, removeItem } = useCartStore()

  return (
    <div className="flex items-center gap-3 p-3 border-b hover:bg-gray-50/50 transition-colors">
      <div className="flex-1 min-w-0">
        <h4 className="text-sm font-medium line-clamp-1">{item.name}</h4>
        <div className="text-xs text-muted-foreground flex items-center gap-2 mt-0.5">
          <span>{formatCurrency(item.price)} each</span>
          <span>•</span>
          <span className="font-medium text-primary">{formatCurrency(item.price * item.cartQuantity)}</span>
        </div>
      </div>

      <div className="flex items-center gap-1">
        <Button
          variant="ghost"
          size="icon"
          className="h-7 w-7 rounded-full"
          onClick={() => updateQuantity(item.id, item.cartQuantity - 1)}
        >
          <Minus className="h-3 w-3" />
        </Button>
        <span className="w-8 text-center text-sm font-semibold">{item.cartQuantity}</span>
        <Button
          variant="ghost"
          size="icon"
          className="h-7 w-7 rounded-full"
          onClick={() => updateQuantity(item.id, item.cartQuantity + 1)}
          disabled={item.cartQuantity >= item.quantity}
        >
          <Plus className="h-3 w-3" />
        </Button>
      </div>

      <Button
        variant="ghost"
        size="icon"
        className="h-8 w-8 text-red-400 hover:text-red-600 hover:bg-red-50"
        onClick={() => removeItem(item.id)}
      >
        <Trash2 className="h-4 w-4" />
      </Button>
    </div>
  )
}
