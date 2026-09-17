import { initialState, inProgress, makeTeams } from './gameState.js'
import { DEFAULT_SETTINGS, MAX_TEAMS, ROUND_TIMES, SCRIPTS, STORAGE_KEY, TARGET_SCORES, TEAM_COLORS, THEMES } from './constants.js'
import { getWords, LEVEL_ORDER } from '../data/words.js'
import { fillNames, motifForName, teamNamesFor } from './teamNames.js'

export const SCREENS = ['setup', 'ready', 'play', 'result', 'finish']

function normalizeSettings(raw = {}) {
  const settings = { ...DEFAULT_SETTINGS }
  const choices = {
    level: LEVEL_ORDER,
    roundSeconds: ROUND_TIMES,
    targetScore: TARGET_SCORES,
    script: SCRIPTS.map(({ id }) => id),
    theme: THEMES.map(({ id }) => id),
  }
  for (const [key, fallback] of Object.entries(settings)) {
    const value = raw?.[key]
    if (choices[key]?.includes(value) || (typeof fallback === 'boolean' && typeof value === 'boolean')) settings[key] = value
  }
  return settings
}

function integer(value, fallback = 0) {
  const number = Number(value)
  return Number.isSafeInteger(number) ? number : fallback
}

/**
 * Аднаўляе захаваны стан з localStorage.
 * Адказы не губляюцца пасля перазагрузкі. Актыўны раунд аднаўляецца на паўзе;
 * час у закрытай укладцы ўлічваецца, калі гульню не паставілі на паўзу загадзя.
 * Каманды нармалізуюцца: колер бярэцца з палітры, знак — паводле назвы. Назвы не са спіса
 * (старыя стандартныя, упісаныя ўручную ў ранейшых версіях, паўторы, юрлівыя па-за рэжымам 18+)
 * замяняюцца выпадковымі са спіса для выбранага ўзроўню.
 */
export function loadSaved(storage) {
  try {
    // Доступ да самога localStorage таксама можа кідаць SecurityError.
    if (storage === undefined) storage = globalThis.localStorage
    const raw = storage?.getItem(STORAGE_KEY)
    if (!raw) return null
    const saved = JSON.parse(raw)
    if (!saved || typeof saved !== 'object' || Array.isArray(saved)) return null
    const settings = normalizeSettings(saved.settings)

    const rawTeams = Array.isArray(saved.teams) ? saved.teams.slice(0, MAX_TEAMS) : []
    const pool = teamNamesFor(settings.level)
    const names = fillNames(
      rawTeams.map((team, i) => {
        const name = team?.name
        const repeated = rawTeams.slice(0, i).some((earlier) => earlier?.name === name)
        return pool.includes(name) && !repeated ? name : null
      }),
      pool,
    )
    const teams =
      rawTeams.length > 0
        ? rawTeams.map((team, i) => ({
            id: i,
            name: names[i],
            color: TEAM_COLORS[i],
            motif: motifForName(names[i]),
            score: integer(team?.score),
            ...(Number.isSafeInteger(team?.roundsPlayed) && team.roundsPlayed >= 0 ? { roundsPlayed: team.roundsPlayed } : {}),
          }))
        : pool === teamNamesFor(initialState.settings.level) ? initialState.teams : makeTeams(initialState.teams.length, [], pool)

    const screen = SCREENS.includes(saved.screen) ? saved.screen : 'setup'
    const validWords = new Set(getWords(settings.level))
    const results = Array.isArray(saved.results)
      ? saved.results.filter((result) => result && typeof result.word === 'string' && result.word.trim() && typeof result.guessed === 'boolean')
        .map(({ word, guessed }) => ({ word, guessed }))
      : []
    const loaded = {
      ...initialState,
      teams,
      settings,
      screen,
      turnIndex: Math.min(Math.max(0, integer(saved.turnIndex)), teams.length - 1),
      roundNo: Math.max(1, integer(saved.roundNo, 1)),
      deck: saved.deckLevel === settings.level && Array.isArray(saved.deck)
        ? [...new Set(saved.deck.filter((word) => validWords.has(word)))] : [],
      deckLevel: LEVEL_ORDER.includes(saved.deckLevel) ? saved.deckLevel : null,
      current: null,
      results: ['play', 'result'].includes(screen) ? results : [],
      endsAt: null,
      pausedLeft: null,
      lastWord: false,
    }

    if (screen === 'play') {
      loaded.current = validWords.has(saved.current) ? saved.current : null
      if (!loaded.current) loaded.screen = results.length ? 'result' : 'ready'
      else {
        const limit = settings.roundSeconds * 1000
        const left = Number.isFinite(saved.pausedLeft) ? saved.pausedLeft
          : Number.isFinite(saved.endsAt) ? saved.endsAt - Date.now() : 0
        if (saved.lastWord === true || left <= 0) {
          loaded.lastWord = settings.lastWordRule
          if (!loaded.lastWord) {
            loaded.screen = 'result'
            loaded.current = null
          }
        } else loaded.pausedLeft = Math.min(limit, left)
      }
    }
    loaded.gameActive = screen === 'finish' ? false
      : ['ready', 'play', 'result'].includes(screen) ||
        (typeof saved.gameActive === 'boolean' ? saved.gameActive : inProgress(loaded))
    return loaded
  } catch {
    return null
  }
}

export function saveState(state, storage) {
  try {
    if (storage === undefined) storage = globalThis.localStorage
    storage?.setItem(STORAGE_KEY, JSON.stringify(state))
    return true
  } catch {
    /* прыватны рэжым браўзера — проста не захоўваем */
    return false
  }
}
