import { describe, expect, it } from 'vitest'
import { HINTS, getHint } from './hints.js'
import { ADULT, EASY, HARD, MEDIUM } from './words.js'
import { looksRussian } from '../test/lookalike.js'

const HINTED = Object.keys(HINTS)

const RUSSIAN = /^[а-яё][а-яё ,;().-]*$/i
const ENGLISH = /^[a-z][a-z ,;()'-]*$/i
const BELARUSIAN = /^[абвгґдеёжзійклмнопрстуўфхцчшыьэюя'’ ,-]+$/i

describe('падказкі да слоў', () => {
  it('колькасць падказак зафіксаваная', () => {
    expect(HINTED).toHaveLength(228)
  })

  it('ёсць толькі да слоў са слоўнікаў гульні', () => {
    const known = new Set([...EASY, ...MEDIUM, ...HARD, ...ADULT])
    expect(HINTED.filter((word) => !known.has(word))).toEqual([])
  })

  it('на лёгкім узроўні падказкі — толькі да зусім непадобных да расейскіх слоў, і іх меншасць', () => {
    const hinted = EASY.filter((word) => getHint(word))
    for (const word of ['пэндзаль', 'слоік', 'дыван', 'трус', 'склеп', 'шкарпэткі']) expect(hinted, word).toContain(word)
    for (const word of ['хлеб', 'малако', 'бульба', 'хата', 'сябар', 'цягнік', 'гадзіннік']) expect(getHint(word), word).toBeNull()
    expect(hinted.length / EASY.length).toBeLessThan(0.2)
  })

  it('пераклад — расейская кірыліцай і ангельская; беларускіх літар у расейскай няма', () => {
    for (const word of HINTED) {
      const hint = getHint(word)
      if (hint.note) continue
      expect(Object.keys(hint), word).toEqual(['ru', 'en'])
      expect(hint.ru, word).toMatch(RUSSIAN)
      expect(hint.ru, word).not.toMatch(/[ўі]/i)
      expect(hint.en, word).toMatch(ENGLISH)
      for (const text of [hint.ru, hint.en]) expect(text, word).toBe(text.trim())
    }
  })

  it('няма падказак да слоў, якія па-расейску пішуцца амаль гэтаксама', () => {
    const lookalikes = HINTED.filter((word) => getHint(word).ru && looksRussian(word, getHint(word).ru))
    expect(lookalikes).toEqual([])
  })

  it('няма падказак да відавочных і часта ўжываных слоў', () => {
    for (const word of ['крама', 'вежа', 'каханне', 'мара', 'чакаць', 'шукаць', 'сустрэча', 'верш', 'сэнс', 'пацалунак']) {
      expect(getHint(word), word).toBeNull()
    }
  })

  it('тлумачэнне — толькі там, дзе перакладу няма: па-беларуску, сцісла і без самога слова', () => {
    const notes = HINTED.filter((word) => getHint(word).note)
    expect(notes).toEqual(['талака', 'Дзяды', 'варыўня', 'застрэшак', 'мачэта'])
    for (const word of notes) {
      const { note } = getHint(word)
      expect(note, word).toMatch(BELARUSIAN)
      expect(note, word).not.toMatch(/[иъщ]/i)
      expect(note.length, word).toBeLessThanOrEqual(60)
      // корань слова ў тлумачэнні — гэта ўжо адказ, а не падказка
      expect(note.toLowerCase(), word).not.toContain(word.toLowerCase().slice(0, 4))
    }
  })

  it('getHint вяртае пераклад, тлумачэнне або null', () => {
    expect(getHint('рыдлёўка')).toEqual({ ru: 'лопата', en: 'spade' })
    expect(getHint('шмаравідла')).toEqual({ ru: 'смазка, лубрикант', en: 'lubricant' })
    expect(getHint('Дзяды')).toEqual({ note: 'звязана з памінальным абрадам' })
    expect(getHint('хлеб')).toBeNull()
    expect(getHint('няма такога')).toBeNull()
    expect(getHint('')).toBeNull()
    expect(getHint(null)).toBeNull()
    expect(getHint(undefined)).toBeNull()
  })

  it('не блытае словы з уласцівасцямі аб’екта', () => {
    for (const key of ['constructor', 'toString', 'hasOwnProperty', '__proto__']) expect(getHint(key)).toBeNull()
  })
})

describe('падабенства да расейскага слова', () => {
  it.each([
    ['цэп', 'цеп'],
    ['музей', 'музей'],
    ['бібліятэка', 'библиотека'],
    ['касманаўт', 'космонавт'],
    ['вадзіцель', 'водитель'],
    ['дылема', 'дилемма'],
    ['смяяцца', 'смеяться'],
    ['калючы', 'колючий'],
    ['сухі', 'сухой'],
    ['замак', 'замок (крепость)'],
    ['спакой', 'покой, спокойствие'],
    ['блядзь', 'блядь (мат)'],
  ])('%s — %s: падобныя', (word, ru) => {
    expect(looksRussian(word, ru)).toBe(true)
  })

  it.each([
    ['рыдлёўка', 'лопата'],
    ['млын', 'мельница'],
    ['вагі', 'весы'],
    ['надзея', 'надежда'],
    ['хрэсьбіны', 'крестины'],
    // другое значэнне праз «;» — падказка патрэбная дзеля яго
    ['прут', 'прут; половой член (прост.)'],
    ['таптаць', 'топтать; заниматься сексом (груб.)'],
    // пераклад са словазлучэння
    ['кросны', 'ткацкий станок'],
  ])('%s — %s: розныя', (word, ru) => {
    expect(looksRussian(word, ru)).toBe(false)
  })
})
