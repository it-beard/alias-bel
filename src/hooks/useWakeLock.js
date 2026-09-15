import { useEffect } from 'react'

/** Не дае экрану згаснуць падчас раунда (там, дзе браўзер гэта падтрымлівае). */
export function useWakeLock(active) {
  useEffect(() => {
    if (!active || typeof navigator === 'undefined' || !navigator.wakeLock) return
    let lock = null
    let cancelled = false
    let requesting = false

    const request = async () => {
      if (requesting || cancelled) return
      requesting = true
      try {
        const next = await navigator.wakeLock.request('screen')
        if (cancelled) await next.release()
        else {
          lock = next
          next.addEventListener?.('release', () => {
            if (lock === next) lock = null
          }, { once: true })
        }
      } catch {
        /* карыстальнік або браўзер адмовіў — гуляць гэта не замінае */
      } finally {
        requesting = false
      }
    }

    const onVisibility = () => {
      if (document.visibilityState === 'visible' && (!lock || lock.released)) request()
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
