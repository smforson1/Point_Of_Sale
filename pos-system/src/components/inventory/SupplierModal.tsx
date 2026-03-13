
'use client'

import { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { toast } from 'react-hot-toast'
import { createClient } from '@/lib/supabase/client'
import { supplierSchema, type SupplierFormValues } from '@/lib/validations'
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
import { Textarea } from '@/components/ui/textarea'
import type { Supplier } from '@/types'

interface SupplierModalProps {
  supplier: Supplier | null
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess: () => void
}

export function SupplierModal({
  supplier,
  open,
  onOpenChange,
  onSuccess,
}: SupplierModalProps) {
  const [loading, setLoading] = useState(false)
  const supabase = createClient()

  const form = useForm<SupplierFormValues>({
    resolver: zodResolver(supplierSchema) as any,
    defaultValues: {
      name: '',
      contact_person: '',
      email: '',
      phone: '',
      address: '',
    },
  })

  useEffect(() => {
    if (supplier) {
      form.reset({
        name: supplier.name,
        contact_person: supplier.contact_person || '',
        email: supplier.email || '',
        phone: supplier.phone || '',
        address: supplier.address || '',
      })
    } else {
      form.reset({
        name: '',
        contact_person: '',
        email: '',
        phone: '',
        address: '',
      })
    }
  }, [supplier, form])

  const onSubmit = async (values: SupplierFormValues) => {
    setLoading(true)
    try {
      if (supplier) {
        const { error } = await supabase
          .from('suppliers')
          .update(values)
          .eq('id', supplier.id)

        if (error) throw error
        toast.success('Supplier updated successfully')
      } else {
        const { error } = await supabase.from('suppliers').insert([values])

        if (error) throw error
        toast.success('Supplier added successfully')
      }

      onSuccess()
      onOpenChange(false)
    } catch (error: any) {
      toast.error(error.message || 'Something went wrong')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>{supplier ? 'Edit Supplier' : 'Add Supplier'}</DialogTitle>
          <DialogDescription>
            Enter the details of the supplier here.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Supplier Name</FormLabel>
                  <FormControl>
                    <Input placeholder="Acme Corp" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="contact_person"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Contact Person</FormLabel>
                  <FormControl>
                    <Input placeholder="John Doe" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email</FormLabel>
                    <FormControl>
                      <Input type="email" placeholder="john@example.com" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="phone"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Phone Number</FormLabel>
                    <FormControl>
                      <Input placeholder="+233..." {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="address"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Address</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Street address, City, Country"
                      className="resize-none"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={loading}>
                {loading ? 'Saving...' : 'Save Supplier'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
