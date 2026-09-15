import { describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'
import ScoreBoard from './ScoreBoard.jsx'
import { fixedTeams } from '../test/fixtures.js'
import { ScriptContext } from '../i18n/script.js'

const teams = fixedTeams(3, [12, 0, 45])

describe('ScoreBoard', () => {
  it('паказвае каманды, рахунак і актыўную каманду', () => {
    render(<ScoreBoard teams={teams} activeIndex={1} target={30} />)
    const rows = screen.getAllByRole('listitem')
    expect(rows).toHaveLength(3)
    expect(rows[1]).toHaveAttribute('aria-current', 'true')
    expect(rows[0]).not.toHaveAttribute('aria-current')
    expect(screen.getByText('12')).toBeInTheDocument()
    expect(screen.getByText('45')).toBeInTheDocument()
    expect(rows[0].querySelector('svg')).toHaveAttribute('data-motif', 'sun')
  })

  it('шкала маштабуецца па лідары, калі ён вышэй за мэту', () => {
    const { container } = render(<ScoreBoard teams={teams} activeIndex={-1} target={30} />)
    const fills = container.querySelectorAll('.scoreboard__fill')
    expect(fills[2].style.width).toBe('100%')
    expect(fills[0].style.width).toBe(`${(12 / 45) * 100}%`)
    expect(fills[1].style.width).toBe('0%')
  })

  it('адмоўны рахунак не ламае шкалу', () => {
    const { container } = render(<ScoreBoard teams={[{ ...teams[0], score: -3 }]} activeIndex={0} target={20} />)
    expect(container.querySelector('.scoreboard__fill').style.width).toBe('0%')
  })

  it('у рэжыме лацінкі назвы транслітаруюцца', () => {
    render(
      <ScriptContext.Provider value="lat">
        <ScoreBoard teams={teams} activeIndex={0} target={30} />
      </ScriptContext.Provider>,
    )
    expect(screen.getByText('Vusy Mulavina')).toBeInTheDocument()
    expect(screen.getByText('Kałasy pad siarpom ŠI')).toBeInTheDocument()
  })
})
