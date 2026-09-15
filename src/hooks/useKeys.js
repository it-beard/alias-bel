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
      const tag = e.target?.tagName
      if (tag === 'INPUT' || tag === 'TEXTAREA') return
      const handler = ref.current[e.key]
      if (!handler) return
      e.preventDefault()
      handler()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [enabled])
}
