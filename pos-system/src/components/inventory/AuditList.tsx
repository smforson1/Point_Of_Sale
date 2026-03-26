'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { InventoryAudit } from '@/types'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { 
  MoreHorizontal, 
  Eye, 
  CheckCircle, 
  Clock, 
  X,
  FileText
} from 'lucide-react'
import { format } from 'date-fns'
import Link from 'next/link'
import { toast } from 'react-hot-toast'

export function AuditList() {
  const [audits, setAudits] = useState<(InventoryAudit & { profiles: { full_name: string } })[]>([])
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  const fetchAudits = async () => {
    setLoading(true)
    const { data, error } = await supabase
      .from('inventory_audits')
      .select('*, profiles(full_name)')
      .order('started_at', { ascending: false })
      
    if (data) setAudits(data as any)
    if (error) toast.error('Failed to load audits')
    setLoading(false)
  }

  useEffect(() => {
    fetchAudits()
  }, [])

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'COMPLETED': return <Badge className="bg-green-100 text-green-700 hover:bg-green-100/80">Completed</Badge>
      case 'CANCELLED': return <Badge variant="destructive">Cancelled</Badge>
      default: return <Badge variant="secondary" className="bg-blue-100 text-blue-700">In Progress</Badge>
    }
  }

  return (
    <div className="rounded-md border border-border bg-card">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Audit ID</TableHead>
            <TableHead>Started By</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Date Started</TableHead>
            <TableHead>Date Completed</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {loading ? (
             Array.from({ length: 3 }).map((_, i) => (
                <TableRow key={i}>
                  <TableCell colSpan={6} className="h-12 animate-pulse bg-muted/20" />
                </TableRow>
             ))
          ) : audits.length > 0 ? (
            audits.map((audit) => (
              <TableRow key={audit.id}>
                <TableCell className="font-mono text-xs max-w-[100px] truncate">{audit.id}</TableCell>
                <TableCell>{audit.profiles?.full_name || 'Staff'}</TableCell>
                <TableCell>{getStatusBadge(audit.status)}</TableCell>
                <TableCell>{format(new Date(audit.started_at), 'MMM d, h:mm a')}</TableCell>
                <TableCell>
                  {audit.completed_at ? format(new Date(audit.completed_at), 'MMM d, h:mm a') : '-'}
                </TableCell>
                <TableCell className="text-right">
                   <Button variant="ghost" size="sm" asChild>
                      <Link href={`/inventory/audit/${audit.id}`}>
                        <Eye className="mr-2 h-4 w-4" /> 
                        {audit.status === 'PENDING' ? 'Resume' : 'View Report'}
                      </Link>
                   </Button>
                </TableCell>
              </TableRow>
            ))
          ) : (
            <TableRow>
              <TableCell colSpan={6} className="text-center py-10 text-muted-foreground">
                No inventory audits found.
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  )
}
