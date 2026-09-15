import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { act, fireEvent, render, screen } from '@testing-library/react'
import ReadyScreen from './ReadyScreen.jsx'
import { initialState } from '../game/gameState.js'
import { fixedTeams } from '../test/fixtures.js'
import { COUNTDOWN_STEP_MS } from '../game/constants.js'
import { sounds, unlockAudio, vibrate } from '../game/feedback.js'
import { ScriptContext } from '../i18n/script.js'

vi.mock('../game/feedback.js', () => ({
  unlockAudio: vi.fn(),
  vibrate: vi.fn(),
  sounds: { tick: vi.fn(), start: vi.fn() },
}))

const ready = { ...initialState, screen: 'ready', teams: fixedTeams(2, [5, 8]), roundNo: 2 }

function setup(state = ready, script = 'cyr') {
  const dispatch = vi.fn()
  const onRules = vi.fn()
  render(
    <ScriptContext.Provider value={script}>
      <ReadyScreen state={state} dispatch={dispatch} onRules={onRules} />
    </ScriptContext.Provider>,
  )
  return { dispatch, onRules }
}

describe('ReadyScreen', () => {
  beforeEach(() => vi.useFakeTimers())
  afterEach(() => vi.useRealTimers())

  it('паказвае раунд, каманду, рахунак і час раунда', () => {
    setup()
    expect(screen.getByText('Раунд 2')).toBeInTheDocument()
    expect(screen.getByRole('heading', { level: 2, name: 'Вусы Мулявіна' })).toBeInTheDocument()
    expect(screen.getByRole('img', { name: 'Знак каманды' })).toHaveAttribute('data-motif', 'mulavin-mustache')
    expect(screen.getByText('60 секунд')).toBeInTheDocument()
    expect(screen.getByText('Рахунак — да 30')).toBeInTheDocument()
    expect(screen.getByText('8')).toBeInTheDocument()
  })

  it('адлічвае 3-2-1 і пачынае раунд', () => {
    const { dispatch } = setup()
    fireEvent.click(screen.getByRole('button', { name: /Пачаць раунд/ }))
    expect(unlockAudio).toHaveBeenCalled()
    expect(screen.getByText('3')).toBeInTheDocument()
    expect(sounds.tick).toHaveBeenCalledTimes(1)
    expect(vibrate).toHaveBeenCalledWith(15)
    act(() => vi.advanceTimersByTime(COUNTDOWN_STEP_MS))
    expect(screen.getByText('2')).toBeInTheDocument()
    act(() => vi.advanceTimersByTime(COUNTDOWN_STEP_MS))
    expect(screen.getByText('1')).toBeInTheDocument()
    expect(dispatch).not.toHaveBeenCalled()
    act(() => vi.advanceTimersByTime(COUNTDOWN_STEP_MS))
    expect(sounds.start).toHaveBeenCalledTimes(1)
    expect(dispatch).toHaveBeenCalledWith({ type: 'startTurn' })
    expect(sounds.tick).toHaveBeenCalledTimes(3)
  })

  it('адлік можна скасаваць дотыкам', () => {
    const { dispatch } = setup()
    fireEvent.click(screen.getByRole('button', { name: /Пачаць раунд/ }))
    fireEvent.click(screen.getByRole('button', { name: 'Скасаваць' }))
    act(() => vi.advanceTimersByTime(COUNTDOWN_STEP_MS * 4))
    expect(screen.queryByText('3')).not.toBeInTheDocument()
    expect(dispatch).not.toHaveBeenCalled()
  })

  it('без гуку і вібрацыі адлік ціхі', () => {
    vi.mocked(sounds.tick).mockClear()
    vi.mocked(vibrate).mockClear()
    vi.mocked(unlockAudio).mockClear()
    setup({ ...ready, settings: { ...ready.settings, sound: false, vibration: false } })
    fireEvent.click(screen.getByRole('button', { name: /Пачаць раунд/ }))
    act(() => vi.advanceTimersByTime(COUNTDOWN_STEP_MS * 3))
    expect(sounds.tick).not.toHaveBeenCalled()
    expect(vibrate).not.toHaveBeenCalled()
    expect(unlockAudio).not.toHaveBeenCalled()
  })

  it('завяршэнне гульні патрабуе пацверджання', () => {
    const { dispatch } = setup()
    fireEvent.click(screen.getByRole('button', { name: 'Скончыць гульню' }))
    expect(screen.getByRole('dialog', { name: 'Скончыць гульню?' })).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: 'Не, вярнуцца' }))
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    expect(dispatch).not.toHaveBeenCalled()
    fireEvent.click(screen.getByRole('button', { name: 'Скончыць гульню' }))
    fireEvent.click(screen.getByRole('button', { name: 'Скончыць' }))
    expect(dispatch).toHaveBeenCalledWith({ type: 'finishNow' })
  })

  it('налады і правілы', () => {
    const { dispatch, onRules } = setup()
    fireEvent.click(screen.getByRole('button', { name: 'Налады' }))
    expect(dispatch).toHaveBeenCalledWith({ type: 'toSetup' })
    fireEvent.click(screen.getByRole('button', { name: 'Правілы' }))
    expect(onRules).toHaveBeenCalledTimes(1)
  })

  it('у рэжыме лацінкі', () => {
    setup(ready, 'lat')
    expect(screen.getByRole('heading', { level: 2, name: 'Vusy Mulavina' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /Pačać raund/ })).toBeInTheDocument()
    expect(screen.getByText('Raund 2')).toBeInTheDocument()
  })
})
