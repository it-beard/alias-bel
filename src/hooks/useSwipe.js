import { useRef, useState } from 'react'

/**
 * Свайп па картцы праз pointer-падзеі (дотык і мыш).
 * Вяртае зрушэнне карткі, каб яна ішла за пальцам, і апрацоўшчыкі падзей.
 * Направа — адгадана, налева — пас.
 */
export function useSwipe({ onLeft, onRight, threshold = 80, enabled = true }) {
  const [offset, setOffset] = useState(0)
  const [dragging, setDragging] = useState(false)
  const start = useRef(null)

  const reset = () => {
    start.current = null
    setOffset(0)
    setDragging(false)
  }

  const handlers = {
    onPointerDown: (e) => {
      if (!enabled || (e.button !== undefined && e.button !== 0)) return
      start.current = { x: e.clientX, y: e.clientY, id: e.pointerId }
      setDragging(true)
      try {
        e.currentTarget.setPointerCapture?.(e.pointerId)
      } catch {
        /* jsdom і старыя браўзеры без захопу ўказальніка */
      }
    },
    onPointerMove: (e) => {
      const from = start.current
      if (!from || e.pointerId !== from.id) return
      setOffset(e.clientX - from.x)
    },
    onPointerUp: (e) => {
      const from = start.current
      if (!from || e.pointerId !== from.id) return
      const dx = e.clientX - from.x
      const dy = e.clientY - from.y
      reset()
      if (Math.abs(dx) < threshold || Math.abs(dx) < Math.abs(dy)) return
      if (dx > 0) onRight?.()
      else onLeft?.()
    },
    onPointerCancel: reset,
  }

  return { offset, dragging, handlers, threshold }
}
