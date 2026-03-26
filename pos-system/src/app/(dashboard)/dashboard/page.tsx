'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { StatsCard } from '@/components/shared/StatsCard'
import { RevenueChart } from '@/components/dashboard/RevenueChart'
import { TopProductsChart } from '@/components/dashboard/TopProductsChart'
import { PaymentMethodChart } from '@/components/dashboard/PaymentMethodChart'
import { RecentSalesTable } from '@/components/dashboard/RecentSalesTable'
import { LowStockAlerts } from '@/components/dashboard/LowStockAlerts'
import { DemandForecast } from '@/components/dashboard/DemandForecast'
import { AIAnalyticsDashboard } from '@/components/dashboard/AIAnalyticsDashboard'
import { DollarSign, Package, ShoppingBag, Users, Loader2, ShieldCheck, UserCog, TrendingUp } from 'lucide-react'
import { formatCurrency } from '@/utils/formatCurrency'
import { useAuthStore } from '@/store/authStore'
import { Badge } from '@/components/ui/badge'

export default function DashboardPage() {
  const { profile, role } = useAuthStore()
  const isAdmin = role === 'ADMIN'
  const isManager = role === 'MANAGER'
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState({
    revenue: 0,
    netProfit: 0,
    salesCount: 0,
    customerCount: 0,
    productCount: 0,
  })
  const [revenueData, setRevenueData] = useState<any[]>([])
  const [topProducts, setTopProducts] = useState<any[]>([])
  const [paymentMethods, setPaymentMethods] = useState<any[]>([])
  const [recentSales, setRecentSales] = useState<any[]>([])
  const [stockAlerts, setStockAlerts] = useState<any[]>([])
  const [forecasts, setForecasts] = useState<any[]>([])

  const supabase = createClient()

  const fetchDashboardData = async () => {
    setLoading(true)
    
    // 1. Fetch Basic Stats
    const { data: sales } = await supabase.from('sales').select('total_amount')
    const { data: expenses } = await supabase.from('expenses').select('amount')
    const { count: productsCount } = await supabase.from('products').select('*', { count: 'exact', head: true })
    const { count: customersCount } = await supabase.from('customers').select('*', { count: 'exact', head: true })

    const totalRevenue = sales?.reduce((acc, s) => acc + Number(s.total_amount), 0) || 0
    const totalExpenses = expenses?.reduce((acc, e) => acc + Number(e.amount), 0) || 0

    setStats({
      revenue: totalRevenue,
      netProfit: totalRevenue - totalExpenses,
      salesCount: sales?.length || 0,
      customerCount: customersCount || 0,
      productCount: productsCount || 0,
    })

    // 2. Fetch Revenue Chart Data (aggregated by day) - 
    // In a real app we'd do this via RPC or complex query. Mocking aggregation logic for now.
    const { data: chartData } = await supabase
      .from('sales')
      .select('created_at, total_amount')
      .order('created_at', { ascending: true })
      .limit(100)
    
    // 3. Recent Sales
    const { data: recent } = await supabase
      .from('sales')
      .select('*, customers(full_name)')
      .order('created_at', { ascending: false })
      .limit(10)
    setRecentSales(recent || [])

    // 4. Low Stock
    const { data: alerts } = await supabase
      .from('products')
      .select('*')
      .lt('quantity', 10) // Fixed for demo, should use low_stock_threshold
      .limit(5)
    setStockAlerts(alerts || [])

    // 5. Mocked charts for variety
    setRevenueData([
      { date: '01/03', amount: 450 },
      { date: '05/03', amount: 820 },
      { date: '10/03', amount: 1250 },
      { date: '15/03', amount: 980 },
      { date: '20/03', amount: 1560 },
      { date: '25/03', amount: 2100 },
      { date: 'Today', amount: totalRevenue > 0 ? totalRevenue / 10 : 0 },
    ] as any)

    setTopProducts([
      { name: 'Gari Photo', total: 1200 },
      { name: 'Jollof Large', total: 950 },
      { name: 'Kelewele', total: 800 },
      { name: 'Malt (Can)', total: 600 },
      { name: 'Banku & Tilapia', total: 550 },
    ])

    setPaymentMethods([
      { name: 'Cash', value: 65 },
      { name: 'MoMo', value: 25 },
      { name: 'Card', value: 10 },
    ])

    setLoading(false)
  }

  useEffect(() => {
    fetchDashboardData()
  }, [supabase])

  if (loading) {
    return (
      <div className="h-[80vh] flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <header className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Dashboard Overview</h1>
          <p className="text-muted-foreground">
            Welcome back, <span className="font-semibold text-foreground">{profile?.full_name || 'there'}</span>! Here's what's happening today.
          </p>
        </div>
        <div className="flex items-center gap-2">
          {isAdmin && (
            <Badge className="gap-1.5 px-3 py-1 text-xs bg-violet-500/10 text-violet-600 dark:text-violet-400 border border-violet-500/30 hover:bg-violet-500/20">
              <ShieldCheck className="h-3.5 w-3.5" />
              Admin Access
            </Badge>
          )}
          {isManager && (
            <Badge className="gap-1.5 px-3 py-1 text-xs bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/30 hover:bg-blue-500/20">
              <UserCog className="h-3.5 w-3.5" />
              Manager Access
            </Badge>
          )}
        </div>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        <StatsCard
          title="Total Revenue"
          value={formatCurrency(stats.revenue)}
          icon={DollarSign}
          trend={{ value: 12.5, label: 'from last month', isPositive: true }}
        />
        <StatsCard
          title="Net Profit"
          value={formatCurrency(stats.netProfit)}
          icon={TrendingUp}
          className={stats.netProfit < 0 ? 'text-red-600' : 'text-green-600'}
        />
        <StatsCard
          title="Total Sales"
          value={stats.salesCount}
          icon={ShoppingBag}
          trend={{ value: 8.2, label: 'from last month', isPositive: true }}
        />
        <StatsCard
          title="Total Products"
          value={stats.productCount}
          icon={Package}
        />
        <StatsCard
          title="Active Customers"
          value={stats.customerCount}
          icon={Users}
          trend={{ value: 3.1, label: 'new this week', isPositive: true }}
        />
      </div>

      {(isAdmin || isManager) && (
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
           <AIAnalyticsDashboard />
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        <RevenueChart data={revenueData} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        <TopProductsChart data={topProducts} />
        <PaymentMethodChart data={paymentMethods} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        <RecentSalesTable sales={recentSales} onUpdate={fetchDashboardData} />
        <LowStockAlerts products={stockAlerts} />
      </div>

      {/* Admin-only: Demand Forecast & AI Insights */}
      {isAdmin && <DemandForecast products={[]} />}

      {/* Manager & Admin: Additional reporting note */}
      {(isAdmin || isManager) && (
        <div className="rounded-xl border border-dashed border-border p-6 text-center space-y-1">
          <p className="text-sm font-semibold">📊 Advanced Analytics</p>
          <p className="text-xs text-muted-foreground">
            Head to the <strong>Reports</strong> section for full sales breakdowns, product performance, and payment analysis.
          </p>
        </div>
      )}
    </div>
  )
}
