import { beforeEach, describe, expect, it, vi } from 'vitest'
import { THEME_BG, applyScript, applyTheme, prefersDark, resolveTheme } from './theme.js'
import { APP_TITLE } from './game/constants.js'

describe('тэма', () => {
  beforeEach(() => {
    document.head.innerHTML = '<meta name="theme-color" content="">'
    document.documentElement.removeAttribute('data-theme')
  })

  it('resolveTheme: светлая/цёмная як ёсць, аўта — з сістэмы', () => {
    expect(resolveTheme('light')).toBe('light')
    expect(resolveTheme('dark')).toBe('dark')
    vi.spyOn(window, 'matchMedia').mockReturnValue({ matches: true })
    expect(prefersDark()).toBe(true)
    expect(resolveTheme('auto')).toBe('dark')
  })

  it('без matchMedia сістэмная тэма лічыцца светлай', () => {
    vi.stubGlobal('matchMedia', undefined)
    expect(prefersDark()).toBe(false)
    expect(resolveTheme('auto')).toBe('light')
    vi.unstubAllGlobals()
  })

  it('applyTheme ставіць data-theme і theme-color', () => {
    applyTheme('dark')
    expect(document.documentElement.getAttribute('data-theme')).toBe('dark')
    expect(document.querySelector('meta[name="theme-color"]').getAttribute('content')).toBe(THEME_BG.dark)
    applyTheme('light')
    expect(document.documentElement.getAttribute('data-theme')).toBe('light')
    expect(document.querySelector('meta[name="theme-color"]').getAttribute('content')).toBe(THEME_BG.light)
    applyTheme('auto')
    expect(document.documentElement.hasAttribute('data-theme')).toBe(false)
  })

  it('applyTheme без дакумента і без meta не падае', () => {
    expect(() => applyTheme('dark', null)).not.toThrow()
    document.head.innerHTML = ''
    expect(() => applyTheme('dark')).not.toThrow()
  })

  it('applyScript ставіць мову дакумента і загаловак укладкі', () => {
    applyScript('lat')
    expect(document.documentElement.getAttribute('lang')).toBe('be-Latn')
    expect(document.title).toBe('Alias pa-biełarusku — anłajn-hulnia ŭ słovy')
    applyScript('cyr')
    expect(document.documentElement.getAttribute('lang')).toBe('be')
    expect(document.title).toBe(APP_TITLE.cyr)
    expect(() => applyScript('lat', null)).not.toThrow()
  })

  it('колеры радка стану супадаюць з фонам тэм', () => {
    expect(THEME_BG).toEqual({ light: '#f6f3ee', dark: '#141215' })
  })
})
