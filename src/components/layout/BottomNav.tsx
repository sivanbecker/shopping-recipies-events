import { NavLink } from 'react-router-dom'
import { ShoppingCart, BookOpen, Calendar, Package, User } from 'lucide-react'
import { useTranslation } from 'react-i18next'

const navItems = [
  {
    to: '/lists',
    icon: ShoppingCart,
    labelHe: 'קניות',
    labelEn: 'Lists',
  },
  {
    to: '/products',
    icon: Package,
    labelHe: 'מוצרים',
    labelEn: 'Products',
  },
  {
    to: '/recipes',
    icon: BookOpen,
    labelHe: 'מתכונים',
    labelEn: 'Recipes',
  },
  {
    to: '/events',
    icon: Calendar,
    labelHe: 'אירועים',
    labelEn: 'Events',
  },
  {
    to: '/profile',
    icon: User,
    labelHe: 'פרופיל',
    labelEn: 'Profile',
  },
]

export function BottomNav() {
  const { i18n } = useTranslation()
  const isHebrew = i18n.language === 'he'

  return (
    <nav
      className="sticky bottom-0 z-40 border-t border-gray-200 bg-white pb-safe"
      aria-label={isHebrew ? 'ניווט ראשי' : 'Main navigation'}
    >
      <div className="mx-auto flex max-w-2xl items-center justify-around">
        {navItems.map(({ to, icon: Icon, labelHe, labelEn }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) =>
              `flex flex-1 flex-col items-center gap-0.5 py-2 text-xs font-medium transition-colors ${
                isActive ? 'text-brand-500' : 'text-gray-500 hover:text-gray-800'
              }`
            }
          >
            {({ isActive }) => (
              <>
                <Icon
                  className={`h-5 w-5 transition-transform ${isActive ? 'scale-110' : ''}`}
                  strokeWidth={isActive ? 2.5 : 2}
                />
                <span>{isHebrew ? labelHe : labelEn}</span>
              </>
            )}
          </NavLink>
        ))}
      </div>
    </nav>
  )
}
