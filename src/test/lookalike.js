/**
 * Ці выглядае беларускае слова амаль гэтаксама, як яго расейскі пераклад
 * («цэп» — «цеп», «бібліятэка» — «библиотека»). Да такіх слоў падказка не патрэбная.
 *
 * Абодва словы зводзяцца да агульнага «шкілета»: аканне і яканне, і/ы, э/е, ў/в, дз/д, ц/т,
 * мяккія знакі, падвоеныя літары і канчаткі прыметнікаў перастаюць адрознівацца.
 * Словы падобныя, калі рэшта адрозненняў — менш за чвэрць даўжыні.
 */

const LETTERS = { о: 'а', я: 'а', э: 'е', ё: 'е', і: 'и', ы: 'и', ю: 'у', ў: 'в', ц: 'т', щ: 'шч' }

export function skeleton(word) {
  return word
    .toLowerCase()
    .replace(/['’ьъ]/g, '')
    .replace(/(ый|ий|ой)$/, 'и')
    .replace(/(цца|ться|тся)$/, 'тса')
    .replace(/дз/g, 'д')
    .replace(/[ояэёіыюўцщ]/g, (letter) => LETTERS[letter])
    .replace(/(.)\1+/g, '$1')
}

export function distance(a, b) {
  let row = Array.from({ length: b.length + 1 }, (_, i) => i)
  for (let i = 1; i <= a.length; i++) {
    const next = [i]
    for (let j = 1; j <= b.length; j++) {
      next[j] = Math.min(row[j] + 1, next[j - 1] + 1, row[j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1))
    }
    row = next
  }
  return row[b.length]
}

/**
 * Параўноўвае слова з асноўным (першым) расейскім перакладам; дужкі з паметамі не ўлічваюцца.
 * Калі ў перакладзе праз «;» пададзеныя розныя значэнні, слова не лічыцца падобным:
 * падказка патрэбная дзеля другога значэння.
 */
export function looksRussian(word, ru) {
  if (ru.includes(';')) return false
  const main = ru.replace(/\([^)]*\)/g, '').split(',')[0].trim()
  if (!main || main.includes(' ')) return false
  const a = skeleton(word)
  const b = skeleton(main)
  return distance(a, b) / Math.max(a.length, b.length) < 0.25
}
