import { describe, expect, it, vi } from 'vitest'
import { loadSaved, saveState } from './storage.js'
import { initialState } from './gameState.js'
import { RANDOM_TEAM_NAMES, STORAGE_KEY, TEAM_COLORS, TEAM_MOTIFS } from './constants.js'

function memoryStorage(initial = {}) {
  const map = new Map(Object.entries(initial))
  return {
    getItem: (k) => (map.has(k) ? map.get(k) : null),
    setItem: (k, v) => map.set(k, String(v)),
    map,
  }
}

describe('saveState', () => {
  it('запісвае стан у сховішча', () => {
    const storage = memoryStorage()
    expect(saveState(initialState, storage)).toBe(true)
    expect(JSON.parse(storage.map.get(STORAGE_KEY)).screen).toBe('setup')
  })

  it('вяртае false, калі сховішча кідае памылку', () => {
    const storage = {
      setItem: () => {
        throw new Error('quota')
      },
    }
    expect(saveState(initialState, storage)).toBe(false)
  })

  it('без сховішча вяртае true і не падае', () => {
    expect(saveState(initialState, null)).toBe(true)
  })
})

describe('loadSaved', () => {
  it('вяртае null, калі нічога не захавана або JSON сапсаваны', () => {
    expect(loadSaved(memoryStorage())).toBeNull()
    expect(loadSaved(memoryStorage({ [STORAGE_KEY]: '{oops' }))).toBeNull()
    expect(loadSaved(memoryStorage({ [STORAGE_KEY]: 'null' }))).toBeNull()
    expect(loadSaved(null)).toBeNull()
  })

  it('незавершаны раунд аднаўляецца на паўзе з адказамі і рэштай часу', () => {
    vi.useFakeTimers()
    const saved = { ...initialState, screen: 'play', current: 'хлеб', results: [{ word: 'а', guessed: true }], endsAt: Date.now() + 25_000 }
    const storage = memoryStorage({ [STORAGE_KEY]: JSON.stringify(saved) })
    const loaded = loadSaved(storage)
    expect(loaded.screen).toBe('play')
    expect(loaded.current).toBe('хлеб')
    expect(loaded.results).toEqual(saved.results)
    expect(loaded.pausedLeft).toBe(25_000)
    expect(loaded.endsAt).toBeNull()
    expect(loaded.lastWord).toBe(false)
  })

  it('экран выніку захоўваецца, невядомы — вяртаецца да наладаў', () => {
    const saved = { ...initialState, screen: 'result', results: [{ word: 'хлеб', guessed: true }] }
    expect(loadSaved(memoryStorage({ [STORAGE_KEY]: JSON.stringify(saved) }))).toMatchObject({ screen: 'result', results: saved.results })
    expect(loadSaved(memoryStorage({ [STORAGE_KEY]: JSON.stringify({ ...initialState, screen: 'wat' }) })).screen).toBe('setup')
    expect(loadSaved(memoryStorage({ [STORAGE_KEY]: JSON.stringify({ ...initialState, screen: 'finish' }) })).screen).toBe('finish')
  })

  it('дапаўняе старыя налады новымі па змаўчанні', () => {
    const saved = { screen: 'setup', settings: { level: 'hard' }, teams: [{ id: 0, name: 'Каты', score: 3 }] }
    const loaded = loadSaved(memoryStorage({ [STORAGE_KEY]: JSON.stringify(saved) }))
    expect(loaded.settings).toMatchObject({ level: 'hard', script: 'cyr', theme: 'auto', roundSeconds: 60 })
  })

  it('нармалізуе каманды: колеры з палітры, знакі паводле назваў, рахунак лікам', () => {
    const saved = {
      screen: 'ready',
      teams: [
        { id: 0, name: 'Вусы Купалы', color: '#000', motif: 'sun', score: '4', roundsPlayed: 2 },
        { id: 1, name: 'Мары Глобуса', motif: 'star', score: null },
        { id: 2, score: 1 },
      ],
      turnIndex: 7,
    }
    const storage = memoryStorage({ [STORAGE_KEY]: JSON.stringify(saved) })
    const loaded = loadSaved(storage)
    expect(loaded.teams).toHaveLength(3)
    expect(loaded.teams[0]).toMatchObject({ id: 0, name: 'Вусы Купалы', color: TEAM_COLORS[0], motif: 'kupala-mustache', score: 4, roundsPlayed: 2 })
    expect(loaded.teams[1]).toMatchObject({ name: 'Мары Глобуса', score: 0, motif: 'dream' })
    expect(RANDOM_TEAM_NAMES).toContain(loaded.teams[2].name)
    expect(loaded.teams[2].motif).toBe(TEAM_MOTIFS[loaded.teams[2].name])
    expect(loaded.turnIndex).toBe(2)
    expect(loaded.screen).toBe('ready')

    saveState(loaded, storage)
    expect(loadSaved(storage).teams).toEqual(loaded.teams)
  })

  it('назвы не са спіса (старыя стандартныя, упісаныя, паўторы) замяняюцца назвамі са спіса', () => {
    const saved = {
      screen: 'setup',
      teams: [
        { name: 'Зубры', score: 3 },
        { name: 'Вусы Купалы', score: 1 },
        { name: 'Суседзі', score: 0 },
        { name: 'Vusy Kupały', score: 0 },
        { name: 'Вусы Купалы', score: 2 },
      ],
    }
    const loaded = loadSaved(memoryStorage({ [STORAGE_KEY]: JSON.stringify(saved) }))
    const names = loaded.teams.map((team) => team.name)
    expect(names[1]).toBe('Вусы Купалы')
    names.forEach((name) => expect(RANDOM_TEAM_NAMES).toContain(name))
    expect(new Set(names).size).toBe(5)
    loaded.teams.forEach((team) => expect(team.motif).toBe(TEAM_MOTIFS[team.name]))
    expect(loaded.teams.map((team) => team.score)).toEqual([3, 1, 0, 0, 2])
  })

  it('без камандаў бярэ каманды па змаўчанні', () => {
    const loaded = loadSaved(memoryStorage({ [STORAGE_KEY]: JSON.stringify({ screen: 'setup', teams: [] }) }))
    expect(loaded.teams).toEqual(initialState.teams)
    expect(loaded.turnIndex).toBe(0)
    expect(loaded.roundNo).toBe(1)
    expect(loaded.deck).toEqual([])
  })

  it('абразае лішнія каманды да максімуму', () => {
    const teams = Array.from({ length: 9 }, (_, i) => ({ id: i, name: `К${i}`, score: 0 }))
    const loaded = loadSaved(memoryStorage({ [STORAGE_KEY]: JSON.stringify({ screen: 'setup', teams }) }))
    expect(loaded.teams).toHaveLength(5)
  })

  it('правярае налады, нумары і словы, каб сапсаванае сховішча не ламала гульню', () => {
    const saved = {
      screen: 'ready', turnIndex: 0.5, roundNo: 'Infinity',
      teams: [{ score: 'Infinity' }, { score: 2 }],
      settings: { level: {}, roundSeconds: '60', targetScore: -10, script: null, sound: 'false' },
      deckLevel: 'easy', deck: [null, {}, 'хлеб', 'хлеб', 'not-a-word'],
    }
    const loaded = loadSaved(memoryStorage({ [STORAGE_KEY]: JSON.stringify(saved) }))
    expect(loaded.settings).toEqual(initialState.settings)
    expect(loaded.turnIndex).toBe(0)
    expect(loaded.roundNo).toBe(1)
    expect(loaded.teams[0].score).toBe(0)
    expect(loaded.deck).toEqual(['хлеб'])
  })

  it.each([true, false])('аднаўляе раунд з мінулым часам паводле правіла апошняга слова (%s)', (lastWordRule) => {
    const saved = { ...initialState, screen: 'play', current: 'хлеб', endsAt: Date.now() - 10_000, settings: { ...initialState.settings, lastWordRule } }
    const loaded = loadSaved(memoryStorage({ [STORAGE_KEY]: JSON.stringify(saved) }))
    expect(loaded.screen).toBe(lastWordRule ? 'play' : 'result')
    expect(loaded.lastWord).toBe(lastWordRule)
    expect(loaded.endsAt).toBeNull()
  })

  it('раней пастаўленая паўза не губляе час пры перазагрузцы', () => {
    const saved = { ...initialState, screen: 'play', current: 'хлеб', pausedLeft: 12_300 }
    expect(loadSaved(memoryStorage({ [STORAGE_KEY]: JSON.stringify(saved) })).pausedLeft).toBe(12_300)
  })

  it('не падае, калі браўзер забараняе нават доступ да localStorage', () => {
    const descriptor = Object.getOwnPropertyDescriptor(globalThis, 'localStorage')
    Object.defineProperty(globalThis, 'localStorage', { configurable: true, get() { throw new Error('SecurityError') } })
    try {
      expect(loadSaved()).toBeNull()
      expect(saveState(initialState)).toBe(false)
    } finally {
      Object.defineProperty(globalThis, 'localStorage', descriptor)
    }
  })
})
