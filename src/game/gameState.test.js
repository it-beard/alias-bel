import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { inProgress, initialState, makeTeams, reducer, roundScore } from './gameState.js'
import { DEFAULT_SETTINGS, RANDOM_TEAM_NAMES, TEAM_COLORS, TEAM_MOTIFS } from './constants.js'
import { getWords } from '../data/words.js'

const run = (actions, from = initialState) => actions.reduce(reducer, from)

describe('makeTeams', () => {
  it('стварае каманды з назвамі са спіса, колерамі і матывамі паводле парадку', () => {
    const teams = makeTeams(5)
    expect(teams).toHaveLength(5)
    expect(new Set(teams.map((team) => team.name)).size).toBe(5)
    teams.forEach((team, i) => {
      expect(RANDOM_TEAM_NAMES).toContain(team.name)
      expect(team).toEqual({ id: i, name: team.name, color: TEAM_COLORS[i], motif: TEAM_MOTIFS[i], score: 0 })
    })
  })

  it('захоўвае назвы папярэдніх камандаў і скідае рахунак', () => {
    const previous = [{ id: 0, name: 'Вусы Купалы', score: 9 }]
    const teams = makeTeams(2, previous)
    expect(teams[0]).toMatchObject({ name: 'Вусы Купалы', score: 0 })
    expect(RANDOM_TEAM_NAMES).toContain(teams[1].name)
  })
})

describe('roundScore', () => {
  const results = [{ guessed: true }, { guessed: true }, { guessed: false }]
  it('са штрафам адымае прапушчаныя', () => expect(roundScore(results, true)).toBe(1))
  it('без штрафу лічыць толькі адгаданыя', () => expect(roundScore(results, false)).toBe(2))
  it('пусты раунд дае нуль', () => expect(roundScore([], true)).toBe(0))
})

describe('inProgress', () => {
  it('пачатковы стан — гульня не ідзе', () => expect(inProgress(initialState)).toBe(false))
  it('другі раунд, не першая каманда або ненулявы рахунак — ідзе', () => {
    expect(inProgress({ ...initialState, roundNo: 2 })).toBe(true)
    expect(inProgress({ ...initialState, turnIndex: 1 })).toBe(true)
    expect(inProgress({ ...initialState, teams: makeTeams(2).map((t) => ({ ...t, score: -1 })) })).toBe(true)
  })
})

describe('reducer: налады', () => {
  it('initialState мае налады па змаўчанні і дзве каманды', () => {
    expect(initialState.settings).toEqual(DEFAULT_SETTINGS)
    expect(initialState.teams).toHaveLength(2)
    expect(initialState.screen).toBe('setup')
  })

  it('setTeamCount мяняе колькасць камандаў, захоўваючы назвы', () => {
    const more = reducer(initialState, { type: 'setTeamCount', count: 4 })
    expect(more.teams).toHaveLength(4)
    expect(more.teams[1].name).toBe(initialState.teams[1].name)
    const fewer = reducer(more, { type: 'setTeamCount', count: 1 })
    expect(fewer.teams).toHaveLength(1)
  })

  it('перайменаваць каманду нельга: дзеянне renameTeam ігнаруецца', () => {
    expect(reducer(initialState, { type: 'renameTeam', id: 0, name: 'Каты' })).toBe(initialState)
  })

  it('setSetting змяняе адну наладу', () => {
    const next = reducer(initialState, { type: 'setSetting', key: 'script', value: 'lat' })
    expect(next.settings.script).toBe('lat')
    expect(next.settings.level).toBe('easy')
  })

  it('невядомае дзеянне вяртае той жа стан', () => {
    expect(reducer(initialState, { type: 'nope' })).toBe(initialState)
  })

  it('restore накладае захаваны стан', () => {
    const next = reducer(initialState, { type: 'restore', state: { roundNo: 4 } })
    expect(next.roundNo).toBe(4)
  })
})

describe('reducer: ход гульні', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-09-15T12:00:00Z'))
  })
  afterEach(() => vi.useRealTimers())

  it('startGame скідае рахункі, стварае калоду і адкрывае экран гатоўнасці', () => {
    const scored = { ...initialState, teams: makeTeams(2).map((t) => ({ ...t, score: 7 })), roundNo: 3, turnIndex: 1 }
    const next = reducer(scored, { type: 'startGame' })
    expect(next.screen).toBe('ready')
    expect(next.teams.every((t) => t.score === 0)).toBe(true)
    expect(next.roundNo).toBe(1)
    expect(next.turnIndex).toBe(0)
    expect(next.deck).toHaveLength(getWords('easy').length)
    expect(next.deckLevel).toBe('easy')
    expect(new Set(next.deck).size).toBe(next.deck.length)
  })

  it('startTurn бярэ слова з калоды і ставіць час заканчэння', () => {
    const ready = reducer(initialState, { type: 'startGame' })
    const play = reducer(ready, { type: 'startTurn' })
    expect(play.screen).toBe('play')
    expect(play.current).toBe(ready.deck[ready.deck.length - 1])
    expect(play.deck).toHaveLength(ready.deck.length - 1)
    expect(play.endsAt).toBe(Date.now() + 60_000)
    expect(play.results).toEqual([])
    expect(play.lastWord).toBe(false)
  })

  it('answer запісвае адзнаку і бярэ наступнае слова', () => {
    const play = run([{ type: 'startGame' }, { type: 'startTurn' }])
    const first = play.current
    const next = reducer(play, { type: 'answer', guessed: true })
    expect(next.results).toEqual([{ word: first, guessed: true }])
    expect(next.current).not.toBe(first)
    expect(next.deck).toHaveLength(play.deck.length - 1)
  })

  it('answer без бягучага слова нічога не робіць', () => {
    const play = { ...run([{ type: 'startGame' }, { type: 'startTurn' }]), current: null }
    expect(reducer(play, { type: 'answer', guessed: true })).toBe(play)
  })

  it('калода папаўняецца, калі скончылася', () => {
    const play = { ...run([{ type: 'startGame' }, { type: 'startTurn' }]), deck: [] }
    const next = reducer(play, { type: 'answer', guessed: false })
    expect(next.current).toBeTruthy()
    expect(next.deck.length).toBe(getWords('easy').length - 1)
  })

  it('timeUp з правілам апошняга слова пакідае слова на экране', () => {
    const play = run([{ type: 'startGame' }, { type: 'startTurn' }])
    const next = reducer(play, { type: 'timeUp' })
    expect(next.lastWord).toBe(true)
    expect(next.endsAt).toBeNull()
    expect(next.screen).toBe('play')
    const done = reducer(next, { type: 'answer', guessed: true })
    expect(done.screen).toBe('result')
    expect(done.current).toBeNull()
    expect(done.lastWord).toBe(false)
    expect(done.results).toHaveLength(1)
  })

  it('timeUp без правіла адразу адкрывае вынік', () => {
    const play = run([{ type: 'setSetting', key: 'lastWordRule', value: false }, { type: 'startGame' }, { type: 'startTurn' }])
    const next = reducer(play, { type: 'timeUp' })
    expect(next.screen).toBe('result')
    expect(next.current).toBeNull()
  })

  it('endRound спыняе раунд з любога стану', () => {
    const play = run([{ type: 'startGame' }, { type: 'startTurn' }, { type: 'pause' }])
    const next = reducer(play, { type: 'endRound' })
    expect(next).toMatchObject({ screen: 'result', current: null, endsAt: null, pausedLeft: null, lastWord: false })
  })

  it('pause/resume захоўваюць рэшту часу', () => {
    const play = run([{ type: 'startGame' }, { type: 'startTurn' }])
    vi.advanceTimersByTime(10_000)
    const paused = reducer(play, { type: 'pause' })
    expect(paused.pausedLeft).toBe(50_000)
    expect(paused.endsAt).toBeNull()
    expect(reducer(paused, { type: 'pause' })).toBe(paused)
    vi.advanceTimersByTime(60_000)
    const resumed = reducer(paused, { type: 'resume' })
    expect(resumed.endsAt).toBe(Date.now() + 50_000)
    expect(resumed.pausedLeft).toBeNull()
    expect(reducer(resumed, { type: 'resume' })).toBe(resumed)
  })

  it('pause не працуе падчас апошняга слова', () => {
    const last = run([{ type: 'startGame' }, { type: 'startTurn' }, { type: 'timeUp' }])
    expect(reducer(last, { type: 'pause' })).toBe(last)
  })

  it('toggleResult пераключае адзнаку слова', () => {
    const state = { ...initialState, results: [{ word: 'а', guessed: true }, { word: 'б', guessed: false }] }
    const next = reducer(state, { type: 'toggleResult', index: 1 })
    expect(next.results.map((r) => r.guessed)).toEqual([true, true])
  })

  it('commitRound налічвае ачкі і перадае ход', () => {
    const state = {
      ...run([{ type: 'startGame' }]),
      screen: 'result',
      results: [{ word: 'а', guessed: true }, { word: 'б', guessed: true }, { word: 'в', guessed: false }],
    }
    const next = reducer(state, { type: 'commitRound' })
    expect(next.teams[0].score).toBe(1)
    expect(next.turnIndex).toBe(1)
    expect(next.roundNo).toBe(1)
    expect(next.screen).toBe('ready')
    expect(next.results).toEqual([])
  })

  it('commitRound без штрафу не адымае за пас', () => {
    const state = {
      ...run([{ type: 'setSetting', key: 'skipPenalty', value: false }, { type: 'startGame' }]),
      results: [{ word: 'а', guessed: true }, { word: 'б', guessed: false }],
    }
    expect(reducer(state, { type: 'commitRound' }).teams[0].score).toBe(1)
  })

  it('пасля апошняй каманды ў крузе нумар раунда расце', () => {
    const state = { ...run([{ type: 'startGame' }]), turnIndex: 1, results: [] }
    const next = reducer(state, { type: 'commitRound' })
    expect(next.turnIndex).toBe(0)
    expect(next.roundNo).toBe(2)
  })

  it('гульня сканчаецца толькі калі мэта дасягнута і круг дагуляны', () => {
    const base = run([{ type: 'setSetting', key: 'targetScore', value: 20 }, { type: 'startGame' }])
    const results = Array.from({ length: 20 }, (_, i) => ({ word: `w${i}`, guessed: true }))
    const afterFirst = reducer({ ...base, results }, { type: 'commitRound' })
    expect(afterFirst.screen).toBe('ready')
    expect(afterFirst.teams[0].score).toBe(20)
    expect(afterFirst.turnIndex).toBe(1)
    const afterSecond = reducer({ ...afterFirst, results: [] }, { type: 'commitRound' })
    expect(afterSecond.screen).toBe('finish')
    expect(afterSecond.results).toEqual([])
  })

  it('сола-рэжым сканчаецца адразу пасля дасягнення мэты', () => {
    const base = run([
      { type: 'setTeamCount', count: 1 },
      { type: 'setSetting', key: 'targetScore', value: 20 },
      { type: 'startGame' },
    ])
    const results = Array.from({ length: 21 }, (_, i) => ({ word: `w${i}`, guessed: true }))
    expect(reducer({ ...base, results }, { type: 'commitRound' }).screen).toBe('finish')
  })

  it('finishNow і toSetup чысцяць раунд', () => {
    const play = run([{ type: 'startGame' }, { type: 'startTurn' }])
    expect(reducer(play, { type: 'finishNow' })).toMatchObject({ screen: 'finish', current: null, endsAt: null })
    expect(reducer(play, { type: 'toSetup' })).toMatchObject({ screen: 'setup', current: null, endsAt: null })
  })

  it('continueGame вяртае да экрана гатоўнасці, захоўваючы калоду таго ж узроўню', () => {
    const state = { ...run([{ type: 'startGame' }, { type: 'toSetup' }]) }
    const next = reducer(state, { type: 'continueGame' })
    expect(next.screen).toBe('ready')
    expect(next.deck).toBe(state.deck)
  })

  it('continueGame перасабірае калоду, калі ўзровень змяніўся', () => {
    const state = run([{ type: 'startGame' }, { type: 'toSetup' }, { type: 'setSetting', key: 'level', value: 'hard' }])
    const next = reducer(state, { type: 'continueGame' })
    expect(next.deck).toHaveLength(getWords('hard').length)
    expect(next.deckLevel).toBe('hard')
  })

  it('continueGame перасабірае калоду, калі яна пустая (стары захаваны стан)', () => {
    const state = { ...initialState, deck: [], deckLevel: 'easy' }
    expect(reducer(state, { type: 'continueGame' }).deck.length).toBeGreaterThan(0)
  })
})
