'use client'

import { useState, useEffect } from 'react'
import { 
  Download, 
  FileText, 
  Table as TableIcon, 
  RefreshCw,
  TrendingUp,
  TrendingDown,
  DollarSign,
  Users
} from 'lucide-react'
import { toast } from 'react-hot-toast'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { SalesReport } from '@/components/reports/SalesReport'
import { ProductPerformance } from '@/components/reports/ProductPerformance'
import { exportToPDF } from '@/utils/exportPDF'
import { exportToExcel } from '@/utils/exportExcel'
import { ExpenseManagementModal } from '@/components/pos/ExpenseManagementModal'
import { formatCurrency } from '@/utils/formatCurrency'

// Mock data fallback
const MOCK_SALES_DATA = [
  { date: '2024-03-07', sales: 4200, profit: 1200 },
  { date: '2024-03-08', sales: 3800, profit: 1100 },
  { date: '2024-03-09', sales: 5100, profit: 1600 },
  { date: '2024-03-10', sales: 2900, profit: 800 },
  { date: '2024-03-11', sales: 6200, profit: 2100 },
  { date: '2024-03-12', sales: 5800, profit: 1900 },
  { date: '2024-03-13', sales: 7400, profit: 2400 },
]

export default function ReportsPage() {
  const [loading, setLoading] = useState(false)
  const [salesData, setSalesData] = useState(MOCK_SALES_DATA)
  const [productData, setProductData] = useState([])
  const [totalExpenses, setTotalExpenses] = useState(0)
  const [isExpenseModalOpen, setIsExpenseModalOpen] = useState(false)
  const [leaderboard, setLeaderboard] = useState<any[]>([])
  const [stats, setStats] = useState({
    monthlyRevenue: 0,
    netProfit: 0,
    avgOrderValue: 0
  })

  const supabase = createClient()

  const fetchData = async () => {
    setLoading(true)
    try {
      const startDate = new Date()
      startDate.setDate(startDate.getDate() - 30)
      
      // 1. Fetch Sales
      const { data: sales } = await supabase
        .from('sales')
        .select(`
          *,
          profiles:user_id (full_name)
        `)
        .gte('created_at', startDate.toISOString())
      
      // 2. Fetch Expenses
      const { data: expenses } = await supabase
        .from('expenses')
        .select('amount')
        .gte('expense_date', startDate.toISOString().split('T')[0])
      
      const totalRev = sales?.reduce((sum, s) => sum + Number(s.total_amount), 0) || 0
      const totalExp = expenses?.reduce((sum, e) => sum + Number(e.amount), 0) || 0
      
      // Calculate simplistic profit (Total Rev - Total Exp - Estimated COGS 60% of Revenue if cost_price is missing)
      // For now, let's keep it simple: Revenue - Expenses. 
      // If we had COGS data, we'd subtract that too.
      const netProfit = totalRev - totalExp
      
      setStats({
        monthlyRevenue: totalRev,
        netProfit: netProfit,
        avgOrderValue: sales?.length ? totalRev / sales.length : 0
      })
      setTotalExpenses(totalExp)

      // 3. Leaderboard calculation
      if (sales) {
        const staffMap: any = {}
        sales.forEach(s => {
          const name = s.profiles?.full_name || 'System'
          if (!staffMap[name]) staffMap[name] = { name, total: 0, count: 0 }
          staffMap[name].total += Number(s.total_amount)
          staffMap[name].count += 1
        })
        setLeaderboard(Object.values(staffMap).sort((a: any, b: any) => b.total - a.total))
      }

    } catch (error) {
      console.error(error)
      toast.error('Failed to load real data')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
  }, [])

  const handleExportPDF = () => {
    const headers = [['Date', 'Sales (₵)', 'Profit (₵)']]
    const data = salesData.map(d => [d.date, d.sales.toFixed(2), d.profit.toFixed(2)])
    exportToPDF('Sales Analysis Report', headers, data, 'sales-report.pdf')
    toast.success('PDF report generated')
  }

  const handleExportExcel = () => {
    const columns = [
      { header: 'Date', key: 'date', width: 15 },
      { header: 'Sales', key: 'sales', width: 15 },
      { header: 'Profit', key: 'profit', width: 15 },
    ]
    exportToExcel('Sales Analysis', columns, salesData, 'sales-report.xlsx')
    toast.success('Excel report generated')
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Business Intelligence</h1>
          <p className="text-muted-foreground text-lg">
            Analyze your store performance and financial health.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={fetchData} disabled={loading}>
            <RefreshCw className={`mr-2 h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          <Button variant="outline" size="sm" onClick={handleExportExcel}>
            <TableIcon className="mr-2 h-4 w-4" />
            Excel
          </Button>
          <Button size="sm" onClick={handleExportPDF}>
            <FileText className="mr-2 h-4 w-4" />
            PDF
          </Button>
          <Button size="sm" variant="secondary" onClick={() => setIsExpenseModalOpen(true)}>
            <Download className="mr-2 h-4 w-4 rotate-180" />
            Expenses
          </Button>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        <Card className="bg-card/40 backdrop-blur-sm border-primary/10">
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-black uppercase tracking-widest text-muted-foreground">Monthly Revenue</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-black">{formatCurrency(stats.monthlyRevenue)}</div>
            <div className="flex items-center gap-1 text-[10px] text-green-600 font-bold mt-1">
              <TrendingUp className="h-3 w-3" /> Live from Sale Records
            </div>
          </CardContent>
        </Card>
        
        <Card className="bg-card/40 backdrop-blur-sm border-primary/10">
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-black uppercase tracking-widest text-muted-foreground">Net Profit (Est.)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className={`text-3xl font-black ${stats.netProfit < 0 ? 'text-red-600' : 'text-primary'}`}>
              {formatCurrency(stats.netProfit)}
            </div>
            <div className="flex items-center gap-1 text-[10px] text-blue-600 font-bold mt-1">
              After {formatCurrency(totalExpenses)} in expenses
            </div>
          </CardContent>
        </Card>

        <Card className="bg-card/40 backdrop-blur-sm border-primary/10">
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-black uppercase tracking-widest text-muted-foreground">Avg. Order Value</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-black">{formatCurrency(stats.avgOrderValue)}</div>
            <div className="flex items-center gap-1 text-[10px] text-green-600 font-bold mt-1">
              <TrendingUp className="h-3 w-3" /> Efficiency Metric
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 md:grid-cols-7">
        <div className="md:col-span-4">
          <SalesReport data={salesData} />
        </div>
        <div className="md:col-span-3">
          <Card className="h-full">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5 text-primary" />
                Staff Performance
              </CardTitle>
              <CardDescription>Top sellers by revenue (Last 30 Days)</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {leaderboard.length === 0 ? (
                  <p className="text-center py-8 text-sm text-muted-foreground italic">No sales data yet to rank staff.</p>
                ) : (
                  leaderboard.map((staff, i) => (
                    <div key={i} className="flex items-center justify-between p-3 rounded-lg bg-muted/30 border border-transparent hover:border-primary/20 transition-all">
                      <div className="flex items-center gap-3">
                        <div className="h-6 w-6 rounded-full bg-primary/10 flex items-center justify-center text-[10px] font-black text-primary">
                          #{i + 1}
                        </div>
                        <div>
                          <p className="text-sm font-bold">{staff.name}</p>
                          <p className="text-[10px] text-muted-foreground lowercase">{staff.count} transactions</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-black">{formatCurrency(staff.total)}</p>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      <ExpenseManagementModal 
        isOpen={isExpenseModalOpen} 
        onClose={() => setIsExpenseModalOpen(false)} 
      />
    </div>
  )
}
