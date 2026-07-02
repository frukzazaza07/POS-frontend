import { useQuery } from '@tanstack/react-query'
import {
  getReportSummary,
  getDailyRevenue,
  getTopProducts,
  getCategoryRevenue,
  getCashierSales,
  getOverduePayLater,
  type ReportDateParams,
} from '@/services/reports'

export function useReportSummary(params: ReportDateParams) {
  return useQuery({
    queryKey: ['reports', 'summary', params],
    queryFn: () => getReportSummary(params),
  })
}

export function useDailyRevenue(params: ReportDateParams) {
  return useQuery({
    queryKey: ['reports', 'daily-revenue', params],
    queryFn: () => getDailyRevenue(params),
  })
}

export function useTopProducts(params: ReportDateParams & { limit?: number }) {
  return useQuery({
    queryKey: ['reports', 'top-products', params],
    queryFn: () => getTopProducts(params),
  })
}

export function useCategoryRevenue(params: ReportDateParams) {
  return useQuery({
    queryKey: ['reports', 'category-revenue', params],
    queryFn: () => getCategoryRevenue(params),
  })
}

export function useCashierSales(params: ReportDateParams) {
  return useQuery({
    queryKey: ['reports', 'cashier-sales', params],
    queryFn: () => getCashierSales(params),
  })
}

export function useOverduePayLater() {
  return useQuery({
    queryKey: ['reports', 'overdue-pay-later'],
    queryFn: getOverduePayLater,
  })
}
