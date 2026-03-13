
'use client'

import { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { toast } from 'react-hot-toast'
import { createClient } from '@/lib/supabase/client'
import { userSchema, type UserFormValues } from '@/lib/validations'
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
  FormDescription,
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
import type { Profile } from '@/types'

interface UserModalProps {
  user: Profile | null
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess: () => void
}

export function UserModal({ user, open, onOpenChange, onSuccess }: UserModalProps) {
  const [loading, setLoading] = useState(false)
  const supabase = createClient()

  const form = useForm<UserFormValues>({
    resolver: zodResolver(userSchema) as any,
    defaultValues: {
      email: '',
      full_name: '',
      role: 'CASHIER',
      password: '',
    },
  })

  useEffect(() => {
    if (user) {
      form.reset({
        email: user.email,
        full_name: user.full_name || '',
        role: user.role,
        password: '', // Don't populate password field
      })
    } else {
      form.reset({
        email: '',
        full_name: '',
        role: 'CASHIER',
        password: '',
      })
    }
  }, [user, open, form])

  const onSubmit = async (values: UserFormValues) => {
    setLoading(true)
    try {
      if (user) {
        // Updating existing user profile
        const { error } = await supabase
          .from('profiles')
          .update({
            full_name: values.full_name,
            role: values.role,
          })
          .eq('id', user.id)

        if (error) throw error
        toast.success('User updated successfully')
      } else {
        // Creating new user via API
        const response = await fetch('/api/users/create', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(values),
        })

        const data = await response.json()
        if (!response.ok) throw new Error(data.error || 'Failed to create user')

        toast.success('User created successfully')
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
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>{user ? 'Edit User' : 'Add New Staff Member'}</DialogTitle>
          <DialogDescription>
            {user ? 'Update account details and permissions.' : 'Create a new account for your staff.'}
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Email Address</FormLabel>
                  <FormControl>
                    <Input placeholder="staff@store.com" disabled={!!user} {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="full_name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Full Name</FormLabel>
                  <FormControl>
                    <Input placeholder="John Doe" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="role"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>System Role</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a role" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="ADMIN">Administrator</SelectItem>
                      <SelectItem value="MANAGER">Manager</SelectItem>
                      <SelectItem value="CASHIER">Cashier</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            {!user && (
              <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Temporary Password</FormLabel>
                    <FormControl>
                      <Input type="password" placeholder="Min 6 characters" {...field} />
                    </FormControl>
                    <FormDescription>User should change this after first login.</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={loading}>
                {loading ? 'Saving...' : user ? 'Update User' : 'Create User'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
