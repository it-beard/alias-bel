import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { act, fireEvent, render, screen, within } from '@testing-library/react'
import App from './App.jsx'
import { initialState } from './game/gameState.js'
import { ANSWER_LOCK_MS, COUNTDOWN_STEP_MS, DEFAULT_SETTINGS, RANDOM_TEAM_NAMES, STORAGE_KEY } from './game/constants.js'
import { THEME_BG } from './theme.js'
import { fixedTeams } from './test/fixtures.js'
import { toLatin } from './i18n/latin.js'
import { advance } from './test/timers.js'

const NOW = new Date('2026-09-15T12:00:00Z').getTime()

const saved = () => JSON.parse(localStorage.getItem(STORAGE_KEY))
const seed = (state) => localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
const teamNames = (label = 'Каманды') =>
  within(screen.getByRole('list', { name: label }))
    .getAllByRole('listitem')
    .map((item) => item.textContent)

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

  it('без захаванага стану каманды атрымліваюць назвы толькі са спіса', () => {
    render(<App />)
    const names = teamNames()
    names.forEach((name) => expect(RANDOM_TEAM_NAMES).toContain(name))
    expect(names[0]).not.toBe(names[1])
  })

  it('старыя стандартныя назвы з захаванай гульні замяняюцца назвамі са спіса', () => {
    seed({ ...initialState, teams: [{ id: 0, name: 'Зубры', score: 4 }, { id: 1, name: 'Буслы', score: 2 }] })
    render(<App />)
    const [first, second] = teamNames()
    expect(RANDOM_TEAM_NAMES).toContain(first)
    expect(RANDOM_TEAM_NAMES).toContain(second)
    expect(saved().teams.map((t) => ({ name: t.name, score: t.score }))).toEqual([
      { name: first, score: 4 },
      { name: second, score: 2 },
    ])
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
    expect(document.title).toBe('Аліяс па-беларуску — анлайн-гульня ў словы')
    fireEvent.click(screen.getByRole('radio', { name: 'Лацінка' }))
    expect(screen.getByRole('heading', { level: 1, name: 'Alias' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Pačać hulniu' })).toBeInTheDocument()
    expect(document.documentElement.getAttribute('lang')).toBe('be-Latn')
    expect(document.title).toBe('Alias pa-biełarusku — anłajn-hulnia ŭ słovy')
    expect(saved().settings.script).toBe('lat')
    expect(teamNames('Kamandy')).toEqual(saved().teams.map((team) => toLatin(team.name)))
    teamNames('Kamandy').forEach((name) => expect(name).not.toMatch(/[\u0400-\u04ff]/))
    fireEvent.click(screen.getByRole('radio', { name: 'Kirylica' }))
    expect(screen.getByRole('heading', { level: 1, name: 'Аліяс' })).toBeInTheDocument()
    expect(document.title).toBe('Аліяс па-беларуску — анлайн-гульня ў словы')
    expect(teamNames()[0]).toBe(saved().teams[0].name)
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

  it('выпадковыя назвы трапляюць у палі, захоўваюцца і пераходзяць у гульню', () => {
    render(<App />)
    fireEvent.click(screen.getByRole('button', { name: 'Выпадковыя назвы' }))
    const [first, second] = teamNames()
    expect(RANDOM_TEAM_NAMES).toContain(first)
    expect(RANDOM_TEAM_NAMES).toContain(second)
    expect(first).not.toBe(second)
    expect(saved().teams.map((t) => t.name)).toEqual([first, second])

    fireEvent.click(screen.getByRole('radio', { name: '3' }))
    const third = teamNames()[2]
    expect(RANDOM_TEAM_NAMES).toContain(third)
    expect([first, second]).not.toContain(third)

    fireEvent.click(screen.getByRole('button', { name: 'Пачаць гульню' }))
    expect(screen.getByRole('heading', { level: 2, name: first })).toBeInTheDocument()
  })

  it('адкрывае і зачыняе правілы', () => {
    render(<App />)
    fireEvent.click(screen.getByRole('button', { name: 'Правілы' }))
    expect(screen.getByRole('dialog', { name: 'Правілы гульні' })).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: 'Зразумела' }))
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  })

  it('поўная партыя: дзве каманды да 20 ачкоў', () => {
    seed({ ...initialState, teams: fixedTeams(2), settings: { ...DEFAULT_SETTINGS, roundSeconds: 30, targetScore: 20, sound: false, vibration: false } })
    render(<App />)

    fireEvent.click(screen.getByRole('button', { name: 'Пачаць гульню' }))
    expect(screen.getByRole('heading', { level: 2, name: 'Вусы Мулявіна' })).toBeInTheDocument()
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

    expect(screen.getByRole('heading', { level: 2, name: 'Крынж Еўфрасінні' })).toBeInTheDocument()
    expect(saved().teams[0].score).toBe(26)
    expect(saved().screen).toBe('ready')

    startRound()
    advance(30_000, 500)
    fireEvent.click(screen.getByRole('button', { name: 'Пас' }))
    expect(screen.getByText('-1')).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: 'Далей' }))

    expect(screen.getByText('Перамога')).toBeInTheDocument()
    expect(screen.getByRole('heading', { level: 2, name: 'Вусы Мулявіна' })).toBeInTheDocument()
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
