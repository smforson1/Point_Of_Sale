'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { Supplier } from '@/types'
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
  Search,
  Plus,
  Mail,
  Phone,
  User,
} from 'lucide-react'
import { toast } from 'react-hot-toast'
import { EmptyState } from '@/components/shared/EmptyState'
import { SupplierModal } from './SupplierModal'
import { ConfirmDialog } from '@/components/shared/ConfirmDialog'
import { useAuthStore } from '@/store/authStore'

export function SupplierTable() {
  const { role } = useAuthStore()
  const [suppliers, setSuppliers] = useState<Supplier[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedSupplier, setSelectedSupplier] = useState<Supplier | null>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [supplierToDelete, setSupplierToDelete] = useState<Supplier | null>(null)

  const supabase = createClient()

  const fetchSuppliers = async () => {
    setLoading(true)
    const { data, error } = await supabase
      .from('suppliers')
      .select('*')
      .order('name')
    if (data) setSuppliers(data)
    if (error) toast.error('Failed to load suppliers')
    setLoading(false)
  }

  useEffect(() => {
    fetchSuppliers()
  }, [])

  const handleDelete = async () => {
    if (!supplierToDelete) return
    try {
      const { error } = await supabase
        .from('suppliers')
        .delete()
        .eq('id', supplierToDelete.id)
      if (error) throw error
      toast.success('Supplier deleted successfully')
      fetchSuppliers()
    } catch (error: any) {
      toast.error(error.message || 'Failed to delete supplier')
    } finally {
      setIsDeleteDialogOpen(false)
      setSupplierToDelete(null)
    }
  }

  const filteredSuppliers = suppliers.filter((s) =>
    s.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    s.contact_person?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    s.email?.toLowerCase().includes(searchTerm.toLowerCase())
  )

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search suppliers..."
            className="pl-9"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        {role !== 'CASHIER' && (
          <Button onClick={() => { setSelectedSupplier(null); setIsModalOpen(true); }}>
            <Plus className="mr-2 h-4 w-4" /> Add Supplier
          </Button>
        )}
      </div>

      <div className="rounded-md border border-border bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Supplier Name</TableHead>
              <TableHead>Contact Person</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Phone</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              Array.from({ length: 3 }).map((_, i) => (
                <TableRow key={i}>
                  <TableCell colSpan={5} className="h-12 animate-pulse bg-muted/20" />
                </TableRow>
              ))
            ) : filteredSuppliers.length > 0 ? (
              filteredSuppliers.map((supplier) => (
                <TableRow key={supplier.id}>
                  <TableCell className="font-medium">{supplier.name}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                       <User className="h-3 w-3 text-muted-foreground" />
                       {supplier.contact_person || 'N/A'}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                       <Mail className="h-3 w-3 text-muted-foreground" />
                       {supplier.email || 'N/A'}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                       <Phone className="h-3 w-3 text-muted-foreground" />
                       {supplier.phone || 'N/A'}
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
                        {role !== 'CASHIER' && (
                          <DropdownMenuItem onClick={() => { setSelectedSupplier(supplier); setIsModalOpen(true); }}>
                            <Pencil className="mr-2 h-4 w-4 text-blue-500" /> Edit
                          </DropdownMenuItem>
                        )}
                        {role !== 'CASHIER' && (
                          <DropdownMenuItem className="text-red-600" onClick={() => { setSupplierToDelete(supplier); setIsDeleteDialogOpen(true); }}>
                            <Trash2 className="mr-2 h-4 w-4" /> Delete
                          </DropdownMenuItem>
                        )}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={5}>
                  <EmptyState
                    title="No suppliers found"
                    description="Get started by adding your first supplier."
                    icon={User}
                  />
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      <SupplierModal
        isOpen={isModalOpen}
        onClose={() => { setIsModalOpen(false); setSelectedSupplier(null); }}
        onSuccess={fetchSuppliers}
        supplier={selectedSupplier}
      />

      <ConfirmDialog
        open={isDeleteDialogOpen}
        onOpenChange={setIsDeleteDialogOpen}
        onConfirm={handleDelete}
        title="Delete Supplier"
        description={`Are you sure you want to delete "${supplierToDelete?.name}"? This will not delete purchase history but will remove the contact record.`}
        confirmText="Delete"
        variant="destructive"
      />
    </div>
  )
}
