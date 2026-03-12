'use client'

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { formatCurrency } from '@/utils/formatCurrency'
import { formatDate } from '@/utils/formatDate'
import { Badge } from '@/components/ui/badge'

interface RecentSalesTableProps {
  sales: any[]
}

export function RecentSalesTable({ sales }: RecentSalesTableProps) {
  return (
    <Card className="col-span-4 lg:col-span-3 shadow-sm">
      <CardHeader>
        <CardTitle className="text-base font-semibold">Recent Transactions</CardTitle>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>ID</TableHead>
              <TableHead>Customer</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Date</TableHead>
              <TableHead className="text-right">Amount</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {sales.map((sale) => (
              <TableRow key={sale.id}>
                <TableCell className="font-medium text-xs font-mono uppercase">
                  {sale.id.slice(0, 8)}
                </TableCell>
                <TableCell>{sale.customers?.full_name || 'Walk-in'}</TableCell>
                <TableCell>
                  <Badge variant={sale.status === 'COMPLETED' ? 'success' : 'destructive'} className="text-[10px]">
                    {sale.status}
                  </Badge>
                </TableCell>
                <TableCell className="text-xs text-muted-foreground">
                  {formatDate(sale.created_at, 'dd/MM HH:mm')}
                </TableCell>
                <TableCell className="text-right font-bold">
                  {formatCurrency(sale.total_amount)}
                </TableCell>
              </TableRow>
            ))}
            {sales.length === 0 && (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                  No recent sales found
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  )
}
