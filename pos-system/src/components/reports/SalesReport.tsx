
'use client'

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts'
import { formatCurrency } from '@/utils/formatCurrency'

interface SalesReportProps {
  data: { date: string; sales: number; profit: number }[]
}

export function SalesReport({ data }: SalesReportProps) {
  return (
    <Card className="col-span-4 bg-card/40 backdrop-blur-sm border-primary/10">
      <CardHeader>
        <CardTitle className="text-xl font-bold">Sales & Profit Trends</CardTitle>
        <CardDescription>Visualizing business growth over time.</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="h-[350px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="colorSales" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#2563eb" stopOpacity={0.1}/>
                  <stop offset="95%" stopColor="#2563eb" stopOpacity={0}/>
                </linearGradient>
                <linearGradient id="colorProfit" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10b981" stopOpacity={0.1}/>
                  <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
              <XAxis 
                dataKey="date" 
                stroke="#888888" 
                fontSize={12} 
                tickLine={false} 
                axisLine={false} 
              />
              <YAxis 
                stroke="#888888" 
                fontSize={12} 
                tickLine={false} 
                axisLine={false} 
                tickFormatter={(value) => `₵${value}`}
              />
              <Tooltip 
                contentStyle={{ 
                  borderRadius: '12px', 
                  border: '1px solid rgba(0,0,0,0.05)', 
                  boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)' 
                }}
                formatter={((value: any, name: any) => [
                  formatCurrency(Number(value) || 0), 
                  String(name || '').charAt(0).toUpperCase() + String(name || '').slice(1)
                ]) as any}
              />
              <Area 
                type="monotone" 
                dataKey="sales" 
                stroke="#2563eb" 
                fillOpacity={1} 
                fill="url(#colorSales)" 
                strokeWidth={3}
              />
              <Area 
                type="monotone" 
                dataKey="profit" 
                stroke="#10b981" 
                fillOpacity={1} 
                fill="url(#colorProfit)" 
                strokeWidth={3}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  )
}
