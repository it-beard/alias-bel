import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { act, render, screen } from '@testing-library/react'
import { CLOSE_MS, useSheetDrag } from './useSheetDrag.js'
import { swipeDown, touchEvent } from '../test/touch.js'

function Sheet({ onClose, grip = true }) {
  const ref = useSheetDrag(onClose)
  return (
    <div data-testid="host">
      <div data-testid="body" ref={ref}>
        {grip && <div className="sheet__grip" />}
        змест
      </div>
    </div>
  )
}

function setup(props = {}) {
  const onClose = vi.fn()
  const view = render(<Sheet onClose={onClose} {...props} />)
  const host = screen.getByTestId('host')
  const css = (name) => host.style.getPropertyValue(name)
  return { onClose, body: screen.getByTestId('body'), css, ...view }
}

describe('useSheetDrag', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('шторка ідзе за пальцам, а за парогам з’язджае ўніз і зачыняецца', () => {
    const { onClose, body, css } = setup()
    Object.defineProperty(body, 'offsetHeight', { value: 400 })
    touchEvent(body, 'touchstart', [{ x: 100, y: 100 }])
    const move = touchEvent(body, 'touchmove', [{ x: 104, y: 200 }])
    expect(move.defaultPrevented).toBe(true)
    expect(css('--sheet-drag')).toBe('100px')
    expect(css('--sheet-fade')).toBe('0.25')
    expect(css('--sheet-ease')).toBe('0s')

    vi.advanceTimersByTime(1000) // павольна: спрацоўвае менавіта адлегласць, а не змах
    touchEvent(body, 'touchend', [{ x: 104, y: 200 }])
    expect(css('--sheet-drag')).toBe('100%')
    expect(css('--sheet-fade')).toBe('1')
    expect(css('--sheet-ease')).toBe(`${CLOSE_MS}ms`)
    expect(onClose).not.toHaveBeenCalled()
    act(() => vi.advanceTimersByTime(CLOSE_MS))
    expect(onClose).toHaveBeenCalledTimes(1)
  })

  it('кароткае павольнае цягненне вяртае шторку на месца', () => {
    const { onClose, body, css } = setup()
    touchEvent(body, 'touchstart', [{ x: 100, y: 100 }])
    touchEvent(body, 'touchmove', [{ x: 100, y: 150 }])
    expect(css('--sheet-drag')).toBe('50px')
    vi.advanceTimersByTime(1000)
    touchEvent(body, 'touchend', [{ x: 100, y: 150 }])
    expect(css('--sheet-drag')).toBe('0px')
    expect(css('--sheet-fade')).toBe('0')
    expect(css('--sheet-ease')).toBe(`${CLOSE_MS}ms`)
    act(() => vi.advanceTimersByTime(1000))
    expect(onClose).not.toHaveBeenCalled()
  })

  it('хуткі кароткі змах таксама зачыняе', () => {
    const { onClose, body } = setup()
    touchEvent(body, 'touchstart', [{ x: 100, y: 100 }])
    touchEvent(body, 'touchmove', [{ x: 100, y: 140 }])
    vi.advanceTimersByTime(60) // 40 px за 60 мс
    touchEvent(body, 'touchend', [{ x: 100, y: 140 }])
    act(() => vi.advanceTimersByTime(CLOSE_MS))
    expect(onClose).toHaveBeenCalledTimes(1)
  })

  it('зусім малы змах не зачыняе, нават імгненны', () => {
    const { onClose, body, css } = setup()
    swipeDown(body, 20)
    act(() => vi.advanceTimersByTime(1000))
    expect(css('--sheet-drag')).toBe('0px')
    expect(onClose).not.toHaveBeenCalled()
  })

  it('калі змест пракручаны, жэст застаецца пракруткай', () => {
    const { onClose, body, css } = setup()
    body.scrollTop = 30
    touchEvent(body, 'touchstart', [{ x: 100, y: 100 }])
    const move = touchEvent(body, 'touchmove', [{ x: 100, y: 300 }])
    touchEvent(body, 'touchend', [{ x: 100, y: 300 }])
    act(() => vi.advanceTimersByTime(1000))
    expect(move.defaultPrevented).toBe(false)
    expect(css('--sheet-drag')).toBe('')
    expect(onClose).not.toHaveBeenCalled()
  })

  it('рух уверх або ўбок адмяняе жэст да канца дотыку', () => {
    const { onClose, body, css } = setup()
    touchEvent(body, 'touchstart', [{ x: 100, y: 100 }])
    const up = touchEvent(body, 'touchmove', [{ x: 100, y: 80 }])
    const down = touchEvent(body, 'touchmove', [{ x: 100, y: 300 }])
    touchEvent(body, 'touchend', [{ x: 100, y: 300 }])
    expect(up.defaultPrevented).toBe(false)
    expect(down.defaultPrevented).toBe(false)

    touchEvent(body, 'touchstart', [{ x: 100, y: 100 }])
    const side = touchEvent(body, 'touchmove', [{ x: 160, y: 120 }])
    touchEvent(body, 'touchmove', [{ x: 160, y: 300 }])
    touchEvent(body, 'touchend', [{ x: 160, y: 300 }])
    expect(side.defaultPrevented).toBe(false)

    act(() => vi.advanceTimersByTime(1000))
    expect(css('--sheet-drag')).toBe('')
    expect(onClose).not.toHaveBeenCalled()
  })

  it('дрыжанне пальца ў межах некалькіх пікселяў жэст не адмяняе і не пачынае', () => {
    const { onClose, body, css } = setup()
    touchEvent(body, 'touchstart', [{ x: 100, y: 100 }])
    const jitter = touchEvent(body, 'touchmove', [{ x: 102, y: 98 }])
    expect(jitter.defaultPrevented).toBe(false)
    expect(css('--sheet-drag')).toBe('')
    touchEvent(body, 'touchmove', [{ x: 102, y: 220 }])
    expect(css('--sheet-drag')).toBe('120px')
    vi.advanceTimersByTime(1000)
    touchEvent(body, 'touchend', [{ x: 102, y: 220 }])
    act(() => vi.advanceTimersByTime(CLOSE_MS))
    expect(onClose).toHaveBeenCalledTimes(1)
  })

  it('пацягнуўшы ўніз і вярнуўшы палец вышэй за пачатак, шторку не падымеш', () => {
    const { onClose, body, css } = setup()
    touchEvent(body, 'touchstart', [{ x: 100, y: 100 }])
    touchEvent(body, 'touchmove', [{ x: 100, y: 160 }])
    touchEvent(body, 'touchmove', [{ x: 100, y: 40 }])
    expect(css('--sheet-drag')).toBe('0px')
    expect(css('--sheet-fade')).toBe('0')
    touchEvent(body, 'touchend', [{ x: 100, y: 40 }])
    act(() => vi.advanceTimersByTime(1000))
    expect(onClose).not.toHaveBeenCalled()
  })

  it('без рыскі або са схаванай рыскай жэсту няма', () => {
    const plain = setup({ grip: false })
    swipeDown(plain.body, 200)
    act(() => vi.advanceTimersByTime(1000))
    expect(plain.onClose).not.toHaveBeenCalled()
    plain.unmount()

    const hidden = setup()
    hidden.body.querySelector('.sheet__grip').style.display = 'none'
    swipeDown(hidden.body, 200)
    act(() => vi.advanceTimersByTime(1000))
    expect(hidden.css('--sheet-drag')).toBe('')
    expect(hidden.onClose).not.toHaveBeenCalled()
  })

  it('touchcancel вяртае шторку на месца', () => {
    const { onClose, body, css } = setup()
    touchEvent(body, 'touchstart', [{ x: 100, y: 100 }])
    touchEvent(body, 'touchmove', [{ x: 100, y: 300 }])
    touchEvent(body, 'touchcancel', [{ x: 100, y: 300 }])
    expect(css('--sheet-drag')).toBe('0px')
    // наступны дотык пачынаецца з чыстага стану
    touchEvent(body, 'touchend', [{ x: 100, y: 300 }])
    act(() => vi.advanceTimersByTime(1000))
    expect(onClose).not.toHaveBeenCalled()
  })

  it('touchcancel да пачатку цягнення або без дотыку нічога не чапае', () => {
    const { body, css } = setup()
    touchEvent(body, 'touchcancel', [{ x: 100, y: 100 }])
    touchEvent(body, 'touchstart', [{ x: 100, y: 100 }])
    const tiny = touchEvent(body, 'touchmove', [{ x: 100, y: 103 }])
    // уніз, але яшчэ ў межах slop: пракрутку браўзера ўжо спыняем, шторку не рухаем
    expect(tiny.defaultPrevented).toBe(true)
    touchEvent(body, 'touchcancel', [{ x: 100, y: 103 }])
    expect(css('--sheet-drag')).toBe('')
  })

  it('другі палец не пачынае і не заканчвае жэст', () => {
    const { onClose, body, css } = setup()
    // два пальцы адразу — гэта не змахванне
    touchEvent(body, 'touchstart', [{ id: 1, x: 100, y: 100 }], [{ id: 1, x: 100, y: 100 }, { id: 2, x: 200, y: 100 }])
    touchEvent(body, 'touchmove', [{ id: 1, x: 100, y: 300 }])
    expect(css('--sheet-drag')).toBe('')
    touchEvent(body, 'touchend', [{ id: 1, x: 100, y: 300 }])

    touchEvent(body, 'touchstart', [{ id: 1, x: 100, y: 100 }])
    touchEvent(body, 'touchmove', [{ id: 1, x: 100, y: 300 }])
    touchEvent(body, 'touchstart', [{ id: 2, x: 200, y: 100 }], [{ id: 1, x: 100, y: 300 }, { id: 2, x: 200, y: 100 }])
    touchEvent(body, 'touchmove', [{ id: 2, x: 200, y: 500 }])
    expect(css('--sheet-drag')).toBe('200px')
    touchEvent(body, 'touchend', [{ id: 2, x: 200, y: 500 }], [{ id: 1, x: 100, y: 300 }])
    expect(css('--sheet-drag')).toBe('200px')
    expect(onClose).not.toHaveBeenCalled()
    vi.advanceTimersByTime(1000)
    touchEvent(body, 'touchend', [{ id: 1, x: 100, y: 300 }])
    act(() => vi.advanceTimersByTime(CLOSE_MS))
    expect(onClose).toHaveBeenCalledTimes(1)
  })

  it('пакуль шторка з’язджае, новыя дотыкі ігнаруюцца, а закрыццё адно', () => {
    const { onClose, body, css } = setup()
    swipeDown(body, 200)
    swipeDown(body, 200)
    touchEvent(body, 'touchstart', [{ x: 100, y: 100 }])
    touchEvent(body, 'touchmove', [{ x: 100, y: 130 }])
    expect(css('--sheet-drag')).toBe('100%')
    act(() => vi.advanceTimersByTime(1000))
    expect(onClose).toHaveBeenCalledTimes(1)
  })

  it('калі шторку прыбралі падчас анімацыі, onClose не выклікаецца', () => {
    const { onClose, body, unmount } = setup()
    swipeDown(body, 200)
    unmount()
    act(() => vi.advanceTimersByTime(1000))
    expect(onClose).not.toHaveBeenCalled()
  })

  it('выклікае апошні перададзены onClose', () => {
    const first = vi.fn()
    const second = vi.fn()
    const { rerender } = render(<Sheet onClose={first} />)
    rerender(<Sheet onClose={second} />)
    swipeDown(screen.getByTestId('body'), 200)
    act(() => vi.advanceTimersByTime(CLOSE_MS))
    expect(first).not.toHaveBeenCalled()
    expect(second).toHaveBeenCalledTimes(1)
  })

  it('некасавальны touchmove не ламае жэст', () => {
    const { body, css } = setup()
    touchEvent(body, 'touchstart', [{ x: 100, y: 100 }])
    const event = new Event('touchmove', { bubbles: true, cancelable: false })
    Object.assign(event, { touches: [], changedTouches: [{ identifier: 0, clientX: 100, clientY: 180 }] })
    body.dispatchEvent(event)
    expect(event.defaultPrevented).toBe(false)
    expect(css('--sheet-drag')).toBe('80px')
  })
})
