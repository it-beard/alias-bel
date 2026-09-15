import { RANDOM_TEAM_NAMES, TEAM_MOTIFS } from './constants.js'
import { shuffle } from './deck.js'

/** Знак залежыць ад назвы, а не ад месца каманды; для невядомай назвы — сонца. */
export function motifForName(name) {
  return Object.hasOwn(TEAM_MOTIFS, name) ? TEAM_MOTIFS[name] : 'sun'
}

/**
 * Выбірае `count` розных назваў са спіса.
 * Спачатку бярэ тыя, якіх няма ў `avoid` (бягучыя назвы), каб кожны націск даваў новы набор.
 */
export function pickRandomNames(count, avoid = []) {
  const unused = shuffle(RANDOM_TEAM_NAMES.filter((name) => !avoid.includes(name)))
  if (unused.length >= count) return unused.slice(0, count)
  const used = shuffle(RANDOM_TEAM_NAMES.filter((name) => avoid.includes(name)))
  return [...unused, ...used].slice(0, count)
}

/** Пакідае назвы-радкі як ёсць, а на месца астатніх ставіць выпадковыя назвы са спіса без паўтораў. */
export function fillNames(names) {
  const missing = names.filter((name) => typeof name !== 'string').length
  const fresh = pickRandomNames(missing, names)
  let next = 0
  return names.map((name) => (typeof name === 'string' ? name : fresh[next++]))
}
