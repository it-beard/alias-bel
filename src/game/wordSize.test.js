import { describe, expect, it } from 'vitest'
import { wordSize } from './wordSize.js'

describe('wordSize', () => {
  it.each([
    ['', 's'],
    ['соль', 's'],
    ['вясёлка', 's'],
    ['гадзіннік', 'm'],
    ['люстэрка', 'm'],
    ['халадзільнік', 'l'],
    ['сінхранізаваць', 'l'],
    ['электрамагнетызм', 'xl'],
  ])('%s → %s', (word, size) => {
    expect(wordSize(word)).toBe(size)
  })

  it('без слова — як кароткае', () => {
    expect(wordSize(undefined)).toBe('s')
    expect(wordSize(null)).toBe('s')
  })
})
