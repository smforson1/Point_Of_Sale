'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { PurchaseOrder, Supplier } from '@/types'
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
import { Badge } from '@/components/ui/badge'
import {
  MoreHorizontal,
  Eye,
  CheckCircle2,
  XCircle,
  Plus,
  Truck,
  Calendar,
} from 'lucide-react'
import { toast } from 'react-hot-toast'
import { format } from 'date-fns'
import Link from 'next/link'
import { useAuthStore } from '@/store/authStore'

export function POTable() {
  const { role } = useAuthStore()
  const [orders, setOrders] = useState<(PurchaseOrder & { suppliers: Supplier })[]>([])
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  const fetchOrders = async () => {
    setLoading(true)
    const { data, error } = await supabase
      .from('purchase_orders')
      .select('*, suppliers(*)')
      .order('created_at', { ascending: false })
      
    if (data) setOrders(data as any)
    if (error) toast.error('Failed to load purchase orders')
    setLoading(false)
  }

  useEffect(() => {
    fetchOrders()
  }, [])

  const handleUpdateStatus = async (id: string, status: 'RECEIVED' | 'CANCELLED') => {
    try {
      // If marking as RECEIVED, we need to handle inventory update
      if (status === 'RECEIVED') {
        const { data: items, error: itemsError } = await supabase
          .from('purchase_order_items')
          .select('product_id, quantity')
          .eq('purchase_order_id', id)

        if (itemsError) throw itemsError

        // Batch update inventory
        for (const item of items) {
          const { error: updateError } = await supabase.rpc('increment_stock', {
            row_id: item.product_id,
            count: item.quantity
          })
          if (updateError) throw updateError
        }
      }

      const { error } = await supabase
        .from('purchase_orders')
        .update({ 
          status, 
          received_at: status === 'RECEIVED' ? new Date().toISOString() : null 
        })
        .eq('id', id)

      if (error) throw error
      toast.success(`Order ${status.toLowerCase()} successfully`)
      fetchOrders()
    } catch (error: any) {
      toast.error(error.message || 'Failed to update order')
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'RECEIVED': return <Badge className="bg-green-100 text-green-700 hover:bg-green-100/80 border-green-200">Received</Badge>
      case 'CANCELLED': return <Badge variant="destructive">Cancelled</Badge>
      default: return <Badge variant="secondary">Pending</Badge>
    }
  }

  return (
    <div className="rounded-md border border-border bg-card">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Order ID</TableHead>
            <TableHead>Supplier</TableHead>
            <TableHead>Total Amount</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Created At</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {loading ? (
             Array.from({ length: 3 }).map((_, i) => (
               <TableRow key={i}>
                 <TableCell colSpan={6} className="h-12 animate-pulse bg-muted/20" />
               </TableRow>
             ))
          ) : orders.length > 0 ? (
            orders.map((order) => (
              <TableRow key={order.id}>
                <TableCell className="font-mono text-xs max-w-[100px] truncate">{order.id}</TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <Truck className="h-3 w-3 text-muted-foreground" />
                    {order.suppliers.name}
                  </div>
                </TableCell>
                <TableCell className="font-medium">${Number(order.total_amount).toFixed(2)}</TableCell>
                <TableCell>{getStatusBadge(order.status)}</TableCell>
                <TableCell>
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Calendar className="h-3 w-3" />
                    {format(new Date(order.created_at), 'MMM d, yyyy')}
                  </div>
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
                      <DropdownMenuItem asChild>
                         <Link href={`/purchase-orders/${order.id}`}>
                           <Eye className="mr-2 h-4 w-4" /> View Details
                         </Link>
                      </DropdownMenuItem>
                      {order.status === 'PENDING' && role !== 'CASHIER' && (
                        <>
                          <DropdownMenuItem onClick={() => handleUpdateStatus(order.id, 'RECEIVED')}>
                            <CheckCircle2 className="mr-2 h-4 w-4 text-green-500" /> Mark as Received
                          </DropdownMenuItem>
                          <DropdownMenuItem className="text-red-600" onClick={() => handleUpdateStatus(order.id, 'CANCELLED')}>
                            <XCircle className="mr-2 h-4 w-4" /> Cancel Order
                          </DropdownMenuItem>
                        </>
                      )}
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))
          ) : (
             <TableRow>
               <TableCell colSpan={6} className="text-center py-10 text-muted-foreground">
                 No purchase orders found.
               </TableCell>
             </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  )
}
