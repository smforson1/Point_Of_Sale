
'use client'

import { useState, useEffect } from 'react'
import { Package, Truck, AlertTriangle, ShoppingCart } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { ProductStockTable } from '@/components/inventory/ProductStockTable'
import { SupplierTable } from '@/components/inventory/SupplierTable'
import { PurchaseOrderTable } from '@/components/inventory/PurchaseOrderTable'

export default function InventoryPage() {
  const [stats, setStats] = useState({
    totalItems: 0,
    lowStock: 0,
    outOfStock: 0,
  })
  const supabase = createClient()

  useEffect(() => {
    async function fetchStats() {
      const { data: products } = await supabase.from('products').select('quantity, low_stock_threshold')
      
      if (products) {
        setStats({
          totalItems: products.length,
          lowStock: products.filter(p => p.quantity > 0 && p.quantity <= p.low_stock_threshold).length,
          outOfStock: products.filter(p => p.quantity === 0).length,
        })
      }
    }
    fetchStats()
  }, [supabase])

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Inventory Management</h1>
          <p className="text-muted-foreground text-lg">
            Monitor stock levels and manage your suppliers.
          </p>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card className="bg-card/40 backdrop-blur-sm border-primary/10">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Total Products</CardTitle>
            <Package className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalItems}</div>
          </CardContent>
        </Card>
        <Card className={`${stats.lowStock > 0 ? 'bg-yellow-500/10 border-yellow-500/20' : 'bg-card/40 border-primary/10'}`}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className={`text-sm font-medium uppercase tracking-wider ${stats.lowStock > 0 ? 'text-yellow-600' : 'text-muted-foreground'}`}>Low Stock</CardTitle>
            <AlertTriangle className={`h-4 w-4 ${stats.lowStock > 0 ? 'text-yellow-600' : 'text-primary'}`} />
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${stats.lowStock > 0 ? 'text-yellow-600' : ''}`}>{stats.lowStock}</div>
          </CardContent>
        </Card>
        <Card className={`${stats.outOfStock > 0 ? 'bg-red-500/10 border-red-500/20' : 'bg-card/40 border-primary/10'}`}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className={`text-sm font-medium uppercase tracking-wider ${stats.outOfStock > 0 ? 'text-red-600' : 'text-muted-foreground'}`}>Out of Stock</CardTitle>
            <Package className={`h-4 w-4 ${stats.outOfStock > 0 ? 'text-red-600' : 'text-primary'}`} />
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${stats.outOfStock > 0 ? 'text-red-600' : ''}`}>{stats.outOfStock}</div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="stock" className="space-y-4">
        <TabsList className="bg-muted/50 p-1">
          <TabsTrigger value="stock" className="flex items-center gap-2">
            <Package className="h-4 w-4" />
            Stock Levels
          </TabsTrigger>
          <TabsTrigger value="suppliers" className="flex items-center gap-2">
            <Truck className="h-4 w-4" />
            Suppliers
          </TabsTrigger>
          <TabsTrigger value="orders" className="flex items-center gap-2">
            <ShoppingCart className="h-4 w-4" />
            Purchase Orders
          </TabsTrigger>
        </TabsList>
        <TabsContent value="stock" className="space-y-4">
          <ProductStockTable />
        </TabsContent>
        <TabsContent value="suppliers" className="space-y-4">
          <SupplierTable />
        </TabsContent>
        <TabsContent value="orders" className="space-y-4">
          <PurchaseOrderTable />
        </TabsContent>
      </Tabs>
    </div>
  )
}
