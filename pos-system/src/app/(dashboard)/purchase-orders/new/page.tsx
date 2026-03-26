'use client'

import { POCreationForm } from '@/components/purchase-orders/POCreationForm'
import { Button } from '@/components/ui/button'
import { ChevronLeft } from 'lucide-react'
import Link from 'next/link'

export default function NewPOPage() {
  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      <div className="flex flex-col gap-4">
        <Button variant="ghost" asChild className="w-fit -ml-2">
          <Link href="/purchase-orders" className="flex items-center gap-2">
            <ChevronLeft className="h-4 w-4" />
            Back to Orders
          </Link>
        </Button>
        
        <div className="flex flex-col gap-2">
          <h1 className="text-3xl font-bold tracking-tight">New Purchase Order</h1>
          <p className="text-muted-foreground">
            Create a new restocking order for your supplier.
          </p>
        </div>
      </div>

      <POCreationForm />
    </div>
  )
}
