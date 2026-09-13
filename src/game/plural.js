/**
 * Форма назоўніка пры лічэбніку: 1 слова, 2 словы, 5 слоў.
 * @param {number} n
 * @param {string} one   форма для 1 (21, 31…)
 * @param {string} few   форма для 2–4 (22, 23…)
 * @param {string} many  форма для 5–20 і астатніх
 */
export function plural(n, one, few, many) {
  const abs = Math.abs(n)
  const mod10 = abs % 10
  const mod100 = abs % 100
  if (mod10 === 1 && mod100 !== 11) return one
  if (mod10 >= 2 && mod10 <= 4 && (mod100 < 12 || mod100 > 14)) return few
  return many
}

export const words = (n) => `${n} ${plural(n, 'слова', 'словы', 'слоў')}`
export const points = (n) => `${n} ${plural(n, 'ачко', 'ачкі', 'ачкоў')}`
export const rounds = (n) => `${n} ${plural(n, 'раунд', 'раунды', 'раундаў')}`
