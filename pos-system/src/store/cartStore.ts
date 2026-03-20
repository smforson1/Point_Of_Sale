import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { CartItem, Product, Coupon } from '@/types'
import { useSettingsStore } from './settingsStore'

interface CartState {
  items: CartItem[]
  customerId: string | null
  discount: number
  discountType: 'FIXED' | 'PERCENTAGE'
  coupon: Coupon | null
  addItem: (product: Product, variantId?: string | null) => void
  removeItem: (productId: string) => void
  updateQuantity: (productId: string, quantity: number) => void
  clearCart: () => void
  setItems: (items: CartItem[]) => void
  setCustomerId: (customerId: string | null) => void
  setDiscount: (discount: number, type: 'FIXED' | 'PERCENTAGE') => void
  setCoupon: (coupon: Coupon | null) => void
  calculateTotals: () => {
    subtotal: number
    discountAmount: number
    taxAmount: number
    total: number
  }
}

export const useCartStore = create<CartState>()(
  persist(
    (set, get) => ({
      items: [],
      customerId: null,
      discount: 0,
      discountType: 'FIXED',
      coupon: null,

      addItem: (product: Product, variantId?: string | null) => {
        const items = get().items
        const existingItem = items.find((item) => 
          item.id === product.id && item.variantId === variantId
        )

        if (existingItem) {
          set({
            items: items.map((item) =>
              (item.id === product.id && item.variantId === variantId)
                ? { ...item, cartQuantity: item.cartQuantity + 1 }
                : item
            ),
          })
        } else {
          let price = product.price
          let name = product.name
          if (variantId && product.variants) {
            const variant = product.variants.find(v => v.id === variantId)
            if (variant) {
              price = variant.price
              name = `${product.name} (${variant.name})`
            }
          }
          
          set({ 
            items: [...items, { 
              ...product, 
              name, 
              price, 
              cartQuantity: 1, 
              variantId 
            }] 
          })
        }
      },

      removeItem: (productId: string) => {
        set({ items: get().items.filter((item) => item.id !== productId) })
      },

      updateQuantity: (productId: string, quantity: number) => {
        if (quantity <= 0) {
          get().removeItem(productId)
          return
        }
        set({
          items: get().items.map((item) =>
            item.id === productId ? { ...item, cartQuantity: quantity } : item
          ),
        })
      },

      clearCart: () => set({ items: [], customerId: null, discount: 0, discountType: 'FIXED', coupon: null }),

      setItems: (items) => set({ items }),

      setCustomerId: (customerId) => set({ customerId }),

      setDiscount: (discount, discountType) => set({ discount, discountType }),

      setCoupon: (coupon) => set({ coupon }),

      calculateTotals: () => {
        const { items, discount, discountType, coupon } = get()
        const settings = useSettingsStore.getState().settings
        
        const subtotal = items.reduce((acc, item) => acc + item.price * item.cartQuantity, 0)
        
        let manualDiscount = 0
        if (discountType === 'PERCENTAGE') {
          manualDiscount = (subtotal * discount) / 100
        } else {
          manualDiscount = discount
        }

        let couponDiscount = 0
        if (coupon && subtotal >= coupon.min_purchase) {
          if (coupon.discount_type === 'PERCENTAGE') {
            couponDiscount = (subtotal * coupon.value) / 100
            if (coupon.max_discount) {
              couponDiscount = Math.min(couponDiscount, coupon.max_discount)
            }
          } else {
            couponDiscount = coupon.value
          }
        }

        const totalDiscount = manualDiscount + couponDiscount
        const taxableAmount = Math.max(0, subtotal - totalDiscount)
        
        // Use tax rate from settings, fallback to 15%
        const taxRate = (settings?.tax_rate || 15) / 100
        const taxAmount = taxableAmount * taxRate
        const total = taxableAmount + taxAmount

        return {
          subtotal,
          discountAmount: totalDiscount,
          taxAmount,
          total,
        }
      },
    }),
    {
      name: 'pos-cart-storage',
    }
  )
)
