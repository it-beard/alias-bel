import { useRef } from 'react'

/** Гарызантальны свайп па картцы: направа — адгадана, налева — пас. */
export function useSwipe({ onLeft, onRight, threshold = 70 }) {
  const start = useRef(null)

  return {
    onTouchStart: (e) => {
      const t = e.touches[0]
      start.current = { x: t.clientX, y: t.clientY }
    },
    onTouchEnd: (e) => {
      const from = start.current
      start.current = null
      if (!from) return
      const t = e.changedTouches[0]
      const dx = t.clientX - from.x
      const dy = t.clientY - from.y
      if (Math.abs(dx) < threshold || Math.abs(dx) < Math.abs(dy)) return
      if (dx > 0) onRight?.()
      else onLeft?.()
    },
  }
}
