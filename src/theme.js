import { APP_TITLE } from './game/constants.js'

/** Колеры фону для радка стану браўзера (meta theme-color), як --bg у index.css. */
export const THEME_BG = { light: '#f6f3ee', dark: '#141215' }

export function prefersDark() {
  return typeof window !== 'undefined' && !!window.matchMedia?.('(prefers-color-scheme: dark)').matches
}

/** Вырашае, якая тэма дзейнічае: «аўта» бярэ сістэмную. */
export function resolveTheme(theme) {
  if (theme === 'light' || theme === 'dark') return theme
  return prefersDark() ? 'dark' : 'light'
}

/** Ставіць data-theme на <html> і абнаўляе theme-color. */
export function applyTheme(theme, doc = typeof document !== 'undefined' ? document : null) {
  if (!doc) return
  const root = doc.documentElement
  if (theme === 'light' || theme === 'dark') root.setAttribute('data-theme', theme)
  else root.removeAttribute('data-theme')
  const meta = doc.querySelector('meta[name="theme-color"]')
  if (meta) meta.setAttribute('content', THEME_BG[resolveTheme(theme)])
}

/** Мова дакумента (be або be-Latn) і загаловак укладкі ў выбраным алфавіце. */
export function applyScript(script, doc = typeof document !== 'undefined' ? document : null) {
  if (!doc) return
  const lat = script === 'lat'
  doc.documentElement.setAttribute('lang', lat ? 'be-Latn' : 'be')
  doc.title = lat ? APP_TITLE.lat : APP_TITLE.cyr
}
