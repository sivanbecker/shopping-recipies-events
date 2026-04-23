import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import {
  type UiPreset,
  type ThemeMode,
  type TextScale,
  type AppBackground,
  applyTheme,
} from '@/lib/theme'

interface AppState {
  // UI
  isSidebarOpen: boolean
  setSidebarOpen: (open: boolean) => void

  // Language
  language: 'he' | 'en'
  setLanguage: (lang: 'he' | 'en') => void

  // Theme
  uiPreset: UiPreset
  themeMode: ThemeMode
  textScale: TextScale
  appBackground: AppBackground
  setUiPreset: (preset: UiPreset) => void
  setThemeMode: (mode: ThemeMode) => void
  setTextScale: (scale: TextScale) => void
  setAppBackground: (bg: AppBackground) => void

  // Legacy — kept so existing ProfilePage dark-mode toggle still compiles
  isDarkMode: boolean
  toggleDarkMode: () => void
}

export const useAppStore = create<AppState>()(
  persist(
    (set, get) => ({
      isSidebarOpen: false,
      setSidebarOpen: open => set({ isSidebarOpen: open }),

      language: 'he',
      setLanguage: lang => set({ language: lang }),

      uiPreset: 'classic',
      themeMode: 'system',
      textScale: 'md',
      appBackground: 'white',

      setUiPreset: uiPreset => {
        set({ uiPreset })
        applyTheme({ ...get(), uiPreset })
      },
      setThemeMode: themeMode => {
        set({ themeMode, isDarkMode: themeMode === 'dark' })
        applyTheme({ ...get(), themeMode })
      },
      setTextScale: textScale => {
        set({ textScale })
        applyTheme({ ...get(), textScale })
      },
      setAppBackground: appBackground => {
        set({ appBackground })
        applyTheme({ ...get(), appBackground })
      },

      // Legacy dark mode — bridges existing ProfilePage toggle until Stage 11.5 replaces it
      isDarkMode: window.matchMedia('(prefers-color-scheme: dark)').matches,
      toggleDarkMode: () => {
        const next = !get().isDarkMode
        const themeMode: ThemeMode = next ? 'dark' : 'light'
        set({ isDarkMode: next, themeMode })
        applyTheme({ ...get(), themeMode })
      },
    }),
    {
      name: 'app-store',
      partialize: state => ({
        language: state.language,
        isDarkMode: state.isDarkMode,
        uiPreset: state.uiPreset,
        themeMode: state.themeMode,
        textScale: state.textScale,
        appBackground: state.appBackground,
      }),
    }
  )
)
