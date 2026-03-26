'use client'

import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { createClient } from '@/lib/supabase/client'
import { toast } from 'react-hot-toast'
import type { Expense, ExpenseCategory } from '@/types'
import { Loader2 } from 'lucide-react'
import { useAuthStore } from '@/store/authStore'

const expenseSchema = z.object({
  category_id: z.string().min(1, 'Category is required'),
  amount: z.number().min(0.01, 'Amount must be greater than 0'),
  description: z.string().min(2, 'Description is required'),
  expense_date: z.string().min(1, 'Date is required'),
  vendor: z.string().optional().or(z.literal('')),
  payment_method: z.string().min(1, 'Payment method is required'),
})

type ExpenseFormValues = z.infer<typeof expenseSchema>

interface ExpenseModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
  expense?: Expense | null
}

export function ExpenseModal({
  isOpen,
  onClose,
  onSuccess,
  expense,
}: ExpenseModalProps) {
  const supabase = createClient()
  const { profile } = useAuthStore()
  const [categories, setCategories] = useState<ExpenseCategory[]>([])
  const [loading, setLoading] = useState(false)
  const [fetchingCategories, setFetchingCategories] = useState(false)
  const isEditing = !!expense

  const form = useForm<ExpenseFormValues>({
    resolver: zodResolver(expenseSchema),
    defaultValues: {
      category_id: '',
      amount: 0,
      description: '',
      expense_date: new Date().toISOString().split('T')[0],
      vendor: '',
      payment_method: 'CASH',
    },
  })

  useEffect(() => {
    const fetchCategories = async () => {
      setFetchingCategories(true)
      try {
        const { data, error } = await supabase.from('expense_categories').select('*').order('name')
        if (error) throw error
        if (data) setCategories(data)
      } catch (error) {
        console.error('Error fetching categories:', error)
      } finally {
        setFetchingCategories(false)
      }
    }

    if (isOpen) {
      fetchCategories()
    }
  }, [isOpen])

  useEffect(() => {
    if (expense) {
      form.reset({
        category_id: expense.category_id || '',
        amount: Number(expense.amount),
        description: expense.description,
        expense_date: expense.expense_date,
        vendor: expense.vendor || '',
        payment_method: expense.payment_method,
      })
    } else {
      form.reset({
        category_id: '',
        amount: 0,
        description: '',
        expense_date: new Date().toISOString().split('T')[0],
        vendor: '',
        payment_method: 'CASH',
      })
    }
  }, [expense, form])

  const onSubmit = async (values: ExpenseFormValues) => {
    if (!profile) return
    setLoading(true)
    try {
      // Ensure optional fields are handled correctly for the database
      const dataToSave = {
        category_id: values.category_id,
        amount: values.amount,
        description: values.description,
        expense_date: values.expense_date,
        vendor: values.vendor?.trim() || null,
        payment_method: values.payment_method,
      }

      if (isEditing && expense) {
        const { error } = await supabase
          .from('expenses')
          .update(dataToSave)
          .eq('id', expense.id)
        if (error) throw error
      } else {
        const { error } = await supabase
          .from('expenses')
          .insert([{ ...dataToSave, user_id: profile.id }])
        if (error) throw error
      }

      toast.success(`Expense ${isEditing ? 'updated' : 'added'} successfully`)
      onSuccess()
      onClose()
    } catch (error: any) {
      toast.error(error.message || 'Something went wrong')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>{isEditing ? 'Edit Expense' : 'Add New Expense'}</DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="category_id"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Category</FormLabel>
                   <Select 
                    onValueChange={field.onChange} 
                    value={field.value || undefined}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a category" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {fetchingCategories ? (
                        <div className="flex items-center justify-center p-4">
                          <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                        </div>
                      ) : categories.length === 0 ? (
                        <div className="p-4 text-center text-sm text-muted-foreground">
                          No categories found
                        </div>
                      ) : (
                        categories.map((cat) => (
                          <SelectItem key={cat.id} value={cat.id}>
                            {cat.name}
                          </SelectItem>
                        ))
                      )}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="amount"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Amount</FormLabel>
                    <FormControl>
                      <Input 
                        type="number" 
                        step="0.01" 
                        {...field} 
                        onChange={(e) => field.onChange(e.target.valueAsNumber || 0)}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="expense_date"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Date</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="payment_method"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Payment Method</FormLabel>
                  <Select 
                    onValueChange={field.onChange} 
                    value={field.value || "CASH"}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select method" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="CASH">Cash</SelectItem>
                      <SelectItem value="MOBILE_MONEY">Mobile Money</SelectItem>
                      <SelectItem value="CARD">Card</SelectItem>
                      <SelectItem value="BANK_TRANSFER">Bank Transfer</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description</FormLabel>
                  <FormControl>
                    <Textarea placeholder="Monthly rent payment" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="vendor"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Vendor (Optional)</FormLabel>
                  <FormControl>
                    <Input placeholder="Shopify, Landlord, etc." {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter>
              <Button type="button" variant="outline" onClick={onClose} disabled={loading}>
                Cancel
              </Button>
              <Button type="submit" disabled={loading}>
                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {isEditing ? 'Save Changes' : 'Record Expense'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
