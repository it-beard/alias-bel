import { describe, expect, it } from 'vitest'
import { BANDS, BAND_NAMES, MOTIFS, MOTIF_NAMES, cells, pathFor, size } from './motifs.js'
import { TEAM_MOTIFS } from '../game/constants.js'

const rectangular = (rows) => rows.every((row) => row.length === rows[0].length)
const onlyCells = (rows) => rows.every((row) => /^[X.]+$/.test(row))
const mirrored = (rows) => rows.every((row) => row === [...row].reverse().join(''))

describe('матывы', () => {
  it('набор матываў зафіксаваны', () => {
    expect(MOTIF_NAMES).toEqual(['sun', 'star', 'field', 'tree', 'hooks'])
  })

  it.each(MOTIF_NAMES)('%s — квадратная матрыца 9×9, сіметрычная па гарызанталі, з назвай', (name) => {
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

  it('кожная каманда мае свой існуючы матыў', () => {
    expect(new Set(TEAM_MOTIFS).size).toBe(TEAM_MOTIFS.length)
    for (const name of TEAM_MOTIFS) expect(MOTIFS[name]).toBeDefined()
  })
})

describe('стужкі', () => {
  it.each(BAND_NAMES)('%s — прамавугольная матрыца з дапушчальных знакаў', (name) => {
    const rows = BANDS[name]
    expect(rectangular(rows)).toBe(true)
    expect(onlyCells(rows)).toBe(true)
    expect(cells(rows).length).toBeGreaterThan(0)
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
