/**
 * Supabase auto-generated types placeholder.
 *
 * After creating your Supabase project and running migrations, replace this file
 * with the output of:
 *   npx supabase gen types typescript --project-id YOUR_PROJECT_ID > src/types/database.ts
 *
 * For now we define a minimal type so the app compiles.
 */
export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          user_id: string
          display_name: string | null
          preferred_language: 'he' | 'en'
          avatar_url: string | null
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          display_name?: string | null
          preferred_language?: 'he' | 'en'
          avatar_url?: string | null
          created_at?: string
        }
        Update: {
          display_name?: string | null
          preferred_language?: 'he' | 'en'
          avatar_url?: string | null
        }
        Relationships: []
      }
      categories: {
        Row: {
          id: string
          name_he: string
          name_en: string
          icon: string | null
          color: string | null
          sort_order: number
        }
        Insert: {
          id?: string
          name_he: string
          name_en: string
          icon?: string | null
          color?: string | null
          sort_order?: number
        }
        Update: {
          name_he?: string
          name_en?: string
          icon?: string | null
          color?: string | null
          sort_order?: number
        }
        Relationships: []
      }
      unit_types: {
        Row: {
          id: string
          code: string
          label_he: string
          label_en: string
          type: 'weight' | 'volume' | 'count' | 'cooking'
        }
        Insert: {
          id?: string
          code: string
          label_he: string
          label_en: string
          type: 'weight' | 'volume' | 'count' | 'cooking'
        }
        Update: {
          label_he?: string
          label_en?: string
        }
        Relationships: []
      }
      products: {
        Row: {
          id: string
          name_he: string
          name_en: string | null
          category_id: string | null
          default_unit_id: string | null
          created_by: string
          is_shared: boolean
          created_at: string
        }
        Insert: {
          id?: string
          name_he: string
          name_en?: string | null
          category_id?: string | null
          default_unit_id?: string | null
          created_by: string
          is_shared?: boolean
          created_at?: string
        }
        Update: {
          name_he?: string
          name_en?: string | null
          category_id?: string | null
          default_unit_id?: string | null
          is_shared?: boolean
        }
        Relationships: []
      }
      shopping_lists: {
        Row: {
          id: string
          name: string | null
          owner_id: string
          is_active: boolean
          is_archived: boolean
          is_missing_list: boolean
          created_at: string
          updated_at: string
          deleted_at: string | null
          deleted_by: string | null
        }
        Insert: {
          id?: string
          name?: string | null
          owner_id: string
          is_active?: boolean
          is_archived?: boolean
          is_missing_list?: boolean
          created_at?: string
          updated_at?: string
          deleted_at?: string | null
          deleted_by?: string | null
        }
        Update: {
          name?: string | null
          is_active?: boolean
          is_archived?: boolean
          deleted_at?: string | null
          deleted_by?: string | null
        }
        Relationships: []
      }
      shopping_items: {
        Row: {
          id: string
          list_id: string
          product_id: string
          quantity: number
          unit_id: string | null
          is_checked: boolean
          added_by: string
          recipe_id: string | null
          note: string | null
          sort_order: number
          created_at: string
          updated_at: string
          last_edited_by: string | null
          last_edited_at: string | null
          completed_by: string | null
          completed_at: string | null
        }
        Insert: {
          id?: string
          list_id: string
          product_id: string
          quantity?: number
          unit_id?: string | null
          is_checked?: boolean
          added_by: string
          recipe_id?: string | null
          note?: string | null
          sort_order?: number
          created_at?: string
          updated_at?: string
          last_edited_by?: string | null
          last_edited_at?: string | null
          completed_by?: string | null
          completed_at?: string | null
        }
        Update: {
          quantity?: number
          unit_id?: string | null
          is_checked?: boolean
          note?: string | null
          sort_order?: number
        }
        Relationships: []
      }
      recipes: {
        Row: {
          id: string
          title: string
          description: string | null
          servings: number
          prep_time_minutes: number | null
          tools: string[]
          owner_id: string
          is_shared: boolean
          created_at: string
        }
        Insert: {
          id?: string
          title: string
          description?: string | null
          servings?: number
          prep_time_minutes?: number | null
          tools?: string[]
          owner_id: string
          is_shared?: boolean
          created_at?: string
        }
        Update: {
          title?: string
          description?: string | null
          servings?: number
          prep_time_minutes?: number | null
          tools?: string[]
          is_shared?: boolean
        }
        Relationships: []
      }
      recipe_ingredients: {
        Row: {
          id: string
          recipe_id: string
          product_id: string
          quantity: number
          unit_id: string | null
          note: string | null
          substitute_group_id: number | null
          sort_order: number
          shopping_unit_id: string | null
          shopping_quantity_multiplier: number
        }
        Insert: {
          id?: string
          recipe_id: string
          product_id: string
          quantity?: number
          unit_id?: string | null
          note?: string | null
          substitute_group_id?: number | null
          sort_order?: number
          shopping_unit_id?: string | null
          shopping_quantity_multiplier?: number
        }
        Update: {
          quantity?: number
          unit_id?: string | null
          note?: string | null
          substitute_group_id?: number | null
          sort_order?: number
          shopping_unit_id?: string | null
          shopping_quantity_multiplier?: number
        }
        Relationships: []
      }
      recipe_steps: {
        Row: {
          id: string
          recipe_id: string
          step_number: number
          description: string
        }
        Insert: {
          id?: string
          recipe_id: string
          step_number: number
          description: string
        }
        Update: {
          step_number?: number
          description?: string
        }
        Relationships: []
      }
      contacts: {
        Row: {
          id: string
          owner_id: string
          name: string
          phone: string | null
          party_size: number
          linked_user_id: string | null
          can_drive: boolean
          label: 'family' | 'friend' | null
          email: string | null
          created_at: string
        }
        Insert: {
          id?: string
          owner_id: string
          name: string
          phone?: string | null
          party_size?: number
          linked_user_id?: string | null
          can_drive?: boolean
          label?: 'family' | 'friend' | null
          email?: string | null
          created_at?: string
        }
        Update: {
          name?: string
          phone?: string | null
          party_size?: number
          linked_user_id?: string | null
          can_drive?: boolean
          label?: 'family' | 'friend' | null
          email?: string | null
        }
        Relationships: []
      }
      host_inventory: {
        Row: {
          id: string
          owner_id: string
          item_type: string
          label: string
          quantity_owned: number
          created_at: string
        }
        Insert: {
          id?: string
          owner_id: string
          item_type: string
          label: string
          quantity_owned?: number
          created_at?: string
        }
        Update: {
          item_type?: string
          label?: string
          quantity_owned?: number
        }
        Relationships: []
      }
      events: {
        Row: {
          id: string
          title: string
          date: string
          location: string | null
          owner_id: string
          notes: string | null
          photo_album_url: string | null
          retro_enough_food: string | null
          retro_what_went_wrong: string | null
          retro_what_went_well: string | null
          retro_remember_next_time: string | null
          created_at: string
        }
        Insert: {
          id?: string
          title: string
          date: string
          location?: string | null
          owner_id: string
          notes?: string | null
          photo_album_url?: string | null
          retro_enough_food?: string | null
          retro_what_went_wrong?: string | null
          retro_what_went_well?: string | null
          retro_remember_next_time?: string | null
          created_at?: string
        }
        Update: {
          title?: string
          date?: string
          location?: string | null
          notes?: string | null
          photo_album_url?: string | null
          retro_enough_food?: string | null
          retro_what_went_wrong?: string | null
          retro_what_went_well?: string | null
          retro_remember_next_time?: string | null
        }
        Relationships: []
      }
      event_members: {
        Row: {
          id: string
          event_id: string
          user_id: string
          role: 'owner' | 'editor' | 'viewer'
        }
        Insert: {
          id?: string
          event_id: string
          user_id: string
          role?: 'owner' | 'editor' | 'viewer'
        }
        Update: {
          role?: 'owner' | 'editor' | 'viewer'
        }
        Relationships: []
      }
      event_invitees: {
        Row: {
          id: string
          event_id: string
          contact_id: string | null
          name: string
          phone: string | null
          party_size: number
          confirmed: boolean
          brings: string | null
          needs_transport: boolean
          transport_by: string | null
          created_at: string
        }
        Insert: {
          id?: string
          event_id: string
          contact_id?: string | null
          name: string
          phone?: string | null
          party_size?: number
          confirmed?: boolean
          brings?: string | null
          needs_transport?: boolean
          transport_by?: string | null
          created_at?: string
        }
        Update: {
          name?: string
          phone?: string | null
          party_size?: number
          confirmed?: boolean
          brings?: string | null
          needs_transport?: boolean
          transport_by?: string | null
        }
        Relationships: []
      }
      event_equipment: {
        Row: {
          id: string
          event_id: string
          item_type: string
          label: string | null
          quantity_needed: number
          is_default: boolean
          is_arranged: boolean
          notes: string | null
        }
        Insert: {
          id?: string
          event_id: string
          item_type: string
          label?: string | null
          quantity_needed?: number
          is_default?: boolean
          is_arranged?: boolean
          notes?: string | null
        }
        Update: {
          item_type?: string
          label?: string | null
          quantity_needed?: number
          is_default?: boolean
          is_arranged?: boolean
          notes?: string | null
        }
        Relationships: []
      }
      event_recipes: {
        Row: {
          id: string
          event_id: string
          recipe_id: string
          servings_override: number | null
          is_dessert: boolean
        }
        Insert: {
          id?: string
          event_id: string
          recipe_id: string
          servings_override?: number | null
          is_dessert?: boolean
        }
        Update: {
          servings_override?: number | null
          is_dessert?: boolean
        }
        Relationships: []
      }
      event_shopping_lists: {
        Row: {
          id: string
          event_id: string
          list_id: string
        }
        Insert: {
          id?: string
          event_id: string
          list_id: string
        }
        Update: Record<string, never>
        Relationships: []
      }
      list_members: {
        Row: {
          id: string
          list_id: string
          user_id: string
          role: 'owner' | 'editor' | 'viewer'
        }
        Insert: {
          id?: string
          list_id: string
          user_id: string
          role?: 'owner' | 'editor' | 'viewer'
        }
        Update: {
          role?: 'owner' | 'editor' | 'viewer'
        }
        Relationships: []
      }
      notifications: {
        Row: {
          id: string
          recipient_user_id: string
          actor_user_id: string | null
          list_id: string | null
          entity_type: 'shopping_item' | 'shopping_list' | 'list_member'
          entity_id: string | null
          notification_type:
            | 'item_added'
            | 'item_completed'
            | 'item_uncompleted'
            | 'item_quantity_changed'
            | 'list_renamed'
            | 'list_deleted'
            | 'list_restored'
            | 'member_added'
            | 'member_removed'
            | 'member_left'
            | 'role_changed'
          payload: Record<string, unknown>
          created_at: string
          read_at: string | null
        }
        Insert: never
        Update: {
          read_at?: string | null
        }
        Relationships: []
      }
    }
    Views: Record<string, never>
    Functions: {
      find_user_by_email: {
        Args: { p_email: string; p_list_id?: string }
        Returns: { user_id: string; display_name: string | null }[]
      }
      get_list_members: {
        Args: { p_list_id: string }
        Returns: {
          id: string
          list_id: string
          user_id: string
          role: 'owner' | 'editor' | 'viewer'
          display_name: string | null
          avatar_url: string | null
        }[]
      }
      list_member_role: {
        Args: { p_list_id: string }
        Returns: 'owner' | 'editor' | 'viewer' | null
      }
      purge_trashed_lists: {
        Args: Record<string, never>
        Returns: number
      }
    }
    Enums: Record<string, never>
  }
}
