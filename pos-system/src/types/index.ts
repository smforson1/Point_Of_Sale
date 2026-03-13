export enum UserRole {
  ADMIN = 'ADMIN',
  MANAGER = 'MANAGER',
  CASHIER = 'CASHIER',
}

export enum PaymentMethod {
  CASH = 'CASH',
  MOBILE_MONEY = 'MOBILE_MONEY',
  CARD = 'CARD',
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
  created_at: string;
  updated_at: string;
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
  created_at: string;
}

export interface SaleItem {
  id: string;
  sale_id: string;
  product_id: string;
  quantity: number;
  unit_price: number;
  subtotal: number;
  created_at: string;
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

export interface AuditLog {
  id: string;
  user_id: string;
  action: string;
  entity_type: string;
  entity_id: string;
  old_data: any;
  new_data: any;
  created_at: string;
  profiles?: {
    full_name: string | null;
    email: string;
  };
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
}
