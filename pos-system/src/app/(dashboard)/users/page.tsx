
import { UserTable } from '@/components/users/UserTable'

export default function UsersPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Staff & Permissions</h1>
        <p className="text-muted-foreground text-lg">
          Manage system users and their access levels.
        </p>
      </div>

      <div className="grid gap-6">
        <UserTable />
      </div>
    </div>
  )
}
