
import { AuditLogsTable } from '@/components/audit-logs/AuditLogsTable'

export default function AuditLogsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Audit Logs</h1>
        <p className="text-muted-foreground text-lg">
          Monitor system changes and user activities.
        </p>
      </div>

      <div className="grid gap-6">
        <AuditLogsTable />
      </div>
    </div>
  )
}
