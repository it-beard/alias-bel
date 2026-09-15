import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { render } from '@testing-library/react'
import SetupScreen from './components/SetupScreen.jsx'
import ReadyScreen from './components/ReadyScreen.jsx'
import PlayScreen from './components/PlayScreen.jsx'
import RoundResultScreen from './components/RoundResultScreen.jsx'
import FinishScreen from './components/FinishScreen.jsx'
import RulesSheet from './components/RulesSheet.jsx'
import { initialState, makeTeams } from './game/gameState.js'
import { ScriptContext } from './i18n/script.js'

vi.mock('./game/feedback.js', () => ({
  unlockAudio: vi.fn(),
  vibrate: vi.fn(),
  sounds: { win: vi.fn(), tick: vi.fn(), start: vi.fn(), correct: vi.fn(), skip: vi.fn(), timeUp: vi.fn() },
}))

const NOW = new Date('2026-09-15T12:00:00Z').getTime()
const teams = makeTeams(3).map((t, i) => ({ ...t, score: [12, 7, 20][i] }))
const noop = () => {}

const states = {
  setup: { ...initialState, teams: makeTeams(2) },
  ready: { ...initialState, screen: 'ready', teams, roundNo: 2, turnIndex: 1 },
  play: { ...initialState, screen: 'play', teams, current: 'вясёлка', deck: ['соль'], endsAt: NOW + 42_000, results: [{ word: 'хлеб', guessed: true }] },
  result: { ...initialState, screen: 'result', teams, results: [{ word: 'хлеб', guessed: true }, { word: 'соль', guessed: false }] },
  finish: { ...initialState, screen: 'finish', teams, roundNo: 3 },
}

const screens = {
  setup: (state) => <SetupScreen state={state} dispatch={noop} onRules={noop} />,
  ready: (state) => <ReadyScreen state={state} dispatch={noop} onRules={noop} />,
  play: (state) => <PlayScreen state={state} dispatch={noop} />,
  result: (state) => <RoundResultScreen state={state} dispatch={noop} />,
  finish: (state) => <FinishScreen state={state} dispatch={noop} />,
}

describe('снапшоты экранаў', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    vi.setSystemTime(NOW)
  })
  afterEach(() => vi.useRealTimers())

  for (const script of ['cyr', 'lat']) {
    for (const [name, make] of Object.entries(screens)) {
      it(`${name} (${script})`, () => {
        const state = { ...states[name], settings: { ...initialState.settings, script } }
        const { container } = render(<ScriptContext.Provider value={script}>{make(state)}</ScriptContext.Provider>)
        expect(container.firstChild).toMatchSnapshot()
      })
    }
    it(`rules (${script})`, () => {
      const { container } = render(
        <ScriptContext.Provider value={script}>
          <RulesSheet onClose={noop} />
        </ScriptContext.Provider>,
      )
      expect(container.firstChild).toMatchSnapshot()
    })
  }
})
