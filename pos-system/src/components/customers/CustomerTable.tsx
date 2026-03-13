
'use client'

import { useState, useEffect, useCallback } from 'react'
import {
  MoreHorizontal,
  Plus,
  Search,
  Pencil,
  Trash2,
  Mail,
  Phone,
  MapPin,
  Trophy,
  Filter,
  Wallet
} from 'lucide-react'
import { CustomerBalanceModal } from './CustomerBalanceModal'
import { toast } from 'react-hot-toast'
import { formatCurrency } from '@/utils/formatCurrency'
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Badge } from '@/components/ui/badge'
import { CustomerModal } from './CustomerModal'
import { ConfirmDialog } from '@/components/shared/ConfirmDialog'
import { EmptyState } from '@/components/shared/EmptyState'
import { Users } from 'lucide-react'
import type { Customer } from '@/types'

export function CustomerTable() {
  const [customers, setCustomers] = useState<Customer[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [isBalanceModalOpen, setIsBalanceModalOpen] = useState(false)
  
  const supabase = createClient()

  const fetchCustomers = useCallback(async () => {
    setLoading(true)
    try {
      const { data, error } = await supabase
        .from('customers')
        .select('*')
        .order('full_name', { ascending: true })

      if (error) throw error
      setCustomers(data || [])
    } catch (error: any) {
      toast.error(error.message || 'Failed to fetch customers')
    } finally {
      setLoading(false)
    }
  }, [supabase])

  useEffect(() => {
    fetchCustomers()
  }, [fetchCustomers])

  const handleDelete = async () => {
    if (!selectedCustomer) return

    try {
      const { error } = await supabase
        .from('customers')
        .delete()
        .eq('id', selectedCustomer.id)

      if (error) throw error
      toast.success('Customer deleted successfully')
      fetchCustomers()
    } catch (error: any) {
      toast.error(error.message || 'Failed to delete customer')
    } finally {
      setIsDeleteDialogOpen(false)
      setSelectedCustomer(null)
    }
  }

  const filteredCustomers = customers.filter((c) =>
    c.full_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    c.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    c.phone?.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const getTierBadge = (tier: string) => {
    switch (tier) {
      case 'GOLD':
        return <Badge className="bg-yellow-500 hover:bg-yellow-600 text-white border-0">Gold</Badge>
      case 'SILVER':
        return <Badge className="bg-slate-300 hover:bg-slate-400 text-slate-800 border-0">Silver</Badge>
      default:
        return <Badge className="bg-orange-600 hover:bg-orange-700 text-white border-0">Bronze</Badge>
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search customers..."
            className="pl-9"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <Button onClick={() => {
          setSelectedCustomer(null)
          setIsModalOpen(true)
        }}>
          <Plus className="mr-2 h-4 w-4" />
          Add Customer
        </Button>
      </div>

      <div className="rounded-xl border bg-card/60 backdrop-blur-sm overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Customer</TableHead>
              <TableHead>Contact Details</TableHead>
              <TableHead>Loyalty</TableHead>
              <TableHead>Balance</TableHead>
              <TableHead>Address</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <TableRow key={i}>
                  <TableCell><div className="h-4 w-32 animate-pulse bg-muted rounded" /></TableCell>
                  <TableCell><div className="h-4 w-40 animate-pulse bg-muted rounded" /></TableCell>
                  <TableCell><div className="h-4 w-24 animate-pulse bg-muted rounded" /></TableCell>
                  <TableCell><div className="h-4 w-24 animate-pulse bg-muted rounded" /></TableCell>
                  <TableCell><div className="h-4 w-48 animate-pulse bg-muted rounded" /></TableCell>
                  <TableCell className="text-right"><div className="h-4 w-8 animate-pulse bg-muted rounded ml-auto" /></TableCell>
                </TableRow>
              ))
            ) : filteredCustomers.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6}>
                  <EmptyState
                    title="No customers found"
                    description={searchQuery ? "Try searching for something else." : "Add your first customer to get started."}
                    icon={Users}
                  />
                </TableCell>
              </TableRow>
            ) : (
              filteredCustomers.map((customer) => (
                <TableRow key={customer.id} className="group hover:bg-muted/50 transition-colors">
                  <TableCell>
                    <div className="font-medium text-foreground">{customer.full_name}</div>
                  </TableCell>
                  <TableCell>
                    <div className="space-y-1">
                      {customer.email && (
                        <div className="flex items-center text-sm text-muted-foreground text-xs">
                          <Mail className="mr-2 h-3 w-3" />
                          {customer.email}
                        </div>
                      )}
                      {customer.phone && (
                        <div className="flex items-center text-sm text-muted-foreground text-xs">
                          <Phone className="mr-2 h-3 w-3" />
                          {customer.phone}
                        </div>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-col gap-1">
                      {getTierBadge(customer.tier)}
                      <div className="flex items-center text-xs text-muted-foreground">
                        <Trophy className="mr-1 h-3 w-3 text-orange-400" />
                        {customer.loyalty_points} Points
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center text-sm font-bold text-primary">
                      <Wallet className="mr-1 h-3 w-3 text-green-500" />
                      {formatCurrency(customer.store_balance || 0)}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-start text-sm text-muted-foreground max-w-[200px] truncate">
                      <MapPin className="mr-2 h-3 w-3 mt-1 flex-shrink-0 text-primary/60" />
                      {customer.address || 'N/A'}
                    </div>
                  </TableCell>
                  <TableCell className="text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="opacity-0 group-hover:opacity-100 transition-opacity">
                          <MoreHorizontal className="h-4 w-4" />
                          <span className="sr-only">Open menu</span>
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuLabel>Actions</DropdownMenuLabel>
                        <DropdownMenuItem onClick={() => {
                          setSelectedCustomer(customer)
                          setIsModalOpen(true)
                        }}>
                          <Pencil className="mr-2 h-4 w-4" />
                          Edit Details
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => {
                          setSelectedCustomer(customer)
                          setIsBalanceModalOpen(true)
                        }}>
                          <Wallet className="mr-2 h-4 w-4" />
                          Top Up Balance
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          className="text-destructive focus:bg-destructive/10"
                          onClick={() => {
                            setSelectedCustomer(customer)
                            setIsDeleteDialogOpen(true)
                          }}
                        >
                          <Trash2 className="mr-2 h-4 w-4" />
                          Delete Customer
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <CustomerModal
        customer={selectedCustomer}
        open={isModalOpen}
        onOpenChange={setIsModalOpen}
        onSuccess={fetchCustomers}
      />

      <CustomerBalanceModal
        customer={selectedCustomer}
        isOpen={isBalanceModalOpen}
        onClose={() => setIsBalanceModalOpen(false)}
        onSuccess={fetchCustomers}
      />

      <ConfirmDialog
        open={isDeleteDialogOpen}
        onOpenChange={setIsDeleteDialogOpen}
        onConfirm={handleDelete}
        title="Delete Customer"
        description={`Are you sure you want to delete ${selectedCustomer?.full_name}? This will also remove their loyalty history.`}
      />
    </div>
  )
}
