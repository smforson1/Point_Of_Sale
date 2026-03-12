'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { AlertCircle, ArrowRight } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import Link from 'next/link'

interface LowStockAlertsProps {
  products: any[]
}

export function LowStockAlerts({ products }: LowStockAlertsProps) {
  return (
    <Card className="col-span-4 lg:col-span-1 shadow-sm border-amber-100 bg-amber-50/20">
      <CardHeader className="flex flex-row items-center justify-between space-y-0">
        <CardTitle className="text-base font-semibold flex items-center gap-2">
          <AlertCircle className="h-4 w-4 text-amber-500" />
          Stock Alerts
        </CardTitle>
        <Link href="/inventory" className="text-xs text-amber-600 hover:underline flex items-center gap-1">
          View All <ArrowRight className="h-3 w-3" />
        </Link>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {products.map((product) => (
            <div key={product.id} className="flex items-center justify-between">
              <div className="space-y-1">
                <p className="text-sm font-medium leading-none">{product.name}</p>
                <p className="text-xs text-muted-foreground">{product.category}</p>
              </div>
              <div className="text-right">
                <Badge variant={product.quantity === 0 ? 'destructive' : 'warning'} className="text-[10px]">
                  {product.quantity} left
                </Badge>
              </div>
            </div>
          ))}
          {products.length === 0 && (
            <p className="text-sm text-center py-4 text-muted-foreground">All products in stock</p>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
