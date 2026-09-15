import { useEffect, useRef, useState } from 'react'

/**
 * Свайп па картцы праз pointer-падзеі (дотык і мыш).
 * Вяртае зрушэнне карткі, каб яна ішла за пальцам, і апрацоўшчыкі падзей.
 * Направа — адгадана, налева — пас.
 */
export function useSwipe({ onLeft, onRight, threshold = 80, enabled = true }) {
  const [gesture, setGesture] = useState({ offset: 0, dragging: false, enabled })
  const start = useRef(null)

  if (gesture.enabled !== enabled) setGesture({ offset: 0, dragging: false, enabled })

  const reset = () => {
    start.current = null
    setGesture({ offset: 0, dragging: false, enabled })
  }

  useEffect(() => {
    if (!enabled) start.current = null
  }, [enabled])

  const handlers = {
    onPointerDown: (e) => {
      if (!enabled || start.current || (e.button !== undefined && e.button !== 0)) return
      start.current = { x: e.clientX, y: e.clientY, id: e.pointerId }
      setGesture({ offset: 0, dragging: true, enabled })
      try {
        e.currentTarget.setPointerCapture?.(e.pointerId)
      } catch {
        /* jsdom і старыя браўзеры без захопу ўказальніка */
      }
    },
    onPointerMove: (e) => {
      const from = start.current
      if (!enabled || !from || e.pointerId !== from.id) return
      setGesture({ offset: e.clientX - from.x, dragging: true, enabled })
    },
    onPointerUp: (e) => {
      const from = start.current
      if (!from || e.pointerId !== from.id) return
      const dx = e.clientX - from.x
      const dy = e.clientY - from.y
      reset()
      if (!enabled) return
      if (Math.abs(dx) < threshold || Math.abs(dx) < Math.abs(dy)) return
      if (dx > 0) onRight?.()
      else onLeft?.()
    },
    onPointerCancel: reset,
    onLostPointerCapture: reset,
  }

  return { offset: gesture.offset, dragging: gesture.dragging, handlers, threshold }
}
