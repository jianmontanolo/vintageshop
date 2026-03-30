import { createContext, useContext, useState } from 'react'
import { translations } from '../i18n/translations'

const LanguageContext = createContext()

const LANGS = ['es', 'en', 'ko']
const FLAGS = { es: '🇲🇽', en: '🇺🇸', ko: '🇰🇷' }
const LABELS = { es: 'ES', en: 'EN', ko: '한국어' }

export function LanguageProvider({ children }) {
  const [lang, setLang] = useState(() => localStorage.getItem('lang') || 'es')

  const toggleLang = () => {
    const next = LANGS[(LANGS.indexOf(lang) + 1) % LANGS.length]
    setLang(next)
    localStorage.setItem('lang', next)
  }

  const t = (section, key) => translations[lang]?.[section]?.[key] ?? translations.es[section]?.[key] ?? key

  return (
    <LanguageContext.Provider value={{ lang, toggleLang, t, flags: FLAGS, labels: LABELS, langs: LANGS }}>
      {children}
    </LanguageContext.Provider>
  )
}

export const useLanguage = () => useContext(LanguageContext)
