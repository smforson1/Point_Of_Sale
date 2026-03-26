'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { Expense, ExpenseCategory } from '@/types'
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
  Pencil,
  Trash2,
  Calendar,
  Receipt,
  Plus,
  Filter,
} from 'lucide-react'
import { toast } from 'react-hot-toast'
import { format } from 'date-fns'
import { ExpenseModal } from './ExpenseModal'
import { ConfirmDialog } from '@/components/shared/ConfirmDialog'
import { useAuthStore } from '@/store/authStore'

export function ExpenseTable() {
  const { role } = useAuthStore()
  const [expenses, setExpenses] = useState<(Expense & { expense_categories: ExpenseCategory })[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedExpense, setSelectedExpense] = useState<Expense | null>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [expenseToDelete, setExpenseToDelete] = useState<Expense | null>(null)

  const supabase = createClient()

  const fetchExpenses = async () => {
    setLoading(true)
    const { data, error } = await supabase
      .from('expenses')
      .select('*, expense_categories(*)')
      .order('expense_date', { ascending: false })
      
    if (data) setExpenses(data as any)
    if (error) toast.error('Failed to load expenses')
    setLoading(false)
  }

  useEffect(() => {
    fetchExpenses()
  }, [])

  const handleDelete = async () => {
    if (!expenseToDelete) return
    try {
      const { error } = await supabase
        .from('expenses')
        .delete()
        .eq('id', expenseToDelete.id)
      if (error) throw error
      toast.success('Expense deleted successfully')
      fetchExpenses()
    } catch (error: any) {
      toast.error(error.message || 'Failed to delete expense')
    } finally {
      setIsDeleteDialogOpen(false)
      setExpenseToDelete(null)
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold flex items-center gap-2">
          <Receipt className="h-5 w-5 text-muted-foreground" />
          Recent Expenses
        </h2>
        {role !== 'CASHIER' && (
          <Button onClick={() => { setSelectedExpense(null); setIsModalOpen(true); }}>
            <Plus className="mr-2 h-4 w-4" /> Add Expense
          </Button>
        )}
      </div>

      <div className="rounded-md border border-border bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Date</TableHead>
              <TableHead>Category</TableHead>
              <TableHead>Description</TableHead>
              <TableHead>Vendor</TableHead>
              <TableHead>Amount</TableHead>
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
            ) : expenses.length > 0 ? (
              expenses.map((expense) => (
                <TableRow key={expense.id}>
                  <TableCell>
                    <div className="flex items-center gap-2 text-sm">
                      <Calendar className="h-3.5 w-3.5 text-muted-foreground" />
                      {format(new Date(expense.expense_date), 'MMM d, yyyy')}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className="bg-muted/50 font-normal">
                      {expense.expense_categories?.name || 'Uncategorized'}
                    </Badge>
                  </TableCell>
                  <TableCell className="max-w-[200px] truncate">{expense.description}</TableCell>
                  <TableCell className="text-muted-foreground">{expense.vendor || '-'}</TableCell>
                  <TableCell className="font-bold text-red-600">
                    -${Number(expense.amount).toFixed(2)}
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
                          <DropdownMenuItem onClick={() => { setSelectedExpense(expense); setIsModalOpen(true); }}>
                            <Pencil className="mr-2 h-4 w-4 text-blue-500" /> Edit
                          </DropdownMenuItem>
                        )}
                        {role !== 'CASHIER' && (
                          <DropdownMenuItem className="text-red-600" onClick={() => { setExpenseToDelete(expense); setIsDeleteDialogOpen(true); }}>
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
                <TableCell colSpan={6} className="text-center py-10 text-muted-foreground">
                  No expenses recorded yet.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      <ExpenseModal
        isOpen={isModalOpen}
        onClose={() => { setIsModalOpen(false); setSelectedExpense(null); }}
        onSuccess={fetchExpenses}
        expense={selectedExpense}
      />

      <ConfirmDialog
        open={isDeleteDialogOpen}
        onOpenChange={setIsDeleteDialogOpen}
        onConfirm={handleDelete}
        title="Delete Expense"
        description={`Are you sure you want to delete this expense record? This will affect your profit reports.`}
        confirmText="Delete"
        variant="destructive"
      />
    </div>
  )
}
