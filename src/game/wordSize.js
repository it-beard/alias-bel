/**
 * Памер слова на картцы паводле даўжыні: s — кароткае, xl — вельмі доўгае.
 * Самі кеглі зададзеныя ў CSS (.card__word[data-len]) у адзінках шырыні карткі.
 */
export function wordSize(word) {
  const n = (word ?? '').length
  if (n <= 7) return 's'
  if (n <= 11) return 'm'
  if (n <= 15) return 'l'
  return 'xl'
}
