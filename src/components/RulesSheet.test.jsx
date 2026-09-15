import { describe, expect, it, vi } from 'vitest'
import { fireEvent, render, screen } from '@testing-library/react'
import RulesSheet from './RulesSheet.jsx'
import { ScriptContext } from '../i18n/script.js'

describe('RulesSheet', () => {
  it('паказвае сем правілаў і зачыняецца кнопкай або фонам', () => {
    const onClose = vi.fn()
    const { container } = render(<RulesSheet onClose={onClose} />)
    expect(screen.getByRole('dialog', { name: 'Правілы гульні' })).toBeInTheDocument()
    expect(container.querySelectorAll('.rules li')).toHaveLength(7)
    fireEvent.click(screen.getByRole('button', { name: 'Зразумела' }))
    expect(onClose).toHaveBeenCalledTimes(1)
    fireEvent.click(container.querySelector('.sheet__backdrop'))
    expect(onClose).toHaveBeenCalledTimes(2)
  })

  it('у рэжыме лацінкі правілы транслітаруюцца', () => {
    render(
      <ScriptContext.Provider value="lat">
        <RulesSheet onClose={() => {}} />
      </ScriptContext.Provider>,
    )
    expect(screen.getByRole('dialog', { name: 'Praviły hulni' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Zrazumieła' })).toBeInTheDocument()
    expect(screen.getByText('Adhadana')).toBeInTheDocument()
  })
})
