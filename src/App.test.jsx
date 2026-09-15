import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { act, fireEvent, render, screen } from '@testing-library/react'
import App from './App.jsx'
import { initialState } from './game/gameState.js'
import { ANSWER_LOCK_MS, COUNTDOWN_STEP_MS, DEFAULT_SETTINGS, STORAGE_KEY } from './game/constants.js'
import { THEME_BG } from './theme.js'
import { advance } from './test/timers.js'

const NOW = new Date('2026-09-15T12:00:00Z').getTime()

const saved = () => JSON.parse(localStorage.getItem(STORAGE_KEY))
const seed = (state) => localStorage.setItem(STORAGE_KEY, JSON.stringify(state))

function startRound() {
  fireEvent.click(screen.getByRole('button', { name: /Пачаць раунд/ }))
  advance(COUNTDOWN_STEP_MS * 3, COUNTDOWN_STEP_MS)
}

function answer(name, times) {
  for (let i = 0; i < times; i++) {
    fireEvent.click(screen.getByRole('button', { name }))
    act(() => vi.advanceTimersByTime(ANSWER_LOCK_MS + 50))
  }
}

describe('App', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    vi.setSystemTime(NOW)
    document.head.innerHTML = '<meta name="theme-color" content="">'
    document.documentElement.removeAttribute('data-theme')
  })
  afterEach(() => vi.useRealTimers())

  it('пачынае з наладаў і захоўвае стан у localStorage', () => {
    render(<App />)
    expect(screen.getByRole('heading', { level: 1, name: 'Аліяс' })).toBeInTheDocument()
    expect(saved().screen).toBe('setup')
    fireEvent.click(screen.getByRole('radio', { name: '3' }))
    expect(saved().teams).toHaveLength(3)
    expect(document.documentElement.getAttribute('lang')).toBe('be')
  })

  it('аднаўляе захаваны стан, а незавершаны раунд вяртае да гатоўнасці', () => {
    seed({ ...initialState, screen: 'play', current: 'хлеб', endsAt: NOW + 1000, roundNo: 3 })
    render(<App />)
    expect(screen.getByText('Раунд 3')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /Пачаць раунд/ })).toBeInTheDocument()
  })

  it('сапсаваны запіс у сховішчы не ламае запуск', () => {
    localStorage.setItem(STORAGE_KEY, '{not json')
    render(<App />)
    expect(screen.getByRole('heading', { level: 1, name: 'Аліяс' })).toBeInTheDocument()
  })

  it('пераключае алфавіт на лацінку для ўсяго інтэрфейсу', () => {
    render(<App />)
    fireEvent.click(screen.getByRole('button', { name: 'Налады' }))
    fireEvent.click(screen.getByRole('radio', { name: 'Лацінка' }))
    expect(screen.getByRole('heading', { level: 1, name: 'Alias' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Pačać hulniu' })).toBeInTheDocument()
    expect(document.documentElement.getAttribute('lang')).toBe('be-Latn')
    expect(saved().settings.script).toBe('lat')
    fireEvent.click(screen.getByRole('radio', { name: 'Kirylica' }))
    expect(screen.getByRole('heading', { level: 1, name: 'Аліяс' })).toBeInTheDocument()
  })

  it('пераключае тэму і абнаўляе колер радка стану', () => {
    render(<App />)
    fireEvent.click(screen.getByRole('button', { name: 'Налады' }))
    fireEvent.click(screen.getByRole('radio', { name: 'Цёмная' }))
    expect(document.documentElement.getAttribute('data-theme')).toBe('dark')
    expect(document.querySelector('meta[name="theme-color"]').getAttribute('content')).toBe(THEME_BG.dark)
    fireEvent.click(screen.getByRole('radio', { name: 'Светлая' }))
    expect(document.documentElement.getAttribute('data-theme')).toBe('light')
    fireEvent.click(screen.getByRole('radio', { name: 'Аўта' }))
    expect(document.documentElement.hasAttribute('data-theme')).toBe(false)
  })

  it('адкрывае і зачыняе правілы', () => {
    render(<App />)
    fireEvent.click(screen.getByRole('button', { name: 'Правілы' }))
    expect(screen.getByRole('dialog', { name: 'Правілы гульні' })).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: 'Зразумела' }))
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  })

  it('поўная партыя: дзве каманды да 20 ачкоў', () => {
    seed({ ...initialState, settings: { ...DEFAULT_SETTINGS, roundSeconds: 30, targetScore: 20, sound: false, vibration: false } })
    render(<App />)

    fireEvent.click(screen.getByRole('button', { name: 'Пачаць гульню' }))
    expect(screen.getByRole('heading', { level: 2, name: 'Зубры' })).toBeInTheDocument()
    expect(screen.getByText('Раунд 1')).toBeInTheDocument()

    startRound()
    expect(screen.getByRole('timer')).toHaveTextContent('30')
    const firstWord = document.querySelector('.card__word').textContent
    expect(firstWord.length).toBeGreaterThan(1)

    answer('Адгадана', 25) // 25 × 350 мс ≈ 8,75 с
    expect(screen.getByLabelText('Ачкі за раунд')).toHaveTextContent('+25')
    advance(30_000, 500)
    expect(screen.getByRole('timer')).toHaveTextContent('Апошняе слова!')
    fireEvent.click(screen.getByRole('button', { name: 'Адгадана' }))

    expect(screen.getByText('+26')).toBeInTheDocument()
    expect(screen.getAllByRole('button', { pressed: true })).toHaveLength(26)
    fireEvent.click(screen.getByRole('button', { name: 'Далей' }))

    expect(screen.getByRole('heading', { level: 2, name: 'Буслы' })).toBeInTheDocument()
    expect(saved().teams[0].score).toBe(26)
    expect(saved().screen).toBe('ready')

    startRound()
    advance(30_000, 500)
    fireEvent.click(screen.getByRole('button', { name: 'Пас' }))
    expect(screen.getByText('-1')).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: 'Далей' }))

    expect(screen.getByText('Перамога')).toBeInTheDocument()
    expect(screen.getByRole('heading', { level: 2, name: 'Зубры' })).toBeInTheDocument()
    expect(screen.getByText('26 ачкоў за 1 раунд')).toBeInTheDocument()
    expect(saved().screen).toBe('finish')

    fireEvent.click(screen.getByRole('button', { name: 'Яшчэ раз' }))
    expect(screen.getByText('Раунд 1')).toBeInTheDocument()
    expect(saved().teams.every((t) => t.score === 0)).toBe(true)
  })

  it('паўза захоўвае час, а спыненне раунда вядзе да выніку', () => {
    seed({ ...initialState, settings: { ...DEFAULT_SETTINGS, sound: false, vibration: false } })
    render(<App />)
    fireEvent.click(screen.getByRole('button', { name: 'Пачаць гульню' }))
    startRound()
    advance(10_000, 500)
    fireEvent.click(screen.getByRole('button', { name: 'Паўза' }))
    expect(screen.getByText('Засталося 50 с')).toBeInTheDocument()
    advance(30_000, 500)
    fireEvent.click(screen.getByRole('button', { name: 'Працягнуць' }))
    expect(screen.getByRole('timer')).toHaveTextContent('50')
    fireEvent.click(screen.getByRole('button', { name: 'Паўза' }))
    fireEvent.click(screen.getByRole('button', { name: 'Спыніць раунд' }))
    expect(screen.getByText('Ніводнага слова не паказана.')).toBeInTheDocument()
  })

  it('з наладаў можна вярнуцца да незавершанай гульні', () => {
    seed({ ...initialState, settings: { ...DEFAULT_SETTINGS, sound: false }, screen: 'ready', roundNo: 2 })
    render(<App />)
    fireEvent.click(screen.getByRole('button', { name: 'Налады' }))
    expect(screen.getByRole('button', { name: 'Працягнуць' })).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: 'Працягнуць' }))
    expect(screen.getByText('Раунд 2')).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: 'Скончыць гульню' }))
    fireEvent.click(screen.getByRole('button', { name: 'Скончыць' }))
    expect(screen.getByText('Нічыя')).toBeInTheDocument()
  })
})
