import { Routes, Route, Navigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useEffect, lazy, Suspense } from 'react'
import { Loader2 } from 'lucide-react'
import { useAppStore } from './store/useAppStore'

import { ProtectedRoute } from './components/ProtectedRoute'
import { AppLayout } from './components/layout/AppLayout'

// AuthPage stays eager — first paint
import AuthPage from './pages/Auth/AuthPage'

// All other pages lazy-loaded
const ListsPage = lazy(() => import('./pages/Lists/ListsPage'))
const ListDetailPage = lazy(() => import('./pages/Lists/ListDetailPage'))
const TrashPage = lazy(() => import('./pages/Lists/TrashPage'))
const ProductsPage = lazy(() => import('./pages/Products/ProductsPage'))
const RecipesPage = lazy(() => import('./pages/Recipes/RecipesPage'))
const RecipeDetailPage = lazy(() => import('./pages/Recipes/RecipeDetailPage'))
const RecipeFormPage = lazy(() => import('./pages/Recipes/RecipeFormPage'))
const EventsPage = lazy(() => import('./pages/Events/EventsPage'))
const EventDetailPage = lazy(() => import('./pages/Events/EventDetailPage'))
const ContactsPage = lazy(() => import('./pages/Events/ContactsPage'))
const ProfilePage = lazy(() => import('./pages/Profile/ProfilePage'))

export default function App() {
  const { i18n } = useTranslation()
  const isDarkMode = useAppStore(s => s.isDarkMode)

  // Keep <html> dir and lang in sync with the active language
  useEffect(() => {
    const lang = i18n.language
    const isHebrew = lang === 'he' || lang.startsWith('he-')
    document.documentElement.lang = isHebrew ? 'he' : 'en'
    document.documentElement.dir = isHebrew ? 'rtl' : 'ltr'
  }, [i18n.language])

  // Keep <html> dark class in sync with dark mode preference
  useEffect(() => {
    document.documentElement.classList.toggle('dark', isDarkMode)
  }, [isDarkMode])

  return (
    <Suspense
      fallback={
        <div className="flex h-screen items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-orange-500" />
        </div>
      }
    >
      <Routes>
        {/* Public */}
        <Route path="/auth" element={<AuthPage />} />

        {/* Protected — wrapped in shared layout */}
        <Route
          element={
            <ProtectedRoute>
              <AppLayout />
            </ProtectedRoute>
          }
        >
          <Route path="/lists" element={<ListsPage />} />
          <Route path="/lists/trash" element={<TrashPage />} />
          <Route path="/lists/:id" element={<ListDetailPage />} />
          <Route path="/products" element={<ProductsPage />} />
          <Route path="/recipes" element={<RecipesPage />} />
          <Route path="/recipes/new" element={<RecipeFormPage />} />
          <Route path="/recipes/:id/edit" element={<RecipeFormPage />} />
          <Route path="/recipes/:id" element={<RecipeDetailPage />} />
          <Route path="/events" element={<EventsPage />} />
          <Route path="/events/:id" element={<EventDetailPage />} />
          <Route path="/contacts" element={<ContactsPage />} />
          <Route path="/profile" element={<ProfilePage />} />
        </Route>

        {/* Default redirect */}
        <Route path="/" element={<Navigate to="/lists" replace />} />
        <Route path="*" element={<Navigate to="/lists" replace />} />
      </Routes>
    </Suspense>
  )
}
