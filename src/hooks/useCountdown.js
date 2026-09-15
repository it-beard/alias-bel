import { useEffect, useReducer, useRef } from 'react'

/**
 * Адлік да абсалютнай адзнакі часу. Абсалютны час, а не лічыльнік крокаў,
 * бо мабільныя браўзеры прытрымліваюць таймеры ў фоне.
 * `onEnd` выклікаецца адзін раз, калі час выйшаў.
 */
export function useCountdown(endsAt, onEnd) {
  const [, tick] = useReducer((n) => n + 1, 0)
  const onEndRef = useRef(onEnd)

  useEffect(() => {
    onEndRef.current = onEnd
  })

  useEffect(() => {
    if (!endsAt) return
    const id = setInterval(() => {
      tick()
      if (remaining(endsAt) <= 0) {
        clearInterval(id)
        onEndRef.current?.()
      }
    }, 100)
    return () => clearInterval(id)
  }, [endsAt])

  return remaining(endsAt)
}

export function remaining(endsAt, now = Date.now()) {
  if (!endsAt) return 0
  return Math.max(0, Math.ceil((endsAt - now) / 1000))
}
