/**
 * Транслітарацыя беларускай кірыліцы ў лацінку (класічная беларуская лацінка).
 *
 * Правілы:
 *  - е, ё, ю, я → je, jo, ju, ja на пачатку слова, пасля галосных, ў, й і апострафа;
 *                → ie, io, iu, ia пасля зычных; → e, o, u, a пасля л (l);
 *  - л → l перад ь, і, е, ё, ю, я (і перад другім л з такім працягам), інакш ł;
 *  - зь, сь, ць, нь → ź, ś, ć, ń; ль → l; іншыя ь апускаюцца;
 *  - апостраф апускаецца, наступная ётаваная літара атрымлівае j;
 *  - г → h, х → ch, ў → ŭ, ж/ч/ш → ž/č/š, ы → y, э → e.
 * Усё, што не кірыліца (лічбы, знакі, лацінка), застаецца як ёсць.
 */

const SIMPLE = {
  а: 'a', б: 'b', в: 'v', г: 'h', ґ: 'g', д: 'd', ж: 'ž', з: 'z', і: 'i', й: 'j', к: 'k',
  м: 'm', н: 'n', о: 'o', п: 'p', р: 'r', с: 's', т: 't', у: 'u', ў: 'ŭ', ф: 'f', х: 'ch',
  ц: 'c', ч: 'č', ш: 'š', ы: 'y', э: 'e', ь: '', щ: 'šč', ъ: '', и: 'i',
}

const IOTATED = { е: 'e', ё: 'o', ю: 'u', я: 'a' }
const SOFT = { н: 'ń', с: 'ś', з: 'ź', ц: 'ć' }
const SOFTENERS = new Set(['ь', 'і', 'е', 'ё', 'ю', 'я'])
const VOWELS = new Set(['а', 'о', 'у', 'ы', 'э', 'і', 'е', 'ё', 'ю', 'я', 'и'])
const APOSTROPHES = new Set(["'", '’', 'ʼ', 'ʹ'])

const CYRILLIC = /^[Ѐ-ӿ]$/

export const isCyrillic = (ch) => typeof ch === 'string' && CYRILLIC.test(ch)
const isApostrophe = (ch) => APOSTROPHES.has(ch)
const isUpper = (ch) => ch !== undefined && ch !== ch.toLowerCase() && ch === ch.toUpperCase()

/** Ці пішацца л мякка (l), калі за ім ідуць літары `after`. */
function softL(after) {
  const [next, nextNext] = after
  if (SOFTENERS.has(next)) return true
  return next === 'л' && SOFTENERS.has(nextNext)
}

/**
 * Транслітаруе адзін кірылічны знак з улікам суседзяў (усе ў ніжнім рэгістры).
 * @param {string[]} lower  масіў знакаў у ніжнім рэгістры
 * @param {number} i        індэкс бягучага знака
 */
function pieceAt(lower, i) {
  const ch = lower[i]
  const prev = lower[i - 1]
  const next = lower[i + 1]

  if (ch in IOTATED) {
    const base = IOTATED[ch]
    if (prev === 'л') return base
    if (prev === 'ь') return lower[i - 2] === 'л' ? `i${base}` : `j${base}`
    if (isCyrillic(prev) && !VOWELS.has(prev) && prev !== 'ў' && prev !== 'й') return `i${base}`
    return `j${base}`
  }

  if (ch === 'і') return isApostrophe(prev) ? 'ji' : 'i'
  if (ch === 'л') return softL(lower.slice(i + 1, i + 3)) ? 'l' : 'ł'
  if (ch in SOFT && next === 'ь') return SOFT[ch]
  if (ch in SIMPLE) return SIMPLE[ch]
  return ch
}

/** Пераводзіць тэкст з кірыліцы ў лацінку, захоўваючы рэгістр і ўсё некірылічнае. */
export function toLatin(text) {
  if (typeof text !== 'string' || text.length === 0) return text
  const chars = [...text]
  const lower = chars.map((c) => c.toLowerCase())
  let out = ''

  for (let i = 0; i < chars.length; i++) {
    const source = chars[i]
    const ch = lower[i]

    if (isApostrophe(ch)) {
      // апостраф унутры слова апускаецца, звонку (лапкі) — застаецца
      if (isCyrillic(lower[i - 1]) && isCyrillic(lower[i + 1])) continue
      out += source
      continue
    }

    if (!isCyrillic(ch)) {
      out += source
      continue
    }

    let piece = pieceAt(lower, i)
    if (isUpper(source) && piece) {
      const capsContext =
        (isCyrillic(chars[i - 1]) && isUpper(chars[i - 1])) ||
        (isCyrillic(chars[i + 1]) && isUpper(chars[i + 1]))
      piece = capsContext ? piece.toUpperCase() : piece[0].toUpperCase() + piece.slice(1)
    }
    out += piece
  }
  return out
}

export const identity = (text) => text
