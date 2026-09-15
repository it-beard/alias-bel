import { createDeck, drawWord } from './deck.js'
import { DEFAULT_SETTINGS, TEAM_COLORS, TEAM_MOTIFS } from './constants.js'
import { fillNames, pickRandomNames } from './teamNames.js'

/**
 * Каманды з колерамі і знакамі па парадку. Назвы бяруцца з `previous`,
 * а новыя каманды атрымліваюць выпадковыя назвы са спіса без паўтораў.
 */
export function makeTeams(count, previous = []) {
  const names = fillNames(Array.from({ length: count }, (_, i) => previous[i]?.name))
  return names.map((name, i) => ({
    id: i,
    name,
    color: TEAM_COLORS[i],
    motif: TEAM_MOTIFS[i],
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
  deckLevel: null,
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

/** Ці ёсць незавершаная гульня, да якой можна вярнуцца з наладаў. */
export function inProgress(state) {
  return state.roundNo > 1 || state.turnIndex > 0 || state.teams.some((t) => t.score !== 0)
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

    case 'randomizeTeamNames': {
      const names = pickRandomNames(
        state.teams.length,
        state.teams.map((team) => team.name),
      )
      return { ...state, teams: state.teams.map((team, i) => ({ ...team, name: names[i] })) }
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
        deckLevel: state.settings.level,
        results: [],
        current: null,
        endsAt: null,
        pausedLeft: null,
        lastWord: false,
      }
    }

    case 'continueGame': {
      const sameDeck = state.deckLevel === state.settings.level && state.deck.length > 0
      return {
        ...state,
        screen: 'ready',
        deck: sameDeck ? state.deck : createDeck(state.settings.level),
        deckLevel: state.settings.level,
        results: [],
        current: null,
        endsAt: null,
        pausedLeft: null,
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
      if (!state.current) return state
      const results = [...state.results, { word: state.current, guessed: action.guessed }]
      if (state.lastWord) {
        return { ...state, results, current: null, screen: 'result', endsAt: null, lastWord: false }
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
      if (state.pausedLeft !== null || state.lastWord) return state
      return { ...state, pausedLeft: Math.max(0, (state.endsAt ?? Date.now()) - Date.now()), endsAt: null }

    case 'resume':
      if (state.pausedLeft === null) return state
      return { ...state, endsAt: Date.now() + state.pausedLeft, pausedLeft: null }

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
