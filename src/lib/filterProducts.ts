import type { Product } from '@/types'

export function filterProducts(products: Product[], query: string): Product[] {
  if (!query.trim()) return products
  const q = query.toLowerCase()
  return products.filter(
    p => p.name_he.toLowerCase().includes(q) || (p.name_en?.toLowerCase().includes(q) ?? false)
  )
}
