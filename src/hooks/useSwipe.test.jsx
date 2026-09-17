import { describe, expect, it, vi } from 'vitest'
import { act, fireEvent, render, renderHook, screen } from '@testing-library/react'
import { useSwipe } from './useSwipe.js'

function Card(props) {
  const { offset, dragging, handlers } = useSwipe(props)
  return (
    <div data-testid="card" data-offset={offset} data-dragging={dragging} {...handlers}>
      картка
    </div>
  )
}

const pointer = (x, y = 0, extra = {}) => ({ clientX: x, clientY: y, pointerId: 1, button: 0, ...extra })

describe('useSwipe', () => {
  it('свайп направа выклікае onRight, налева — onLeft', () => {
    const onLeft = vi.fn()
    const onRight = vi.fn()
    render(<Card onLeft={onLeft} onRight={onRight} />)
    const card = screen.getByTestId('card')

    fireEvent.pointerDown(card, pointer(0))
    fireEvent.pointerMove(card, pointer(120))
    fireEvent.pointerUp(card, pointer(120))
    expect(onRight).toHaveBeenCalledTimes(1)

    fireEvent.pointerDown(card, pointer(200))
    fireEvent.pointerUp(card, pointer(50))
    expect(onLeft).toHaveBeenCalledTimes(1)
  })

  it('картка ідзе за пальцам і вяртаецца пасля адпускання', () => {
    render(<Card onLeft={() => {}} onRight={() => {}} />)
    const card = screen.getByTestId('card')
    fireEvent.pointerDown(card, pointer(10))
    expect(card.dataset.dragging).toBe('true')
    fireEvent.pointerMove(card, pointer(50))
    expect(card.dataset.offset).toBe('40')
    fireEvent.pointerUp(card, pointer(50))
    expect(card.dataset.offset).toBe('0')
    expect(card.dataset.dragging).toBe('false')
  })

  it('кароткі або вертыкальны рух не лічыцца свайпам', () => {
    const onLeft = vi.fn()
    const onRight = vi.fn()
    render(<Card onLeft={onLeft} onRight={onRight} />)
    const card = screen.getByTestId('card')

    fireEvent.pointerDown(card, pointer(0))
    fireEvent.pointerUp(card, pointer(40))
    fireEvent.pointerDown(card, pointer(0, 0))
    fireEvent.pointerUp(card, pointer(100, 150))
    expect(onLeft).not.toHaveBeenCalled()
    expect(onRight).not.toHaveBeenCalled()
  })

  it('выключаны свайп нічога не робіць', () => {
    const onRight = vi.fn()
    render(<Card onRight={onRight} enabled={false} />)
    const card = screen.getByTestId('card')
    fireEvent.pointerDown(card, pointer(0))
    fireEvent.pointerUp(card, pointer(200))
    expect(onRight).not.toHaveBeenCalled()
    expect(card.dataset.dragging).toBe('false')
  })

  it('ігнаруе іншы ўказальнік, правую кнопку і адмену', () => {
    const onRight = vi.fn()
    render(<Card onRight={onRight} />)
    const card = screen.getByTestId('card')

    fireEvent.pointerDown(card, pointer(0, 0, { button: 2 }))
    fireEvent.pointerUp(card, pointer(200))
    expect(onRight).not.toHaveBeenCalled()

    fireEvent.pointerDown(card, pointer(0))
    fireEvent.pointerMove(card, pointer(150, 0, { pointerId: 2 }))
    expect(card.dataset.offset).toBe('0')
    fireEvent.pointerUp(card, pointer(200, 0, { pointerId: 2 }))
    expect(onRight).not.toHaveBeenCalled()

    fireEvent.pointerMove(card, pointer(60))
    fireEvent.pointerCancel(card)
    expect(card.dataset.offset).toBe('0')
    fireEvent.pointerUp(card, pointer(200))
    expect(onRight).not.toHaveBeenCalled()
  })

  it('парог можна задаць', () => {
    const onRight = vi.fn()
    render(<Card onRight={onRight} threshold={20} />)
    const card = screen.getByTestId('card')
    fireEvent.pointerDown(card, pointer(0))
    fireEvent.pointerUp(card, pointer(25))
    expect(onRight).toHaveBeenCalledTimes(1)
  })

  it('паўза скідае незавершаны жэст, а страта захопу не пакідае картку зрушанай', () => {
    const onRight = vi.fn()
    const { rerender } = render(<Card onRight={onRight} />)
    const card = screen.getByTestId('card')
    fireEvent.pointerDown(card, pointer(0))
    fireEvent.pointerMove(card, pointer(100))
    rerender(<Card onRight={onRight} enabled={false} />)
    expect(card.dataset.offset).toBe('0')
    expect(card.dataset.dragging).toBe('false')
    rerender(<Card onRight={onRight} />)
    fireEvent.pointerUp(card, pointer(150))
    expect(onRight).not.toHaveBeenCalled()
    fireEvent.pointerDown(card, pointer(0))
    fireEvent.pointerMove(card, pointer(100))
    fireEvent.lostPointerCapture(card)
    expect(card.dataset.dragging).toBe('false')
    expect(card.dataset.offset).toBe('0')
  })

  it('жэст, пачаты апрацоўшчыкам з мінулага рэндэру, пасля выключэння не дае адказу', () => {
    const onRight = vi.fn()
    const { result, rerender } = renderHook((props) => useSwipe(props), { initialProps: { onRight, enabled: true } })
    const stale = result.current.handlers
    rerender({ onRight, enabled: false })
    act(() => stale.onPointerDown({ ...pointer(0), currentTarget: {} }))
    act(() => result.current.handlers.onPointerUp(pointer(200)))
    expect(onRight).not.toHaveBeenCalled()
    expect(result.current.dragging).toBe(false)
    expect(result.current.offset).toBe(0)
  })

  it('без апрацоўшчыкаў свайп проста вяртае картку на месца', () => {
    render(<Card />)
    const card = screen.getByTestId('card')
    fireEvent.pointerDown(card, pointer(0))
    expect(() => fireEvent.pointerUp(card, pointer(200))).not.toThrow()
    fireEvent.pointerDown(card, pointer(200))
    expect(() => fireEvent.pointerUp(card, pointer(0))).not.toThrow()
    expect(card.dataset.offset).toBe('0')
  })
})
