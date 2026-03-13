
'use client'

import { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { toast } from 'react-hot-toast'
import { Settings as SettingsIcon, Store, Mail, Phone, MapPin, Percent, Coins } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { settingsSchema, type SettingsFormValues } from '@/lib/validations'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
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
import { Textarea } from '@/components/ui/textarea'

export default function SettingsPage() {
  const [loading, setLoading] = useState(false)
  const [initialLoading, setInitialLoading] = useState(true)
  const supabase = createClient()

  const form = useForm<SettingsFormValues>({
    resolver: zodResolver(settingsSchema) as any,
    defaultValues: {
      store_name: '',
      store_address: '',
      store_phone: '',
      store_email: '',
      tax_rate: 15,
      currency_code: 'GHS',
      receipt_footer: '',
    },
  })

  useEffect(() => {
    async function fetchSettings() {
      try {
        const { data, error } = await supabase.from('settings').select('*').single()
        if (error && error.code !== 'PGRST116') throw error
        
        if (data) {
          form.reset({
            store_name: data.store_name,
            store_address: data.store_address || '',
            store_phone: data.store_phone || '',
            store_email: data.store_email || '',
            tax_rate: data.tax_rate,
            currency_code: data.currency_code,
            receipt_footer: data.receipt_footer || '',
          })
        }
      } catch (error: any) {
        toast.error('Failed to load settings')
      } finally {
        setInitialLoading(false)
      }
    }
    fetchSettings()
  }, [supabase, form])

  const onSubmit = async (values: SettingsFormValues) => {
    setLoading(true)
    try {
      const { data: existing } = await supabase.from('settings').select('id').single()
      
      let error
      if (existing) {
        const { error: updateError } = await supabase
          .from('settings')
          .update(values)
          .eq('id', existing.id)
        error = updateError
      } else {
        const { error: insertError } = await supabase.from('settings').insert([values])
        error = insertError
      }

      if (error) throw error
      toast.success('Settings updated successfully')
    } catch (error: any) {
      toast.error(error.message || 'Failed to update settings')
    } finally {
      setLoading(false)
    }
  }

  if (initialLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">System Settings</h1>
        <p className="text-muted-foreground text-lg">
          Configure your store information and global preferences.
        </p>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <div className="grid gap-6 md:grid-cols-2">
            <Card className="bg-card/40 backdrop-blur-sm border-primary/10">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-primary">
                  <Store className="h-5 w-5" />
                  Store Identity
                </CardTitle>
                <CardDescription>
                  This information will appear on your receipts and reports.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <FormField
                  control={form.control}
                  name="store_name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Store Name</FormLabel>
                      <FormControl>
                        <Input placeholder="My Professional POS" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="store_email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Business Email</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                          <Input className="pl-9" placeholder="billing@store.com" {...field} />
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="store_phone"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Phone Number</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                          <Input className="pl-9" placeholder="+233..." {...field} />
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="store_address"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Physical Address</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <MapPin className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                          <Textarea className="pl-9 resize-none" placeholder="123 Street, Accra, Ghana" {...field} />
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </CardContent>
            </Card>

            <div className="space-y-6">
              <Card className="bg-card/40 backdrop-blur-sm border-primary/10">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-primary">
                    <Percent className="h-5 w-5" />
                    Tax & Currency
                  </CardTitle>
                  <CardDescription>
                    Define your default tax rates and currency symbols.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <FormField
                    control={form.control}
                    name="tax_rate"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Default Tax Rate (%)</FormLabel>
                        <FormControl>
                          <Input type="number" step="0.01" {...field} />
                        </FormControl>
                        <FormDescription>Applied to all sales by default.</FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="currency_code"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Currency Code</FormLabel>
                        <FormControl>
                          <div className="relative">
                            <Coins className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                            <Input className="pl-9" placeholder="GHS" {...field} />
                          </div>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </CardContent>
              </Card>

              <Card className="bg-card/40 backdrop-blur-sm border-primary/10">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-primary">
                    <SettingsIcon className="h-5 w-5" />
                    Receipt Customization
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <FormField
                    control={form.control}
                    name="receipt_footer"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Receipt Footer Message</FormLabel>
                        <FormControl>
                          <Textarea 
                            className="resize-none" 
                            placeholder="Thank you for shopping with us! No refund after 7 days." 
                            {...field} 
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </CardContent>
              </Card>
            </div>
          </div>

          <div className="flex justify-end gap-3">
            <Button variant="outline" type="button" onClick={() => form.reset()}>
              Reset Changes
            </Button>
            <Button type="submit" size="lg" disabled={loading}>
              {loading ? 'Saving...' : 'Save All Settings'}
            </Button>
          </div>
        </form>
      </Form>
    </div>
  )
}
