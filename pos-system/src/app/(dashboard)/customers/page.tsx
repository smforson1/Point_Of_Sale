
'use client'

import { useState, useEffect } from 'react'
import { Users, Trophy, UserPlus, Star } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { CustomerTable } from '@/components/customers/CustomerTable'

export default function CustomersPage() {
  const [stats, setStats] = useState({
    totalCustomers: 0,
    goldTier: 0,
    totalPoints: 0,
  })
  const supabase = createClient()

  useEffect(() => {
    async function fetchStats() {
      const { data: customers } = await supabase
        .from('customers')
        .select('tier, loyalty_points')
      
      if (customers) {
        setStats({
          totalCustomers: customers.length,
          goldTier: customers.filter(c => c.tier === 'GOLD').length,
          totalPoints: customers.reduce((acc, c) => acc + (c.loyalty_points || 0), 0),
        })
      }
    }
    fetchStats()
  }, [supabase])

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Customer Database</h1>
          <p className="text-muted-foreground text-lg">
            Manage your customers and loyalty programs.
          </p>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card className="bg-card/40 backdrop-blur-sm border-primary/10">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Total Customers</CardTitle>
            <Users className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalCustomers}</div>
          </CardContent>
        </Card>
        <Card className="bg-card/40 backdrop-blur-sm border-primary/10">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Gold Tier</CardTitle>
            <Star className="h-4 w-4 text-yellow-500 fill-yellow-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.goldTier}</div>
          </CardContent>
        </Card>
        <Card className="bg-card/40 backdrop-blur-sm border-primary/10">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Total Loyalty Points</CardTitle>
            <Trophy className="h-4 w-4 text-orange-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalPoints}</div>
          </CardContent>
        </Card>
      </div>

      <div className="rounded-xl border bg-card/40 backdrop-blur-sm p-6">
        <div className="flex items-center gap-2 mb-6">
          <UserPlus className="h-5 w-5 text-primary" />
          <h2 className="text-xl font-semibold">Active Customers</h2>
        </div>
        <CustomerTable />
      </div>
    </div>
  )
}
