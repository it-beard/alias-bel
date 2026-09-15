import { describe, expect, it, vi } from 'vitest'
import { createDeck, drawWord, shuffle } from './deck.js'
import { getWords } from '../data/words.js'

describe('shuffle', () => {
  it('не мяняе зыходны масіў і захоўвае набор элементаў', () => {
    const source = [1, 2, 3, 4, 5, 6, 7, 8]
    const copy = [...source]
    const out = shuffle(source)
    expect(source).toEqual(copy)
    expect([...out].sort()).toEqual([...source].sort())
  })

  it('перамешвае паводле Math.random', () => {
    vi.spyOn(Math, 'random').mockReturnValue(0)
    expect(shuffle([1, 2, 3])).toEqual([2, 3, 1])
  })

  it('працуе з пустым масівам', () => expect(shuffle([])).toEqual([]))
})

describe('createDeck', () => {
  it('змяшчае ўсе ўнікальныя словы ўзроўню', () => {
    const deck = createDeck('medium')
    expect(deck).toHaveLength(getWords('medium').length)
    expect(new Set(deck).size).toBe(deck.length)
  })

  it('невядомы ўзровень адкатваецца да лёгкага', () => {
    expect(createDeck('nope')).toHaveLength(getWords('easy').length)
  })
})

describe('drawWord', () => {
  it('бярэ апошняе слова і памяншае калоду', () => {
    const { word, deck } = drawWord(['а', 'б', 'в'], 'easy')
    expect(word).toBe('в')
    expect(deck).toEqual(['а', 'б'])
  })

  it('з пустой калоды тасуе ўзровень нанова', () => {
    const { word, deck } = drawWord([], 'hard')
    expect(getWords('hard')).toContain(word)
    expect(deck).toHaveLength(getWords('hard').length - 1)
  })
})
