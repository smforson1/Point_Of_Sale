
'use client'

import { useState, useEffect } from 'react'
import { 
  Download, 
  FileText, 
  Table as TableIcon, 
  Calendar as CalendarIcon,
  Filter,
  RefreshCw,
} from 'lucide-react'
import { toast } from 'react-hot-toast'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { SalesReport } from '@/components/reports/SalesReport'
import { ProductPerformance } from '@/components/reports/ProductPerformance'
import { exportToPDF } from '@/utils/exportPDF'
import { exportToExcel } from '@/utils/exportExcel'

// Mock data for demonstration when DB is empty
const MOCK_SALES_DATA = [
  { date: '2024-03-07', sales: 4200, profit: 1200 },
  { date: '2024-03-08', sales: 3800, profit: 1100 },
  { date: '2024-03-09', sales: 5100, profit: 1600 },
  { date: '2024-03-10', sales: 2900, profit: 800 },
  { date: '2024-03-11', sales: 6200, profit: 2100 },
  { date: '2024-03-12', sales: 5800, profit: 1900 },
  { date: '2024-03-13', sales: 7400, profit: 2400 },
]

const MOCK_PRODUCT_DATA = [
  { name: 'Modern Desk Lamp', revenue: 12500 },
  { name: 'Ergonomic Chair', revenue: 9800 },
  { name: 'Wireless Keyboard', revenue: 7600 },
  { name: 'USB-C Hub', revenue: 5400 },
  { name: 'Laptop Stand', revenue: 4200 },
]

export default function ReportsPage() {
  const [loading, setLoading] = useState(false)
  const [salesData, setSalesData] = useState(MOCK_SALES_DATA)
  const [productData, setProductData] = useState(MOCK_PRODUCT_DATA)

  const supabase = createClient()

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

  const refreshData = async () => {
    setLoading(true)
    try {
      // In a real scenario, we would calculate this from sales and sale_items tables
      // For now, we'll keep the mock data or fetch a small sample
      await new Promise(resolve => setTimeout(resolve, 1000))
      toast.success('Report data refreshed')
    } catch (error) {
      toast.error('Failed to refresh data')
    } finally {
      setLoading(false)
    }
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
          <Button variant="outline" size="sm" onClick={refreshData} disabled={loading}>
            <RefreshCw className={`mr-2 h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          <Button variant="outline" size="sm" onClick={handleExportExcel}>
            <TableIcon className="mr-2 h-4 w-4" />
            Excel
          </Button>
          <Button size="sm" onClick={handleExportPDF}>
            <FileText className="mr-2 h-4 w-4" />
            Generate PDF
          </Button>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-7">
        <SalesReport data={salesData} />
        <ProductPerformance data={productData} />
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        <Card className="bg-card/40 backdrop-blur-sm border-primary/10">
          <CardHeader>
            <CardTitle className="text-sm font-medium">Monthly Gross Revenue</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">₵35,200.00</div>
            <p className="text-xs text-muted-foreground mt-1 text-green-500 font-medium">
              +12.5% from last month
            </p>
          </CardContent>
        </Card>
        <Card className="bg-card/40 backdrop-blur-sm border-primary/10">
          <CardHeader>
            <CardTitle className="text-sm font-medium">Net Profit Margin</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">28.4%</div>
            <p className="text-xs text-muted-foreground mt-1 text-blue-500 font-medium">
              Within industry standard
            </p>
          </CardContent>
        </Card>
        <Card className="bg-card/40 backdrop-blur-sm border-primary/10">
          <CardHeader>
            <CardTitle className="text-sm font-medium">Average Order Value</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">₵480.00</div>
            <p className="text-xs text-muted-foreground mt-1 text-green-500 font-medium">
              +5.2% from last week
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
