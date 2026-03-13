'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Customer } from '@/types'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { toast } from 'react-hot-toast'
import { Wallet, Plus, ArrowUpRight, History, Loader2 } from 'lucide-react'
import { formatCurrency } from '@/utils/formatCurrency'

interface CustomerBalanceModalProps {
  isOpen: boolean
  onClose: () => void
  customer: Customer | null
  onSuccess?: () => void
}

export function CustomerBalanceModal({ isOpen, onClose, customer, onSuccess }: CustomerBalanceModalProps) {
  const [amount, setAmount] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const supabase = createClient()

  if (!customer) return null

  const handleDeposit = async () => {
    const depositAmount = parseFloat(amount)
    if (isNaN(depositAmount) || depositAmount <= 0) {
      toast.error('Enter a valid deposit amount')
      return
    }

    setIsLoading(true)
    try {
      // 1. Log Transaction
      const { error: txError } = await supabase
        .from('balance_transactions')
        .insert({
          customer_id: customer.id,
          amount: depositAmount,
          type: 'DEPOSIT',
          reference_id: 'MANUAL_DEPOSIT'
        })

      if (txError) throw txError

      // 2. Update Customer Balance
      const { error: custError } = await supabase
        .from('customers')
        .update({
          store_balance: (customer.store_balance || 0) + depositAmount
        })
        .eq('id', customer.id)

      if (custError) throw custError

      toast.success(`${formatCurrency(depositAmount)} added to ${customer.full_name}'s balance`)
      setAmount('')
      if (onSuccess) onSuccess()
      onClose()
    } catch (error: any) {
      toast.error('Failed to deposit: ' + error.message)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Wallet className="h-5 w-5 text-primary" />
            Manage Store Balance
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6 py-4">
          <div className="bg-primary/5 p-4 rounded-xl border border-primary/10">
            <p className="text-[10px] text-muted-foreground uppercase font-black tracking-widest mb-1 text-center">Current Balance</p>
            <h2 className="text-3xl font-black text-center text-primary">{formatCurrency(customer.store_balance || 0)}</h2>
            <p className="text-center text-xs text-muted-foreground mt-1">{customer.full_name}</p>
          </div>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="deposit-amount">Deposit Amount (₵)</Label>
              <div className="relative">
                <Input
                  id="deposit-amount"
                  type="number"
                  placeholder="0.00"
                  className="text-2xl h-14 pl-10 font-bold border-primary/30"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                />
                <div className="absolute left-3 top-1/2 -translate-y-1/2 font-bold text-muted-foreground text-xl">₵</div>
              </div>
            </div>

            <Button className="w-full h-12 text-lg font-bold shadow-lg" onClick={handleDeposit} disabled={isLoading}>
              {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Plus className="mr-2 h-5 w-5" />}
              Top Up Balance
            </Button>
          </div>

          <div className="pt-4 border-t">
            <Button variant="ghost" className="w-full text-xs text-muted-foreground" disabled>
              <History className="mr-2 h-3 w-3" /> Transaction history soon...
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
