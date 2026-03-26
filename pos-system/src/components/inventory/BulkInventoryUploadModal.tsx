'use client'

import { useState, useRef } from 'react'
import ExcelJS from 'exceljs'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { toast } from 'react-hot-toast'
import { FileUp, Download, Loader2, AlertCircle, CheckCircle2 } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { productSchema } from '@/lib/validations'

interface BulkInventoryUploadModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
}

export function BulkInventoryUploadModal({
  isOpen,
  onClose,
  onSuccess,
}: BulkInventoryUploadModalProps) {
  const [isUploading, setIsUploading] = useState(false)
  const [progress, setProgress] = useState(0)
  const [error, setError] = useState<string | null>(null)
  const [results, setResults] = useState<{ success: number; failed: number } | null>(null)
  const [uploadMode, setUploadMode] = useState<'restock' | 'overwrite'>('restock')
  const fileInputRef = useRef<HTMLInputElement>(null)
  const supabase = createClient()

  const downloadTemplate = async () => {
    const workbook = new ExcelJS.Workbook()
    const worksheet = workbook.addWorksheet('Inventory Template')

    worksheet.columns = [
      { header: 'Product Name*', key: 'name', width: 30 },
      { header: 'Category*', key: 'category', width: 15 },
      { header: 'Price*', key: 'price', width: 12 },
      { header: 'Cost Price', key: 'cost_price', width: 12 },
      { header: 'Initial Stock*', key: 'quantity', width: 15 },
      { header: 'Barcode', key: 'barcode', width: 20 },
      { header: 'SKU', key: 'sku', width: 15 },
      { header: 'Low Stock Level', key: 'low_stock_threshold', width: 15 },
      { header: 'Description', key: 'description', width: 40 },
    ]

    // Add sample row
    worksheet.addRow({
      name: 'Sample Product',
      category: 'General',
      price: 10.00,
      cost_price: 7.00,
      quantity: 100,
      barcode: '1234567890',
      sku: 'SKU-001',
      low_stock_threshold: 10,
      description: 'A sample product description'
    })

    // Style the header
    worksheet.getRow(1).font = { bold: true }
    worksheet.getRow(1).fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FFE0E0E0' }
    }

    const buffer = await workbook.xlsx.writeBuffer()
    const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = 'inventory_upload_template.xlsx'
    link.click()
    URL.revokeObjectURL(url)
  }

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setIsUploading(true)
    setProgress(0)
    setError(null)
    setResults(null)

    try {
      const workbook = new ExcelJS.Workbook()
      const arrayBuffer = await file.arrayBuffer()
      await workbook.xlsx.load(arrayBuffer)
      const worksheet = workbook.getWorksheet(1)
      
      if (!worksheet) throw new Error('Could not find worksheet in Excel file')

      const products: any[] = []
      const rows = worksheet.rowCount
      
      // Map columns based on headers
      const headers: Record<string, number> = {}
      worksheet.getRow(1).eachCell((cell, colNumber) => {
        const header = cell.value?.toString().toLowerCase().replace('*', '').trim()
        if (header) headers[header] = colNumber
      })

      // Required fields validation
      const required = ['product name', 'category', 'price', 'initial stock']
      const missing = required.filter(r => !headers[r])
      if (missing.length > 0) {
        throw new Error(`Missing required columns: ${missing.join(', ')}`)
      }

      const productsList: any[] = []
      for (let i = 2; i <= rows; i++) {
        const row = worksheet.getRow(i)
        const name = row.getCell(headers['product name']).value?.toString()
        if (!name) continue

        const product = {
          name: name,
          category: row.getCell(headers['category']).value?.toString() || 'General',
          price: Number(row.getCell(headers['price']).value) || 0,
          cost_price: Number(row.getCell(headers['cost price']).value) || 0,
          quantity: Number(row.getCell(headers['initial stock']).value) || 0,
          barcode: row.getCell(headers['barcode']).value?.toString() || null,
          sku: row.getCell(headers['sku']).value?.toString() || null,
          low_stock_threshold: Number(row.getCell(headers['low stock level']).value) || 5,
          description: row.getCell(headers['description']).value?.toString() || '',
          is_active: true,
          variants: []
        }
        
        productsList.push(product)
      }

      // Group products by barcode/sku to handle duplicates in the Excel itself
      const groupedProducts: Record<string, any> = {}
      for (const p of productsList) {
        const key = p.barcode || p.sku || p.name
        if (groupedProducts[key]) {
          groupedProducts[key].quantity += p.quantity
        } else {
          groupedProducts[key] = { ...p }
        }
      }

      const uniqueProducts = Object.values(groupedProducts)
      setProgress(30)

      if (uniqueProducts.length === 0) throw new Error('No valid products found in Excel file')

      // Fetch existing products to handle restocking
      const barcodes = uniqueProducts.filter(p => p.barcode).map(p => p.barcode)
      const skus = uniqueProducts.filter(p => p.sku).map(p => p.sku)
      
      const { data: existingProducts } = await supabase
        .from('products')
        .select('id, barcode, sku, quantity')
        .or(`barcode.in.(${barcodes.join(',')}),sku.in.(${skus.join(',')})`)

      const existingMap: Record<string, { id: string; quantity: number }> = {}
      existingProducts?.forEach(p => {
        if (p.barcode) existingMap[p.barcode] = { id: p.id, quantity: p.quantity }
        if (p.sku) existingMap[p.sku] = { id: p.id, quantity: p.quantity }
      })

      // Update products with IDs and new quantities if they exist
      const finalProducts = uniqueProducts.map(p => {
        const existing = (p.barcode && existingMap[p.barcode]) || (p.sku && existingMap[p.sku])
        if (existing) {
          return {
            ...p,
            id: existing.id,
            quantity: uploadMode === 'restock' ? existing.quantity + p.quantity : p.quantity
          }
        }
        return p
      })

      // Batch upload to Supabase using upsert
      const chunkSize = 50
      let successCount = 0
      let failedCount = 0

      for (let i = 0; i < finalProducts.length; i += chunkSize) {
        const chunk = finalProducts.slice(i, i + chunkSize)
        const { error: uploadError } = await supabase.from('products').upsert(chunk, { onConflict: 'id' as any })
        
        if (uploadError) {
          console.error('Upload Error:', uploadError)
          failedCount += chunk.length
        } else {
          successCount += chunk.length
        }
        
        const uploadProgress = 30 + Math.round(((i + chunk.length) / finalProducts.length) * 70)
        setProgress(uploadProgress)
      }

      setResults({ success: successCount, failed: failedCount })
      if (failedCount === 0) {
        toast.success(`Successfully processed ${successCount} products!`)
        onSuccess()
      } else if (successCount > 0) {
        toast.error(`Processed ${successCount} products, but ${failedCount} failed.`)
        onSuccess()
      } else {
        throw new Error('All products failed to upload.')
      }

    } catch (err: any) {
      setError(err.message || 'An error occurred during upload')
      toast.error(err.message || 'Upload failed')
    } finally {
      setIsUploading(false)
      if (fileInputRef.current) fileInputRef.current.value = ''
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Bulk Inventory Upload</DialogTitle>
          <DialogDescription>
            Upload an Excel file (.xlsx) to add multiple products to your inventory at once.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          <div className="grid grid-cols-2 gap-4">
            <Button
              variant="outline"
              className="flex flex-col h-24 gap-2 border-dashed border-2 hover:border-primary hover:bg-primary/5"
              onClick={downloadTemplate}
            >
              <Download className="h-6 w-6 text-muted-foreground" />
              <span className="text-xs font-bold uppercase tracking-wide">Download Template</span>
            </Button>
            
            <Button
              variant="outline"
              className={`flex flex-col h-24 gap-2 border-dashed border-2 transition-all relative overflow-hidden ${
                isUploading ? 'bg-muted' : 'blink-on-hover hover:border-primary hover:bg-primary/5'
              }`}
              disabled={isUploading}
            >
              <FileUp className={`h-6 w-6 ${isUploading ? 'animate-bounce' : 'text-muted-foreground'}`} />
              <span className="text-xs font-bold uppercase tracking-wide">{isUploading ? 'Uploading...' : 'Select Excel File'}</span>
              <input
                type="file"
                ref={fileInputRef}
                className="absolute inset-0 opacity-0 cursor-pointer"
                accept=".xlsx"
                onChange={handleFileUpload}
                disabled={isUploading}
              />
            </Button>
          </div>

          <div className="p-4 rounded-xl border bg-card/60 space-y-4 shadow-sm">
            <h4 className="text-xs font-bold uppercase tracking-widest text-primary flex items-center gap-2">
              <AlertCircle className="h-3 w-3" />
              Stock Handling Mode
            </h4>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setUploadMode('restock')}
                className={`p-3 rounded-lg border text-left transition-all ${
                  uploadMode === 'restock' 
                    ? 'border-primary bg-primary/10 ring-1 ring-primary' 
                    : 'border-border bg-muted/20 hover:bg-muted/50'
                }`}
              >
                <p className="text-sm font-bold">Restock (Add)</p>
                <p className="text-[10px] text-muted-foreground">Add Excel amount to your current inventory</p>
              </button>
              <button
                type="button"
                onClick={() => setUploadMode('overwrite')}
                className={`p-3 rounded-lg border text-left transition-all ${
                  uploadMode === 'overwrite' 
                    ? 'border-orange-500 bg-orange-500/10 ring-1 ring-orange-500' 
                    : 'border-border bg-muted/20 hover:bg-muted/50'
                }`}
              >
                <p className="text-sm font-bold">Overwrite (Set)</p>
                <p className="text-[10px] text-muted-foreground italic">Set inventory exactly to what is in file</p>
              </button>
            </div>
          </div>

          {isUploading && (
            <div className="space-y-2">
              <div className="flex justify-between text-xs">
                <span>Processing products...</span>
                <span>{progress}%</span>
              </div>
              <Progress value={progress} className="h-2" />
            </div>
          )}

          {error && (
            <div className="flex items-center gap-2 p-3 rounded-lg bg-destructive/10 text-destructive text-sm">
              <AlertCircle className="h-4 w-4" />
              <p>{error}</p>
            </div>
          )}

          {results && (
            <div className="p-4 rounded-xl border bg-muted/30 space-y-3">
              <h4 className="text-sm font-semibold flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-green-500" />
                Upload Results
              </h4>
              <div className="grid grid-cols-2 gap-4">
                <div className="p-2 rounded bg-green-500/10 text-green-700 text-center">
                  <p className="text-lg font-bold">{results.success}</p>
                  <p className="text-[10px] uppercase font-bold">Successful</p>
                </div>
                <div className="p-2 rounded bg-red-500/10 text-red-700 text-center">
                  <p className="text-lg font-bold">{results.failed}</p>
                  <p className="text-[10px] uppercase font-bold">Failed</p>
                </div>
              </div>
              {results.failed > 0 && (
                <p className="text-[10px] text-muted-foreground text-center">
                  Failed items likely have duplicate Barcodes or SKUs that already exist in the database.
                </p>
              )}
            </div>
          )}

          <div className="text-[11px] text-muted-foreground bg-primary/5 p-3 rounded-lg space-y-1">
            <p className="font-bold uppercase text-[9px] text-primary">Instructions:</p>
            <ul className="list-disc pl-4 space-y-1">
              <li>Columns marked with * are mandatory.</li>
              <li>Price and Stock must be numeric values.</li>
              <li>Barcode and SKU help identify existing products.</li>
              <li>New products (unmatched barcode/sku) will be created automatically.</li>
              <li>Existing products will be updated based on your "Mode" selection above.</li>
            </ul>
          </div>
        </div>

        <DialogFooter>
          <Button variant="ghost" onClick={onClose} disabled={isUploading}>
            {results ? 'Close' : 'Cancel'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
