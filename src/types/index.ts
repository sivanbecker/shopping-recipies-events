import type { Database } from './database'

// Convenience row types from the DB schema
export type Profile = Database['public']['Tables']['profiles']['Row']
export type Category = Database['public']['Tables']['categories']['Row']
export type UnitType = Database['public']['Tables']['unit_types']['Row']
export type Product = Database['public']['Tables']['products']['Row']
export type ShoppingList = Database['public']['Tables']['shopping_lists']['Row']
export type ShoppingItem = Database['public']['Tables']['shopping_items']['Row']
export type Recipe = Database['public']['Tables']['recipes']['Row']
export type RecipeIngredient = Database['public']['Tables']['recipe_ingredients']['Row']
export type RecipeStep = Database['public']['Tables']['recipe_steps']['Row']
export type Event = Database['public']['Tables']['events']['Row']
export type EventGuest = Database['public']['Tables']['event_guests']['Row']
export type ListMember = Database['public']['Tables']['list_members']['Row']

// Enriched types for UI use
export type ShoppingItemWithProduct = ShoppingItem & {
  product: Product & {
    category: Category | null
    default_unit: UnitType | null
  }
  unit: UnitType | null
}

export type ShoppingListWithItems = ShoppingList & {
  items: ShoppingItemWithProduct[]
  memberCount?: number
}

export type RecipeWithDetails = Recipe & {
  ingredients: (RecipeIngredient & {
    product: Product
    unit: UnitType | null
  })[]
  steps: RecipeStep[]
}

export type ListMemberWithProfile = ListMember & { display_name: string | null }

export type Language = 'he' | 'en'
export type UnitCategory = 'weight' | 'volume' | 'count' | 'cooking'
export type ListRole = 'owner' | 'editor' | 'viewer'
export type EventItemType = 'chair' | 'table' | 'recipe' | 'other'
