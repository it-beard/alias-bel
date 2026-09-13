import { createDeck, drawWord } from './deck.js'
import { DEFAULT_SETTINGS, TEAM_COLORS, TEAM_NAMES } from './constants.js'

export function makeTeams(count, previous = []) {
  return Array.from({ length: count }, (_, i) => ({
    id: i,
    name: previous[i]?.name ?? TEAM_NAMES[i],
    color: TEAM_COLORS[i],
    score: 0,
  }))
}

export const initialState = {
  screen: 'setup',
  settings: { ...DEFAULT_SETTINGS },
  teams: makeTeams(2),
  turnIndex: 0,
  roundNo: 1,
  deck: [],
  current: null,
  results: [],
  endsAt: null,
  pausedLeft: null,
  lastWord: false,
}

/** Ачкі за раунд паводле бягучых адзнак у спісе слоў. */
export function roundScore(results, skipPenalty) {
  const guessed = results.filter((r) => r.guessed).length
  const skipped = results.length - guessed
  return skipPenalty ? guessed - skipped : guessed
}

function nextWord(state) {
  const { word, deck } = drawWord(state.deck, state.settings.level)
  return { ...state, current: word, deck }
}

export function reducer(state, action) {
  switch (action.type) {
    case 'restore':
      return { ...state, ...action.state }

    case 'setTeamCount':
      return { ...state, teams: makeTeams(action.count, state.teams) }

    case 'renameTeam':
      return {
        ...state,
        teams: state.teams.map((t) => (t.id === action.id ? { ...t, name: action.name } : t)),
      }

    case 'setSetting':
      return { ...state, settings: { ...state.settings, [action.key]: action.value } }

    case 'startGame': {
      const teams = state.teams.map((t) => ({ ...t, score: 0 }))
      return {
        ...state,
        teams,
        screen: 'ready',
        turnIndex: 0,
        roundNo: 1,
        deck: createDeck(state.settings.level),
        results: [],
        current: null,
        lastWord: false,
      }
    }

    case 'startTurn': {
      const withWord = nextWord({ ...state, results: [], lastWord: false })
      return {
        ...withWord,
        screen: 'play',
        endsAt: Date.now() + state.settings.roundSeconds * 1000,
        pausedLeft: null,
      }
    }

    case 'answer': {
      const results = [...state.results, { word: state.current, guessed: action.guessed }]
      if (state.lastWord) {
        return { ...state, results, current: null, screen: 'result', endsAt: null }
      }
      return nextWord({ ...state, results })
    }

    case 'timeUp': {
      if (state.settings.lastWordRule && state.current) {
        return { ...state, lastWord: true, endsAt: null }
      }
      return { ...state, screen: 'result', current: null, endsAt: null, lastWord: false }
    }

    case 'endRound':
      return { ...state, screen: 'result', current: null, endsAt: null, pausedLeft: null, lastWord: false }

    case 'toggleResult':
      return {
        ...state,
        results: state.results.map((r, i) => (i === action.index ? { ...r, guessed: !r.guessed } : r)),
      }

    case 'pause':
      return { ...state, pausedLeft: Math.max(0, (state.endsAt ?? Date.now()) - Date.now()), endsAt: null }

    case 'resume':
      return { ...state, endsAt: Date.now() + (state.pausedLeft ?? 0), pausedLeft: null }

    case 'commitRound': {
      const delta = roundScore(state.results, state.settings.skipPenalty)
      const teams = state.teams.map((t, i) => (i === state.turnIndex ? { ...t, score: t.score + delta } : t))
      const isLastInCircle = state.turnIndex === teams.length - 1
      const reached = teams.some((t) => t.score >= state.settings.targetScore)
      if (reached && isLastInCircle) {
        return { ...state, teams, screen: 'finish', results: [], current: null }
      }
      return {
        ...state,
        teams,
        screen: 'ready',
        results: [],
        current: null,
        turnIndex: isLastInCircle ? 0 : state.turnIndex + 1,
        roundNo: isLastInCircle ? state.roundNo + 1 : state.roundNo,
      }
    }

    case 'finishNow':
      return { ...state, screen: 'finish', results: [], current: null, endsAt: null, pausedLeft: null }

    case 'toSetup':
      return { ...state, screen: 'setup', results: [], current: null, endsAt: null, pausedLeft: null }

    default:
      return state
  }
}
