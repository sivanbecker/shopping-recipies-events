import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Link, useNavigate } from 'react-router-dom'
import { LogOut, Pencil, Check, X, Loader2, Moon, Sun, Users, ChevronRight } from 'lucide-react'
import { toast } from 'sonner'
import { useAuth } from '@/hooks/useAuth'
import { UserAvatar } from '@/components/UserAvatar'
import { useAppStore } from '@/store/useAppStore'

export default function ProfilePage() {
  const { t, i18n } = useTranslation()
  const { user, profile, signOut, updateProfile } = useAuth()
  const { isDarkMode, toggleDarkMode } = useAppStore()
  const navigate = useNavigate()

  const [editingName, setEditingName] = useState(false)
  const [nameValue, setNameValue] = useState('')
  const [saving, setSaving] = useState(false)

  // Sync input when profile loads
  useEffect(() => {
    setNameValue(profile?.display_name ?? '')
  }, [profile?.display_name])

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

      {/* Dark mode toggle */}
      <div className="rounded-2xl bg-white p-5 shadow-sm dark:bg-gray-900">
        <p className="mb-3 text-sm font-medium text-gray-700 dark:text-gray-300">
          {t('profile.darkMode')}
        </p>
        <button
          onClick={toggleDarkMode}
          className="flex w-full items-center justify-between rounded-xl bg-gray-100 px-4 py-2.5 text-sm font-medium text-gray-700 transition hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700"
        >
          <span>{isDarkMode ? t('profile.lightMode') : t('profile.darkMode')}</span>
          {isDarkMode ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
        </button>
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
