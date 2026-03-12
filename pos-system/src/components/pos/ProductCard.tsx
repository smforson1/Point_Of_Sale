'use client'

import { Product } from '@/types'
import { Card, CardContent, CardFooter } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { formatCurrency } from '@/utils/formatCurrency'
import { useCartStore } from '@/store/cartStore'
import { cn } from '@/lib/utils'
import Image from 'next/image'

interface ProductCardProps {
  product: Product
}

export function ProductCard({ product }: ProductCardProps) {
  const addItem = useCartStore((state) => state.addItem)
  const isOutOfStock = product.quantity <= 0
  const isLowStock = product.quantity <= product.low_stock_threshold && !isOutOfStock

  return (
    <Card
      className={cn(
        'overflow-hidden cursor-pointer transition-all hover:ring-2 hover:ring-primary h-full flex flex-col',
        isOutOfStock && 'opacity-60 grayscale cursor-not-allowed hover:ring-0'
      )}
      onClick={() => !isOutOfStock && addItem(product)}
    >
      <div className="relative aspect-square bg-gray-100 flex items-center justify-center">
        {product.image_url ? (
          <Image
            src={product.image_url}
            alt={product.name}
            fill
            className="object-cover"
          />
        ) : (
          <span className="text-gray-400 text-xs font-medium uppercase tracking-wider">No Image</span>
        )}
        <div className="absolute top-2 right-2 flex flex-col gap-1">
          {isOutOfStock && (
            <Badge variant="destructive" className="text-[10px]">Out of Stock</Badge>
          )}
          {isLowStock && (
            <Badge variant="warning" className="text-[10px] bg-amber-500 hover:bg-amber-600">Low Stock</Badge>
          )}
        </div>
      </div>
      <CardContent className="p-3 flex-1 flex flex-col justify-between">
        <h3 className="font-semibold text-sm line-clamp-2 min-h-[2.5rem] leading-tight">
          {product.name}
        </h3>
        <p className="text-xs text-muted-foreground mt-1">{product.category}</p>
      </CardContent>
      <CardFooter className="p-3 pt-0 flex items-center justify-between border-t mt-auto">
        <span className="font-bold text-sm text-primary">
          {formatCurrency(product.price)}
        </span>
        <span className="text-[10px] text-muted-foreground">
          {product.quantity} left
        </span>
      </CardFooter>
    </Card>
  )
}
