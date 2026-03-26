'use client'

import { AuditList } from '@/components/inventory/AuditList'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { ClipboardCheck, Plus, Loader2 } from 'lucide-react'
import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { useAuthStore } from '@/store/authStore'
import { toast } from 'react-hot-toast'

export default function InventoryAuditPage() {
  const [isStarting, setIsStarting] = useState(false)
  const { profile } = useAuthStore()
  const supabase = createClient()
  const router = useRouter()

  const handleStartAudit = async () => {
    if (!profile) return
    setIsStarting(true)
    try {
      // 1. Create a new audit header
      const { data: audit, error: auditError } = await supabase
        .from('inventory_audits')
        .insert([{
          user_id: profile.id,
          status: 'PENDING'
        }])
        .select()
        .single()

      if (auditError) throw auditError

      // 2. Snaphot current stock for all products
      const { data: products, error: productsError } = await supabase
        .from('products')
        .select('id, quantity')
        .eq('is_active', true)

      if (productsError) throw productsError

      // 3. Create items for the audit
      const auditItems = products.map(p => ({
        audit_id: audit.id,
        product_id: p.id,
        expected_quantity: p.quantity,
        actual_quantity: p.quantity, // Default to expected, user will override
      }))

      const { error: itemsError } = await supabase
        .from('inventory_audit_items')
        .insert(auditItems)

      if (itemsError) throw itemsError

      toast.success('Audit session started')
      router.push(`/inventory/audit/${audit.id}`)
    } catch (error: any) {
      toast.error(error.message || 'Failed to start audit')
    } finally {
      setIsStarting(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex flex-col gap-2">
          <h1 className="text-3xl font-bold tracking-tight">Inventory Audit</h1>
          <p className="text-muted-foreground">
            Perform stock counts and reconcile physical inventory with the app.
          </p>
        </div>
        <Button onClick={handleStartAudit} disabled={isStarting}>
          {isStarting ? (
             <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
             <Plus className="mr-2 h-4 w-4" />
          )}
          New Stock Count
        </Button>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <ClipboardCheck className="h-5 w-5 text-primary" />
            <CardTitle>Recent Counts</CardTitle>
          </div>
          <CardDescription>
            History of all stock reconciliation sessions.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <AuditList />
        </CardContent>
      </Card>
    </div>
  )
}
