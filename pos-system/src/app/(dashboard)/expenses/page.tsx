'use client'

import { ExpenseTable } from '@/components/expenses/ExpenseTable'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Wallet } from 'lucide-react'

export default function ExpensesPage() {
  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold tracking-tight">Expenses</h1>
        <p className="text-muted-foreground">
          Track your store costs and overheads to monitor your business health.
        </p>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Wallet className="h-5 w-5 text-primary" />
            <CardTitle>Management</CardTitle>
          </div>
          <CardDescription>
            A record of all your business expenditures.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ExpenseTable />
        </CardContent>
      </Card>
    </div>
  )
}
