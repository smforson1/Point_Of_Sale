'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useAuthStore } from '@/store/authStore'
import { formatCurrency } from '@/utils/formatCurrency'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { toast } from 'react-hot-toast'
import { Receipt, Plus, Loader2, Trash2 } from 'lucide-react'
import { Expense } from '@/types'

interface ExpenseManagementModalProps {
  isOpen: boolean
  onClose: () => void
}

const EXPENSE_CATEGORIES = [
  'Utilities',
  'Rent',
  'Salaries',
  'Supplies',
  'Marketing',
  'Maintenance',
  'Other'
]

export function ExpenseManagementModal({ isOpen, onClose }: ExpenseManagementModalProps) {
  const { profile } = useAuthStore()
  const [expenses, setExpenses] = useState<Expense[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  
  const [newExpense, setNewExpense] = useState({
    category: 'Other',
    amount: '',
    description: ''
  })

  const supabase = createClient()

  useEffect(() => {
    if (isOpen) {
      fetchExpenses()
    }
  }, [isOpen])

  const fetchExpenses = async () => {
    setIsLoading(true)
    const { data } = await supabase
      .from('expenses')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(20)
    
    if (data) setExpenses(data)
    setIsLoading(false)
  }

  const handleAddExpense = async () => {
    if (!profile) return
    const amount = parseFloat(newExpense.amount)
    if (isNaN(amount) || amount <= 0) {
      toast.error('Enter a valid amount')
      return
    }

    setIsSubmitting(true)
    try {
      const { data, error } = await supabase
        .from('expenses')
        .insert({
          category: newExpense.category,
          amount,
          description: newExpense.description,
          user_id: profile.id
        })
        .select()
        .single()

      if (error) throw error
      
      setExpenses([data, ...expenses])
      setNewExpense({ category: 'Other', amount: '', description: '' })
      toast.success('Expense logged')
    } catch (error: any) {
      toast.error(error.message)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleDeleteExpense = async (id: string) => {
    const { error } = await supabase.from('expenses').delete().eq('id', id)
    if (error) {
      toast.error('Failed to delete')
    } else {
      setExpenses(expenses.filter(e => e.id !== id))
      toast.success('Deleted')
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Receipt className="h-5 w-5 text-primary" />
            Expense Management
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* New Expense Form */}
          <div className="bg-muted/50 p-4 rounded-xl border space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-xs">Category</Label>
                <Select 
                  value={newExpense.category} 
                  onValueChange={(val) => setNewExpense({...newExpense, category: val})}
                >
                  <SelectTrigger className="h-9">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {EXPENSE_CATEGORIES.map(cat => (
                      <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label className="text-xs">Amount (₵)</Label>
                <Input
                  type="number"
                  className="h-9 font-bold"
                  value={newExpense.amount}
                  onChange={(e) => setNewExpense({...newExpense, amount: e.target.value})}
                  placeholder="0.00"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label className="text-xs">Description (Optional)</Label>
              <Textarea
                className="h-20 resize-none text-xs"
                value={newExpense.description}
                onChange={(e) => setNewExpense({...newExpense, description: e.target.value})}
                placeholder="What was this for?"
              />
            </div>
            <Button className="w-full h-9" onClick={handleAddExpense} disabled={isSubmitting}>
              {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="mr-2 h-4 w-4" />}
              Log Expense
            </Button>
          </div>

          {/* Recent Expenses List */}
          <div className="space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center justify-between">
              Recent Expenses
              {isLoading && <Loader2 className="h-3 w-3 animate-spin" />}
            </h3>
            <div className="max-h-[250px] overflow-y-auto space-y-2 pr-1 custom-scrollbar">
              {expenses.length === 0 && !isLoading ? (
                <p className="text-center py-8 text-xs text-muted-foreground">No expenses logged yet.</p>
              ) : (
                expenses.map((expense) => (
                  <div key={expense.id} className="flex items-center justify-between p-3 border border-border rounded-lg bg-card group">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold px-1.5 py-0.5 bg-secondary text-secondary-foreground rounded">
                          {expense.category}
                        </span>
                        <span className="text-[10px] text-muted-foreground">
                          {new Date(expense.created_at).toLocaleDateString()}
                        </span>
                      </div>
                      <p className="text-xs mt-1 font-medium">{expense.description || 'No description'}</p>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="font-black text-sm text-red-600">-{formatCurrency(expense.amount)}</span>
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="h-7 w-7 opacity-0 group-hover:opacity-100 text-destructive transition-opacity"
                        onClick={() => handleDeleteExpense(expense.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
