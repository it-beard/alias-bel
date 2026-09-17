import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
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

  it('па-за браўзерам (без document і window) нічога не робіць і не падае', () => {
    const root = document.documentElement
    vi.stubGlobal('document', undefined)
    vi.stubGlobal('window', undefined)
    try {
      expect(() => applyTheme('dark')).not.toThrow()
      expect(() => applyScript('lat')).not.toThrow()
      expect(prefersDark()).toBe(false)
      expect(resolveTheme('auto')).toBe('light')
    } finally {
      vi.unstubAllGlobals()
    }
    expect(root.hasAttribute('data-theme')).toBe(false)
  })

  it('аўта бярэ колер радка стану з сістэмнай тэмы', () => {
    const meta = document.querySelector('meta[name="theme-color"]')
    vi.spyOn(window, 'matchMedia').mockReturnValue({ matches: true })
    applyTheme('auto')
    expect(meta.getAttribute('content')).toBe(THEME_BG.dark)
    expect(document.documentElement.hasAttribute('data-theme')).toBe(false)
    vi.mocked(window.matchMedia).mockReturnValue({ matches: false })
    applyTheme('auto')
    expect(meta.getAttribute('content')).toBe(THEME_BG.light)
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

describe('палітра', () => {
  const css = readFileSync(resolve(process.cwd(), 'src/index.css'), 'utf8')
  // тры блокі токенаў: светлы, цёмны сістэмны і цёмны выбраны ўручную
  const blocks = css.split(/(?=^\s*:root)/m).filter((block) => block.includes('--bg:'))
  const token = (block, name) => block.match(new RegExp(`--${name}:\\s*(#[0-9a-f]{6})`, 'i'))?.[1]
  const luminance = (hex) => {
    const [r, g, b] = [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16) / 255).map((c) => (c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4))
    return 0.2126 * r + 0.7152 * g + 0.0722 * b
  }
  const contrast = (a, b) => {
    const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x)
    return (hi + 0.05) / (lo + 0.05)
  }

  it('надпіс «18+» у перамыкачы чытаецца і ў светлай, і ў цёмнай тэме (WCAG AA)', () => {
    expect(blocks).toHaveLength(3)
    for (const block of blocks) {
      expect(token(block, 'adult'), block.slice(0, 40)).toBeTruthy()
      expect(contrast(token(block, 'adult'), token(block, 'surface-2'))).toBeGreaterThanOrEqual(4.5)
    }
    expect(token(blocks[1], 'adult')).toBe(token(blocks[2], 'adult'))
  })

  it('тэкст на «небяспечнай» кнопцы чытаецца ў абедзвюх тэмах (WCAG AA)', () => {
    for (const block of blocks) {
      expect(contrast(token(block, 'on-bad'), token(block, 'bad'))).toBeGreaterThanOrEqual(4.5)
    }
    expect(token(blocks[1], 'on-bad')).toBe(token(blocks[2], 'on-bad'))
  })
})
