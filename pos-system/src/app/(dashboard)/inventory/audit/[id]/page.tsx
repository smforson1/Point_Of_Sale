'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { Badge } from '@/components/ui/badge'
import { 
  ChevronLeft, 
  Save, 
  CheckCircle, 
  AlertTriangle,
  Loader2,
  RefreshCw,
  Search,
  Package
} from 'lucide-react'
import Link from 'next/link'
import { toast } from 'react-hot-toast'
import { Checkbox } from '@/components/ui/checkbox'

export default function AuditDetailsPage() {
  const { id } = useParams()
  const router = useRouter()
  const supabase = createClient()
  const [loading, setLoading] = useState(true)
  const [audit, setAudit] = useState<any>(null)
  const [items, setItems] = useState<any[]>([])
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [updateInventory, setUpdateInventory] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')

  const fetchData = async () => {
    setLoading(true)
    try {
      const { data: auditData, error: auditError } = await supabase
        .from('inventory_audits')
        .select('*, profiles(full_name)')
        .eq('id', id)
        .single()

      if (auditError) throw auditError
      setAudit(auditData)

      const { data: itemsData, error: itemsError } = await supabase
        .from('inventory_audit_items')
        .select('*, products(name, sku, category)')
        .eq('audit_id', id)
        .order('created_at')

      if (itemsError) throw itemsError
      setItems(itemsData)
    } catch (error: any) {
      toast.error('Failed to load audit details')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (id) fetchData()
  }, [id])

  const handleUpdateQuantity = (idx: number, val: string) => {
    const newVal = parseInt(val) || 0
    const newItems = [...items]
    newItems[idx] = { 
      ...newItems[idx], 
      actual_quantity: newVal,
      discrepancy: newVal - newItems[idx].expected_quantity
    }
    setItems(newItems)
  }

  const handleSaveProgress = async () => {
    setIsSubmitting(true)
    try {
      for (const item of items) {
        const { error } = await supabase
          .from('inventory_audit_items')
          .update({ actual_quantity: item.actual_quantity })
          .eq('id', item.id)
        if (error) throw error
      }
      toast.success('Audit progress saved')
    } catch (error: any) {
      toast.error('Failed to save progress')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleCompleteAudit = async () => {
    setIsSubmitting(true)
    try {
      // 1. Save all items
      await handleSaveProgress()

      // 2. Finalize status
      const { error: poError } = await supabase
        .from('inventory_audits')
        .update({ 
          status: 'COMPLETED',
          completed_at: new Date().toISOString()
        })
        .eq('id', id)

      if (poError) throw poError

      // 3. Update inventory if requested
      if (updateInventory) {
        for (const item of items) {
          const { error: invError } = await supabase
            .from('products')
            .update({ quantity: item.actual_quantity })
            .eq('id', item.product_id)
          if (invError) throw invError
        }
      }

      toast.success('Audit completed successfully')
      router.push('/inventory/audit')
    } catch (error: any) {
      toast.error('Failed to complete audit')
    } finally {
      setIsSubmitting(false)
    }
  }

  const filteredItems = items.filter(item => 
    item.products.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.products.sku?.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const totalDiscrepancy = items.reduce((sum, item) => sum + Math.abs(item.discrepancy), 0)
  const itemsWithDiscrepancies = items.filter(i => i.discrepancy !== 0).length

  if (loading) {
    return (
      <div className="flex h-96 items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-20">
      <div className="flex flex-col gap-4">
        <Button variant="ghost" asChild className="w-fit -ml-2">
          <Link href="/inventory/audit" className="flex items-center gap-2 text-muted-foreground">
            <ChevronLeft className="h-4 w-4" />
            Back to Audits
          </Link>
        </Button>
        
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex flex-col gap-2">
            <div className="flex items-center gap-2">
               <h1 className="text-3xl font-bold tracking-tight">Stock Count</h1>
               <Badge className={audit.status === 'COMPLETED' ? 'bg-green-100 text-green-700' : 'bg-blue-100 text-blue-700'}>
                 {audit.status}
               </Badge>
            </div>
            <p className="text-muted-foreground">
              Conducted by {audit.profiles?.full_name} on {new Date(audit.started_at).toLocaleDateString()}
            </p>
          </div>
          
          {audit.status === 'PENDING' && (
            <div className="flex gap-2">
              <Button variant="outline" onClick={handleSaveProgress} disabled={isSubmitting}>
                <Save className="mr-2 h-4 w-4" /> Save Draft
              </Button>
              <Button onClick={handleCompleteAudit} disabled={isSubmitting} className="bg-green-600 hover:bg-green-700">
                <CheckCircle className="mr-2 h-4 w-4" /> Complete Audit
              </Button>
            </div>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="md:col-span-2">
          <CardHeader>
             <div className="flex items-center justify-between gap-4">
               <CardTitle>Reconciliation List</CardTitle>
               <div className="relative w-48 sm:w-64">
                <Search className="absolute left-2 top-2 h-3.5 w-3.5 text-muted-foreground" />
                <Input
                  placeholder="Filter products..."
                  className="h-8 pl-8 text-xs"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
               </div>
             </div>
          </CardHeader>
          <CardContent>
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Product</TableHead>
                    <TableHead className="text-center w-24">Expected</TableHead>
                    <TableHead className="text-center w-32">Actual</TableHead>
                    <TableHead className="text-center w-20">Diff</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredItems.map((item, idx) => (
                    <TableRow key={item.id} className={item.discrepancy !== 0 ? 'bg-red-50/30' : ''}>
                      <TableCell>
                        <div className="font-medium text-sm">{item.products.name}</div>
                        <div className="text-[10px] text-muted-foreground font-mono">{item.products.sku || 'No SKU'}</div>
                      </TableCell>
                      <TableCell className="text-center font-bold text-muted-foreground">{item.expected_quantity}</TableCell>
                      <TableCell className="text-center">
                        <Input
                          type="number"
                          value={item.actual_quantity}
                          onChange={(e) => handleUpdateQuantity(idx, e.target.value)}
                          className="h-8 text-center"
                          disabled={audit.status !== 'PENDING'}
                        />
                      </TableCell>
                      <TableCell className="text-center">
                         <span className={item.discrepancy < 0 ? 'text-red-600 font-bold' : item.discrepancy > 0 ? 'text-green-600 font-bold' : 'text-gray-400'}>
                             {item.discrepancy > 0 ? `+${item.discrepancy}` : item.discrepancy}
                         </span>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Audit Summary</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex justify-between items-center text-sm">
                <span className="text-muted-foreground">Total Products</span>
                <span className="font-bold">{items.length}</span>
              </div>
              <div className="flex justify-between items-center text-sm">
                <span className="text-muted-foreground">Discrepancies Found</span>
                <span className={itemsWithDiscrepancies > 0 ? 'text-orange-600 font-bold' : 'text-green-600 font-bold'}>
                  {itemsWithDiscrepancies} items
                </span>
              </div>
              <div className="flex justify-between items-center text-sm">
                <span className="text-muted-foreground">Total Units Delta</span>
                <span className={totalDiscrepancy !== 0 ? 'text-red-600 font-bold' : 'text-green-600 font-bold'}>
                  {totalDiscrepancy} units
                </span>
              </div>
              
              <Separator />

              {audit.status === 'PENDING' && (
                <div className="space-y-4 pt-2">
                  <div className="flex items-start space-x-2 bg-muted/50 p-3 rounded-lg">
                    <Checkbox 
                      id="update-inventory" 
                      checked={updateInventory}
                      onCheckedChange={(checked: boolean) => setUpdateInventory(checked)}
                    />
                    <div className="grid gap-1.5 leading-none">
                      <label 
                        htmlFor="update-inventory" 
                        className="text-[11px] font-medium leading-none cursor-pointer"
                      >
                        Sync Inventory on Completion
                      </label>
                      <p className="text-[10px] text-muted-foreground">
                        Updates main product stock levels to match your physical count.
                      </p>
                    </div>
                  </div>
                  
                  {itemsWithDiscrepancies > 0 && (
                    <div className="flex items-center gap-2 p-2 bg-orange-50 border border-orange-100 rounded text-orange-700 text-[10px]">
                      <AlertTriangle className="h-4 w-4 shrink-0" />
                      Attention: Your count has {itemsWithDiscrepancies} mismatches.
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
