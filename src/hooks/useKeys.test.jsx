import { describe, expect, it, vi } from 'vitest'
import { fireEvent, render, renderHook } from '@testing-library/react'
import { useKeys } from './useKeys.js'

describe('useKeys', () => {
  it('выклікае апрацоўшчык патрэбнай клавішы', () => {
    const right = vi.fn()
    const space = vi.fn()
    renderHook(() => useKeys({ ArrowRight: right, ' ': space }))
    fireEvent.keyDown(window, { key: 'ArrowRight' })
    fireEvent.keyDown(window, { key: ' ' })
    fireEvent.keyDown(window, { key: 'a' })
    expect(right).toHaveBeenCalledTimes(1)
    expect(space).toHaveBeenCalledTimes(1)
  })

  it('не спрацоўвае ў полі ўводу і калі выключаны', () => {
    const right = vi.fn()
    const { unmount } = renderHook(() => useKeys({ ArrowRight: right }, false))
    fireEvent.keyDown(window, { key: 'ArrowRight' })
    expect(right).not.toHaveBeenCalled()
    unmount()

    function Field() {
      useKeys({ ArrowRight: right })
      return <input aria-label="поле" />
    }
    const { getByLabelText } = render(<Field />)
    fireEvent.keyDown(getByLabelText('поле'), { key: 'ArrowRight' })
    expect(right).not.toHaveBeenCalled()
  })

  it('бярэ самы свежы апрацоўшчык і здымае слухач пры размантаванні', () => {
    const first = vi.fn()
    const second = vi.fn()
    const { rerender, unmount } = renderHook(({ fn }) => useKeys({ ArrowLeft: fn }), { initialProps: { fn: first } })
    rerender({ fn: second })
    fireEvent.keyDown(window, { key: 'ArrowLeft' })
    expect(first).not.toHaveBeenCalled()
    expect(second).toHaveBeenCalledTimes(1)
    unmount()
    fireEvent.keyDown(window, { key: 'ArrowLeft' })
    expect(second).toHaveBeenCalledTimes(1)
  })
})
