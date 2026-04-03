import i18n from 'i18next'
import { initReactI18next } from 'react-i18next'
import LanguageDetector from 'i18next-browser-languagedetector'

// Hebrew translations
import heCommon from './locales/he/common.json'
import heShopping from './locales/he/shopping.json'
import heRecipes from './locales/he/recipes.json'
import heEvents from './locales/he/events.json'

// English translations
import enCommon from './locales/en/common.json'
import enShopping from './locales/en/shopping.json'
import enRecipes from './locales/en/recipes.json'
import enEvents from './locales/en/events.json'

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources: {
      he: {
        common: heCommon,
        shopping: heShopping,
        recipes: heRecipes,
        events: heEvents,
      },
      en: {
        common: enCommon,
        shopping: enShopping,
        recipes: enRecipes,
        events: enEvents,
      },
    },
    fallbackLng: 'he',
    defaultNS: 'common',
    interpolation: {
      escapeValue: false,
    },
    detection: {
      order: ['localStorage', 'navigator'],
      caches: ['localStorage'],
    },
  })

export default i18n
