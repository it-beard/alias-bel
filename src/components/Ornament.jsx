import { MOTIFS, pathFor, size } from '../ornament/motifs.js'

/** Піксельны знак каманды або матыў арнаменту; колер бярэцца з currentColor. */
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

/** Знак гульні — ромб, найпрасцейшы элемент беларускага арнаменту. */
export function Mark({ size: px = 22, className = '' }) {
  return (
    <svg className={`mark ${className}`.trim()} viewBox="0 0 24 24" width={px} height={px} aria-hidden="true">
      <path d="M12 2.5 21.5 12 12 21.5 2.5 12z" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinejoin="miter" />
      <path d="M12 8.2 15.8 12 12 15.8 8.2 12z" fill="currentColor" />
    </svg>
  )
}
