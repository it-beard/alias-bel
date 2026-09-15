import { describe, expect, it } from 'vitest'
import { loadSaved, saveState } from './storage.js'
import { initialState } from './gameState.js'
import { STORAGE_KEY, TEAM_COLORS, TEAM_MOTIFS, TEAM_NAMES } from './constants.js'

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

  it('незавершаны раунд вяртае да экрана гатоўнасці і чысціць раунд', () => {
    const saved = { ...initialState, screen: 'play', current: 'хлеб', results: [{ word: 'а', guessed: true }], endsAt: 1 }
    const storage = memoryStorage({ [STORAGE_KEY]: JSON.stringify(saved) })
    const loaded = loadSaved(storage)
    expect(loaded.screen).toBe('ready')
    expect(loaded.current).toBeNull()
    expect(loaded.results).toEqual([])
    expect(loaded.endsAt).toBeNull()
    expect(loaded.lastWord).toBe(false)
  })

  it('экран выніку таксама вяртае да гатоўнасці, невядомы — да наладаў', () => {
    expect(loadSaved(memoryStorage({ [STORAGE_KEY]: JSON.stringify({ ...initialState, screen: 'result' }) })).screen).toBe('ready')
    expect(loadSaved(memoryStorage({ [STORAGE_KEY]: JSON.stringify({ ...initialState, screen: 'wat' }) })).screen).toBe('setup')
    expect(loadSaved(memoryStorage({ [STORAGE_KEY]: JSON.stringify({ ...initialState, screen: 'finish' }) })).screen).toBe('finish')
  })

  it('дапаўняе старыя налады новымі па змаўчанні', () => {
    const saved = { screen: 'setup', settings: { level: 'hard' }, teams: [{ id: 0, name: 'Каты', score: 3 }] }
    const loaded = loadSaved(memoryStorage({ [STORAGE_KEY]: JSON.stringify(saved) }))
    expect(loaded.settings).toMatchObject({ level: 'hard', script: 'cyr', theme: 'auto', roundSeconds: 60 })
  })

  it('нармалізуе каманды: колеры і матывы з бягучай палітры, рахунак лікам', () => {
    const saved = {
      screen: 'ready',
      teams: [
        { id: 0, name: 'Каты', color: '#000', score: '4' },
        { id: 1, name: 'Сабакі', score: null },
        { id: 2, score: 1 },
      ],
      turnIndex: 7,
    }
    const loaded = loadSaved(memoryStorage({ [STORAGE_KEY]: JSON.stringify(saved) }))
    expect(loaded.teams).toHaveLength(3)
    expect(loaded.teams[0]).toMatchObject({ id: 0, name: 'Каты', color: TEAM_COLORS[0], motif: TEAM_MOTIFS[0], score: 4 })
    expect(loaded.teams[1]).toMatchObject({ score: 0, motif: TEAM_MOTIFS[1] })
    expect(loaded.teams[2].name).toBe(TEAM_NAMES[2])
    expect(loaded.turnIndex).toBe(2)
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
})
