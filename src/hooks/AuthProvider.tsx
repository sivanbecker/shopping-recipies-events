import { useEffect, useState } from 'react'
import type { User, Session } from '@supabase/supabase-js'
import { supabase } from '@/lib/supabase'
import type { Profile } from '@/types'
import type { Database } from '@/types/database'
import { AuthContext } from './AuthContext'

type ProfileUpdate = Database['public']['Tables']['profiles']['Update']

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [session, setSession] = useState<Session | null>(null)
  const [profile, setProfile] = useState<Profile | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
      setUser(session?.user ?? null)
      if (session?.user) {
        fetchProfile(session.user.id, session.user.user_metadata?.avatar_url ?? null)
      } else {
        setLoading(false)
      }
    })

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session)
      setUser(session?.user ?? null)
      if (session?.user) {
        fetchProfile(session.user.id, session.user.user_metadata?.avatar_url ?? null)
      } else {
        setProfile(null)
        setLoading(false)
      }
    })

    return () => subscription.unsubscribe()
  }, [])

  async function fetchProfile(userId: string, metaAvatarUrl: string | null = null) {
    try {
      const { data } = await supabase.from('profiles').select('*').eq('user_id', userId).single()
      // Backfill avatar_url for existing Google users whose profile row pre-dates migration 025
      if (data && !data.avatar_url && metaAvatarUrl) {
        await supabase.from('profiles').update({ avatar_url: metaAvatarUrl }).eq('user_id', userId)
        setProfile({ ...data, avatar_url: metaAvatarUrl })
      } else {
        setProfile(data)
      }
    } catch {
      setProfile(null)
    } finally {
      setLoading(false)
    }
  }

  async function signOut() {
    await supabase.auth.signOut()
  }

  async function updateProfile(updates: ProfileUpdate): Promise<{ error: Error | null }> {
    if (!user) return { error: new Error('Not authenticated') }
    const { error } = await supabase.from('profiles').update(updates).eq('user_id', user.id)
    if (!error) {
      setProfile(prev => (prev ? { ...prev, ...updates } : prev))
    }
    return { error: error ? new Error(error.message) : null }
  }

  return (
    <AuthContext.Provider value={{ user, session, profile, loading, signOut, updateProfile }}>
      {children}
    </AuthContext.Provider>
  )
}
