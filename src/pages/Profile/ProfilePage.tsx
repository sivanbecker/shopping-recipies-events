import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Link, useNavigate } from 'react-router-dom'
import { LogOut, Pencil, Check, X, Loader2, Users, ChevronRight } from 'lucide-react'
import { toast } from 'sonner'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useAuth } from '@/hooks/useAuth'
import { UserAvatar } from '@/components/UserAvatar'
import { supabase } from '@/lib/supabase'
import type { HostInventoryItem } from '@/types'

const HOST_ITEMS = [
  { type: 'chair', labelKey: 'profile.hostInventory.chair' },
  { type: 'table', labelKey: 'profile.hostInventory.table' },
  { type: 'plate', labelKey: 'profile.hostInventory.plate' },
  { type: 'bowl', labelKey: 'profile.hostInventory.bowl' },
  { type: 'cold_glass', labelKey: 'profile.hostInventory.coldGlass' },
  { type: 'hot_cup', labelKey: 'profile.hostInventory.hotCup' },
] as const

export default function ProfilePage() {
  const { t, i18n } = useTranslation()
  const { user, profile, signOut, updateProfile } = useAuth()
  const navigate = useNavigate()
  const queryClient = useQueryClient()

  const [editingName, setEditingName] = useState(false)
  const [nameValue, setNameValue] = useState('')
  const [saving, setSaving] = useState(false)
  const [editingHost, setEditingHost] = useState(false)
  const [hostFormState, setHostFormState] = useState<Record<string, number>>({})

  // Host inventory query
  const { data: hostInventory = [] } = useQuery<HostInventoryItem[]>({
    queryKey: ['host-inventory', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('host_inventory')
        .select('*')
        .eq('owner_id', user!.id)
      if (error) throw error
      return data
    },
    enabled: !!user?.id,
  })

  // Sync profile name input when profile loads
  useEffect(() => {
    setNameValue(profile?.display_name ?? '')
  }, [profile?.display_name])

  // Sync form state when host inventory loads
  useEffect(() => {
    if (hostInventory.length > 0) {
      const state = Object.fromEntries(hostInventory.map(h => [h.item_type, h.quantity_owned]))
      setHostFormState(state)
    }
  }, [hostInventory])

  // Pre-fill missing types with 0 when entering edit mode
  useEffect(() => {
    if (!editingHost) return
    const filled = { ...hostFormState }
    HOST_ITEMS.forEach(item => {
      if (!(item.type in filled)) filled[item.type] = 0
    })
    setHostFormState(filled)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [editingHost])

  // Host inventory save mutation
  const saveMutation = useMutation({
    mutationFn: async () => {
      const updates = HOST_ITEMS.map(item => ({
        owner_id: user!.id,
        item_type: item.type,
        label: t(item.labelKey),
        quantity_owned: hostFormState[item.type] ?? 0,
      }))

      const { error } = await supabase
        .from('host_inventory')
        .upsert(updates, { onConflict: 'owner_id,item_type' })
      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['host-inventory', user?.id] })
      setEditingHost(false)
      toast.success(t('profile.hostInventory.saved'))
    },
    onError: () => toast.error(t('status.error')),
  })

  async function handleSignOut() {
    await signOut()
    navigate('/auth', { replace: true })
  }

  function startEdit() {
    setNameValue(profile?.display_name ?? '')
    setEditingName(true)
  }

  function cancelEdit() {
    setEditingName(false)
    setNameValue(profile?.display_name ?? '')
  }

  async function saveName() {
    const trimmed = nameValue.trim()
    if (!trimmed) return
    setSaving(true)
    const { error } = await updateProfile({ display_name: trimmed })
    setSaving(false)
    if (error) {
      toast.error(t('status.error'))
    } else {
      setEditingName(false)
      toast.success(t('profile.nameSaved'))
    }
  }

  async function changeLanguage(lang: 'he' | 'en') {
    i18n.changeLanguage(lang)
    await updateProfile({ preferred_language: lang })
  }

  return (
    <div className="space-y-4">
      {/* Profile card */}
      <div className="rounded-2xl bg-white p-5 shadow-sm dark:bg-gray-900">
        <div className="flex items-center gap-4">
          <UserAvatar userId={user?.id ?? ''} displayName={profile?.display_name} size={56} />
          <div className="min-w-0 flex-1">
            {editingName ? (
              <div className="flex items-center gap-2">
                <input
                  value={nameValue}
                  onChange={e => setNameValue(e.target.value)}
                  onKeyDown={e => {
                    if (e.key === 'Enter') saveName()
                    if (e.key === 'Escape') cancelEdit()
                  }}
                  autoFocus
                  placeholder={t('profile.namePlaceholder')}
                  className="min-w-0 flex-1 rounded-lg border border-gray-200 px-3 py-1.5 text-sm focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100 dark:placeholder:text-gray-500"
                />
                <button
                  onClick={saveName}
                  disabled={saving}
                  className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-brand-500 text-white hover:bg-brand-600 disabled:opacity-60"
                  aria-label={t('actions.save')}
                >
                  {saving ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Check className="h-4 w-4" />
                  )}
                </button>
                <button
                  onClick={cancelEdit}
                  className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-gray-100 text-gray-600 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600"
                  aria-label={t('actions.cancel')}
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <p className="truncate font-semibold text-gray-900 dark:text-gray-100">
                  {profile?.display_name ?? user?.email ?? '—'}
                </p>
                <button
                  onClick={startEdit}
                  className="shrink-0 text-gray-400 hover:text-brand-500"
                  aria-label={t('profile.editName')}
                >
                  <Pencil className="h-3.5 w-3.5" />
                </button>
              </div>
            )}
            <p className="mt-0.5 truncate text-sm text-gray-500 dark:text-gray-400">
              {user?.email}
            </p>
          </div>
        </div>
      </div>

      {/* Language toggle */}
      <div className="rounded-2xl bg-white p-5 shadow-sm dark:bg-gray-900">
        <p className="mb-3 text-sm font-medium text-gray-700 dark:text-gray-300">
          {t('profile.language')}
        </p>
        <div className="flex gap-2">
          {(['he', 'en'] as const).map(lang => (
            <button
              key={lang}
              onClick={() => changeLanguage(lang)}
              className={`flex-1 rounded-xl py-2 text-sm font-medium transition ${
                i18n.language === lang
                  ? 'bg-brand-500 text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700'
              }`}
            >
              {lang === 'he' ? 'עברית' : 'English'}
            </button>
          ))}
        </div>
      </div>

      {/* Host Equipment */}
      <div className="rounded-2xl bg-white p-5 shadow-sm dark:bg-gray-900">
        <div className="mb-3 flex items-center justify-between">
          <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
            {t('profile.hostInventory.title')}
          </p>
          {!editingHost && (
            <button
              onClick={() => setEditingHost(true)}
              className="text-xs font-medium text-purple-600 hover:text-purple-700 dark:text-purple-400"
            >
              {t('actions.edit')}
            </button>
          )}
        </div>

        {editingHost ? (
          <>
            <p className="mb-4 text-xs text-gray-500 dark:text-gray-400">
              {t('profile.hostInventory.description')}
            </p>

            <div className="mb-4 grid grid-cols-2 gap-4">
              {HOST_ITEMS.map(item => (
                <div key={item.type} className="flex flex-col gap-2">
                  <label className="text-xs font-medium text-gray-600 dark:text-gray-400">
                    {t(item.labelKey)}
                  </label>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() =>
                        setHostFormState(s => ({
                          ...s,
                          [item.type]: Math.max(0, (s[item.type] ?? 0) - 1),
                        }))
                      }
                      disabled={saveMutation.isPending}
                      className="flex h-7 w-7 items-center justify-center rounded-lg border border-gray-200 text-sm text-gray-600 hover:bg-gray-50 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-800"
                    >
                      −
                    </button>
                    <span className="w-6 text-center text-sm font-semibold text-gray-800 dark:text-gray-100">
                      {hostFormState[item.type] ?? 0}
                    </span>
                    <button
                      onClick={() =>
                        setHostFormState(s => ({
                          ...s,
                          [item.type]: (s[item.type] ?? 0) + 1,
                        }))
                      }
                      disabled={saveMutation.isPending}
                      className="flex h-7 w-7 items-center justify-center rounded-lg border border-gray-200 text-sm text-gray-600 hover:bg-gray-50 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-800"
                    >
                      +
                    </button>
                  </div>
                </div>
              ))}
            </div>

            <div className="flex gap-2">
              <button
                onClick={() => saveMutation.mutate()}
                disabled={saveMutation.isPending}
                className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-purple-600 py-2 text-sm font-semibold text-white hover:bg-purple-700 disabled:opacity-50"
              >
                {saveMutation.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
                {t('actions.save')}
              </button>
              <button
                onClick={() => setEditingHost(false)}
                disabled={saveMutation.isPending}
                className="flex-1 rounded-xl border border-gray-200 py-2 text-sm font-semibold text-gray-600 hover:bg-gray-50 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-800"
              >
                {t('actions.cancel')}
              </button>
            </div>
          </>
        ) : (
          <div className="grid grid-cols-2 gap-3">
            {HOST_ITEMS.map(item => (
              <div
                key={item.type}
                className="flex flex-col gap-1 rounded-lg bg-gray-50 p-3 dark:bg-gray-800"
              >
                <p className="text-xs font-medium text-gray-600 dark:text-gray-400">
                  {t(item.labelKey)}
                </p>
                <p className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                  {hostInventory.find(h => h.item_type === item.type)?.quantity_owned ?? 0}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Manage Contacts */}
      <Link
        to="/contacts"
        className="flex items-center justify-between rounded-2xl bg-white p-5 shadow-sm transition hover:bg-gray-50 dark:bg-gray-900 dark:hover:bg-gray-800"
      >
        <div className="flex items-center gap-3">
          <Users className="h-5 w-5 text-purple-500" />
          <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
            {t('events:contacts.manage')}
          </span>
        </div>
        <ChevronRight className="h-4 w-4 text-gray-400" />
      </Link>

      {/* Sign out */}
      <button
        onClick={handleSignOut}
        className="flex w-full items-center justify-center gap-2 rounded-2xl bg-white p-4 text-sm font-medium text-red-500 shadow-sm transition hover:bg-red-50 dark:bg-gray-900 dark:hover:bg-red-950"
      >
        <LogOut className="h-4 w-4" />
        {t('auth.logout')}
      </button>
    </div>
  )
}
