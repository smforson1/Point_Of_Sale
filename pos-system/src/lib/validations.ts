import * as z from 'zod'

export const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
})

export type LoginFormValues = z.infer<typeof loginSchema>

export const productSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  description: z.string().optional().or(z.literal('')),
  sku: z.string().optional().or(z.literal('')),
  barcode: z.string().optional().or(z.literal('')),
  category: z.string().min(1, 'Category is required'),
  price: z.coerce.number().min(0, 'Price must be 0 or greater'),
  cost_price: z.coerce.number().min(0, 'Cost price must be 0 or greater').optional(),
  quantity: z.coerce.number().int().min(0, 'Quantity must be 0 or greater'),
  low_stock_threshold: z.coerce.number().int().min(0, 'Threshold must be 0 or greater'),
  is_active: z.boolean().default(true),
})

export type ProductFormValues = z.infer<typeof productSchema>

export const customerSchema = z.object({
  full_name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email().optional().or(z.literal('')),
  phone: z.string().optional(),
  address: z.string().optional(),
})

export type CustomerFormValues = z.infer<typeof customerSchema>

export const supplierSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  contact_person: z.string().optional(),
  email: z.string().email().optional().or(z.literal('')),
  phone: z.string().optional(),
  address: z.string().optional(),
})

export type SupplierFormValues = z.infer<typeof supplierSchema>

export const saleSchema = z.object({
  customer_id: z.string().optional(),
  discount_amount: z.coerce.number().min(0).default(0),
  discount_type: z.enum(['FIXED', 'PERCENTAGE']).default('FIXED'),
  payment_method: z.enum(['CASH', 'MOBILE_MONEY', 'CARD']),
  amount_tendered: z.coerce.number().min(0).optional(),
})

export type SaleFormValues = z.infer<typeof saleSchema>

export const userSchema = z.object({
  email: z.string().email('Invalid email address'),
  full_name: z.string().min(2, 'Name must be at least 2 characters'),
  role: z.enum(['ADMIN', 'MANAGER', 'CASHIER']),
  password: z.string().min(6, 'Password must be at least 6 characters').optional(),
})

export type UserFormValues = z.infer<typeof userSchema>

export const settingsSchema = z.object({
  store_name: z.string().min(2, 'Store name is required'),
  store_address: z.string().optional(),
  store_phone: z.string().optional(),
  store_email: z.string().email().optional().or(z.literal('')),
  tax_rate: z.coerce.number().min(0).max(100),
  currency_code: z.string().default('GHS'),
  receipt_footer: z.string().optional(),
})

export type SettingsFormValues = z.infer<typeof settingsSchema>

export const stockAdjustmentSchema = z.object({
  type: z.enum(['ADD', 'REMOVE', 'SET']),
  quantity: z.coerce.number().int().min(1, 'Quantity must be at least 1'),
  reason: z.string().min(3, 'Reason is required'),
})

export type StockAdjustmentFormValues = z.infer<typeof stockAdjustmentSchema>
