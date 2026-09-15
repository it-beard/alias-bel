import { initialState } from './gameState.js'
import { MAX_TEAMS, STORAGE_KEY, TEAM_COLORS, TEAM_MOTIFS, TEAM_NAMES } from './constants.js'

export const SCREENS = ['setup', 'ready', 'play', 'result', 'finish']

/**
 * Аднаўляе захаваны стан з localStorage.
 * Незавершаны раунд аднаўляць несумленна — вяртаемся да экрана гатоўнасці.
 * Каманды нармалізуюцца: колер і матыў заўсёды бяруцца з бягучай палітры.
 */
export function loadSaved(storage = globalThis.localStorage) {
  try {
    const raw = storage?.getItem(STORAGE_KEY)
    if (!raw) return null
    const saved = JSON.parse(raw)
    if (!saved || typeof saved !== 'object') return null

    const teams =
      Array.isArray(saved.teams) && saved.teams.length > 0
        ? saved.teams.slice(0, MAX_TEAMS).map((team, i) => ({
            ...team,
            id: i,
            name: typeof team?.name === 'string' ? team.name : TEAM_NAMES[i] ?? `${i + 1}`,
            color: TEAM_COLORS[i],
            motif: TEAM_MOTIFS[i],
            score: Number(team?.score) || 0,
          }))
        : initialState.teams

    const screen = saved.screen === 'play' || saved.screen === 'result' ? 'ready' : saved.screen
    return {
      ...saved,
      teams,
      settings: { ...initialState.settings, ...(saved.settings ?? {}) },
      screen: SCREENS.includes(screen) ? screen : 'setup',
      turnIndex: Math.min(Math.max(0, Number(saved.turnIndex) || 0), teams.length - 1),
      roundNo: Math.max(1, Number(saved.roundNo) || 1),
      deck: Array.isArray(saved.deck) ? saved.deck : [],
      current: null,
      results: [],
      endsAt: null,
      pausedLeft: null,
      lastWord: false,
    }
  } catch {
    return null
  }
}

export function saveState(state, storage = globalThis.localStorage) {
  try {
    storage?.setItem(STORAGE_KEY, JSON.stringify(state))
    return true
  } catch {
    /* прыватны рэжым браўзера — проста не захоўваем */
    return false
  }
}
