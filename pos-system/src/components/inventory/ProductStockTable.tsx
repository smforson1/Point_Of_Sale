
'use client'

import { useState, useEffect, useCallback } from 'react'
import {
  Search,
  Package,
  AlertTriangle,
  History,
} from 'lucide-react'
import { toast } from 'react-hot-toast'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { StockAdjustmentModal } from './StockAdjustmentModal'
import { EmptyState } from '@/components/shared/EmptyState'
import { ProductImage } from '@/components/shared/ProductImage'
import type { Product } from '@/types'

import { useAuthStore } from '@/store/authStore'

export function ProductStockTable() {
  const { role } = useAuthStore()
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)
  
  const supabase = createClient()

  const fetchProducts = useCallback(async () => {
    setLoading(true)
    try {
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .order('name', { ascending: true })

      if (error) throw error
      setProducts(data || [])
    } catch (error: any) {
      toast.error(error.message || 'Failed to fetch products')
    } finally {
      setLoading(false)
    }
  }, [supabase])

  useEffect(() => {
    fetchProducts()
  }, [fetchProducts])

  const filteredProducts = products.filter((p) =>
    p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    p.sku?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    p.barcode?.includes(searchQuery)
  )

  const getStockBadge = (quantity: number, threshold: number) => {
    if (quantity === 0) return <Badge variant="destructive">Out of Stock</Badge>
    if (quantity <= threshold) return <Badge variant="secondary" className="bg-yellow-100 text-yellow-700 hover:bg-yellow-100">Low Stock</Badge>
    return <Badge variant="secondary" className="bg-green-100 text-green-700 hover:bg-green-100">In Stock</Badge>
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search products for adjustment..."
            className="pl-9"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      <div className="rounded-xl border bg-card/60 backdrop-blur-sm overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Product</TableHead>
              <TableHead>SKU</TableHead>
              <TableHead>Current Stock</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <TableRow key={i}>
                  <TableCell><div className="h-4 w-32 animate-pulse bg-muted rounded" /></TableCell>
                  <TableCell><div className="h-4 w-24 animate-pulse bg-muted rounded" /></TableCell>
                  <TableCell><div className="h-4 w-16 animate-pulse bg-muted rounded" /></TableCell>
                  <TableCell><div className="h-4 w-20 animate-pulse bg-muted rounded" /></TableCell>
                  <TableCell className="text-right"><div className="h-8 w-24 animate-pulse bg-muted rounded ml-auto" /></TableCell>
                </TableRow>
              ))
            ) : filteredProducts.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5}>
                  <EmptyState
                    title="No products found"
                    description="Make sure you have added products to the catalog."
                    icon={Package}
                  />
                </TableCell>
              </TableRow>
            ) : (
              filteredProducts.map((product) => (
                <TableRow key={product.id} className="group hover:bg-muted/50 transition-colors">
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 flex-shrink-0">
                        <ProductImage 
                          src={product.image_url} 
                          alt={product.name} 
                          className="rounded-lg"
                          size="sm"
                        />
                      </div>
                      <div className="font-medium text-foreground">{product.name}</div>
                    </div>
                  </TableCell>
                  <TableCell className="text-muted-foreground font-mono text-xs">
                    {product.sku || 'N/A'}
                  </TableCell>
                  <TableCell>
                    <div className="font-bold">{product.quantity}</div>
                  </TableCell>
                  <TableCell>
                    {getStockBadge(product.quantity, product.low_stock_threshold)}
                  </TableCell>
                  <TableCell className="text-right">
                    {role !== 'CASHIER' && (
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => {
                          setSelectedProduct(product)
                          setIsModalOpen(true)
                        }}
                      >
                        <History className="mr-2 h-4 w-4" />
                        Adjust Stock
                      </Button>
                    )}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <StockAdjustmentModal
        product={selectedProduct}
        open={isModalOpen}
        onOpenChange={setIsModalOpen}
        onSuccess={fetchProducts}
      />
    </div>
  )
}
