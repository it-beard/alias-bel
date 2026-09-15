import '@testing-library/jest-dom/vitest'
import { afterEach, vi } from 'vitest'
import { cleanup } from '@testing-library/react'

/** Просты localStorage у памяці: Node 25 мае ўласны, які без файла не працуе і засланяе jsdom. */
function memoryStorage() {
  const map = new Map()
  return {
    getItem: (key) => (map.has(String(key)) ? map.get(String(key)) : null),
    setItem: (key, value) => map.set(String(key), String(value)),
    removeItem: (key) => map.delete(String(key)),
    clear: () => map.clear(),
    key: (i) => [...map.keys()][i] ?? null,
    get length() {
      return map.size
    },
  }
}

if (typeof globalThis.localStorage?.getItem !== 'function') {
  const storage = memoryStorage()
  Object.defineProperty(globalThis, 'localStorage', { value: storage, configurable: true, writable: true })
  if (typeof window !== 'undefined' && window !== globalThis) {
    Object.defineProperty(window, 'localStorage', { value: storage, configurable: true, writable: true })
  }
}

// matchMedia няма ў jsdom — тэма «аўта» абапіраецца на яго
if (typeof window !== 'undefined' && !window.matchMedia) {
  window.matchMedia = (query) => ({
    matches: false,
    media: query,
    onchange: null,
    addEventListener: () => {},
    removeEventListener: () => {},
    addListener: () => {},
    removeListener: () => {},
    dispatchEvent: () => false,
  })
}

afterEach(() => {
  cleanup()
  vi.restoreAllMocks()
  vi.useRealTimers()
  localStorage.clear()
})
