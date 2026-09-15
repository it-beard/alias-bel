import { describe, expect, it } from 'vitest'
import { plural, points, rounds, words } from './plural.js'

describe('plural', () => {
  it.each([
    [1, 'слова'],
    [2, 'словы'],
    [4, 'словы'],
    [5, 'слоў'],
    [11, 'слоў'],
    [12, 'слоў'],
    [14, 'слоў'],
    [21, 'слова'],
    [22, 'словы'],
    [25, 'слоў'],
    [100, 'слоў'],
    [101, 'слова'],
    [111, 'слоў'],
    [0, 'слоў'],
    [-1, 'слова'],
  ])('%i → %s', (n, expected) => {
    expect(plural(n, 'слова', 'словы', 'слоў')).toBe(expected)
  })
})

describe('гатовыя формы', () => {
  it('words', () => {
    expect(words(1)).toBe('1 слова')
    expect(words(340)).toBe('340 слоў')
  })
  it('points', () => {
    expect(points(1)).toBe('1 ачко')
    expect(points(3)).toBe('3 ачкі')
    expect(points(30)).toBe('30 ачкоў')
  })
  it('rounds', () => {
    expect(rounds(1)).toBe('1 раунд')
    expect(rounds(2)).toBe('2 раунды')
    expect(rounds(7)).toBe('7 раундаў')
  })
})
