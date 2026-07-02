import api from '@/lib/api'
import type {
  ApiResponse,
  SummaryReport,
  DailyRevenue,
  TopProduct,
  CategoryRevenue,
  CashierSales,
  Order,
} from '@/types/api'

export interface ReportDateParams {
  from?: string
  to?: string
}

export async function getReportSummary(params?: ReportDateParams): Promise<SummaryReport> {
  const { data } = await api.get<ApiResponse<SummaryReport>>('/api/v1/reports/summary', { params })
  return data.data!
}

export async function getDailyRevenue(params?: ReportDateParams): Promise<DailyRevenue[]> {
  const { data } = await api.get<ApiResponse<DailyRevenue[]>>('/api/v1/reports/revenue/daily', { params })
  return data.data!
}

export async function getTopProducts(
  params?: ReportDateParams & { limit?: number },
): Promise<TopProduct[]> {
  const { data } = await api.get<ApiResponse<TopProduct[]>>('/api/v1/reports/products/top', { params })
  return data.data!
}

export async function getCategoryRevenue(params?: ReportDateParams): Promise<CategoryRevenue[]> {
  const { data } = await api.get<ApiResponse<CategoryRevenue[]>>('/api/v1/reports/revenue/category', { params })
  return data.data!
}

export async function getCashierSales(params?: ReportDateParams): Promise<CashierSales[]> {
  const { data } = await api.get<ApiResponse<CashierSales[]>>('/api/v1/reports/cashiers', { params })
  return data.data!
}

export async function getOverduePayLater(): Promise<Order[]> {
  const { data } = await api.get<ApiResponse<Order[]>>('/api/v1/reports/pay-later/overdue')
  return data.data!
}
