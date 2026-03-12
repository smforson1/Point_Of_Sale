'use client'

// Demand forecasting logic for inventory management

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { AlertTriangle, Info, TrendingDown } from 'lucide-react'
import { Progress } from '@/components/ui/progress'

interface DemandForecastProps {
  products: any[]
}

export function DemandForecast({ products }: DemandForecastProps) {
  // Logic: avg daily sales over last 30 days
  // Stockout in X days = Current Stock / Avg Daily Sales
  
  return (
    <Card className="col-span-4 shadow-sm border-purple-100 bg-purple-50/10">
      <CardHeader>
        <CardTitle className="text-base font-semibold flex items-center gap-2">
          <TrendingDown className="h-4 w-4 text-purple-500" />
          Stockout Forecasting
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {products.map((p) => {
            const stockoutDays = Math.round(p.quantity / (p.avg_daily_sales || 1))
            const riskLevel = stockoutDays <= 3 ? 'high' : stockoutDays <= 7 ? 'medium' : 'low'
            
            return (
              <div key={p.id} className="space-y-2">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="text-sm font-semibold">{p.name}</p>
                    <p className="text-xs text-muted-foreground">{stockoutDays} days until out of stock</p>
                  </div>
                  <Badge 
                    variant={riskLevel === 'high' ? 'destructive' : riskLevel === 'medium' ? 'warning' : 'secondary'}
                    className="text-[10px]"
                  >
                    {riskLevel === 'high' ? 'CRITICAL' : riskLevel === 'medium' ? 'WARNING' : 'STABLE'}
                  </Badge>
                </div>
                <Progress value={Math.min(100, (stockoutDays / 14) * 100)} className="h-1.5" />
                <div className="flex justify-between text-[10px] text-muted-foreground italic">
                  <span>Avg Sales: {p.avg_daily_sales || 0}/day</span>
                  <span>Stock: {p.quantity}</span>
                </div>
              </div>
            )
          })}
          {products.length === 0 && (
            <div className="col-span-full py-8 text-center text-muted-foreground flex flex-col items-center gap-2">
              <Info className="h-8 w-8 opacity-20" />
              <p className="text-sm">Not enough sales data to generate forecasts yet.</p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
