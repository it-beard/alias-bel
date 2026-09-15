import { makeTeams } from '../game/gameState.js'
import { RANDOM_TEAM_NAMES } from '../game/constants.js'

/**
 * Каманды з вядомымі назвамі для тэстаў: першыя назвы са спіса і зададзеныя ачкі.
 * 0 — «Вусы Мулявіна», 1 — «Крынж Еўфрасінні», 2 — «Каласы пад сярпом ШІ».
 */
export function fixedTeams(count, scores = []) {
  return makeTeams(count, RANDOM_TEAM_NAMES.slice(0, count).map((name) => ({ name }))).map((team, i) => ({
    ...team,
    score: scores[i] ?? 0,
  }))
}
