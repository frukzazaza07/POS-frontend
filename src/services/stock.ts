import api from '@/lib/api'
import type { ApiResponse, StockItem, ProductAvailability } from '@/types/api'

export async function getStock(): Promise<StockItem[]> {
  const { data } = await api.get<ApiResponse<StockItem[]>>('/api/v1/stock')
  return data.data!
}

export async function checkAvailability(
  posProductId: string,
  quantity = 1,
): Promise<ProductAvailability> {
  const { data } = await api.get<ApiResponse<ProductAvailability>>(
    `/api/v1/stock/availability/${posProductId}`,
    { params: { quantity } },
  )
  return data.data!
}

export async function syncStock(): Promise<{ message: string; count: number }> {
  const { data } = await api.post<ApiResponse<{ message: string; count: number }>>(
    '/api/v1/stock/sync',
  )
  return data.data!
}
