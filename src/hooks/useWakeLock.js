import { useEffect } from 'react'

/** Не дае экрану згаснуць падчас раунда (там, дзе браўзер гэта падтрымлівае). */
export function useWakeLock(active) {
  useEffect(() => {
    if (!active || typeof navigator === 'undefined' || !navigator.wakeLock) return
    let lock = null
    let cancelled = false

    const request = async () => {
      try {
        const next = await navigator.wakeLock.request('screen')
        if (cancelled) next.release()
        else lock = next
      } catch {
        /* карыстальнік або браўзер адмовіў — гуляць гэта не замінае */
      }
    }

    const onVisibility = () => {
      if (document.visibilityState === 'visible' && !lock) request()
    }

    request()
    document.addEventListener('visibilitychange', onVisibility)
    return () => {
      cancelled = true
      document.removeEventListener('visibilitychange', onVisibility)
      Promise.resolve(lock?.release?.()).catch(() => {})
      lock = null
    }
  }, [active])
}
