import api from '@/lib/api'
import type { ApiResponse, PaginatedResponse, Order, PaymentMethod, OrderStatus } from '@/types/api'

export interface CreateOrderPayload {
  payment_method?: PaymentMethod
  notes?: string
  items: Array<{ pos_product_id: string; quantity: number }>
  // PAY_LATER only
  customer_name?: string
  customer_phone?: string
  payment_due_days?: number
}

export interface OrderListParams {
  page?: number
  limit?: number
  payment_method?: PaymentMethod
  status?: OrderStatus
  overdue?: boolean
}

export async function createOrder(payload: CreateOrderPayload): Promise<Order> {
  const { data } = await api.post<ApiResponse<Order>>('/api/v1/orders', payload)
  return data.data!
}

export async function getOrders(params?: OrderListParams): Promise<PaginatedResponse<Order>> {
  const { data } = await api.get<ApiResponse<PaginatedResponse<Order>>>(
    '/api/v1/orders',
    { params },
  )
  return data.data!
}

export async function getOrder(id: string): Promise<Order> {
  const { data } = await api.get<ApiResponse<Order>>(`/api/v1/orders/${id}`)
  return data.data!
}

export async function cancelOrder(id: string): Promise<void> {
  await api.post(`/api/v1/orders/${id}/cancel`)
}

export async function markOrderPaid(id: string): Promise<{ message: string; order: Order }> {
  const { data } = await api.post<ApiResponse<{ message: string; order: Order }>>(
    `/api/v1/orders/${id}/pay`,
  )
  return data.data!
}
