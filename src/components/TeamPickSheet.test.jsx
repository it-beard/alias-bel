import { describe, expect, it, vi } from 'vitest'
import { fireEvent, render, screen, within } from '@testing-library/react'
import TeamPickSheet from './TeamPickSheet.jsx'
import { fixedTeams } from '../test/fixtures.js'
import { ScriptContext } from '../i18n/script.js'

const teams = fixedTeams(3)

function setup(props = {}, script = 'cyr') {
  const onPick = vi.fn()
  const onClose = vi.fn()
  const view = render(
    <ScriptContext.Provider value={script}>
      <TeamPickSheet teams={teams} activeIndex={1} onPick={onPick} onClose={onClose} {...props} />
    </ScriptContext.Provider>,
  )
  return { onPick, onClose, ...view }
}

describe('TeamPickSheet', () => {
  it('паказвае ўсе каманды і адзначае тую, чый раунд', () => {
    setup()
    const dialog = screen.getByRole('dialog', { name: 'Хто адгадаў?' })
    const items = within(dialog).getAllByRole('listitem')
    expect(items.map((item) => item.textContent)).toEqual(['Вусы Мулявіна', 'Крынж Еўфрасіннііх раунд', 'Каласы пад сярпом ШІ'])
    items.forEach((item, i) => expect(within(item).getByRole('button').style.getPropertyValue('--team')).toBe(teams[i].color))
  })

  it('выбар каманды перадае яе індэкс', () => {
    const { onPick } = setup()
    fireEvent.click(screen.getByRole('button', { name: /Каласы пад сярпом ШІ/ }))
    expect(onPick).toHaveBeenCalledWith(2)
  })

  it('зачыняецца кнопкай «Назад» або фонам', () => {
    const { onClose, container } = setup()
    fireEvent.click(screen.getByRole('button', { name: 'Назад' }))
    fireEvent.click(container.querySelector('.sheet__backdrop'))
    expect(onClose).toHaveBeenCalledTimes(2)
  })

  it('варыянт «ніхто» і слова паказваюцца толькі калі перададзеныя', () => {
    setup()
    expect(screen.queryByRole('button', { name: 'Ніхто не адгадаў' })).not.toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Назад' })).toHaveClass('btn--wide')
  })

  it('з варыянтам «ніхто» і словам', () => {
    const onNobody = vi.fn()
    setup({ onNobody, word: 'хлеб' })
    expect(screen.getByText('хлеб')).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: 'Ніхто не адгадаў' }))
    expect(onNobody).toHaveBeenCalledTimes(1)
    expect(screen.getByRole('button', { name: 'Назад' })).not.toHaveClass('btn--wide')
  })

  it('у рэжыме лацінкі транслітаруецца', () => {
    setup({ word: 'хлеб', onNobody: () => {} }, 'lat')
    expect(screen.getByRole('dialog', { name: 'Chto adhadaŭ?' })).toBeInTheDocument()
    expect(screen.getByText('chleb')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /Vusy Mulavina/ })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Nichto nie adhadaŭ' })).toBeInTheDocument()
  })
})
