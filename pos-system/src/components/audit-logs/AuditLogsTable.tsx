
'use client'

import { useState, useEffect, useCallback } from 'react'
import {
  Search,
  History,
  Info,
  Package,
  User as UserIcon,
  ShoppingCart,
  Settings as SettingsIcon,
  CreditCard,
} from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { toast } from 'react-hot-toast'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { formatDate } from '@/utils/formatDate'
import type { AuditLog } from '@/types'

export function AuditLogsTable() {
  const [logs, setLogs] = useState<AuditLog[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const supabase = createClient()

  const fetchLogs = useCallback(async () => {
    setLoading(true)
    try {
      const { data, error } = await supabase
        .from('audit_logs')
        .select(`
          *,
          profiles (
            full_name,
            email
          )
        `)
        .order('created_at', { ascending: false })
        .limit(100)

      if (error) throw error
      setLogs(data || [])
    } catch (error: any) {
      toast.error(error.message || 'Failed to fetch audit logs')
    } finally {
      setLoading(false)
    }
  }, [supabase])

  useEffect(() => {
    fetchLogs()
  }, [fetchLogs])

  const filteredLogs = logs.filter((log) =>
    log.action.toLowerCase().includes(searchQuery.toLowerCase()) ||
    log.entity_type.toLowerCase().includes(searchQuery.toLowerCase()) ||
    log.profiles?.full_name?.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const getEntityIcon = (type: string) => {
    switch (type) {
      case 'PRODUCT':
        return <Package className="h-4 w-4" />
      case 'USER':
      case 'PROFILE':
        return <UserIcon className="h-4 w-4" />
      case 'SALE':
        return <ShoppingCart className="h-4 w-4" />
      case 'SETTINGS':
        return <SettingsIcon className="h-4 w-4" />
      case 'PAYMENT':
        return <CreditCard className="h-4 w-4" />
      default:
        return <Info className="h-4 w-4" />
    }
  }

  const getActionBadge = (action: string) => {
    if (action.includes('CREATE') || action.includes('ADD') || action.includes('INSERT')) {
      return <Badge className="bg-green-500/10 text-green-600 hover:bg-green-500/10 border-green-200">CREATED</Badge>
    }
    if (action.includes('UPDATE') || action.includes('EDIT') || action.includes('ADJUST')) {
      return <Badge className="bg-blue-500/10 text-blue-600 hover:bg-blue-500/10 border-blue-200">UPDATED</Badge>
    }
    if (action.includes('DELETE') || action.includes('REMOVE')) {
      return <Badge className="bg-red-500/10 text-red-600 hover:bg-red-500/10 border-red-200">DELETED</Badge>
    }
    return <Badge variant="secondary">{action}</Badge>
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search activity logs..."
            className="pl-9"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      <div className="rounded-xl border bg-card/60 backdrop-blur-sm overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Activity</TableHead>
              <TableHead>Entity</TableHead>
              <TableHead>User</TableHead>
              <TableHead>Date & Time</TableHead>
              <TableHead className="text-right">Details</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <TableRow key={i}>
                  <TableCell><div className="h-4 w-32 animate-pulse bg-muted rounded" /></TableCell>
                  <TableCell><div className="h-4 w-24 animate-pulse bg-muted rounded" /></TableCell>
                  <TableCell><div className="h-4 w-32 animate-pulse bg-muted rounded" /></TableCell>
                  <TableCell><div className="h-4 w-40 animate-pulse bg-muted rounded" /></TableCell>
                  <TableCell className="text-right"><div className="h-4 w-8 animate-pulse bg-muted rounded ml-auto" /></TableCell>
                </TableRow>
              ))
            ) : filteredLogs.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="h-32 text-center text-muted-foreground">
                  No activity logs found.
                </TableCell>
              </TableRow>
            ) : (
              filteredLogs.map((log) => (
                <TableRow key={log.id} className="group hover:bg-muted/50 transition-colors">
                  <TableCell>
                    <div className="flex flex-col gap-1">
                      {getActionBadge(log.action)}
                      <span className="text-xs font-mono text-muted-foreground">{log.action}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <div className="p-1.5 rounded-md bg-muted text-muted-foreground">
                        {getEntityIcon(log.entity_type)}
                      </div>
                      <div className="flex flex-col">
                        <span className="text-sm font-medium">{log.entity_type}</span>
                        <span className="text-[10px] text-muted-foreground font-mono">ID: {log.entity_id}</span>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-col">
                      <span className="text-sm font-medium">{log.profiles?.full_name || 'System'}</span>
                      <span className="text-xs text-muted-foreground">{log.profiles?.email || 'automated'}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="text-sm whitespace-nowrap">
                      {formatDate(log.created_at)}
                    </div>
                  </TableCell>
                  <TableCell className="text-right">
                    <Dialog>
                      <DialogTrigger asChild>
                        <Button variant="ghost" size="sm">View Diff</Button>
                      </DialogTrigger>
                      <DialogContent className="max-w-2xl">
                        <DialogHeader>
                          <DialogTitle>Audit Log Details</DialogTitle>
                        </DialogHeader>
                        <div className="grid grid-cols-2 gap-4 mt-4">
                          <div className="space-y-2">
                            <h4 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider text-[10px]">Previous State</h4>
                            <pre className="p-3 bg-muted rounded-md text-xs overflow-auto max-h-[300px]">
                              {JSON.stringify(log.old_data, null, 2)}
                            </pre>
                          </div>
                          <div className="space-y-2">
                            <h4 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider text-[10px]">New State</h4>
                            <pre className="p-3 bg-muted rounded-md text-xs overflow-auto max-h-[300px]">
                              {JSON.stringify(log.new_data, null, 2)}
                            </pre>
                          </div>
                        </div>
                      </DialogContent>
                    </Dialog>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}
