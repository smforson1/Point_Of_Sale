
'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from 'recharts'
import { formatCurrency } from '@/utils/formatCurrency'

interface ProductPerformanceProps {
  data: { name: string; revenue: number }[]
}

const COLORS = ['#2563eb', '#3b82f6', '#60a5fa', '#93c5fd', '#bfdbfe']

export function ProductPerformance({ data }: ProductPerformanceProps) {
  return (
    <Card className="col-span-3 bg-card/40 backdrop-blur-sm border-primary/10">
      <CardHeader>
        <CardTitle className="text-xl font-bold">Top Products by Revenue</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-[350px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data} layout="vertical" margin={{ top: 5, right: 30, left: 40, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} stroke="#f0f0f0" />
              <XAxis type="number" hide />
              <YAxis 
                dataKey="name" 
                type="category" 
                stroke="#888888" 
                fontSize={12} 
                tickLine={false} 
                axisLine={false}
                width={80}
              />
              <Tooltip 
                cursor={{ fill: 'rgba(240, 240, 240, 0.4)' }}
                contentStyle={{ 
                  borderRadius: '12px', 
                  border: '1px solid rgba(0,0,0,0.05)', 
                  boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)' 
                }}
                formatter={(value: any) => [formatCurrency(Number(value)), 'Revenue']}
              />
              <Bar dataKey="revenue" radius={[0, 4, 4, 0]} barSize={30}>
                {data.map((_, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  )
}
