import { act } from '@testing-library/react'
import { vi } from 'vitest'

/**
 * Прасоўвае фальшывыя таймеры крокамі ў асобных act(): так кожны тык
 * інтэрвалу дае свой рэндэр, як у браўзеры, а не зліваецца ў адзін.
 */
export function advance(ms, step = 200) {
  for (let passed = 0; passed < ms; passed += step) {
    act(() => vi.advanceTimersByTime(Math.min(step, ms - passed)))
  }
}
