import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { act, fireEvent, render, screen } from '@testing-library/react'
import PlayScreen from './PlayScreen.jsx'
import { initialState } from '../game/gameState.js'
import { fixedTeams } from '../test/fixtures.js'
import { ANSWER_LOCK_MS } from '../game/constants.js'
import { sounds, vibrate } from '../game/feedback.js'
import { ScriptContext } from '../i18n/script.js'
import { advance } from '../test/timers.js'

vi.mock('../game/feedback.js', () => ({
  unlockAudio: vi.fn(),
  vibrate: vi.fn(),
  sounds: { correct: vi.fn(), skip: vi.fn(), tick: vi.fn(), timeUp: vi.fn(), start: vi.fn(), win: vi.fn() },
}))

const NOW = new Date('2026-09-15T12:00:00Z').getTime()

const playing = () => ({
  ...initialState,
  teams: fixedTeams(2),
  screen: 'play',
  current: 'хлеб',
  deck: ['соль', 'мора'],
  endsAt: NOW + 60_000,
  results: [],
})

function setup(state = playing(), script = 'cyr') {
  const dispatch = vi.fn()
  const view = render(
    <ScriptContext.Provider value={script}>
      <PlayScreen state={state} dispatch={dispatch} />
    </ScriptContext.Provider>,
  )
  return { dispatch, ...view }
}

describe('PlayScreen', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    vi.setSystemTime(NOW)
    vi.clearAllMocks()
  })
  afterEach(() => vi.useRealTimers())

  it('паказвае слова, каманду, таймер і нулявы рахунак', () => {
    setup()
    expect(screen.getByText('хлеб')).toBeInTheDocument()
    expect(screen.getByText('Вусы Мулявіна')).toBeInTheDocument()
    expect(screen.getByRole('timer')).toHaveTextContent('60')
    expect(screen.getByLabelText('Ачкі за раунд')).toHaveTextContent('0')
    expect(screen.getByText('1', { selector: '.card__index' })).toBeInTheDocument()
  })

  it('кнопкі адказу адпраўляюць адзнаку з гукам і вібрацыяй', () => {
    const { dispatch } = setup()
    fireEvent.click(screen.getByRole('button', { name: 'Адгадана' }))
    expect(dispatch).toHaveBeenCalledWith({ type: 'answer', guessed: true })
    expect(sounds.correct).toHaveBeenCalledTimes(1)
    expect(vibrate).toHaveBeenCalledWith(30)
    act(() => vi.advanceTimersByTime(ANSWER_LOCK_MS + 10))
    fireEvent.click(screen.getByRole('button', { name: 'Пас' }))
    expect(dispatch).toHaveBeenCalledWith({ type: 'answer', guessed: false })
    expect(sounds.skip).toHaveBeenCalledTimes(1)
    expect(vibrate).toHaveBeenLastCalledWith([20, 40, 20])
  })

  it('абараняе ад падвойнага націску', () => {
    const { dispatch } = setup()
    fireEvent.click(screen.getByRole('button', { name: 'Адгадана' }))
    fireEvent.click(screen.getByRole('button', { name: 'Адгадана' }))
    expect(dispatch).toHaveBeenCalledTimes(1)
    act(() => vi.advanceTimersByTime(ANSWER_LOCK_MS))
    fireEvent.click(screen.getByRole('button', { name: 'Адгадана' }))
    expect(dispatch).toHaveBeenCalledTimes(2)
  })

  it('без гуку і вібрацыі — толькі dispatch', () => {
    const state = playing()
    state.settings = { ...state.settings, sound: false, vibration: false }
    const { dispatch } = setup(state)
    fireEvent.click(screen.getByRole('button', { name: 'Адгадана' }))
    expect(dispatch).toHaveBeenCalledTimes(1)
    expect(sounds.correct).not.toHaveBeenCalled()
    expect(vibrate).not.toHaveBeenCalled()
  })

  it('клавіятура: стрэлкі адказваюць, прабел ставіць паўзу', () => {
    const { dispatch } = setup()
    fireEvent.keyDown(window, { key: 'ArrowRight' })
    expect(dispatch).toHaveBeenLastCalledWith({ type: 'answer', guessed: true })
    act(() => vi.advanceTimersByTime(ANSWER_LOCK_MS))
    fireEvent.keyDown(window, { key: 'ArrowLeft' })
    expect(dispatch).toHaveBeenLastCalledWith({ type: 'answer', guessed: false })
    fireEvent.keyDown(window, { key: ' ' })
    expect(dispatch).toHaveBeenLastCalledWith({ type: 'pause' })
  })

  it('свайп па картцы адказвае і паказвае штампы', () => {
    const { dispatch, container } = setup()
    const card = container.querySelector('.card')
    fireEvent.pointerDown(card, { clientX: 0, clientY: 0, pointerId: 1, button: 0 })
    fireEvent.pointerMove(card, { clientX: 40, clientY: 0, pointerId: 1 })
    expect(card.style.transform).toContain('translateX(40px)')
    expect(container.querySelector('.card__stamp--ok').style.opacity).toBe('0.5')
    expect(container.querySelector('.card__stamp--skip').style.opacity).toBe('0')
    fireEvent.pointerUp(card, { clientX: 120, clientY: 0, pointerId: 1 })
    expect(dispatch).toHaveBeenCalledWith({ type: 'answer', guessed: true })
    expect(card.style.transform).toContain('translateX(0px)')

    act(() => vi.advanceTimersByTime(ANSWER_LOCK_MS))
    fireEvent.pointerDown(card, { clientX: 200, clientY: 0, pointerId: 1, button: 0 })
    fireEvent.pointerUp(card, { clientX: 60, clientY: 0, pointerId: 1 })
    expect(dispatch).toHaveBeenLastCalledWith({ type: 'answer', guessed: false })
  })

  it('кнопка паўзы адпраўляе pause', () => {
    const { dispatch } = setup()
    fireEvent.click(screen.getByRole('button', { name: 'Паўза' }))
    expect(dispatch).toHaveBeenCalledWith({ type: 'pause' })
  })

  it('на паўзе: накладка з resume або endRound, адказы заблакаваныя', () => {
    const paused = { ...playing(), endsAt: null, pausedLeft: 30_000 }
    const view = setup(paused)
    expect(screen.getByRole('dialog', { name: 'Паўза' })).toBeInTheDocument()
    expect(screen.getByText('Засталося 30 с')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Адгадана' })).toBeDisabled()
    expect(screen.getByRole('button', { name: 'Пас' })).toBeDisabled()
    fireEvent.click(screen.getByRole('button', { name: 'Працягнуць' }))
    expect(view.dispatch).toHaveBeenCalledWith({ type: 'resume' })
    fireEvent.click(screen.getByRole('button', { name: 'Спыніць раунд' }))
    expect(view.dispatch).toHaveBeenCalledWith({ type: 'endRound' })
    fireEvent.keyDown(window, { key: 'ArrowRight' })
    expect(view.dispatch).not.toHaveBeenCalledWith({ type: 'answer', guessed: true })
  })

  it('калі час выйшаў — сігнал, вібрацыя і timeUp; апошнія 5 секунд цікаюць', () => {
    const { dispatch } = setup()
    advance(54_000, 1000)
    expect(sounds.tick).not.toHaveBeenCalled()
    advance(6_000)
    expect(sounds.tick).toHaveBeenCalledTimes(5)
    expect(sounds.timeUp).toHaveBeenCalledTimes(1)
    expect(vibrate).toHaveBeenCalledWith([120, 60, 120])
    expect(dispatch).toHaveBeenCalledWith({ type: 'timeUp' })
    expect(dispatch).toHaveBeenCalledTimes(1)
  })

  it('апошняе слова: таймер спынены, паўза недаступная', () => {
    const { dispatch } = setup({ ...playing(), endsAt: null, lastWord: true })
    expect(screen.getByRole('timer')).toHaveTextContent('Апошняе слова!')
    expect(screen.getByRole('button', { name: 'Паўза' })).toBeDisabled()
    fireEvent.keyDown(window, { key: ' ' })
    expect(dispatch).not.toHaveBeenCalled()
    fireEvent.click(screen.getByRole('button', { name: 'Адгадана' }))
    expect(dispatch).toHaveBeenCalledWith({ type: 'answer', guessed: true })
  })

  it('паказвае бягучы рахунак раунда і нумар слова', () => {
    const results = [
      { word: 'а', guessed: true },
      { word: 'б', guessed: true },
      { word: 'в', guessed: false },
    ]
    setup({ ...playing(), results })
    expect(screen.getByLabelText('Ачкі за раунд')).toHaveTextContent('+1')
    expect(screen.getByText('4', { selector: '.card__index' })).toBeInTheDocument()
  })

  it('пазначае тэрміновасць у апошнія секунды', () => {
    const { container } = setup({ ...playing(), endsAt: NOW + 4_000 })
    expect(container.querySelector('.timer')).toHaveClass('is-urgent')
  })

  it('у рэжыме лацінкі слова і кнопкі на лацінцы', () => {
    const { container } = setup(playing(), 'lat')
    expect(screen.getByText('chleb')).toBeInTheDocument()
    expect(container.querySelector('.card')).toHaveAttribute('lang', 'be-Latn')
    expect(screen.getByRole('button', { name: 'Adhadana' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Pas' })).toBeInTheDocument()
  })
})
