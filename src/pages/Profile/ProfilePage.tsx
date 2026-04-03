import { useTranslation } from 'react-i18next'
import { useAuth } from '@/hooks/useAuth'
import { User, LogOut } from 'lucide-react'
import { useNavigate } from 'react-router-dom'

// TODO Stage 1: Full implementation (edit name, language pref, etc.)
export default function ProfilePage() {
  const { t, i18n } = useTranslation()
  const { user, profile, signOut } = useAuth()
  const navigate = useNavigate()
  const isHebrew = i18n.language === 'he'

  async function handleSignOut() {
    await signOut()
    navigate('/auth', { replace: true })
  }

  return (
    <div className="space-y-4">
      {/* Profile card */}
      <div className="flex items-center gap-4 rounded-2xl bg-white p-5 shadow-sm">
        <div className="flex h-14 w-14 items-center justify-center rounded-full bg-brand-100">
          <User className="h-7 w-7 text-brand-600" />
        </div>
        <div>
          <p className="font-semibold text-gray-900">
            {profile?.display_name ?? user?.email ?? '—'}
          </p>
          <p className="text-sm text-gray-500">{user?.email}</p>
        </div>
      </div>

      {/* Language toggle */}
      <div className="rounded-2xl bg-white p-5 shadow-sm">
        <p className="mb-3 text-sm font-medium text-gray-700">
          {isHebrew ? 'שפה' : 'Language'}
        </p>
        <div className="flex gap-2">
          {(['he', 'en'] as const).map(lang => (
            <button
              key={lang}
              onClick={() => i18n.changeLanguage(lang)}
              className={`flex-1 rounded-xl py-2 text-sm font-medium transition ${
                i18n.language === lang
                  ? 'bg-brand-500 text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {lang === 'he' ? 'עברית' : 'English'}
            </button>
          ))}
        </div>
      </div>

      {/* Sign out */}
      <button
        onClick={handleSignOut}
        className="flex w-full items-center justify-center gap-2 rounded-2xl bg-white p-4 text-sm font-medium text-red-500 shadow-sm hover:bg-red-50 transition"
      >
        <LogOut className="h-4 w-4" />
        {t('auth.logout')}
      </button>
    </div>
  )
}
