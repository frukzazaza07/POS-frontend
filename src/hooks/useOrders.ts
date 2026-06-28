import { useQuery } from '@tanstack/react-query'
import { getOrders, type OrderListParams } from '@/services/orders'

export function useOrders(params: OrderListParams = {}) {
  return useQuery({
    queryKey: ['orders', params],
    queryFn: () => getOrders({ limit: 20, ...params }),
  })
}
