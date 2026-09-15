import { beforeEach, describe, expect, it, vi } from 'vitest'
import { fireEvent, render, screen } from '@testing-library/react'
import FinishScreen from './FinishScreen.jsx'
import { initialState, makeTeams } from '../game/gameState.js'
import { fixedTeams } from '../test/fixtures.js'
import { sounds, vibrate } from '../game/feedback.js'
import { ScriptContext } from '../i18n/script.js'

vi.mock('../game/feedback.js', () => ({
  unlockAudio: vi.fn(),
  vibrate: vi.fn(),
  sounds: { win: vi.fn() },
}))

function setup(overrides, script = 'cyr') {
  const dispatch = vi.fn()
  render(
    <ScriptContext.Provider value={script}>
      <FinishScreen state={{ ...initialState, screen: 'finish', roundNo: 4, ...overrides }} dispatch={dispatch} />
    </ScriptContext.Provider>,
  )
  return { dispatch }
}

describe('FinishScreen', () => {
  beforeEach(() => vi.clearAllMocks())

  it('называе пераможцу, сартуе табліцу і грае перамогу', () => {
    const teams = fixedTeams(3, [12, 31, 20])
    setup({ teams })
    expect(screen.getByText('Перамога')).toBeInTheDocument()
    expect(screen.getByRole('heading', { level: 2, name: 'Крынж Еўфрасінні' })).toBeInTheDocument()
    expect(screen.getByText('31 ачко за 4 раунды')).toBeInTheDocument()
    const rows = screen.getAllByRole('listitem')
    expect(rows[0]).toHaveTextContent('Крынж Еўфрасінні')
    expect(rows[2]).toHaveTextContent('Вусы Мулявіна')
    expect(sounds.win).toHaveBeenCalledTimes(1)
    expect(vibrate).toHaveBeenCalledTimes(1)
  })

  it('нічыя', () => {
    const teams = makeTeams(2).map((t) => ({ ...t, score: 30 }))
    setup({ teams })
    expect(screen.getByText('Нічыя')).toBeInTheDocument()
    expect(screen.getByRole('heading', { level: 2, name: 'Роўны рахунак' })).toBeInTheDocument()
    expect(document.querySelector('.finish__motif')).toBeNull()
  })

  it('сола: мэта дасягнута або проста вынік', () => {
    setup({ teams: makeTeams(1).map((t) => ({ ...t, score: 30 })) })
    expect(screen.getByText('Мэта дасягнута')).toBeInTheDocument()
    setup({ teams: makeTeams(1).map((t) => ({ ...t, score: 3 })) })
    expect(screen.getByText('Вынік')).toBeInTheDocument()
  })

  it('без гуку і вібрацыі маўчыць', () => {
    setup({ settings: { ...initialState.settings, sound: false, vibration: false } })
    expect(sounds.win).not.toHaveBeenCalled()
    expect(vibrate).not.toHaveBeenCalled()
  })

  it('кнопкі: налады і яшчэ раз', () => {
    const { dispatch } = setup({})
    fireEvent.click(screen.getByRole('button', { name: 'Налады' }))
    expect(dispatch).toHaveBeenCalledWith({ type: 'toSetup' })
    fireEvent.click(screen.getByRole('button', { name: 'Яшчэ раз' }))
    expect(dispatch).toHaveBeenCalledWith({ type: 'startGame' })
  })

  it('датэрміновае завяршэнне паказвае толькі сапраўды згуляныя раунды', () => {
    setup({ roundNo: 2, teams: fixedTeams(1, [7]).map((team) => ({ ...team, roundsPlayed: 1 })) })
    expect(screen.getByText('7 ачкоў за 1 раунд')).toBeInTheDocument()
  })

  it('у рэжыме лацінкі', () => {
    const teams = fixedTeams(2, [30, 10])
    setup({ teams }, 'lat')
    expect(screen.getByText('Pieramoha')).toBeInTheDocument()
    expect(screen.getByRole('heading', { level: 2, name: 'Vusy Mulavina' })).toBeInTheDocument()
    expect(screen.getByText('30 ačkoŭ za 4 raundy')).toBeInTheDocument()
  })
})
