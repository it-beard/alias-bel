import { describe, expect, it, vi } from 'vitest'
import { fireEvent, render, screen } from '@testing-library/react'
import AdultGate from './AdultGate.jsx'
import { ScriptContext } from '../i18n/script.js'

describe('AdultGate', () => {
  it('пытаецца пра ўзрост: пацвярджае або зачыняецца', () => {
    const onConfirm = vi.fn()
    const onClose = vi.fn()
    const { container } = render(<AdultGate onConfirm={onConfirm} onClose={onClose} />)
    expect(screen.getByRole('dialog', { name: 'Вам дакладна ёсць 18 гадоў?' })).toBeInTheDocument()
    expect(screen.getByText(/беларуская секс-лексіка/)).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: 'Так, мне ёсць 18' }))
    expect(onConfirm).toHaveBeenCalledTimes(1)
    fireEvent.click(screen.getByRole('button', { name: 'Не, вярнуцца' }))
    fireEvent.click(container.querySelector('.sheet__backdrop'))
    expect(onClose).toHaveBeenCalledTimes(2)
  })

  it('Escape зачыняе без пацвярджэння', () => {
    const onConfirm = vi.fn()
    const onClose = vi.fn()
    render(<AdultGate onConfirm={onConfirm} onClose={onClose} />)
    fireEvent(screen.getByRole('dialog'), new Event('cancel', { cancelable: true }))
    expect(onClose).toHaveBeenCalledTimes(1)
    expect(onConfirm).not.toHaveBeenCalled()
  })

  it('у рэжыме лацінкі', () => {
    render(
      <ScriptContext.Provider value="lat">
        <AdultGate onConfirm={() => {}} onClose={() => {}} />
      </ScriptContext.Provider>,
    )
    expect(screen.getByRole('dialog', { name: 'Vam dakładna josć 18 hadoŭ?' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Tak, mnie josć 18' })).toBeInTheDocument()
  })
})
