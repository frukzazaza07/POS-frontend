import { create } from 'zustand'
import type { POSProduct } from '@/types/api'

interface CartItem {
  product: POSProduct
  quantity: number
}

interface CartStore {
  items: CartItem[]
  add: (product: POSProduct) => void
  remove: (posProductId: string) => void
  updateQty: (posProductId: string, qty: number) => void
  clear: () => void
}

export const useCart = create<CartStore>((set) => ({
  items: [],

  add: (product) =>
    set((s) => {
      const existing = s.items.find((i) => i.product.pos_product_id === product.pos_product_id)
      if (existing) {
        return {
          items: s.items.map((i) =>
            i.product.pos_product_id === product.pos_product_id
              ? { ...i, quantity: i.quantity + 1 }
              : i,
          ),
        }
      }
      return { items: [...s.items, { product, quantity: 1 }] }
    }),

  remove: (posProductId) =>
    set((s) => ({ items: s.items.filter((i) => i.product.pos_product_id !== posProductId) })),

  updateQty: (posProductId, qty) =>
    set((s) => {
      if (qty <= 0) {
        return { items: s.items.filter((i) => i.product.pos_product_id !== posProductId) }
      }
      return {
        items: s.items.map((i) =>
          i.product.pos_product_id === posProductId ? { ...i, quantity: qty } : i,
        ),
      }
    }),

  clear: () => set({ items: [] }),
}))

export const selectTotal = (s: CartStore) =>
  s.items.reduce((sum, i) => sum + i.product.price * i.quantity, 0)
