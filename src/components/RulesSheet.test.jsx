import { describe, expect, it, vi } from 'vitest'
import { act, fireEvent, render, screen } from '@testing-library/react'
import RulesSheet from './RulesSheet.jsx'
import { ScriptContext } from '../i18n/script.js'
import { CLOSE_MS } from '../hooks/useSheetDrag.js'
import { swipeDown } from '../test/touch.js'

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

  it('зачыняецца змахам уніз', () => {
    vi.useFakeTimers()
    const onClose = vi.fn()
    const { container } = render(<RulesSheet onClose={onClose} />)
    swipeDown(container.querySelector('.sheet__body'), 160)
    act(() => vi.advanceTimersByTime(CLOSE_MS))
    expect(onClose).toHaveBeenCalledTimes(1)
  })

  it('побач са свайпамі сказана пра кнопку падказкі', () => {
    const { container } = render(<RulesSheet onClose={() => {}} />)
    const rule = [...container.querySelectorAll('.rules li')].find((li) => li.textContent.includes('свайп налева'))
    expect(rule).toHaveTextContent('Каля рэдкіх слоў ёсць кнопка ? — яна паказвае пераклад.')
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
