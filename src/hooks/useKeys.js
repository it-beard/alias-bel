import { useEffect, useRef } from 'react'

/**
 * Клавіятурныя скароты (для гульні з ноўтбука): { ArrowRight: fn, ' ': fn }.
 * Не спрацоўваюць, калі фокус у полі ўводу.
 */
export function useKeys(map, enabled = true) {
  const ref = useRef(map)

  useEffect(() => {
    ref.current = map
  })

  useEffect(() => {
    if (!enabled) return
    const onKey = (e) => {
      if (e.defaultPrevented || e.repeat || e.altKey || e.ctrlKey || e.metaKey) return
      const tag = e.target?.tagName
      if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT' || e.target?.isContentEditable) return
      // Прабел на кнопцы павінен націскаць кнопку, а не ставіць гульню на паўзу.
      if (e.key === ' ' && e.target?.closest?.('button, a, summary, [role="button"]')) return
      const handler = ref.current[e.key]
      if (!handler) return
      e.preventDefault()
      handler()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [enabled])
}
