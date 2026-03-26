'use client'

import { POTable } from '@/components/purchase-orders/POTable'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { ClipboardList, Plus } from 'lucide-react'
import Link from 'next/link'
import { useAuthStore } from '@/store/authStore'

export default function PurchaseOrdersPage() {
  const { role } = useAuthStore()

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex flex-col gap-2">
          <h1 className="text-3xl font-bold tracking-tight">Purchase Orders</h1>
          <p className="text-muted-foreground">
            Track and manage inventory restocking from your suppliers.
          </p>
        </div>
        {role !== 'CASHIER' && (
          <Button asChild>
            <Link href="/purchase-orders/new">
              <Plus className="mr-2 h-4 w-4" /> New Purchase Order
            </Link>
          </Button>
        )}
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <ClipboardList className="h-5 w-5 text-primary" />
            <CardTitle>Order History</CardTitle>
          </div>
          <CardDescription>
            View all pending and received purchase orders.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <POTable />
        </CardContent>
      </Card>
    </div>
  )
}
