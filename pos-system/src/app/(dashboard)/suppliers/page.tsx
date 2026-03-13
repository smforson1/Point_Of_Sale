
import { SupplierTable } from '@/components/inventory/SupplierTable'

export default function SuppliersPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Suppliers</h1>
        <p className="text-muted-foreground text-lg">
          Manage your product suppliers.
        </p>
      </div>
      <SupplierTable />
    </div>
  )
}
