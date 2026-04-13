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
export type Contact = Database['public']['Tables']['contacts']['Row']
export type HostInventoryItem = Database['public']['Tables']['host_inventory']['Row']
export type Event = Database['public']['Tables']['events']['Row']
export type EventMember = Database['public']['Tables']['event_members']['Row']
export type EventInvitee = Database['public']['Tables']['event_invitees']['Row']
export type EventEquipment = Database['public']['Tables']['event_equipment']['Row']
export type EventRecipe = Database['public']['Tables']['event_recipes']['Row']
export type EventShoppingList = Database['public']['Tables']['event_shopping_lists']['Row']
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
    shopping_unit: UnitType | null
  })[]
  steps: RecipeStep[]
}

export type ListMemberWithProfile = ListMember & {
  display_name: string | null
  avatar_url: string | null
}

export type Language = 'he' | 'en'
export type UnitCategory = 'weight' | 'volume' | 'count' | 'cooking'
export type ListRole = 'owner' | 'editor' | 'viewer'
export type EventWithCounts = Event & {
  invitee_count: number
  total_people: number
}

export type EventRole = 'owner' | 'editor' | 'viewer'
