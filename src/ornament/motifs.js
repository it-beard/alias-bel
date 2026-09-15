import { TEAM_LOGOS } from './teamLogos.js'

/**
 * Матывы беларускага арнаменту ў стылі вышыўкі крыжыкам.
 * Кожны матыў — матрыца радкоў: «X» — зашыты квадрацік, «.» — пустое месца.
 * Малюнак будуецца праграмна, таму лёгка дадаць новыя матывы.
 */

export const MOTIFS = {
  sun: {
    title: 'Сонца',
    meaning: 'жыццё і цяпло',
    rows: [
      'X...X...X',
      '.X..X..X.',
      '..X.X.X..',
      '...XXX...',
      'XXXX.XXXX',
      '...XXX...',
      '..X.X.X..',
      '.X..X..X.',
      'X...X...X',
    ],
  },
  star: {
    title: 'Зорка',
    meaning: 'шчасце і дарога',
    rows: [
      '....X....',
      '...XXX...',
      '.X.X.X.X.',
      '..X...X..',
      'XXX...XXX',
      '..X...X..',
      '.X.X.X.X.',
      '...XXX...',
      '....X....',
    ],
  },
  field: {
    title: 'Засеянае поле',
    meaning: 'урадлівасць і дабрабыт',
    rows: [
      '....X....',
      '...X.X...',
      '..X...X..',
      '.X..X..X.',
      'X.X...X.X',
      '.X..X..X.',
      '..X...X..',
      '...X.X...',
      '....X....',
    ],
  },
  tree: {
    title: 'Дрэва жыцця',
    meaning: 'род і памяць',
    rows: [
      '....X....',
      '...XXX...',
      '..X.X.X..',
      '.X..X..X.',
      '..X.X.X..',
      '.X..X..X.',
      '..X.X.X..',
      '....X....',
      '...XXX...',
    ],
  },
  hooks: {
    title: 'Крукі',
    meaning: 'каханне і згода',
    rows: [
      '..X...X..',
      '.X.X.X.X.',
      'X...X...X',
      '.X.....X.',
      '..X...X..',
      '.X.....X.',
      'X...X...X',
      '.X.X.X.X.',
      '..X...X..',
    ],
  },
  ...TEAM_LOGOS,
}

export const MOTIF_NAMES = Object.keys(MOTIFS)

/** Каардынаты зашытых квадрацікаў матрыцы. */
export function cells(rows) {
  const out = []
  rows.forEach((row, y) => {
    for (let x = 0; x < row.length; x++) if (row[x] === 'X') out.push([x, y])
  })
  return out
}

/** Адзін SVG-шлях на ўсю матрыцу — танней, чым сотні <rect>. */
export function pathFor(rows, scale = 1) {
  return cells(rows)
    .map(([x, y]) => `M${x * scale} ${y * scale}h${scale}v${scale}h-${scale}z`)
    .join('')
}

export function size(rows) {
  return { width: Math.max(...rows.map((r) => r.length)), height: rows.length }
}
