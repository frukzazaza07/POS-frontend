export type UserRole = 'admin' | 'cashier'
export type OrderStatus = 'PENDING' | 'COMPLETED' | 'CANCELLED' | 'FAILED'
export type PaymentMethod = 'CASH' | 'BANK_QRCODE' | 'PAY_LATER'

export interface User {
  id: string
  name: string
  email: string
  role: UserRole
  is_active: boolean
  created_at: string
  updated_at: string
}

export interface POSProduct {
  id: string
  pos_product_id: string
  name: string
  description: string
  price: number
  cost_price?: number // admin only — absent/omitted for cashier role
  category: string
  is_active: boolean
  created_at: string
  updated_at: string
}

export interface OrderItem {
  id: string
  order_id: string
  pos_product_id: string
  product_name: string
  quantity: number
  unit_price: number
  subtotal: number
  cost_price?: number // admin only
}

export interface Order {
  id: string
  pos_order_id: string
  cashier_id: string
  cashier?: User
  status: OrderStatus
  total_amount: number
  total_cost?: number // admin only
  profit?: number      // admin only — total_amount - total_cost
  vat_rate?: number     // 0 if VAT disabled — visible to all roles
  vat_amount?: number
  net_amount?: number   // total_amount - vat_amount (pre-tax price)
  payment_method: PaymentMethod
  notes: string
  fail_reason?: string
  items?: OrderItem[]
  // PAY_LATER fields
  customer_name?: string
  customer_phone?: string
  payment_due_date?: string
  is_paid?: boolean
  paid_at?: string | null
  created_at: string
  updated_at: string
}

export interface BankQRConfig {
  id: string
  bank_name: string
  account_name: string
  account_number?: string
  promptpay_id?: string
  qr_image_url: string
  is_active: boolean
}

export interface VatConfig {
  id: string
  enabled: boolean
  rate: number               // percent, e.g. 7 for 7%
  price_includes_vat: boolean // true = product prices already include VAT
}

export interface StockItem {
  inventory_item_id: string
  sku: string
  name: string
  unit: string
  quantity_in_stock: number
  min_quantity: number
  is_low: boolean
  is_out: boolean
  synced_at: string
}

export interface AvailabilityDetail {
  inventory_item_id: string
  sku: string
  name: string
  required: number
  available: number
  is_sufficient: boolean
}

export interface ProductAvailability {
  pos_product_id: string
  name: string
  is_available: boolean
  details: AvailabilityDetail[]
}

export interface BarcodeProduct {
  id: string
  pos_product_id: string
  name: string
  sku: string
  barcode: string
  is_active: boolean
  bom: Array<{
    inventory_item_id: string
    quantity_required: number
    inventory_item: {
      sku: string
      name: string
      unit: string
      quantity_in_stock: number
    }
  }>
  created_at: string
  updated_at: string
}

export interface ApiResponse<T> {
  status: 'success' | 'error'
  message?: string
  data?: T
}

export interface PaginatedResponse<T> {
  items: T[]
  total: number
  page: number
  limit: number
}

export interface SummaryReport {
  from: string
  to: string
  total_revenue: number
  total_cost: number
  gross_profit: number
  total_vat: number
  order_count: number
  avg_order_value: number
  by_status: Array<{ status: OrderStatus; count: number; total_amount: number }>
  by_payment_method: Array<{ payment_method: PaymentMethod; count: number; total_amount: number }>
}

export interface DailyRevenue {
  date: string
  revenue: number
  order_count: number
}

export interface TopProduct {
  pos_product_id: string
  product_name: string
  total_qty: number
  total_revenue: number
  total_cost: number
  profit: number
}

export interface CategoryRevenue {
  category: string
  revenue: number
  order_count: number
}

export interface CashierSales {
  cashier_id: string
  cashier_name: string
  order_count: number
  revenue: number
}
