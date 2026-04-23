import { useCallback, useEffect, useRef } from 'react'
import { useTranslation } from 'react-i18next'
import { useAppStore } from '@/store/useAppStore'
import { useAuth } from '@/hooks/useAuth'
import { cn } from '@/lib/utils'
import type { UiPreset, ThemeMode, TextScale, AppBackground, AppearanceMode } from '@/lib/theme'

// Preset preview accent colors + radius for the mini swatch cards
const PRESET_PREVIEWS: Record<UiPreset, { color: string; radius: string; label: string }> = {
  classic: { color: '#f97316', radius: '0.75rem', label: 'appearance.preset.classic' },
  minimal: { color: '#64748b', radius: '0.25rem', label: 'appearance.preset.minimal' },
  warm: { color: '#c2410c', radius: '1.25rem', label: 'appearance.preset.warm' },
}

const MODES: { value: ThemeMode; labelKey: string }[] = [
  { value: 'light', labelKey: 'appearance.mode.light' },
  { value: 'dark', labelKey: 'appearance.mode.dark' },
  { value: 'system', labelKey: 'appearance.mode.system' },
]

const BASIC_BACKGROUNDS: { value: AppBackground; labelKey: string; preview: string }[] = [
  {
    value: 'white',
    labelKey: 'appearance.background.white',
    preview: 'bg-white border border-gray-200',
  },
  {
    value: 'aero',
    labelKey: 'appearance.background.aero',
    preview: 'bg-gradient-to-br from-sky-200 via-blue-100 to-cyan-200',
  },
  {
    value: 'blobs',
    labelKey: 'appearance.background.blobs',
    preview: 'bg-gradient-to-br from-purple-200 via-pink-100 to-green-200',
  },
]

const ADVANCED_BACKGROUNDS: { value: AppBackground; labelKey: string; preview: string }[] = [
  ...BASIC_BACKGROUNDS,
  {
    value: 'gradient-sunset',
    labelKey: 'appearance.background.gradientSunset',
    preview: 'bg-gradient-to-br from-red-400 via-orange-300 to-yellow-300',
  },
  {
    value: 'gradient-forest',
    labelKey: 'appearance.background.gradientForest',
    preview: 'bg-gradient-to-br from-green-900 via-green-500 to-green-200',
  },
  {
    value: 'gradient-ocean',
    labelKey: 'appearance.background.gradientOcean',
    preview: 'bg-gradient-to-br from-blue-900 via-cyan-500 to-sky-200',
  },
  {
    value: 'gradient-candy',
    labelKey: 'appearance.background.gradientCandy',
    preview: 'bg-gradient-to-br from-pink-500 via-purple-500 to-sky-300',
  },
  {
    value: 'gradient-dusk',
    labelKey: 'appearance.background.gradientDusk',
    preview: 'bg-gradient-to-br from-indigo-700 via-violet-600 to-pink-500',
  },
  {
    value: 'noise-warm',
    labelKey: 'appearance.background.noiseWarm',
    preview: 'bg-amber-50',
  },
  {
    value: 'noise-cool',
    labelKey: 'appearance.background.noiseCool',
    preview: 'bg-slate-100',
  },
]

const TEXT_SCALES: { value: TextScale; labelKey: string }[] = [
  { value: 'sm', labelKey: 'appearance.textSize.sm' },
  { value: 'md', labelKey: 'appearance.textSize.md' },
  { value: 'lg', labelKey: 'appearance.textSize.lg' },
]

// 24 curated accent colors — 6 columns × 4 rows covering a full hue wheel
const ACCENT_PALETTE: string[] = [
  '#ef4444',
  '#f97316',
  '#eab308',
  '#22c55e',
  '#06b6d4',
  '#3b82f6',
  '#dc2626',
  '#ea580c',
  '#ca8a04',
  '#16a34a',
  '#0891b2',
  '#2563eb',
  '#ec4899',
  '#a855f7',
  '#8b5cf6',
  '#14b8a6',
  '#64748b',
  '#1d4ed8',
  '#db2777',
  '#9333ea',
  '#7c3aed',
  '#0d9488',
  '#475569',
  '#1e40af',
]

export function AppearancePanel() {
  const { t } = useTranslation()
  const { updateProfile } = useAuth()
  const {
    uiPreset,
    themeMode,
    textScale,
    appBackground,
    appearanceMode,
    customAccentColor,
    setUiPreset,
    setThemeMode,
    setTextScale,
    setAppBackground,
    setAppearanceMode,
    setCustomAccentColor,
  } = useAppStore(s => ({
    uiPreset: s.uiPreset,
    themeMode: s.themeMode,
    textScale: s.textScale,
    appBackground: s.appBackground,
    appearanceMode: s.appearanceMode,
    customAccentColor: s.customAccentColor,
    setUiPreset: s.setUiPreset,
    setThemeMode: s.setThemeMode,
    setTextScale: s.setTextScale,
    setAppBackground: s.setAppBackground,
    setAppearanceMode: s.setAppearanceMode,
    setCustomAccentColor: s.setCustomAccentColor,
  }))

  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const pendingRef = useRef<{
    uiPreset: UiPreset
    themeMode: ThemeMode
    textScale: TextScale
    appBackground: AppBackground
    appearanceMode: AppearanceMode
    customAccentColor: string | null
  }>({
    uiPreset,
    themeMode,
    textScale,
    appBackground,
    appearanceMode,
    customAccentColor,
  })

  const scheduleSave = useCallback(() => {
    if (saveTimer.current) clearTimeout(saveTimer.current)
    saveTimer.current = setTimeout(() => {
      updateProfile({
        ui_preset: pendingRef.current.uiPreset,
        theme_mode: pendingRef.current.themeMode,
        text_scale: pendingRef.current.textScale,
        app_background: pendingRef.current.appBackground,
        appearance_mode: pendingRef.current.appearanceMode,
        custom_accent_color: pendingRef.current.customAccentColor,
      })
    }, 800)
  }, [updateProfile])

  useEffect(() => {
    pendingRef.current = {
      uiPreset,
      themeMode,
      textScale,
      appBackground,
      appearanceMode,
      customAccentColor,
    }
  }, [uiPreset, themeMode, textScale, appBackground, appearanceMode, customAccentColor])

  function handlePreset(preset: UiPreset) {
    setUiPreset(preset)
    scheduleSave()
  }
  function handleMode(mode: ThemeMode) {
    setThemeMode(mode)
    scheduleSave()
  }
  function handleScale(scale: TextScale) {
    setTextScale(scale)
    scheduleSave()
  }
  function handleBackground(bg: AppBackground) {
    setAppBackground(bg)
    scheduleSave()
  }
  function handleAppearanceMode(mode: AppearanceMode) {
    setAppearanceMode(mode)
    if (mode === 'basic') {
      setCustomAccentColor(null)
    }
    scheduleSave()
  }
  function handleAccentColor(color: string) {
    setCustomAccentColor(color)
    scheduleSave()
  }

  const isAdvanced = appearanceMode === 'advanced'
  const backgrounds = isAdvanced ? ADVANCED_BACKGROUNDS : BASIC_BACKGROUNDS

  return (
    <div className="space-y-5">
      {/* Basic / Advanced toggle */}
      <div className="flex rounded-xl border border-gray-200 bg-gray-100 p-1 dark:border-gray-700 dark:bg-gray-800">
        {(['basic', 'advanced'] as AppearanceMode[]).map(m => (
          <button
            key={m}
            onClick={() => handleAppearanceMode(m)}
            className={cn(
              'flex-1 rounded-lg py-1.5 text-sm font-medium transition',
              appearanceMode === m
                ? 'bg-white text-gray-900 shadow-sm dark:bg-gray-700 dark:text-gray-100'
                : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200'
            )}
          >
            {t(m === 'basic' ? 'appearance.modeBasic' : 'appearance.modeAdvanced')}
          </button>
        ))}
      </div>

      {/* Preset picker — hidden in advanced mode */}
      {!isAdvanced && (
        <div>
          <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
            {t('appearance.preset.label')}
          </p>
          <div className="grid grid-cols-3 gap-3">
            {(Object.keys(PRESET_PREVIEWS) as UiPreset[]).map(preset => {
              const { color, radius, label } = PRESET_PREVIEWS[preset]
              const active = uiPreset === preset
              return (
                <button
                  key={preset}
                  onClick={() => handlePreset(preset)}
                  className={cn(
                    'flex flex-col items-center gap-2 rounded-xl border-2 p-3 transition',
                    active
                      ? 'border-brand-500 bg-brand-50 dark:bg-brand-950/30'
                      : 'border-gray-200 bg-gray-50 hover:border-gray-300 dark:border-gray-700 dark:bg-gray-800 dark:hover:border-gray-600'
                  )}
                >
                  <div
                    className="flex h-10 w-full items-center justify-center gap-1.5 overflow-hidden"
                    style={{ borderRadius: radius }}
                  >
                    <div
                      className="h-6 w-full"
                      style={{ backgroundColor: color, borderRadius: radius }}
                    />
                  </div>
                  <span className="text-xs font-medium text-gray-700 dark:text-gray-300">
                    {t(label)}
                  </span>
                </button>
              )
            })}
          </div>
        </div>
      )}

      {/* Custom color palette — advanced mode only */}
      {isAdvanced && (
        <div>
          <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
            {t('appearance.customColor')}
          </p>
          <p className="mb-3 text-xs text-gray-400 dark:text-gray-500">
            {t('appearance.customColorHint')}
          </p>
          <div className="grid grid-cols-6 gap-2">
            {ACCENT_PALETTE.map(color => {
              const active = customAccentColor === color
              return (
                <button
                  key={color}
                  onClick={() => handleAccentColor(color)}
                  className={cn(
                    'h-9 w-full rounded-lg border-2 transition',
                    active
                      ? 'border-gray-900 scale-110 dark:border-white'
                      : 'border-transparent hover:scale-105'
                  )}
                  style={{ backgroundColor: color }}
                  aria-label={color}
                />
              )
            })}
          </div>
        </div>
      )}

      {/* Color mode */}
      <div>
        <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
          {t('appearance.mode.label')}
        </p>
        <div className="flex rounded-xl border border-gray-200 bg-gray-100 p-1 dark:border-gray-700 dark:bg-gray-800">
          {MODES.map(({ value, labelKey }) => (
            <button
              key={value}
              onClick={() => handleMode(value)}
              className={cn(
                'flex-1 rounded-lg py-1.5 text-sm font-medium transition',
                themeMode === value
                  ? 'bg-white text-gray-900 shadow-sm dark:bg-gray-700 dark:text-gray-100'
                  : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200'
              )}
            >
              {t(labelKey)}
            </button>
          ))}
        </div>
      </div>

      {/* Background */}
      <div>
        <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
          {t('appearance.background.label')}
        </p>
        <div className={cn('grid gap-3', isAdvanced ? 'grid-cols-4' : 'grid-cols-3')}>
          {backgrounds.map(({ value, labelKey, preview }) => (
            <button
              key={value}
              onClick={() => handleBackground(value)}
              className={cn(
                'flex flex-col items-center gap-2 rounded-xl border-2 p-3 transition',
                appBackground === value
                  ? 'border-brand-500 bg-brand-50 dark:bg-brand-950/30'
                  : 'border-gray-200 hover:border-gray-300 dark:border-gray-700 dark:hover:border-gray-600'
              )}
            >
              <div className={cn('h-10 w-full rounded-lg', preview)} />
              <span className="text-xs font-medium text-gray-700 dark:text-gray-300">
                {t(labelKey)}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Text size */}
      <div>
        <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
          {t('appearance.textSize.label')}
        </p>
        <div className="flex rounded-xl border border-gray-200 bg-gray-100 p-1 dark:border-gray-700 dark:bg-gray-800">
          {TEXT_SCALES.map(({ value, labelKey }) => (
            <button
              key={value}
              onClick={() => handleScale(value)}
              className={cn(
                'flex-1 rounded-lg py-1.5 text-sm font-medium transition',
                textScale === value
                  ? 'bg-white text-gray-900 shadow-sm dark:bg-gray-700 dark:text-gray-100'
                  : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200'
              )}
            >
              {t(labelKey)}
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}
