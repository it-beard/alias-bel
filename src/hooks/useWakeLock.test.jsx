import { afterEach, describe, expect, it, vi } from 'vitest'
import { renderHook, waitFor } from '@testing-library/react'
import { useWakeLock } from './useWakeLock.js'

function installWakeLock(request) {
  Object.defineProperty(navigator, 'wakeLock', { value: { request }, configurable: true })
}

describe('useWakeLock', () => {
  afterEach(() => {
    delete navigator.wakeLock
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
})
