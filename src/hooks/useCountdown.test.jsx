import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { renderHook } from '@testing-library/react'
import { remaining, useCountdown } from './useCountdown.js'
import { advance } from '../test/timers.js'

describe('useCountdown', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-09-15T12:00:00Z'))
  })
  afterEach(() => vi.useRealTimers())

  it('remaining акругляе ўверх і не ідзе ніжэй за нуль', () => {
    expect(remaining(null)).toBe(0)
    expect(remaining(Date.now() + 2500)).toBe(3)
    expect(remaining(Date.now() - 100)).toBe(0)
  })

  it('лічыць секунды і выклікае onEnd адзін раз', () => {
    const onEnd = vi.fn()
    const endsAt = Date.now() + 3000
    const { result } = renderHook(() => useCountdown(endsAt, onEnd))
    expect(result.current).toBe(3)
    advance(1000)
    expect(result.current).toBe(2)
    advance(2000)
    expect(result.current).toBe(0)
    expect(onEnd).toHaveBeenCalledTimes(1)
    advance(5000)
    expect(onEnd).toHaveBeenCalledTimes(1)
  })

  it('без endsAt вяртае нуль і не запускае таймер', () => {
    const onEnd = vi.fn()
    const { result } = renderHook(() => useCountdown(null, onEnd))
    expect(result.current).toBe(0)
    advance(5000)
    expect(onEnd).not.toHaveBeenCalled()
  })

  it('пры новым endsAt адлік пачынаецца нанова', () => {
    const onEnd = vi.fn()
    const { result, rerender } = renderHook(({ endsAt }) => useCountdown(endsAt, onEnd), {
      initialProps: { endsAt: Date.now() + 2000 },
    })
    advance(1000)
    expect(result.current).toBe(1)
    rerender({ endsAt: Date.now() + 10_000 })
    expect(result.current).toBe(10)
    advance(1500)
    expect(onEnd).not.toHaveBeenCalled()
  })

  it('выклікае самы свежы onEnd', () => {
    const first = vi.fn()
    const second = vi.fn()
    const endsAt = Date.now() + 1000
    const { rerender } = renderHook(({ cb }) => useCountdown(endsAt, cb), { initialProps: { cb: first } })
    rerender({ cb: second })
    advance(1100)
    expect(first).not.toHaveBeenCalled()
    expect(second).toHaveBeenCalledTimes(1)
  })
})
