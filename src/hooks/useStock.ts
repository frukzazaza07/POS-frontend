import { useQuery } from '@tanstack/react-query'
import { getStock } from '@/services/stock'

export function useStock() {
  return useQuery({
    queryKey: ['stock'],
    queryFn: getStock,
    staleTime: 1000 * 60 * 5,
  })
}
