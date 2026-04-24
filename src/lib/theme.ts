export type UiPreset = 'classic' | 'minimal' | 'warm'
export type ThemeMode = 'light' | 'dark' | 'system'
export type TextScale = 'sm' | 'md' | 'lg'
export type AppBackground =
  | 'white'
  | 'aero'
  | 'blobs'
  | 'gradient-sunset'
  | 'gradient-forest'
  | 'gradient-ocean'
  | 'gradient-candy'
  | 'gradient-dusk'
  | 'noise-warm'
  | 'noise-cool'

export type AppearanceMode = 'basic' | 'advanced'

export interface ThemeSettings {
  uiPreset: UiPreset
  themeMode: ThemeMode
  textScale: TextScale
  appBackground: AppBackground
  appearanceMode: AppearanceMode
  customAccentColor: string | null
}

export const DEFAULT_THEME: ThemeSettings = {
  uiPreset: 'classic',
  themeMode: 'system',
  textScale: 'md',
  appBackground: 'white',
  appearanceMode: 'basic',
  customAccentColor: null,
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

/** Derives a 10-stop --brand-* ramp from a hex color and injects it on <html>. */
export function applyCustomAccent(hex: string): void {
  const hsl = hexToHsl(hex)
  if (!hsl) return
  const { h, s } = hsl
  const html = document.documentElement
  // 10 stops: 50 (lightest) → 950 (darkest), using fixed lightness steps
  const stops: [string, number][] = [
    ['50', 97],
    ['100', 93],
    ['200', 85],
    ['300', 75],
    ['400', 63],
    ['500', 52],
    ['600', 43],
    ['700', 35],
    ['800', 27],
    ['900', 20],
    ['950', 13],
  ]
  for (const [stop, l] of stops) {
    html.style.setProperty(`--brand-${stop}`, `hsl(${h} ${s}% ${l}%)`)
  }
}

/** Removes inline --brand-* overrides so the preset CSS vars take over. */
export function clearCustomAccent(): void {
  const html = document.documentElement
  const stops = ['50', '100', '200', '300', '400', '500', '600', '700', '800', '900', '950']
  for (const stop of stops) {
    html.style.removeProperty(`--brand-${stop}`)
  }
}

export function applyTheme(settings: Partial<ThemeSettings>): void {
  const { uiPreset, themeMode, textScale, appBackground, appearanceMode, customAccentColor } = {
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
  if (appearanceMode === 'advanced' && customAccentColor) {
    applyCustomAccent(customAccentColor)
  } else {
    clearCustomAccent()
  }
  syncThemeColorMeta()
}

function syncThemeColorMeta(): void {
  // Read the resolved brand-500 from the DOM so it reflects preset + custom accent
  const color = getComputedStyle(document.documentElement).getPropertyValue('--brand-500').trim()
  if (!color) return
  let meta = document.querySelector<HTMLMetaElement>('meta[name="theme-color"]')
  if (!meta) {
    meta = document.createElement('meta')
    meta.name = 'theme-color'
    document.head.appendChild(meta)
  }
  meta.content = color
}

// ── helpers ──────────────────────────────────────────────────────────────────

function hexToHsl(hex: string): { h: number; s: number; l: number } | null {
  const clean = hex.replace('#', '')
  if (clean.length !== 6) return null
  const r = parseInt(clean.slice(0, 2), 16) / 255
  const g = parseInt(clean.slice(2, 4), 16) / 255
  const b = parseInt(clean.slice(4, 6), 16) / 255
  const max = Math.max(r, g, b)
  const min = Math.min(r, g, b)
  const l = (max + min) / 2
  if (max === min) return { h: 0, s: 0, l: Math.round(l * 100) }
  const d = max - min
  const s = l > 0.5 ? d / (2 - max - min) : d / (max + min)
  let h = 0
  if (max === r) h = ((g - b) / d + (g < b ? 6 : 0)) / 6
  else if (max === g) h = ((b - r) / d + 2) / 6
  else h = ((r - g) / d + 4) / 6
  return { h: Math.round(h * 360), s: Math.round(s * 100), l: Math.round(l * 100) }
}
