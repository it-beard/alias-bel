import { afterEach, describe, expect, it, vi } from 'vitest'
import { renderHook, waitFor } from '@testing-library/react'
import { useWakeLock } from './useWakeLock.js'

function installWakeLock(request) {
  Object.defineProperty(navigator, 'wakeLock', { value: { request }, configurable: true })
}

function setVisibility(value) {
  Object.defineProperty(document, 'visibilityState', { value, configurable: true })
  document.dispatchEvent(new Event('visibilitychange'))
}

function deferred() {
  let resolve
  const promise = new Promise((done) => {
    resolve = done
  })
  return { promise, resolve }
}

/** Дае завяршыцца асінхроннаму запыту блакіроўкі разам з яго finally. */
const flush = () => new Promise((done) => setTimeout(done, 0))

describe('useWakeLock', () => {
  afterEach(() => {
    delete navigator.wakeLock
    delete document.visibilityState
  })

  it('запытвае блакіроўку экрана і вызваляе пры размантаванні', async () => {
    const release = vi.fn().mockResolvedValue()
    const request = vi.fn().mockResolvedValue({ release })
    installWakeLock(request)
    const { unmount } = renderHook(() => useWakeLock(true))
    await waitFor(() => expect(request).toHaveBeenCalledWith('screen'))
    unmount()
    expect(release).toHaveBeenCalled()
  })

  it('не запытвае, калі неактыўна або няма падтрымкі', async () => {
    const request = vi.fn().mockResolvedValue({ release: vi.fn() })
    installWakeLock(request)
    renderHook(() => useWakeLock(false))
    await Promise.resolve()
    expect(request).not.toHaveBeenCalled()
    delete navigator.wakeLock
    expect(() => renderHook(() => useWakeLock(true))).not.toThrow()
  })

  it('перазапытвае блакіроўку, калі ўкладка зноў бачная', async () => {
    const request = vi.fn().mockRejectedValueOnce(new Error('denied')).mockResolvedValue({ release: vi.fn() })
    installWakeLock(request)
    renderHook(() => useWakeLock(true))
    await waitFor(() => expect(request).toHaveBeenCalledTimes(1))
    Object.defineProperty(document, 'visibilityState', { value: 'visible', configurable: true })
    document.dispatchEvent(new Event('visibilitychange'))
    await waitFor(() => expect(request).toHaveBeenCalledTimes(2))
  })

  it('аднаўляе блакіроўку пасля аўтаматычнага вызвалення браўзерам', async () => {
    const lock = new EventTarget()
    lock.release = vi.fn().mockResolvedValue()
    const request = vi.fn().mockResolvedValue(lock)
    installWakeLock(request)
    renderHook(() => useWakeLock(true))
    await waitFor(() => expect(request).toHaveBeenCalledTimes(1))
    lock.dispatchEvent(new Event('release'))
    Object.defineProperty(document, 'visibilityState', { value: 'visible', configurable: true })
    document.dispatchEvent(new Event('visibilitychange'))
    await waitFor(() => expect(request).toHaveBeenCalledTimes(2))
  })

  it('не перазапытвае, пакуль укладка схаваная або блакіроўка яшчэ дзейнічае', async () => {
    const request = vi.fn().mockResolvedValue({ release: vi.fn().mockResolvedValue(), released: false })
    installWakeLock(request)
    renderHook(() => useWakeLock(true))
    await waitFor(() => expect(request).toHaveBeenCalledTimes(1))
    await flush()
    setVisibility('hidden')
    setVisibility('visible')
    await flush()
    expect(request).toHaveBeenCalledTimes(1)
  })

  it('схаваная ўкладка не запытвае блакіроўку нават пасля адмовы', async () => {
    const request = vi.fn().mockRejectedValue(new Error('denied'))
    installWakeLock(request)
    renderHook(() => useWakeLock(true))
    await waitFor(() => expect(request).toHaveBeenCalledTimes(1))
    await flush()
    setVisibility('hidden')
    await flush()
    expect(request).toHaveBeenCalledTimes(1)
  })

  it('некалькі падзей запар не дублююць запыт, пакуль першы не скончыўся', async () => {
    const pending = deferred()
    const request = vi.fn().mockRejectedValueOnce(new Error('denied')).mockReturnValue(pending.promise)
    installWakeLock(request)
    renderHook(() => useWakeLock(true))
    await waitFor(() => expect(request).toHaveBeenCalledTimes(1))
    await flush()
    setVisibility('visible')
    setVisibility('visible')
    expect(request).toHaveBeenCalledTimes(2)
    pending.resolve({ release: vi.fn().mockResolvedValue() })
    await flush()
  })

  it('блакіроўка, атрыманая ўжо пасля размантавання, адразу вызваляецца', async () => {
    const pending = deferred()
    const release = vi.fn().mockResolvedValue()
    installWakeLock(vi.fn().mockReturnValue(pending.promise))
    const { unmount } = renderHook(() => useWakeLock(true))
    unmount()
    expect(release).not.toHaveBeenCalled()
    pending.resolve({ release })
    await waitFor(() => expect(release).toHaveBeenCalledTimes(1))
  })

  it('пасля размантавання больш не сочыць за бачнасцю ўкладкі', async () => {
    const add = vi.spyOn(document, 'addEventListener')
    const remove = vi.spyOn(document, 'removeEventListener')
    const request = vi.fn().mockRejectedValue(new Error('denied'))
    installWakeLock(request)
    const { unmount } = renderHook(() => useWakeLock(true))
    await waitFor(() => expect(request).toHaveBeenCalledTimes(1))
    await flush()
    const [, onVisibility] = add.mock.calls.find(([type]) => type === 'visibilitychange')
    unmount()
    expect(remove).toHaveBeenCalledWith('visibilitychange', onVisibility)
    setVisibility('visible')
    await flush()
    expect(request).toHaveBeenCalledTimes(1)
  })

  it('запозненая падзея release ад старой блакіроўкі не скідае новую', async () => {
    const first = new EventTarget()
    first.release = vi.fn().mockResolvedValue()
    const second = { release: vi.fn().mockResolvedValue(), released: false }
    const request = vi.fn().mockResolvedValueOnce(first).mockResolvedValue(second)
    installWakeLock(request)
    renderHook(() => useWakeLock(true))
    await waitFor(() => expect(request).toHaveBeenCalledTimes(1))
    await flush()
    first.released = true
    setVisibility('visible')
    await waitFor(() => expect(request).toHaveBeenCalledTimes(2))
    await flush()
    first.dispatchEvent(new Event('release'))
    setVisibility('visible')
    await flush()
    expect(request).toHaveBeenCalledTimes(2)
  })

  it('памылка вызвалення пры размантаванні не выплывае вонкі', async () => {
    const unhandled = vi.fn()
    process.on('unhandledRejection', unhandled)
    let released = 0
    // не vi.fn: мок сам падпісваецца на проміс і хавае неапрацаваную адмову
    const release = () => {
      released += 1
      return Promise.reject(new Error('already released'))
    }
    installWakeLock(vi.fn().mockResolvedValue({ release }))
    try {
      const { unmount } = renderHook(() => useWakeLock(true))
      await flush()
      expect(() => unmount()).not.toThrow()
      expect(released).toBe(1)
      await flush()
      expect(unhandled).not.toHaveBeenCalled()
    } finally {
      process.off('unhandledRejection', unhandled)
    }
  })

  it('выключэнне (паўза) вызваляе блакіроўку, уключэнне — запытвае зноў', async () => {
    const release = vi.fn().mockResolvedValue()
    const request = vi.fn().mockResolvedValue({ release })
    installWakeLock(request)
    const { rerender } = renderHook(({ active }) => useWakeLock(active), { initialProps: { active: true } })
    await waitFor(() => expect(request).toHaveBeenCalledTimes(1))
    await flush()
    rerender({ active: false })
    expect(release).toHaveBeenCalledTimes(1)
    rerender({ active: true })
    await waitFor(() => expect(request).toHaveBeenCalledTimes(2))
  })
})
