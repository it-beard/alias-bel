import { useEffect, useState } from 'react'

/**
 * Адлік да абсалютнай адзнакі часу. Абсалютны час, а не лічыльнік крокаў,
 * бо мабільныя браўзеры прытрымліваюць таймеры ў фоне.
 */
export function useCountdown(endsAt, onEnd) {
  const [left, setLeft] = useState(() => remaining(endsAt))

  useEffect(() => {
    if (!endsAt) {
      setLeft(0)
      return
    }
    setLeft(remaining(endsAt))
    const id = setInterval(() => {
      const value = remaining(endsAt)
      setLeft(value)
      if (value <= 0) {
        clearInterval(id)
        onEnd?.()
      }
    }, 100)
    return () => clearInterval(id)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [endsAt])

  return left
}

function remaining(endsAt) {
  if (!endsAt) return 0
  return Math.max(0, Math.ceil((endsAt - Date.now()) / 1000))
}
