/** Колеры фону для радка стану браўзера (meta theme-color). */
export const THEME_BG = { light: '#f4eee2', dark: '#17141a' }

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

/** Мова дакумента: be або be-Latn — уплывае на пераносы і чытанне з экрана. */
export function applyScript(script, doc = typeof document !== 'undefined' ? document : null) {
  if (!doc) return
  doc.documentElement.setAttribute('lang', script === 'lat' ? 'be-Latn' : 'be')
}
