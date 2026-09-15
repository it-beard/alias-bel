import { describe, expect, it, vi } from 'vitest'
import { fireEvent, render, screen } from '@testing-library/react'
import Toggle from './Toggle.jsx'

describe('Toggle', () => {
  it('паказвае стан і пераключае яго', () => {
    const onChange = vi.fn()
    render(<Toggle label="Гук" hint="Сігналы" value={true} onChange={onChange} />)
    const sw = screen.getByRole('switch', { name: /Гук/ })
    expect(sw).toHaveAttribute('aria-checked', 'true')
    expect(screen.getByText('Сігналы')).toBeInTheDocument()
    fireEvent.click(sw)
    expect(onChange).toHaveBeenCalledWith(false)
  })

  it('без падказкі рэндэрыць толькі подпіс', () => {
    render(<Toggle label="Вібрацыя" value={false} onChange={() => {}} />)
    expect(screen.getByRole('switch')).toHaveAttribute('aria-checked', 'false')
    expect(screen.queryByText(/Сігналы/)).not.toBeInTheDocument()
  })
})
