import api from '@/lib/api'
import type { ApiResponse, BarcodeProduct, PaginatedResponse, POSProduct } from '@/types/api'

export async function getProducts(params?: {
  search?: string
  page?: number
  limit?: number
}): Promise<PaginatedResponse<POSProduct>> {
  const { data } = await api.get<ApiResponse<PaginatedResponse<POSProduct>>>(
    '/api/v1/products',
    { params },
  )
  return data.data!
}

export async function getProduct(id: string): Promise<POSProduct> {
  const { data } = await api.get<ApiResponse<POSProduct>>(`/api/v1/products/${id}`)
  return data.data!
}

export async function createProduct(payload: {
  pos_product_id: string
  name: string
  description?: string
  price: number
  category?: string
  is_active?: boolean
}): Promise<POSProduct> {
  const { data } = await api.post<ApiResponse<POSProduct>>('/api/v1/products', payload)
  return data.data!
}

export async function updateProduct(
  id: string,
  payload: Partial<{
    name: string
    description: string
    price: number
    category: string
    is_active: boolean
  }>,
): Promise<POSProduct> {
  const { data } = await api.put<ApiResponse<POSProduct>>(`/api/v1/products/${id}`, payload)
  return data.data!
}

export async function deleteProduct(id: string): Promise<void> {
  await api.delete(`/api/v1/products/${id}`)
}

export async function getProductByBarcode(barcode: string): Promise<BarcodeProduct> {
  const { data } = await api.get<ApiResponse<BarcodeProduct>>(
    `/api/v1/products/barcode/${encodeURIComponent(barcode)}`,
  )
  return data.data!
}
