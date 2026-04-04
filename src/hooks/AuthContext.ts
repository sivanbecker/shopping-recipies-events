import { createContext } from 'react'
import type { User, Session } from '@supabase/supabase-js'
import type { Profile } from '@/types'
import type { Database } from '@/types/database'

type ProfileUpdate = Database['public']['Tables']['profiles']['Update']

export interface AuthContextValue {
  user: User | null
  session: Session | null
  profile: Profile | null
  loading: boolean
  signOut: () => Promise<void>
  updateProfile: (updates: ProfileUpdate) => Promise<{ error: Error | null }>
}

export const AuthContext = createContext<AuthContextValue | undefined>(undefined)
