import { useTranslation } from 'react-i18next'
import { ShoppingCart, Moon, Sun } from 'lucide-react'
import { Link, useLocation } from 'react-router-dom'
import { useAppStore } from '@/store/useAppStore'
import { ProfileDropdown } from './ProfileDropdown'

const pageTitles: Record<string, { he: string; en: string }> = {
  '/lists': { he: 'רשימות קניות', en: 'Shopping Lists' },
  '/products': { he: 'מוצרים', en: 'Products' },
  '/recipes': { he: 'מתכונים', en: 'Recipes' },
  '/events': { he: 'אירועים', en: 'Events' },
  '/profile': { he: 'פרופיל', en: 'Profile' },
}

export function Header() {
  const { i18n } = useTranslation()
  const location = useLocation()
  const isHebrew = i18n.language === 'he'
  const { isDarkMode, toggleDarkMode } = useAppStore()

  const currentPage = Object.keys(pageTitles).find(key => location.pathname.startsWith(key))
  const title = currentPage
    ? pageTitles[currentPage][isHebrew ? 'he' : 'en']
    : isHebrew
      ? 'ניהול קניות'
      : 'Shopping Manager'

  const toggleLanguage = () => {
    i18n.changeLanguage(isHebrew ? 'en' : 'he')
  }

  return (
    <header className="sticky top-0 z-40 border-b border-gray-200 bg-white shadow-sm dark:border-gray-700 dark:bg-gray-900">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3">
        <div className="flex items-center gap-2">
          <Link to="/lists" aria-label={isHebrew ? 'ראשי' : 'Home'}>
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-brand-500">
              <ShoppingCart className="h-4 w-4 text-white" />
            </div>
          </Link>
          <h1 className="text-lg font-semibold text-gray-900 dark:text-gray-100">{title}</h1>
        </div>

        <div className="flex items-center gap-1">
          {/* Dark mode toggle */}
          <button
            onClick={toggleDarkMode}
            className="rounded-lg p-1.5 text-gray-600 transition hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800"
            aria-label={isDarkMode ? 'Switch to light mode' : 'Switch to dark mode'}
          >
            {isDarkMode ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
          </button>

          {/* Language switcher */}
          <button
            onClick={toggleLanguage}
            className="rounded-lg px-3 py-1.5 text-sm font-medium text-gray-600 transition hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800"
            aria-label={isHebrew ? 'Switch to English' : 'עבור לעברית'}
          >
            {isHebrew ? 'EN' : 'עב'}
          </button>

          <ProfileDropdown />
        </div>
      </div>
    </header>
  )
}
