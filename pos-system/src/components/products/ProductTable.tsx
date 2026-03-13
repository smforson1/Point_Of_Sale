'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Product } from '@/types'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Input } from '@/components/ui/input'
import {
  MoreHorizontal,
  Pencil,
  Trash2,
  Barcode as BarcodeIcon,
  Search,
  Filter,
  Plus,
} from 'lucide-react'
import { formatCurrency } from '@/utils/formatCurrency'
import { Badge } from '@/components/ui/badge'
import { ProductModal } from './ProductModal'
import { ConfirmDialog } from '@/components/shared/ConfirmDialog'
import { BarcodeDisplay } from './BarcodeDisplay'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { toast } from 'react-hot-toast'

export function ProductTable() {
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [isBarcodeOpen, setIsBarcodeOpen] = useState(false)
  const [productToDelete, setProductToDelete] = useState<Product | null>(null)
  const [productForBarcode, setProductForBarcode] = useState<Product | null>(null)

  const supabase = createClient()

  const fetchProducts = async () => {
    setLoading(true)
    const { data, error } = await supabase
      .from('products')
      .select('*')
      .order('name')
    if (data) setProducts(data)
    setLoading(false)
  }

  useEffect(() => {
    fetchProducts()
  }, [])

  const handleDelete = async () => {
    if (!productToDelete) return
    try {
      const { error } = await supabase
        .from('products')
        .delete()
        .eq('id', productToDelete.id)
      if (error) throw error
      toast.success('Product deleted successfully')
      fetchProducts()
    } catch (error: any) {
      toast.error(error.message || 'Failed to delete product')
    } finally {
      setIsDeleteDialogOpen(false)
      setProductToDelete(null)
    }
  }

  const filteredProducts = products.filter((p) =>
    p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.sku?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.barcode?.includes(searchTerm)
  )

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search products..."
            className="pl-9"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <Button onClick={() => { setSelectedProduct(null); setIsModalOpen(true); }}>
          <Plus className="mr-2 h-4 w-4" /> Add Product
        </Button>
      </div>

      <div className="rounded-md border bg-white">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Product Name</TableHead>
              <TableHead>Category</TableHead>
              <TableHead>SKU</TableHead>
              <TableHead>Stock</TableHead>
              <TableHead>Price</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-10 text-muted-foreground">
                  Loading products...
                </TableCell>
              </TableRow>
            ) : filteredProducts.length > 0 ? (
              filteredProducts.map((product) => (
                <TableRow key={product.id}>
                  <TableCell className="font-medium">{product.name}</TableCell>
                  <TableCell>{product.category}</TableCell>
                  <TableCell className="font-mono text-xs">{product.sku || '-'}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <span className={product.quantity <= product.low_stock_threshold ? 'text-red-500 font-bold' : ''}>
                        {product.quantity}
                      </span>
                      {product.quantity <= product.low_stock_threshold && (
                        <Badge variant="warning" className="text-[10px]">Low</Badge>
                      )}
                    </div>
                  </TableCell>
                  <TableCell className="font-bold">{formatCurrency(product.price)}</TableCell>
                  <TableCell>
                    <Badge variant={product.is_active ? 'success' : 'outline'}>
                      {product.is_active ? 'Active' : 'Inactive'}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" className="h-8 w-8 p-0">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuLabel>Actions</DropdownMenuLabel>
                        <DropdownMenuItem onClick={() => { setSelectedProduct(product); setIsModalOpen(true); }}>
                          <Pencil className="mr-2 h-4 w-4 text-blue-500" /> Edit
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => { setProductForBarcode(product); setIsBarcodeOpen(true); }}>
                          <BarcodeIcon className="mr-2 h-4 w-4 text-purple-500" /> Barcode
                        </DropdownMenuItem>
                        <DropdownMenuItem className="text-red-600" onClick={() => { setProductToDelete(product); setIsDeleteDialogOpen(true); }}>
                          <Trash2 className="mr-2 h-4 w-4" /> Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-10 text-muted-foreground">
                  No products found.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      <ProductModal
        isOpen={isModalOpen}
        onClose={() => { setIsModalOpen(false); setSelectedProduct(null); }}
        onSuccess={fetchProducts}
        product={selectedProduct}
      />

      <ConfirmDialog
        open={isDeleteDialogOpen}
        onOpenChange={setIsDeleteDialogOpen}
        onConfirm={handleDelete}
        title="Delete Product"
        description={`Are you sure you want to delete "${productToDelete?.name}"? This action cannot be undone.`}
        confirmText="Delete"
        variant="destructive"
      />

      <Dialog open={isBarcodeOpen} onOpenChange={setIsBarcodeOpen}>
        <DialogContent className="max-w-fit">
          <DialogHeader>
            <DialogTitle>Product Barcode - {productForBarcode?.name}</DialogTitle>
          </DialogHeader>
          {productForBarcode?.barcode ? (
            <BarcodeDisplay value={productForBarcode.barcode} />
          ) : (
            <div className="p-10 text-center text-muted-foreground italic">
              This product has no barcode defined.
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
