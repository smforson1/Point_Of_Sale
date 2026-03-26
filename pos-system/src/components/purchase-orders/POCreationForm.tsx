'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import type { Supplier, Product } from '@/types'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Trash2, Plus, Search, Loader2, Truck, Package } from 'lucide-react'
import { toast } from 'react-hot-toast'

interface POItem {
  productId: string
  name: string
  quantity: number
  unitCost: number
}

export function POCreationForm() {
  const router = useRouter()
  const supabase = createClient()
  const [suppliers, setSuppliers] = useState<Supplier[]>([])
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  
  const [selectedSupplierId, setSelectedSupplierId] = useState<string>('')
  const [items, setItems] = useState<POItem[]>([])
  const [searchTerm, setSearchTerm] = useState('')

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true)
      const [suppliersRes, productsRes] = await Promise.all([
        supabase.from('suppliers').select('*').order('name'),
        supabase.from('products').select('*').order('name')
      ])
      
      if (suppliersRes.data) setSuppliers(suppliersRes.data)
      if (productsRes.data) setProducts(productsRes.data)
      setLoading(false)
    }
    fetchData()
  }, [])

  const addItem = (product: Product) => {
    if (items.find(i => i.productId === product.id)) {
      toast.error('Product already added to list')
      return
    }
    setItems([...items, { 
      productId: product.id, 
      name: product.name, 
      quantity: 1, 
      unitCost: product.cost_price || 0 
    }])
    setSearchTerm('')
  }

  const removeItem = (index: number) => {
    setItems(items.filter((_, i) => i !== index))
  }

  const updateItem = (index: number, field: keyof POItem, value: number) => {
    const newItems = [...items]
    newItems[index] = { ...newItems[index], [field]: value }
    setItems(newItems)
  }

  const totalAmount = items.reduce((sum, item) => sum + (item.quantity * item.unitCost), 0)

  const handleSubmit = async () => {
    if (!selectedSupplierId) {
      toast.error('Please select a supplier')
      return
    }
    if (items.length === 0) {
      toast.error('Please add at least one item')
      return
    }

    setIsSubmitting(true)
    try {
      // 1. Create Purchase Order
      const { data: po, error: poError } = await supabase
        .from('purchase_orders')
        .insert([{
          supplier_id: selectedSupplierId,
          total_amount: totalAmount,
          status: 'PENDING'
        }])
        .select()
        .single()

      if (poError) throw poError

      // 2. Create PO Items
      const poItems = items.map(item => ({
        purchase_order_id: po.id,
        product_id: item.productId,
        quantity: item.quantity,
        unit_cost: item.unitCost,
        subtotal: item.quantity * item.unitCost
      }))

      const { error: itemsError } = await supabase
        .from('purchase_order_items')
        .insert(poItems)

      if (itemsError) throw itemsError

      toast.success('Purchase Order created successfully')
      router.push('/purchase-orders')
    } catch (error: any) {
      toast.error(error.message || 'Failed to create order')
    } finally {
      setIsSubmitting(false)
    }
  }

  const filteredProducts = products.filter(p => 
    p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.sku?.toLowerCase().includes(searchTerm.toLowerCase())
  ).slice(0, 5)

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <div className="lg:col-span-2 space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Package className="h-5 w-5" />
              Order Items
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="relative">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search products by name or SKU..."
                className="pl-9"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
              {searchTerm && filteredProducts.length > 0 && (
                <div className="absolute z-10 w-full mt-1 bg-card border border-border rounded-md shadow-lg overflow-hidden">
                  {filteredProducts.map(product => (
                    <button
                      key={product.id}
                      className="w-full px-4 py-2 text-left hover:bg-muted flex items-center justify-between"
                      onClick={() => addItem(product)}
                    >
                      <span>{product.name}</span>
                      <span className="text-xs text-muted-foreground">SKU: {product.sku || 'N/A'}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>

            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Product</TableHead>
                    <TableHead className="w-24">Qty</TableHead>
                    <TableHead className="w-32">Unit Cost</TableHead>
                    <TableHead className="w-32">Subtotal</TableHead>
                    <TableHead className="w-12"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {items.length > 0 ? (
                    items.map((item, index) => (
                      <TableRow key={item.productId}>
                        <TableCell className="font-medium text-sm">{item.name}</TableCell>
                        <TableCell>
                          <Input
                            type="number"
                            min="1"
                            value={item.quantity}
                            onChange={(e) => updateItem(index, 'quantity', parseInt(e.target.value) || 0)}
                            className="h-8"
                          />
                        </TableCell>
                        <TableCell>
                          <Input
                            type="number"
                            step="0.01"
                            min="0"
                            value={item.unitCost}
                            onChange={(e) => updateItem(index, 'unitCost', parseFloat(e.target.value) || 0)}
                            className="h-8"
                          />
                        </TableCell>
                        <TableCell className="text-sm">
                          ${(item.quantity * item.unitCost).toFixed(2)}
                        </TableCell>
                        <TableCell>
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            className="h-8 w-8 text-red-500 hover:text-red-600 hover:bg-red-50"
                            onClick={() => removeItem(index)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                        No items added yet. Search products to add them to your order.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Truck className="h-5 w-5" />
              Supplier Details
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Select Supplier</label>
              <Select value={selectedSupplierId} onValueChange={setSelectedSupplierId}>
                <SelectTrigger>
                  <SelectValue placeholder="Choose a supplier..." />
                </SelectTrigger>
                <SelectContent>
                  {suppliers.map(s => (
                    <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Summary</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Item Count</span>
              <span>{items.length}</span>
            </div>
            <div className="flex justify-between text-lg font-bold border-t pt-4">
              <span>Total Amount</span>
              <span className="text-primary">${totalAmount.toFixed(2)}</span>
            </div>
          </CardContent>
          <CardFooter>
            <Button 
              className="w-full" 
              size="lg" 
              disabled={isSubmitting}
              onClick={handleSubmit}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Creating Order...
                </>
              ) : (
                'Create Purchase Order'
              )}
            </Button>
          </CardFooter>
        </Card>
      </div>
    </div>
  )
}
