'use client'

import { useHoldStore } from '@/store/holdStore'
import { useCartStore } from '@/store/cartStore'
import { formatCurrency } from '@/utils/formatCurrency'
import { formatDate } from '@/utils/formatDate'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Play, Trash2, ShoppingBag } from 'lucide-react'
import { toast } from 'react-hot-toast'

interface HeldOrdersModalProps {
  isOpen: boolean
  onClose: () => void
}

export function HeldOrdersModal({ isOpen, onClose }: HeldOrdersModalProps) {
  const { heldCarts, resumeCart, deleteHeldCart } = useHoldStore()
  const { setItems, setCustomerId, setDiscount } = useCartStore()

  const handleResume = (id: string) => {
    const cart = resumeCart(id)
    if (cart) {
      // Clear current cart and load the held one
      setItems(cart.items)
      setCustomerId(cart.customerId)
      setDiscount(cart.discount, cart.discountType)
      toast.success('Order resumed')
      onClose()
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Held Orders</DialogTitle>
          <DialogDescription>
            Resume or delete orders waiting in the queue
          </DialogDescription>
        </DialogHeader>

        <div className="mt-4 space-y-4 max-h-[60vh] overflow-y-auto">
          {heldCarts.length === 0 ? (
            <div className="text-center py-10 text-muted-foreground">
              <ShoppingBag className="h-12 w-12 mx-auto mb-2 opacity-20" />
              <p>No held orders found</p>
            </div>
          ) : (
            heldCarts.map((cart) => (
              <div key={cart.id} className="flex items-center justify-between p-4 bg-muted/50 rounded-lg border hover:border-primary/50 transition-colors group">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-lg">{cart.label}</span>
                    <span className="text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded border border-border">
                      {cart.items.length} items
                    </span>
                  </div>
                  <div className="flex items-center gap-4 text-xs text-muted-foreground">
                    <span>{formatDate(new Date(cart.createdAt).toISOString())}</span>
                    <span className="font-bold text-primary">
                      {formatCurrency(cart.items.reduce((sum, item) => sum + (item.price * item.cartQuantity), 0))}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  <Button variant="outline" size="sm" className="h-9" onClick={() => handleResume(cart.id)}>
                    <Play className="h-4 w-4 mr-2" />
                    Resume
                  </Button>
                  <Button variant="ghost" size="icon" className="h-9 w-9 text-destructive hover:bg-destructive/10" onClick={() => deleteHeldCart(cart.id)}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
