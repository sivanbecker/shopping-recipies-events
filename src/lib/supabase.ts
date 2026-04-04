import { createClient } from '@supabase/supabase-js'
import type { Database } from '@/types/database'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

// If env vars are missing (e.g. first run before .env.local is created),
// we use placeholder values so the app loads and the UI is visible.
// Auth operations will simply fail gracefully with a "not configured" message.
export const isSupabaseConfigured = Boolean(supabaseUrl && supabaseAnonKey)

if (!isSupabaseConfigured) {
  console.warn(
    '[Supabase] Environment variables not set.\n' +
      'Copy .env.example → .env.local and add your project URL + anon key.\n' +
      'The app UI is still visible but login will not work until configured.'
  )
}

export const supabase = createClient<Database>(
  supabaseUrl || 'https://placeholder.supabase.co',
  supabaseAnonKey || 'placeholder-anon-key',
  {
    auth: {
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: true,
    },
  }
)
