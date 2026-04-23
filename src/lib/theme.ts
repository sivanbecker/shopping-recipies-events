export type UiPreset = 'classic' | 'minimal' | 'warm'
export type ThemeMode = 'light' | 'dark' | 'system'
export type TextScale = 'sm' | 'md' | 'lg'
export type AppBackground = 'white' | 'aero' | 'blobs'

export interface ThemeSettings {
  uiPreset: UiPreset
  themeMode: ThemeMode
  textScale: TextScale
  appBackground: AppBackground
}

export const DEFAULT_THEME: ThemeSettings = {
  uiPreset: 'classic',
  themeMode: 'system',
  textScale: 'md',
  appBackground: 'white',
}

export const PRESET_TO_AVATAR_VARIANT: Record<UiPreset, string> = {
  classic: 'beam',
  minimal: 'marble',
  warm: 'sunset',
}

function resolveIsDark(mode: ThemeMode): boolean {
  if (mode === 'dark') return true
  if (mode === 'light') return false
  return window.matchMedia('(prefers-color-scheme: dark)').matches
}

export function applyTheme(settings: Partial<ThemeSettings>): void {
  const { uiPreset, themeMode, textScale, appBackground } = {
    ...DEFAULT_THEME,
    ...settings,
  }
  const html = document.documentElement
  html.setAttribute('data-preset', uiPreset)
  html.setAttribute('data-background', appBackground)
  html.setAttribute('data-text-scale', textScale)
  if (resolveIsDark(themeMode)) {
    html.classList.add('dark')
  } else {
    html.classList.remove('dark')
  }
}
