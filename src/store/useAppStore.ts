import { create } from 'zustand'
import { persist } from 'zustand/middleware'

interface AppState {
  // UI
  isSidebarOpen: boolean
  setSidebarOpen: (open: boolean) => void

  // Preferences
  language: 'he' | 'en'
  setLanguage: (lang: 'he' | 'en') => void

  isDarkMode: boolean
  toggleDarkMode: () => void
}

export const useAppStore = create<AppState>()(
  persist(
    set => ({
      isSidebarOpen: false,
      setSidebarOpen: open => set({ isSidebarOpen: open }),

      language: 'he',
      setLanguage: lang => set({ language: lang }),

      isDarkMode: window.matchMedia('(prefers-color-scheme: dark)').matches,
      toggleDarkMode: () => set(s => ({ isDarkMode: !s.isDarkMode })),
    }),
    {
      name: 'app-store',
      partialize: state => ({ language: state.language, isDarkMode: state.isDarkMode }),
    }
  )
)
