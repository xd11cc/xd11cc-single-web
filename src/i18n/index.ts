import { createI18n } from 'vue-i18n'
import { zhCN, enUS } from './locales'

export const supportedLocales = ['zh-CN', 'en-US'] as const
export type SupportedLocale = (typeof supportedLocales)[number]

const defaultLocale: SupportedLocale = 'zh-CN'

function isSupportedLocale(locale: string | null): locale is SupportedLocale {
  return supportedLocales.includes(locale as SupportedLocale)
}

function normalizeLocale(locale: string | null | undefined): SupportedLocale | undefined {
  if (!locale) return undefined
  if (isSupportedLocale(locale)) return locale

  const language = locale.toLowerCase().split('-')[0]
  if (language === 'en') return 'en-US'
  if (language === 'zh') return 'zh-CN'
  return undefined
}

/**
 * Locale detection priority:
 * 1. URL query param ?lang=xx (shareable links)
 * 2. localStorage 'app-locale' (persists across sessions)
 * 3. navigator.language (browser preference)
 * 4. Fallback: 'zh-CN'
 */
function detectLocale(): SupportedLocale {
  const urlParams = new URLSearchParams(window.location.search)
  const queryLocale = normalizeLocale(urlParams.get('lang'))
  if (queryLocale) return queryLocale

  try {
    const storedLocale = normalizeLocale(localStorage.getItem('app-locale'))
    if (storedLocale) return storedLocale
  } catch {
    /* quota exceeded or unavailable */
  }

  return normalizeLocale(navigator.language) ?? defaultLocale
}

function syncDocumentLocale(locale: SupportedLocale) {
  document.documentElement.lang = locale
}

const initialLocale = detectLocale()
syncDocumentLocale(initialLocale)

export const i18n = createI18n({
  legacy: false,
  globalInjection: true,
  locale: initialLocale,
  fallbackLocale: defaultLocale,
  messages: {
    'zh-CN': zhCN,
    'en-US': enUS,
  },
  missingWarn: import.meta.env.DEV,
  fallbackWarn: false,
})

export function setLocale(locale: SupportedLocale) {
  i18n.global.locale.value = locale
  syncDocumentLocale(locale)
  try {
    localStorage.setItem('app-locale', locale)
  } catch {
    /* ignore */
  }
}

export function getLocale(): SupportedLocale {
  return i18n.global.locale.value as SupportedLocale
}
