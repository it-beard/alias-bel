import { useId } from 'react'
import { BANDS, MOTIFS, pathFor, size } from '../ornament/motifs.js'

/** Адзін матыў арнаменту; колер бярэцца з currentColor. */
export function Motif({ name, size: px = 24, title, className = '' }) {
  const motif = MOTIFS[name] ?? MOTIFS.sun
  const { width, height } = size(motif.rows)
  return (
    <svg
      className={`motif ${className}`.trim()}
      viewBox={`0 0 ${width} ${height}`}
      width={px}
      height={px}
      role={title ? 'img' : undefined}
      aria-label={title}
      aria-hidden={title ? undefined : true}
      shapeRendering="crispEdges"
      data-motif={name}
    >
      <path d={pathFor(motif.rows)} fill="currentColor" />
    </svg>
  )
}

/** Гарызантальная арнаментальная стужка на ўсю шырыню кантэйнера. */
export function Band({ pattern = 'chain', height = 14, className = '', lines = false }) {
  const rows = BANDS[pattern] ?? BANDS.chain
  const id = useId()
  const grid = size(rows)
  const cell = height / grid.height
  const tileWidth = grid.width * cell
  return (
    <svg
      className={`band ${className}`.trim()}
      height={lines ? height + cell * 4 : height}
      width="100%"
      aria-hidden="true"
      shapeRendering="crispEdges"
      data-band={pattern}
    >
      <defs>
        <pattern id={id} patternUnits="userSpaceOnUse" width={tileWidth} height={height} x="50%">
          <path d={pathFor(rows, cell)} fill="currentColor" />
        </pattern>
      </defs>
      {lines && <rect x="0" y="0" width="100%" height={cell} fill="currentColor" />}
      <rect x="0" y={lines ? cell * 2 : 0} width="100%" height={height} fill={`url(#${id})`} />
      {lines && <rect x="0" y={height + cell * 3} width="100%" height={cell} fill="currentColor" />}
    </svg>
  )
}
