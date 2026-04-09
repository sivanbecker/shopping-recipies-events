import { Routes, Route, Navigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useEffect } from 'react'
import { useAppStore } from './store/useAppStore'

import { ProtectedRoute } from './components/ProtectedRoute'
import { AppLayout } from './components/layout/AppLayout'

// Pages
import AuthPage from './pages/Auth/AuthPage'
import ListsPage from './pages/Lists/ListsPage'
import ListDetailPage from './pages/Lists/ListDetailPage'
import ProductsPage from './pages/Products/ProductsPage'
import RecipesPage from './pages/Recipes/RecipesPage'
import RecipeDetailPage from './pages/Recipes/RecipeDetailPage'
import RecipeFormPage from './pages/Recipes/RecipeFormPage'
import EventsPage from './pages/Events/EventsPage'
import EventDetailPage from './pages/Events/EventDetailPage'
import ProfilePage from './pages/Profile/ProfilePage'

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
        <Route path="/lists/:id" element={<ListDetailPage />} />
        <Route path="/products" element={<ProductsPage />} />
        <Route path="/recipes" element={<RecipesPage />} />
        <Route path="/recipes/new" element={<RecipeFormPage />} />
        <Route path="/recipes/:id/edit" element={<RecipeFormPage />} />
        <Route path="/recipes/:id" element={<RecipeDetailPage />} />
        <Route path="/events" element={<EventsPage />} />
        <Route path="/events/:id" element={<EventDetailPage />} />
        <Route path="/profile" element={<ProfilePage />} />
      </Route>

      {/* Default redirect */}
      <Route path="/" element={<Navigate to="/lists" replace />} />
      <Route path="*" element={<Navigate to="/lists" replace />} />
    </Routes>
  )
}
