import { createClient } from '@supabase/supabase-js'
import type { Database } from '@/types/database'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabasePublishableKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY

// If env vars are missing (e.g. first run before .env.local is created),
// we use placeholder values so the app loads and the UI is visible.
// Auth operations will simply fail gracefully with a "not configured" message.
export const isSupabaseConfigured = Boolean(supabaseUrl && supabasePublishableKey)

if (!isSupabaseConfigured) {
  console.warn(
    '[Supabase] Environment variables not set.\n' +
      'Copy .env.example → .env.local and add your project URL + publishable key.\n' +
      'The app UI is still visible but login will not work until configured.'
  )
}

export const supabase = createClient<Database>(
  supabaseUrl || 'https://placeholder.supabase.co',
  supabasePublishableKey || 'placeholder-publishable-key',
  {
    auth: {
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: true,
    },
  }
)

export function broadcastChange(listId: string, event: 'items-changed' | 'list-changed') {
  const ch = supabase.getChannels().find(c => c.topic === `realtime:list-detail-${listId}`)
  void ch?.send({ type: 'broadcast', event, payload: {} })
}
