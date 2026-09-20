import { createDeck, drawWord } from './deck.js'
import { DEFAULT_SETTINGS, MAX_TEAMS, MIN_TEAMS, TEAM_COLORS } from './constants.js'
import { fillNames, motifForName, pickRandomNames, teamNamesFor } from './teamNames.js'

/**
 * Каманды з колерамі па парадку і знакамі паводле назваў. Назвы бяруцца з `previous`,
 * а новыя каманды атрымліваюць выпадковыя назвы са спіса `pool` без паўтораў.
 */
export function makeTeams(count, previous = [], pool) {
  const names = fillNames(Array.from({ length: count }, (_, i) => previous[i]?.name), pool)
  return names.map((name, i) => ({
    id: i,
    name,
    color: TEAM_COLORS[i],
    motif: motifForName(name),
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

/** Ці перахапіла агульнае апошняе слова іншая каманда: тады яно не ідзе ў залік той, што тлумачыла. */
export const isStolen = (result) => result.guessed && result.by != null

/** Ачкі за раунд паводле бягучых адзнак у спісе слоў. */
export function roundScore(results, skipPenalty) {
  const own = results.filter((r) => !isStolen(r))
  const guessed = own.filter((r) => r.guessed).length
  const skipped = own.length - guessed
  return skipPenalty ? guessed - skipped : guessed
}

/** Ці адгадваюць апошняе слова ўсе каманды: абедзве налады ўключаныя і ёсць з кім спаборнічаць. */
export function lastWordShared(state) {
  return state.settings.lastWordRule && state.settings.lastWordForAll && state.teams.length > 1
}

/**
 * Адзнака агульнага апошняга слова. `by` — індэкс каманды, якая адгадала першай;
 * у вынік ён трапляе, толькі калі гэта не тая каманда, што тлумачыла.
 */
export function sharedResult({ teams, turnIndex }, word, guessed, by) {
  const other = guessed && Number.isInteger(by) && by >= 0 && by < teams.length && by !== turnIndex
  return { word, guessed, shared: true, ...(other ? { by } : {}) }
}

/** Ці ёсць незавершаная гульня, да якой можна вярнуцца з наладаў. */
export function inProgress(state) {
  if (state.screen === 'finish') return false
  if (typeof state.gameActive === 'boolean') return state.gameActive
  return ['ready', 'play', 'result'].includes(state.screen) || state.deckLevel != null ||
    state.roundNo > 1 || state.turnIndex > 0 || state.teams.some((t) => t.score !== 0)
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
      if (!Number.isInteger(action.count) || action.count < MIN_TEAMS || action.count > MAX_TEAMS || action.count === state.teams.length) return state
      // Іншы склад каманд — новая партыя. Не пакідаем ход за выдаленай камандай.
      return { ...initialState, settings: state.settings, teams: makeTeams(action.count, state.teams, teamNamesFor(state.settings.level)), gameActive: false }

    case 'randomizeTeamNames': {
      const names = pickRandomNames(
        state.teams.length,
        state.teams.map((team) => team.name),
        teamNamesFor(state.settings.level),
      )
      return {
        ...state,
        teams: state.teams.map((team, i) => ({ ...team, name: names[i], motif: motifForName(names[i]) })),
      }
    }

    case 'setSetting': {
      const next = { ...state, settings: { ...state.settings, [action.key]: action.value } }
      const pool = teamNamesFor(next.settings.level)
      if (action.key !== 'level' || pool === teamNamesFor(state.settings.level)) return next
      // Юрлівыя назвы жывуць толькі ў рэжыме 18+: пры ўваходзе і выхадзе каманды пераназываюцца.
      const names = pickRandomNames(state.teams.length, [], pool)
      return { ...next, teams: state.teams.map((team, i) => ({ ...team, name: names[i], motif: motifForName(names[i]) })) }
    }

    case 'startGame': {
      const teams = state.teams.map((t) => ({ ...t, score: 0, roundsPlayed: 0 }))
      return {
        ...state,
        teams,
        gameActive: true,
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
        gameActive: true,
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
      if (state.screen !== 'ready') return state
      const withWord = nextWord({ ...state, results: [], lastWord: false })
      return {
        ...withWord,
        screen: 'play',
        endsAt: Date.now() + state.settings.roundSeconds * 1000,
        pausedLeft: null,
      }
    }

    case 'answer': {
      if (state.screen !== 'play' || state.pausedLeft !== null || !state.current) return state
      // Клік можа прыйсці раней за чарговы tick пасля выхаду часу (асабліва ў фоне).
      const expired = !state.lastWord && state.endsAt !== null && Date.now() >= state.endsAt
      if (expired && !state.settings.lastWordRule) {
        return { ...state, screen: 'result', current: null, endsAt: null, lastWord: false }
      }
      if (state.lastWord || expired) {
        const last = lastWordShared(state)
          ? sharedResult(state, state.current, action.guessed, action.by)
          : { word: state.current, guessed: action.guessed }
        return { ...state, results: [...state.results, last], current: null, screen: 'result', endsAt: null, lastWord: false }
      }
      return nextWord({ ...state, results: [...state.results, { word: state.current, guessed: action.guessed }] })
    }

    case 'timeUp': {
      if (state.screen !== 'play' || state.pausedLeft !== null || state.lastWord) return state
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
        results: state.results.map((r, i) => {
          if (i !== action.index) return r
          // агульнае слова без выбару каманды вяртаецца той, што тлумачыла
          return r.shared ? sharedResult(state, r.word, !r.guessed) : { ...r, guessed: !r.guessed }
        }),
      }

    case 'assignResult': {
      // хто адгадаў агульнае апошняе слова: індэкс каманды або null, калі ніхто
      if (!state.results[action.index]?.shared) return state
      return {
        ...state,
        results: state.results.map((r, i) => (i === action.index ? sharedResult(state, r.word, action.by !== null, action.by) : r)),
      }
    }

    case 'pause':
      if (state.screen !== 'play' || state.pausedLeft !== null || state.lastWord) return state
      if (state.endsAt !== null && Date.now() >= state.endsAt) return reducer(state, { type: 'timeUp' })
      return { ...state, pausedLeft: Math.max(0, (state.endsAt ?? Date.now()) - Date.now()), endsAt: null }

    case 'resume':
      if (state.screen !== 'play' || state.pausedLeft === null) return state
      return { ...state, endsAt: Date.now() + state.pausedLeft, pausedLeft: null }

    case 'commitRound': {
      if (state.screen !== 'result') return state
      const delta = roundScore(state.results, state.settings.skipPenalty)
      const teams = state.teams.map((t, i) => {
        if (i === state.turnIndex) return { ...t, score: t.score + delta, roundsPlayed: (t.roundsPlayed ?? state.roundNo - 1) + 1 }
        // перахопленае агульнае слова — ачко той камандзе, што адгадала
        const stolen = state.results.filter((r) => isStolen(r) && r.by === i).length
        return stolen ? { ...t, score: t.score + stolen } : t
      })
      const isLastInCircle = state.turnIndex === teams.length - 1
      const reached = teams.some((t) => t.score >= state.settings.targetScore)
      if (reached && isLastInCircle) {
        return { ...state, teams, gameActive: false, screen: 'finish', results: [], current: null }
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
      return { ...state, gameActive: false, screen: 'finish', results: [], current: null, endsAt: null, pausedLeft: null, lastWord: false }

    case 'toSetup':
      return { ...state, gameActive: inProgress(state), screen: 'setup', results: [], current: null, endsAt: null, pausedLeft: null, lastWord: false }

    default:
      return state
  }
}
