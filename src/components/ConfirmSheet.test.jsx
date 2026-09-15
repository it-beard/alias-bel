import { describe, expect, it, vi } from 'vitest'
import { fireEvent, render, screen } from '@testing-library/react'
import ConfirmSheet from './ConfirmSheet.jsx'

describe('ConfirmSheet', () => {
  it('пацвярджае або зачыняецца', () => {
    const onConfirm = vi.fn()
    const onClose = vi.fn()
    const { container } = render(
      <ConfirmSheet title="Скончыць гульню?" text="Тлумачэнне" confirmLabel="Скончыць" danger onConfirm={onConfirm} onClose={onClose} />,
    )
    expect(screen.getByRole('dialog', { name: 'Скончыць гульню?' })).toBeInTheDocument()
    expect(screen.getByText('Тлумачэнне')).toBeInTheDocument()
    const confirm = screen.getByRole('button', { name: 'Скончыць' })
    expect(confirm).toHaveClass('btn--danger')
    fireEvent.click(confirm)
    expect(onConfirm).toHaveBeenCalledTimes(1)
    fireEvent.click(screen.getByRole('button', { name: 'Не, вярнуцца' }))
    fireEvent.click(container.querySelector('.sheet__backdrop'))
    expect(onClose).toHaveBeenCalledTimes(2)
  })

  it('без тэксту і без danger', () => {
    render(<ConfirmSheet title="Так?" confirmLabel="Так" onConfirm={() => {}} onClose={() => {}} />)
    expect(screen.getByRole('button', { name: 'Так' })).toHaveClass('btn--primary')
    expect(screen.queryByText('Тлумачэнне')).not.toBeInTheDocument()
  })
})
