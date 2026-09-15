import { describe, expect, it, vi } from 'vitest'
import { fireEvent, render, screen } from '@testing-library/react'
import Segmented from './Segmented.jsx'

const options = [
  { value: 30, label: '30 с' },
  { value: 60, label: '60 с' },
]

describe('Segmented', () => {
  it('пазначае выбраны сегмент і паведамляе пра выбар', () => {
    const onChange = vi.fn()
    render(<Segmented label="Час" options={options} value={60} onChange={onChange} />)
    expect(screen.getByRole('radiogroup', { name: 'Час' })).toBeInTheDocument()
    expect(screen.getByRole('radio', { name: '60 с' })).toHaveAttribute('aria-checked', 'true')
    expect(screen.getByRole('radio', { name: '30 с' })).toHaveAttribute('aria-checked', 'false')
    fireEvent.click(screen.getByRole('radio', { name: '30 с' }))
    expect(onChange).toHaveBeenCalledWith(30)
  })

  it('прымае дадатковы клас', () => {
    const { container } = render(<Segmented options={options} value={30} onChange={() => {}} className="x" />)
    expect(container.firstChild).toHaveClass('seg', 'x')
  })
})
