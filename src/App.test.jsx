import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { act, createEvent, fireEvent, render, screen, within } from '@testing-library/react'
import App from './App.jsx'
import { initialState } from './game/gameState.js'
import { ADULT } from './data/words.js'
import { ADULT_TEAM_NAMES, ANSWER_LOCK_MS, COUNTDOWN_STEP_MS, DEFAULT_SETTINGS, RANDOM_TEAM_NAMES, STORAGE_KEY, TEAM_MOTIFS } from './game/constants.js'
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

  it('у рэжыме 18+ каманды атрымліваюць юрлівыя назвы, а па-за ім — звычайныя', () => {
    render(<App />)
    fireEvent.click(screen.getByRole('radio', { name: '18+' }))
    teamNames().forEach((name) => expect(RANDOM_TEAM_NAMES).toContain(name))
    fireEvent.click(screen.getByRole('button', { name: 'Так, мне ёсць 18' }))
    const hot = teamNames()
    hot.forEach((name) => expect(ADULT_TEAM_NAMES).toContain(name))
    expect(saved().teams.map((team) => team.name)).toEqual(hot)
    within(screen.getByRole('list', { name: 'Каманды' })).getAllByRole('listitem').forEach((item) => {
      expect(item.querySelector('svg')).toHaveAttribute('data-motif', TEAM_MOTIFS[item.textContent])
    })

    fireEvent.click(screen.getByRole('button', { name: /Выпадковыя назвы/ }))
    teamNames().forEach((name) => expect(ADULT_TEAM_NAMES).toContain(name))

    fireEvent.click(screen.getByRole('radio', { name: 'Лёгкі' }))
    teamNames().forEach((name) => expect(RANDOM_TEAM_NAMES).toContain(name))
  })

  it('пераход на 18+ пасярод партыі захоўвае рахунак і дае дарослыя словы', () => {
    seed({
      ...initialState,
      settings: { ...DEFAULT_SETTINGS, sound: false, vibration: false },
      teams: fixedTeams(2, [12, 7]),
      screen: 'ready',
      roundNo: 3,
      deckLevel: 'easy',
      deck: ['хлеб', 'соль'],
    })
    render(<App />)
    fireEvent.click(screen.getByRole('button', { name: 'Налады' }))
    fireEvent.click(screen.getByRole('radio', { name: '18+' }))
    fireEvent.click(screen.getByRole('button', { name: 'Так, мне ёсць 18' }))
    expect(saved().teams.map((team) => team.score)).toEqual([12, 7])
    saved().teams.forEach((team) => expect(ADULT_TEAM_NAMES).toContain(team.name))

    fireEvent.click(screen.getByRole('button', { name: 'Працягнуць' }))
    expect(screen.getByText(/^Раунд 3/)).toHaveTextContent('Раунд 3 18+')
    expect(saved().deckLevel).toBe('adult')
    startRound()
    expect(ADULT).toContain(saved().current)
    expect(screen.getByText(saved().current)).toBeInTheDocument()
    expect(document.querySelector('.card__adult')).toBeInTheDocument()
    saved().deck.forEach((word) => expect(ADULT).toContain(word))
  })

  it('захаваны рэжым 18+ аднаўляецца без паўторнага пытання пра ўзрост', () => {
    seed({ ...initialState, settings: { ...DEFAULT_SETTINGS, level: 'adult' }, teams: [{ name: 'Мара Глобуса', score: 0 }, { name: 'Дудка Багушэвіча', score: 0 }] })
    render(<App />)
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    expect(screen.getByRole('radio', { name: '18+' })).toHaveAttribute('aria-checked', 'true')
    expect(teamNames()).toEqual(['Мара Глобуса', 'Дудка Багушэвіча'])
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

  it('аднаўляе захаваны раунд на паўзе', () => {
    seed({ ...initialState, screen: 'play', current: 'хлеб', endsAt: NOW + 1000, roundNo: 3 })
    render(<App />)
    expect(screen.getByRole('dialog', { name: 'Паўза' })).toBeInTheDocument()
    expect(screen.getByText('Засталося 1 с')).toBeInTheDocument()
    expect(saved().roundNo).toBe(3)
    fireEvent.click(screen.getByRole('button', { name: 'Працягнуць' }))
    expect(screen.getByText('хлеб')).toBeVisible()
  })

  it('сапсаваны запіс у сховішчы не ламае запуск', () => {
    localStorage.setItem(STORAGE_KEY, '{not json')
    render(<App />)
    expect(screen.getByRole('heading', { level: 1, name: 'Аліяс' })).toBeInTheDocument()
  })

  it('пераключае алфавіт на лацінку для ўсяго інтэрфейсу', () => {
    render(<App />)
    const logos = [...screen.getByRole('list', { name: 'Каманды' }).querySelectorAll('[data-motif]')]
      .map((svg) => svg.outerHTML)
    fireEvent.click(screen.getByRole('button', { name: 'Налады' }))
    expect(document.title).toBe('Аліяс па-беларуску — анлайн-гульня ў словы')
    fireEvent.click(screen.getByRole('radio', { name: 'Лацінка' }))
    expect(screen.getByRole('heading', { level: 1, name: 'Alias' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Pačać hulniu' })).toBeInTheDocument()
    expect(document.documentElement.getAttribute('lang')).toBe('be-Latn')
    expect(document.title).toBe('Alias pa-biełarusku — anłajn-hulnia ŭ słovy')
    expect(saved().settings.script).toBe('lat')
    expect(teamNames('Kamandy')).toEqual(saved().teams.map((team) => toLatin(team.name)))
    expect([...screen.getByRole('list', { name: 'Kamandy' }).querySelectorAll('[data-motif]')]
      .map((svg) => svg.outerHTML)).toEqual(logos)
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

  it('у рэжыме «аўта» сочыць за сістэмнай тэмай і перастае, калі тэма выбраная ўручную', () => {
    const listeners = new Set()
    const query = {
      matches: false,
      addEventListener: vi.fn((type, listener) => listeners.add(listener)),
      removeEventListener: vi.fn((type, listener) => listeners.delete(listener)),
    }
    vi.spyOn(window, 'matchMedia').mockReturnValue(query)
    const meta = () => document.querySelector('meta[name="theme-color"]').getAttribute('content')

    render(<App />)
    expect(window.matchMedia).toHaveBeenCalledWith('(prefers-color-scheme: dark)')
    expect(query.addEventListener).toHaveBeenCalledWith('change', expect.any(Function))
    expect(meta()).toBe(THEME_BG.light)

    query.matches = true
    act(() => listeners.forEach((listener) => listener({ matches: true })))
    expect(meta()).toBe(THEME_BG.dark)
    expect(document.documentElement.hasAttribute('data-theme')).toBe(false)

    fireEvent.click(screen.getByRole('button', { name: 'Налады' }))
    fireEvent.click(screen.getByRole('radio', { name: 'Светлая' }))
    expect(listeners.size).toBe(0)
    expect(meta()).toBe(THEME_BG.light)
  })

  it('без matchMedia тэма «аўта» проста светлая', () => {
    vi.stubGlobal('matchMedia', undefined)
    try {
      expect(() => render(<App />)).not.toThrow()
      expect(document.querySelector('meta[name="theme-color"]').getAttribute('content')).toBe(THEME_BG.light)
    } finally {
      vi.unstubAllGlobals()
    }
  })

  it('захаваныя тэма і алфавіт дзейнічаюць адразу пры запуску', () => {
    seed({ ...initialState, settings: { ...DEFAULT_SETTINGS, theme: 'dark', script: 'lat' } })
    render(<App />)
    expect(document.documentElement.getAttribute('data-theme')).toBe('dark')
    expect(document.documentElement.getAttribute('lang')).toBe('be-Latn')
    expect(screen.getByRole('heading', { level: 1, name: 'Alias' })).toBeInTheDocument()
  })

  it('выпадковыя назвы і іх лагатыпы захоўваюцца і пераходзяць у гульню', () => {
    render(<App />)
    fireEvent.click(screen.getByRole('button', { name: 'Выпадковыя назвы' }))
    const [first, second] = teamNames()
    expect(RANDOM_TEAM_NAMES).toContain(first)
    expect(RANDOM_TEAM_NAMES).toContain(second)
    expect(first).not.toBe(second)
    expect(saved().teams.map((t) => t.name)).toEqual([first, second])
    const items = within(screen.getByRole('list', { name: 'Каманды' })).getAllByRole('listitem')
    items.forEach((item) => {
      expect(item.querySelector('svg')).toHaveAttribute('data-motif', TEAM_MOTIFS[item.textContent])
    })

    fireEvent.click(screen.getByRole('radio', { name: '3' }))
    const third = teamNames()[2]
    expect(RANDOM_TEAM_NAMES).toContain(third)
    expect([first, second]).not.toContain(third)

    fireEvent.click(screen.getByRole('button', { name: 'Пачаць гульню' }))
    expect(screen.getByRole('heading', { level: 2, name: first })).toBeInTheDocument()
    expect(screen.getByRole('img', { name: 'Знак каманды' })).toHaveAttribute('data-motif', TEAM_MOTIFS[first])
  })

  it('адкрывае і зачыняе правілы', () => {
    render(<App />)
    fireEvent.click(screen.getByRole('button', { name: 'Правілы' }))
    expect(screen.getByRole('dialog', { name: 'Правілы гульні' })).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: 'Зразумела' }))
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  })

  it('правілы даступныя і перад раундам, а Escape іх зачыняе', () => {
    seed({ ...initialState, screen: 'ready', settings: { ...DEFAULT_SETTINGS, sound: false } })
    render(<App />)
    fireEvent.click(screen.getByRole('button', { name: 'Правілы' }))
    const dialog = screen.getByRole('dialog', { name: 'Правілы гульні' })
    fireEvent(dialog, createEvent('cancel', dialog, { cancelable: true }))
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    expect(screen.getByRole('button', { name: /Пачаць раунд/ })).toBeInTheDocument()
  })

  it('экран з main адпавядае этапу гульні', () => {
    seed({ ...initialState, settings: { ...DEFAULT_SETTINGS, sound: false, vibration: false } })
    render(<App />)
    const main = screen.getByRole('main')
    expect(main).toHaveAttribute('data-screen', 'setup')
    fireEvent.click(screen.getByRole('button', { name: 'Пачаць гульню' }))
    expect(main).toHaveAttribute('data-screen', 'ready')
    startRound()
    expect(main).toHaveAttribute('data-screen', 'play')
    fireEvent.click(screen.getByRole('button', { name: 'Паўза' }))
    fireEvent.click(screen.getByRole('button', { name: 'Спыніць раунд' }))
    expect(main).toHaveAttribute('data-screen', 'result')
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
    expect(screen.getByText('Пакуль няма адказаў.')).toBeInTheDocument()
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
