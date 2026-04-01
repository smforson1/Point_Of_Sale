export enum UserRole {
  ADMIN = 'ADMIN',
  MANAGER = 'MANAGER',
  CASHIER = 'CASHIER',
}

export enum PaymentMethod {
  CASH = 'CASH',
  MOBILE_MONEY = 'MOBILE_MONEY',
  CARD = 'CARD',
  PAYSTACK = 'PAYSTACK',
}

export enum StockStatus {
  IN_STOCK = 'IN_STOCK',
  LOW_STOCK = 'LOW_STOCK',
  OUT_OF_STOCK = 'OUT_OF_STOCK',
}

export enum OrderStatus {
  COMPLETED = 'COMPLETED',
  VOIDED = 'VOIDED',
  REFUNDED = 'REFUNDED',
}

export enum NotificationType {
  LOW_STOCK = 'LOW_STOCK',
  OUT_OF_STOCK = 'OUT_OF_STOCK',
  SYSTEM = 'SYSTEM',
}

export interface Shift {
  id: string;
  user_id: string;
  start_time: string;
  end_time: string | null;
  opening_cash: number;
  closing_cash_actual: number | null;
  closing_cash_expected: number | null;
  status: 'OPEN' | 'CLOSED';
  notes: string | null;
  created_at: string;
}


export interface ProductVariant {
  id: string;
  name: string;
  sku: string | null;
  price: number;
  quantity: number;
}

export interface Profile {
  id: string;
  email: string;
  full_name: string | null;
  avatar_url: string | null;
  role: UserRole;
  created_at: string;
  updated_at: string;
}

export interface Product {
  id: string;
  name: string;
  description: string | null;
  sku: string | null;
  barcode: string | null;
  category: string;
  price: number;
  cost_price: number | null;
  quantity: number;
  low_stock_threshold: number;
  image_url: string | null;
  is_active: boolean;
  variants: ProductVariant[] | null;
  created_at: string;
  updated_at: string;
}

export interface Customer {
  id: string;
  full_name: string;
  email: string | null;
  phone: string | null;
  address: string | null;
  loyalty_points: number;
  tier: 'BRONZE' | 'SILVER' | 'GOLD';
  store_balance: number;
  birthday: string | null;
  last_visit: string | null;
  created_at: string;
  updated_at: string;
}

export interface Coupon {
  id: string;
  code: string;
  discount_type: 'FIXED' | 'PERCENTAGE';
  value: number;
  min_purchase: number;
  max_discount: number | null;
  expiry_date: string | null;
  usage_limit: number | null;
  used_count: number;
  is_active: boolean;
  created_at: string;
}

export interface BalanceTransaction {
  id: string;
  customer_id: string;
  amount: number;
  type: 'DEPOSIT' | 'WITHDRAWAL' | 'REFUND';
  reference_id: string | null;
  created_at: string;
}

export interface Sale {
  id: string;
  customer_id: string | null;
  user_id: string;
  subtotal: number;
  discount_amount: number;
  discount_type: 'FIXED' | 'PERCENTAGE';
  tax_amount: number;
  total_amount: number;
  status: OrderStatus;
  shift_id: string | null;
  created_at: string;
}

export interface SaleItem {
  id: string;
  sale_id: string;
  product_id: string;
  quantity: number;
  unit_price: number;
  subtotal: number;
  quantity_returned: number;
  created_at: string;
}

export interface Return {
  id: string;
  sale_id: string;
  user_id: string;
  reason: string;
  amount_refunded: number;
  created_at: string;
  sale_items?: SaleItem[];
}

export interface Payment {
  id: string;
  sale_id: string;
  amount: number;
  method: PaymentMethod;
  provider_reference: string | null;
  details: any;
  created_at: string;
}

export interface Supplier {
  id: string;
  name: string;
  contact_person: string | null;
  email: string | null;
  phone: string | null;
  address: string | null;
  created_at: string;
  updated_at: string;
}

export interface PurchaseOrder {
  id: string;
  supplier_id: string;
  total_amount: number;
  status: 'PENDING' | 'RECEIVED' | 'CANCELLED';
  received_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface PurchaseOrderItem {
  id: string;
  purchase_order_id: string;
  product_id: string;
  quantity: number;
  unit_cost: number;
  subtotal: number;
  created_at: string;
  products?: Product;
}

export interface ExpenseCategory {
  id: string;
  name: string;
  description: string | null;
  created_at: string;
}

export interface Expense {
  id: string;
  category_id: string | null;
  amount: number;
  description: string;
  expense_date: string;
  vendor: string | null;
  payment_method: string;
  user_id: string;
  created_at: string;
  expense_categories?: ExpenseCategory;
}

export interface InventoryAudit {
  id: string;
  user_id: string;
  status: 'PENDING' | 'COMPLETED' | 'CANCELLED';
  notes: string | null;
  started_at: string;
  completed_at: string | null;
  profiles?: {
    full_name: string | null;
  };
}

export interface InventoryAuditItem {
  id: string;
  audit_id: string;
  product_id: string;
  expected_quantity: number;
  actual_quantity: number;
  discrepancy: number;
  notes: string | null;
  created_at: string;
  products?: Product;
}

export interface Notification {
  id: string;
  title: string;
  message: string;
  type: NotificationType;
  is_read: boolean;
  created_at: string;
}

export interface Settings {
  id: string;
  store_name: string;
  store_address: string | null;
  store_phone: string | null;
  store_email: string | null;
  store_logo_url: string | null;
  currency_code: string;
  tax_rate: number;
  receipt_footer: string | null;
  updated_at: string;
}

export interface CartItem extends Product {
  cartQuantity: number;
  variantId?: string | null;
}
