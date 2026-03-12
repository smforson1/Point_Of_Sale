'use client'

import { useState, useEffect } from 'react'
import { Customer } from '@/types'
import { createClient } from '@/lib/supabase/client'
import { useCartStore } from '@/store/cartStore'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { User, UserPlus } from 'lucide-react'
import { Button } from '@/components/ui/button'

export function CustomerSelector() {
  const [customers, setCustomers] = useState<Customer[]>([])
  const { customerId, setCustomer } = useCartStore()
  const supabase = createClient()

  useEffect(() => {
    const fetchCustomers = async () => {
      const { data } = await supabase
        .from('customers')
        .select('*')
        .order('full_name')
      
      if (data) setCustomers(data)
    }

    fetchCustomers()
  }, [supabase])

  const selectedCustomer = customers.find(c => c.id === customerId)

  return (
    <div className="flex items-center gap-2">
      <div className="flex-1">
        <Select
          value={customerId || 'walk-in'}
          onValueChange={(val) => setCustomer(val === 'walk-in' ? null : val)}
        >
          <SelectTrigger className="w-full">
            <div className="flex items-center gap-2">
              <User className="h-4 w-4 text-muted-foreground" />
              <SelectValue placeholder="Walk-in Customer" />
            </div>
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="walk-in">Walk-in Customer</SelectItem>
            {customers.map((customer) => (
              <SelectItem key={customer.id} value={customer.id}>
                {customer.full_name} ({customer.tier})
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <Button variant="outline" size="icon" className="shrink-0" title="Add Customer">
        <UserPlus className="h-4 w-4" />
      </Button>
    </div>
  )
}
