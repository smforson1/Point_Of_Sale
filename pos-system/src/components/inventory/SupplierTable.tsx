
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
  User,
  Truck,
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Badge } from '@/components/ui/badge'
import { SupplierModal } from './SupplierModal'
import { ConfirmDialog } from '@/components/shared/ConfirmDialog'
import { EmptyState } from '@/components/shared/EmptyState'
import type { Supplier } from '@/types'

export function SupplierTable() {
  const [suppliers, setSuppliers] = useState<Supplier[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedSupplier, setSelectedSupplier] = useState<Supplier | null>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  
  const supabase = createClient()

  const fetchSuppliers = useCallback(async () => {
    setLoading(true)
    try {
      const { data, error } = await supabase
        .from('suppliers')
        .select('*')
        .order('name', { ascending: true })

      if (error) throw error
      setSuppliers(data || [])
    } catch (error: any) {
      toast.error(error.message || 'Failed to fetch suppliers')
    } finally {
      setLoading(false)
    }
  }, [supabase])

  useEffect(() => {
    fetchSuppliers()
  }, [fetchSuppliers])

  const handleDelete = async () => {
    if (!selectedSupplier) return

    try {
      const { error } = await supabase
        .from('suppliers')
        .delete()
        .eq('id', selectedSupplier.id)

      if (error) throw error
      toast.success('Supplier deleted successfully')
      fetchSuppliers()
    } catch (error: any) {
      toast.error(error.message || 'Failed to delete supplier')
    } finally {
      setIsDeleteDialogOpen(false)
      setSelectedSupplier(null)
    }
  }

  const filteredSuppliers = suppliers.filter((s) =>
    s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    s.contact_person?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    s.email?.toLowerCase().includes(searchQuery.toLowerCase())
  )

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search suppliers..."
            className="pl-9"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <Button onClick={() => {
          setSelectedSupplier(null)
          setIsModalOpen(true)
        }}>
          <Plus className="mr-2 h-4 w-4" />
          Add Supplier
        </Button>
      </div>

      <div className="rounded-xl border bg-card/60 backdrop-blur-sm overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Supplier</TableHead>
              <TableHead>Contact Person</TableHead>
              <TableHead>Contact Details</TableHead>
              <TableHead>Address</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <TableRow key={i}>
                  <TableCell><div className="h-4 w-32 animate-pulse bg-muted rounded" /></TableCell>
                  <TableCell><div className="h-4 w-24 animate-pulse bg-muted rounded" /></TableCell>
                  <TableCell><div className="h-4 w-40 animate-pulse bg-muted rounded" /></TableCell>
                  <TableCell><div className="h-4 w-48 animate-pulse bg-muted rounded" /></TableCell>
                  <TableCell className="text-right"><div className="h-4 w-8 animate-pulse bg-muted rounded ml-auto" /></TableCell>
                </TableRow>
              ))
            ) : filteredSuppliers.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5}>
                  <EmptyState
                    title="No suppliers found"
                    description={searchQuery ? "Try searching for something else." : "Add your first supplier to get started."}
                    icon={Truck}
                  />
                </TableCell>
              </TableRow>
            ) : (
              filteredSuppliers.map((supplier) => (
                <TableRow key={supplier.id} className="group hover:bg-muted/50 transition-colors">
                  <TableCell>
                    <div className="font-medium text-foreground">{supplier.name}</div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center text-sm text-muted-foreground">
                      <User className="mr-2 h-3 w-3" />
                      {supplier.contact_person || 'N/A'}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="space-y-1">
                      {supplier.email && (
                        <div className="flex items-center text-sm text-muted-foreground">
                          <Mail className="mr-2 h-3 w-3" />
                          {supplier.email}
                        </div>
                      )}
                      {supplier.phone && (
                        <div className="flex items-center text-sm text-muted-foreground">
                          <Phone className="mr-2 h-3 w-3" />
                          {supplier.phone}
                        </div>
                      )}
                      {!supplier.email && !supplier.phone && (
                        <span className="text-sm text-muted-foreground italic">No contact info</span>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-start text-sm text-muted-foreground max-w-[200px] truncate">
                      <MapPin className="mr-2 h-3 w-3 mt-1 flex-shrink-0" />
                      {supplier.address || 'N/A'}
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
                          setSelectedSupplier(supplier)
                          setIsModalOpen(true)
                        }}>
                          <Pencil className="mr-2 h-4 w-4" />
                          Edit Supplier
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          className="text-destructive focus:bg-destructive/10"
                          onClick={() => {
                            setSelectedSupplier(supplier)
                            setIsDeleteDialogOpen(true)
                          }}
                        >
                          <Trash2 className="mr-2 h-4 w-4" />
                          Delete Supplier
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

      <SupplierModal
        supplier={selectedSupplier}
        open={isModalOpen}
        onOpenChange={setIsModalOpen}
        onSuccess={fetchSuppliers}
      />

      <ConfirmDialog
        open={isDeleteDialogOpen}
        onOpenChange={setIsDeleteDialogOpen}
        onConfirm={handleDelete}
        title="Delete Supplier"
        description={`Are you sure you want to delete ${selectedSupplier?.name}? This action cannot be undone.`}
      />
    </div>
  )
}
