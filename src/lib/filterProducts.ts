import type { Product } from '@/types'

export function filterProducts<T extends Product>(products: T[], query: string): T[] {
  if (!query.trim()) return products
  const q = query.toLowerCase()
  return products.filter(
    p => p.name_he.toLowerCase().includes(q) || (p.name_en?.toLowerCase().includes(q) ?? false)
  )
}
