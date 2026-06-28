import { useQuery } from '@tanstack/react-query'
import { getProducts } from '@/services/products'

export function useProducts(search = '', page = 1) {
  return useQuery({
    queryKey: ['products', search, page],
    queryFn: () => getProducts({ search, page, limit: 20 }),
    staleTime: 1000 * 30,
  })
}
