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
}

export interface Order {
  id: string
  pos_order_id: string
  cashier_id: string
  cashier?: User
  status: OrderStatus
  total_amount: number
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
