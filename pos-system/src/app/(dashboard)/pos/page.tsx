import { ProductGrid } from '@/components/pos/ProductGrid'
import { CartPanel } from '@/components/pos/CartPanel'

export default function POSPage() {
  return (
    <div className="flex flex-col h-[calc(100vh-130px)] md:flex-row gap-6">
      <div className="flex-1 h-full min-h-0">
        <div className="h-full flex flex-col bg-white rounded-lg border shadow-sm p-4">
          <header className="mb-4">
            <h1 className="text-2xl font-bold tracking-tight">Point of Sale</h1>
            <p className="text-sm text-muted-foreground">Select products to add them to the sale</p>
          </header>
          <div className="flex-1 min-h-0">
            <ProductGrid />
          </div>
        </div>
      </div>
      
      <div className="w-full md:w-[400px] shrink-0 h-full">
        <CartPanel />
      </div>
    </div>
  )
}
