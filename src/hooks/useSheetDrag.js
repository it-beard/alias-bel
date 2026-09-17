import { useEffect, useRef } from 'react'

const SLOP = 6 // px, пакуль незразумела, куды пайшоў палец
const CLOSE_DISTANCE = 90 // px: пацягнулі далей — шторка зачыняецца
const FLICK_DISTANCE = 24 // px: кароткі, але хуткі змах таксама зачыняе
const FLICK_SPEED = 0.5 // px/мс
export const CLOSE_MS = 160

/**
 * Шторку з рыскай зверху можна змахнуць уніз, як натыўную. Жэст пачынаецца толькі з самага верху
 * пракруткі, інакш гэта звычайная пракрутка зместу. Там, дзе рыска схаваная (шырокі экран), жэсту няма.
 * Вяртае ref для .sheet__body; зрушэнне перадаецца ў CSS праз зменныя на бацькоўскім dialog.
 */
export function useSheetDrag(onClose) {
  const ref = useRef(null)
  const close = useRef(onClose)

  useEffect(() => {
    close.current = onClose
  })

  useEffect(() => {
    const body = ref.current
    const host = body?.parentElement
    if (!host) return undefined
    let drag = null
    let timer = null

    const place = (offset, fade, ease) => {
      host.style.setProperty('--sheet-drag', offset)
      host.style.setProperty('--sheet-fade', String(fade))
      host.style.setProperty('--sheet-ease', ease ? `${CLOSE_MS}ms` : '0s')
    }
    const touchOf = (event) => [...event.changedTouches].find((touch) => touch.identifier === drag.id)
    const hasGrip = () => {
      const grip = body.querySelector('.sheet__grip')
      return !!grip && getComputedStyle(grip).display !== 'none'
    }

    const onStart = (event) => {
      if (drag || timer || event.touches.length > 1 || body.scrollTop > 0 || !hasGrip()) return
      const touch = event.changedTouches[0]
      drag = { id: touch.identifier, x: touch.clientX, y: touch.clientY, at: Date.now(), active: false }
    }

    const onMove = (event) => {
      const touch = drag && touchOf(event)
      if (!touch) return
      const dx = touch.clientX - drag.x
      const dy = touch.clientY - drag.y
      if (!drag.active) {
        if (dy <= 0 || Math.abs(dx) > dy) {
          // уверх або ўбок — гэта пракрутка ці іншы жэст: за межамі slop да канца дотыку не ўмешваемся
          if (Math.abs(dx) >= SLOP || Math.abs(dy) >= SLOP) drag = null
          return
        }
        if (dy >= SLOP) drag.active = true
      }
      // інакш браўзер пачне сваю пракрутку або pull-to-refresh і забярэ жэст
      if (event.cancelable) event.preventDefault()
      if (drag.active) place(`${Math.max(0, dy)}px`, Math.min(1, Math.max(0, dy) / (body.offsetHeight || 1)), false)
    }

    const onEnd = (event) => {
      const touch = drag && touchOf(event)
      if (!touch) return
      const { active, y, at } = drag
      drag = null
      if (!active) return
      const dy = touch.clientY - y
      const flick = dy >= FLICK_DISTANCE && dy / Math.max(1, Date.now() - at) >= FLICK_SPEED
      if (dy >= CLOSE_DISTANCE || flick) {
        place('100%', 1, true)
        timer = setTimeout(() => close.current(), CLOSE_MS)
      } else {
        place('0px', 0, true)
      }
    }

    const onCancel = () => {
      if (!drag) return
      const { active } = drag
      drag = null
      if (active) place('0px', 0, true)
    }

    body.addEventListener('touchstart', onStart, { passive: true })
    // не passive: React вешае touchmove пасіўна, а тут патрэбны preventDefault
    body.addEventListener('touchmove', onMove, { passive: false })
    body.addEventListener('touchend', onEnd)
    body.addEventListener('touchcancel', onCancel)
    return () => {
      clearTimeout(timer)
      body.removeEventListener('touchstart', onStart)
      body.removeEventListener('touchmove', onMove)
      body.removeEventListener('touchend', onEnd)
      body.removeEventListener('touchcancel', onCancel)
    }
  }, [])

  return ref
}
