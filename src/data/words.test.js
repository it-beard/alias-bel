import { describe, expect, it } from 'vitest'
import { EASY, HARD, LEVELS, LEVEL_ORDER, MEDIUM, getWords } from './words.js'

const LETTERS = "абвгґдеёжзійклмнопрстуўфхцчшыьэюя'’"
// уласныя назвы (Каляды, Купалле) могуць пачынацца з вялікай літары; дэфіс — для складаных слоў
const BELARUSIAN = new RegExp(`^[${LETTERS}${LETTERS.toUpperCase()}][${LETTERS}\\-]*$`)

describe('слоўнікі', () => {
  it('колькасць слоў зафіксаваная', () => {
    expect(EASY).toHaveLength(340)
    expect(MEDIUM).toHaveLength(304)
    expect(HARD).toHaveLength(242)
    expect(getWords('all')).toHaveLength(886)
  })

  it.each(LEVEL_ORDER)('узровень %s без паўтораў, пустых радкоў і лішніх прабелаў', (id) => {
    const list = LEVELS[id].words
    expect(new Set(list).size).toBe(list.length)
    for (const word of list) {
      expect(word, word).toBe(word.trim())
      expect(word.length, word).toBeGreaterThan(1)
    }
  })

  it('усе словы — беларускай кірыліцай, вялікая літара толькі першая', () => {
    for (const word of getWords('all')) {
      expect(word, word).toMatch(BELARUSIAN)
      expect(word, word).not.toMatch(/[иъщ]/)
    }
  })

  it('узроўні не перасякаюцца', () => {
    const easy = new Set(EASY)
    const medium = new Set(MEDIUM)
    for (const word of MEDIUM) expect(easy.has(word), word).toBe(false)
    for (const word of HARD) {
      expect(easy.has(word), word).toBe(false)
      expect(medium.has(word), word).toBe(false)
    }
  })

  it('LEVELS мае подпісы і парадак', () => {
    expect(LEVEL_ORDER).toEqual(['easy', 'medium', 'hard', 'all'])
    for (const id of LEVEL_ORDER) {
      expect(LEVELS[id].id).toBe(id)
      expect(LEVELS[id].label).toBeTruthy()
      expect(LEVELS[id].hint).toBeTruthy()
    }
  })

  it('getWords вяртае ўнікальныя словы і адкатваецца да лёгкага ўзроўню', () => {
    expect(getWords('easy')).toEqual([...new Set(EASY)])
    expect(getWords('missing')).toEqual(getWords('easy'))
  })
})
