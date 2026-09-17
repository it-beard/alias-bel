import { afterEach, describe, expect, it } from 'vitest'
import { act, screen } from '@testing-library/react'
import { STORAGE_KEY } from './game/constants.js'

describe('main', () => {
  afterEach(() => {
    document.body.innerHTML = ''
  })

  it('манціруе гульню ў #root з index.html', async () => {
    document.body.innerHTML = '<div id="root"></div>'
    await act(() => import('./main.jsx'))
    const root = document.getElementById('root')
    expect(root).toContainElement(screen.getByRole('heading', { level: 1, name: 'Аліяс' }))
    expect(root.querySelector('main.app')).toHaveAttribute('data-screen', 'setup')
    expect(JSON.parse(localStorage.getItem(STORAGE_KEY)).screen).toBe('setup')
  })
})
