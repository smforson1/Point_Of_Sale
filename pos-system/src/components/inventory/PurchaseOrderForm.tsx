
'use client'

import { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { toast } from 'react-hot-toast'
import { Plus, Trash2, ShoppingCart } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import * as z from 'zod'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { formatCurrency } from '@/utils/formatCurrency'
import type { Supplier, Product } from '@/types'

const poItemSchema = z.object({
  product_id: z.string().min(1, 'Product is required'),
  quantity: z.coerce.number().int().min(1, 'Min 1'),
  unit_cost: z.coerce.number().min(0, 'Min 0'),
})

const purchaseOrderSchema = z.object({
  supplier_id: z.string().min(1, 'Supplier is required'),
  items: z.array(poItemSchema).min(1, 'At least one item is required'),
})

type POFormValues = z.infer<typeof purchaseOrderSchema>

interface PurchaseOrderFormProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess: () => void
}

export function PurchaseOrderForm({ open, onOpenChange, onSuccess }: PurchaseOrderFormProps) {
  const [loading, setLoading] = useState(false)
  const [suppliers, setSuppliers] = useState<Supplier[]>([])
  const [products, setProducts] = useState<Product[]>([])
  const supabase = createClient()

  const form = useForm<POFormValues>({
    resolver: zodResolver(purchaseOrderSchema) as any,
    defaultValues: {
      supplier_id: '',
      items: [{ product_id: '', quantity: 1, unit_cost: 0 }],
    },
  })

  useEffect(() => {
    async function fetchData() {
      const [{ data: sData }, { data: pData }] = await Promise.all([
        supabase.from('suppliers').select('*').order('name'),
        supabase.from('products').select('*').order('name'),
      ])
      if (sData) setSuppliers(sData)
      if (pData) setProducts(pData)
    }
    if (open) fetchData()
  }, [open, supabase])

  const addItem = () => {
    const items = form.getValues('items')
    form.setValue('items', [...items, { product_id: '', quantity: 1, unit_cost: 0 }])
  }

  const removeItem = (index: number) => {
    const items = form.getValues('items')
    if (items.length > 1) {
      form.setValue('items', items.filter((_, i) => i !== index))
    }
  }

  const onSubmit = async (values: POFormValues) => {
    setLoading(true)
    try {
      const total_amount = values.items.reduce((sum, item) => sum + (item.quantity * item.unit_cost), 0)
      
      // 1. Create Purchase Order
      const { data: po, error: poError } = await supabase
        .from('purchase_orders')
        .insert({
          supplier_id: values.supplier_id,
          total_amount,
          status: 'PENDING',
        })
        .select()
        .single()

      if (poError) throw poError

      // Note: Ideally we would also insert items into a purchase_order_items table
      // But based on the schema.sql provided earlier, we only have purchase_orders table.
      // If we don't have po_items table, we might just log this action or update stock directly if status is 'RECEIVED'.
      // For this implementation, we'll assume the PO is created.
      
      toast.success('Purchase Order created successfully')
      onSuccess()
      onOpenChange(false)
      form.reset()
    } catch (error: any) {
      toast.error(error.message || 'Failed to create purchase order')
    } finally {
      setLoading(false)
    }
  }

  const calculateTotal = () => {
    const items = form.watch('items') || []
    return items.reduce((sum, item) => sum + (Number(item.quantity || 0) * Number(item.unit_cost || 0)), 0)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Create Purchase Order</DialogTitle>
          <DialogDescription>
            Record a new stock shipment request from a supplier.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <FormField
              control={form.control}
              name="supplier_id"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Supplier</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a supplier" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {suppliers.map((s) => (
                        <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-medium">Order Items</h3>
                <Button type="button" variant="outline" size="sm" onClick={addItem}>
                  <Plus className="mr-2 h-4 w-4" />
                  Add Item
                </Button>
              </div>

              <div className="border rounded-lg overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Product</TableHead>
                      <TableHead className="w-[100px]">Qty</TableHead>
                      <TableHead className="w-[120px]">Unit Cost</TableHead>
                      <TableHead className="w-[100px]">Subtotal</TableHead>
                      <TableHead className="w-[50px]"></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {form.watch('items').map((_, index) => (
                      <TableRow key={index}>
                        <TableCell>
                          <FormField
                            control={form.control}
                            name={`items.${index}.product_id`}
                            render={({ field }) => (
                              <FormItem>
                                <Select onValueChange={field.onChange} defaultValue={field.value}>
                                  <FormControl>
                                    <SelectTrigger className="border-0 bg-transparent focus:ring-0">
                                      <SelectValue placeholder="Select" />
                                    </SelectTrigger>
                                  </FormControl>
                                  <SelectContent>
                                    {products.map((p) => (
                                      <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                              </FormItem>
                            )}
                          />
                        </TableCell>
                        <TableCell>
                          <FormField
                            control={form.control}
                            name={`items.${index}.quantity`}
                            render={({ field }) => (
                              <FormItem>
                                <Input type="number" min="1" className="border-0 bg-transparent focus-visible:ring-0" {...field} />
                              </FormItem>
                            )}
                          />
                        </TableCell>
                        <TableCell>
                          <FormField
                            control={form.control}
                            name={`items.${index}.unit_cost`}
                            render={({ field }) => (
                              <FormItem>
                                <Input type="number" step="0.01" className="border-0 bg-transparent focus-visible:ring-0" {...field} />
                              </FormItem>
                            )}
                          />
                        </TableCell>
                        <TableCell className="font-medium">
                          {formatCurrency((form.watch(`items.${index}.quantity`) || 0) * (form.watch(`items.${index}.unit_cost`) || 0))}
                        </TableCell>
                        <TableCell>
                          <Button 
                            type="button" 
                            variant="ghost" 
                            size="icon" 
                            className="text-destructive hover:text-red-600 hover:bg-red-50"
                            onClick={() => removeItem(index)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </div>

            <div className="flex justify-between items-center p-4 bg-muted/50 rounded-lg">
              <span className="font-semibold">Total Order Amount:</span>
              <span className="text-xl font-bold text-primary">{formatCurrency(calculateTotal())}</span>
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={loading}>
                {loading ? 'Submitting...' : 'Submit Purchase Order'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
