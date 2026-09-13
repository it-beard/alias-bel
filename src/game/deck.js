import { getWords } from '../data/words.js'

/** Тасаванне Фішэра — Ейтса (не мяняе зыходны масіў). */
export function shuffle(items) {
  const out = [...items]
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[out[i], out[j]] = [out[j], out[i]]
  }
  return out
}

export function createDeck(levelId) {
  return shuffle(getWords(levelId))
}

/**
 * Дастае наступнае слова з калоды. Калі калода скончылася —
 * тасуе нанова ўсе словы ўзроўню, каб гульня ніколі не спынялася.
 */
export function drawWord(deck, levelId) {
  const source = deck.length > 0 ? deck : createDeck(levelId)
  const rest = source.slice(0, -1)
  return { word: source[source.length - 1], deck: rest }
}
