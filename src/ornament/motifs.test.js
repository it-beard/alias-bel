import { describe, expect, it } from 'vitest'
import { MOTIFS, MOTIF_NAMES, cells, pathFor, size } from './motifs.js'
import { TEAM_LOGOS } from './teamLogos.js'
import { TEAM_MOTIFS } from '../game/constants.js'

const ornaments = ['sun', 'star', 'field', 'tree', 'hooks']
const rectangular = (rows) => rows.every((row) => row.length === rows[0].length)
const onlyCells = (rows) => rows.every((row) => /^[X.]+$/.test(row))
const mirrored = (rows) => rows.every((row) => row === [...row].reverse().join(''))

describe('матывы', () => {
  it('набор матываў зафіксаваны', () => {
    expect(MOTIF_NAMES).toEqual([...ornaments, ...Object.keys(TEAM_LOGOS)])
  })

  it.each(ornaments)('%s — квадратная матрыца 9×9, сіметрычная па гарызанталі, з назвай', (name) => {
    const { rows, title, meaning } = MOTIFS[name]
    expect(rows).toHaveLength(9)
    expect(rectangular(rows)).toBe(true)
    expect(rows[0]).toHaveLength(9)
    expect(onlyCells(rows)).toBe(true)
    expect(mirrored(rows)).toBe(true)
    expect(cells(rows).length).toBeGreaterThan(8)
    expect(title).toBeTruthy()
    expect(meaning).toBeTruthy()
  })

  it('кожная назва каманды мае свой унікальны малюнак', () => {
    const logos = Object.values(TEAM_MOTIFS).map((name) => MOTIFS[name])
    expect(logos.every(Boolean)).toBe(true)
    expect(new Set(logos.map(({ rows }) => pathFor(rows))).size).toBe(logos.length)
  })

  it.each(Object.keys(TEAM_LOGOS))('%s — піксельная матрыца 15×15 з назвай', (name) => {
    const { rows, title } = MOTIFS[name]
    expect(rows).toHaveLength(15)
    expect(rows[0]).toHaveLength(15)
    expect(rectangular(rows)).toBe(true)
    expect(onlyCells(rows)).toBe(true)
    expect(cells(rows).length).toBeGreaterThan(8)
    expect(title).toBeTruthy()
  })
})

describe('геаметрыя', () => {
  it('cells вяртае каардынаты зашытых клетак', () => {
    expect(cells(['X.', '.X'])).toEqual([
      [0, 0],
      [1, 1],
    ])
    expect(cells([])).toEqual([])
  })

  it('pathFor будуе шлях з квадрацікаў з маштабам', () => {
    expect(pathFor(['X.', '.X'])).toBe('M0 0h1v1h-1zM1 1h1v1h-1z')
    expect(pathFor(['X'], 4)).toBe('M0 0h4v4h-4z')
  })

  it('size вымярае матрыцу', () => {
    expect(size(['X..', 'XX.'])).toEqual({ width: 3, height: 2 })
  })
})
