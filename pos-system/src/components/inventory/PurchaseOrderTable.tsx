
'use client'

import { useState, useEffect, useCallback } from 'react'
import { Plus, Search, FileText, BadgeCheck, Clock, XCircle } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { toast } from 'react-hot-toast'
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
import { formatCurrency } from '@/utils/formatCurrency'
import { formatDate } from '@/utils/formatDate'
import { PurchaseOrderForm } from './PurchaseOrderForm'
import type { PurchaseOrder, Supplier } from '@/types'

export function PurchaseOrderTable() {
  const [orders, setOrders] = useState<(PurchaseOrder & { suppliers: Supplier })[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [isModalOpen, setIsModalOpen] = useState(false)
  const supabase = createClient()

  const fetchOrders = useCallback(async () => {
    setLoading(true)
    try {
      const { data, error } = await supabase
        .from('purchase_orders')
        .select('*, suppliers(*)')
        .order('created_at', { ascending: false })

      if (error) throw error
      setOrders(data || [])
    } catch (error: any) {
      toast.error(error.message || 'Failed to fetch purchase orders')
    } finally {
      setLoading(false)
    }
  }, [supabase])

  useEffect(() => {
    fetchOrders()
  }, [fetchOrders])

  const filteredOrders = orders.filter((o) =>
    o.suppliers?.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    o.id.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'RECEIVED':
        return <Badge className="bg-green-500 hover:bg-green-600 border-0"><BadgeCheck className="mr-1 h-3 w-3" /> Received</Badge>
      case 'CANCELLED':
        return <Badge variant="destructive"><XCircle className="mr-1 h-3 w-3" /> Cancelled</Badge>
      default:
        return <Badge variant="secondary"><Clock className="mr-1 h-3 w-3" /> Pending</Badge>
    }
  }

  const handleUpdateStatus = async (id: string, status: 'RECEIVED' | 'CANCELLED') => {
    try {
      const { error } = await supabase
        .from('purchase_orders')
        .update({ 
          status,
          received_at: status === 'RECEIVED' ? new Date().toISOString() : null
        })
        .eq('id', id)

      if (error) throw error
      toast.success(`Order marked as ${status.toLowerCase()}`)
      fetchOrders()
    } catch (error: any) {
      toast.error(error.message || 'Failed to update status')
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search by supplier or ID..."
            className="pl-9"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <Button onClick={() => setIsModalOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
          New Order
        </Button>
      </div>

      <div className="rounded-xl border bg-card/60 backdrop-blur-sm overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Order ID</TableHead>
              <TableHead>Supplier</TableHead>
              <TableHead>Amount</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Date</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              Array.from({ length: 3 }).map((_, i) => (
                <TableRow key={i}>
                  <TableCell><div className="h-4 w-24 animate-pulse bg-muted rounded" /></TableCell>
                  <TableCell><div className="h-4 w-32 animate-pulse bg-muted rounded" /></TableCell>
                  <TableCell><div className="h-4 w-20 animate-pulse bg-muted rounded" /></TableCell>
                  <TableCell><div className="h-4 w-20 animate-pulse bg-muted rounded" /></TableCell>
                  <TableCell><div className="h-4 w-24 animate-pulse bg-muted rounded" /></TableCell>
                  <TableCell className="text-right"><div className="h-4 w-12 animate-pulse bg-muted rounded ml-auto" /></TableCell>
                </TableRow>
              ))
            ) : filteredOrders.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="h-32 text-center text-muted-foreground">
                  No purchase orders found.
                </TableCell>
              </TableRow>
            ) : (
              filteredOrders.map((order) => (
                <TableRow key={order.id} className="group hover:bg-muted/50 transition-colors">
                  <TableCell className="font-mono text-xs text-muted-foreground">
                    {order.id.split('-')[0].toUpperCase()}
                  </TableCell>
                  <TableCell className="font-medium text-sm">
                    {order.suppliers?.name}
                  </TableCell>
                  <TableCell className="font-semibold text-sm">
                    {formatCurrency(order.total_amount)}
                  </TableCell>
                  <TableCell>
                    {getStatusBadge(order.status)}
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {formatDate(order.created_at)}
                  </TableCell>
                  <TableCell className="text-right">
                    {order.status === 'PENDING' && (
                      <div className="flex justify-end gap-2">
                        <Button 
                          variant="outline" 
                          size="sm" 
                          className="h-8 text-xs bg-green-50 text-green-600 border-green-200 hover:bg-green-100"
                          onClick={() => handleUpdateStatus(order.id, 'RECEIVED')}
                        >
                          Receive
                        </Button>
                        <Button 
                          variant="outline" 
                          size="sm" 
                          className="h-8 text-xs text-destructive bg-red-50 hover:bg-red-100"
                          onClick={() => handleUpdateStatus(order.id, 'CANCELLED')}
                        >
                          Cancel
                        </Button>
                      </div>
                    )}
                    {order.status === 'RECEIVED' && order.received_at && (
                      <div className="text-[10px] text-muted-foreground italic">
                        Received on {new Date(order.received_at).toLocaleDateString()}
                      </div>
                    )}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <PurchaseOrderForm
        open={isModalOpen}
        onOpenChange={setIsModalOpen}
        onSuccess={fetchOrders}
      />
    </div>
  )
}
