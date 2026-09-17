import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { act, cleanup, createEvent, fireEvent, render, screen, within } from '@testing-library/react'
import PlayScreen from './PlayScreen.jsx'
import { initialState } from '../game/gameState.js'
import { fixedTeams } from '../test/fixtures.js'
import { ANSWER_LOCK_MS } from '../game/constants.js'
import { sounds, unlockAudio, vibrate } from '../game/feedback.js'
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

// рэдкае слова сярэдняга ўзроўню — з перакладам у падказцы
const hinted = (extra = {}) => ({ ...playing(), current: 'рыдлёўка', ...extra })

function setup(state = playing(), script = 'cyr') {
  const dispatch = vi.fn()
  const ui = (next) => (
    <ScriptContext.Provider value={script}>
      <PlayScreen state={next} dispatch={dispatch} />
    </ScriptContext.Provider>
  )
  const view = render(ui(state))
  return { dispatch, ...view, update: (next) => view.rerender(ui(next)) }
}

const hintButton = () => screen.queryByRole('button', { name: 'Падказка' })

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
    expect(vibrate).toHaveBeenCalledWith(50)
    act(() => vi.advanceTimersByTime(ANSWER_LOCK_MS + 10))
    fireEvent.click(screen.getByRole('button', { name: 'Пас' }))
    expect(dispatch).toHaveBeenCalledWith({ type: 'answer', guessed: false })
    expect(sounds.skip).toHaveBeenCalledTimes(1)
    expect(vibrate).toHaveBeenLastCalledWith([40, 60, 40])
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

  describe('скончыць гульню з паўзы', () => {
    const pausedState = () => ({ ...playing(), endsAt: null, pausedLeft: 30_000, results: [{ word: 'соль', guessed: true }] })
    const confirmDialog = () => screen.queryByRole('dialog', { name: 'Скончыць гульню?' })

    it('кнопка ёсць толькі ў попапе паўзы і спачатку пытаецца', () => {
      const { dispatch, update } = setup()
      expect(screen.queryByRole('button', { name: 'Скончыць гульню' })).not.toBeInTheDocument()
      update(pausedState())
      const buttons = within(screen.getByRole('dialog', { name: 'Паўза' })).getAllByRole('button').map((button) => button.textContent)
      expect(buttons).toEqual(['Працягнуць', 'Спыніць раунд', 'Скончыць гульню'])
      expect(confirmDialog()).not.toBeInTheDocument()

      fireEvent.click(screen.getByRole('button', { name: 'Скончыць гульню' }))
      expect(confirmDialog()).toHaveTextContent('Пераможца вызначыцца па бягучым рахунку. Словы гэтага раунда не залічацца.')
      expect(dispatch).not.toHaveBeenCalled()
    })

    it('пацверджанне адпраўляе finishNow адзін раз — без resume і endRound', () => {
      const { dispatch } = setup(pausedState())
      fireEvent.click(screen.getByRole('button', { name: 'Скончыць гульню' }))
      fireEvent.click(within(confirmDialog()).getByRole('button', { name: 'Скончыць' }))
      expect(dispatch.mock.calls).toEqual([[{ type: 'finishNow' }]])
      expect(unlockAudio).not.toHaveBeenCalled()
    })

    it('адмова, фон і Escape вяртаюць да паўзы: гульня не працягваецца і не сканчаецца', () => {
      const { dispatch, container } = setup(pausedState())
      const open = () => fireEvent.click(screen.getByRole('button', { name: 'Скончыць гульню' }))

      open()
      fireEvent.click(within(confirmDialog()).getByRole('button', { name: 'Не, вярнуцца' }))
      expect(confirmDialog()).not.toBeInTheDocument()

      open()
      fireEvent.click(container.querySelector('.sheet__backdrop'))
      expect(confirmDialog()).not.toBeInTheDocument()

      open()
      const cancel = createEvent('cancel', confirmDialog(), { cancelable: true })
      fireEvent(confirmDialog(), cancel)
      expect(cancel.defaultPrevented).toBe(true)
      expect(confirmDialog()).not.toBeInTheDocument()

      expect(screen.getByRole('dialog', { name: 'Паўза' })).toBeInTheDocument()
      expect(dispatch).not.toHaveBeenCalled()
    })

    it('Escape, які дайшоў да акна паўзы пад пацверджаннем, гульню не працягвае', () => {
      const { dispatch } = setup(pausedState())
      fireEvent.click(screen.getByRole('button', { name: 'Скончыць гульню' }))
      // Chrome групуе дыялогі, адкрытыя без дзеяння карыстальніка: cancel прыходзіць абодвум запар
      act(() => {
        for (const dialog of [confirmDialog(), screen.getByRole('dialog', { name: 'Паўза' })]) {
          dialog.dispatchEvent(new Event('cancel', { cancelable: true }))
        }
      })
      expect(confirmDialog()).not.toBeInTheDocument()
      expect(screen.getByRole('dialog', { name: 'Паўза' })).toBeInTheDocument()
      expect(dispatch).not.toHaveBeenCalled()
      expect(unlockAudio).not.toHaveBeenCalled()
      // без пацверджання Escape зноў здымае паўзу
      fireEvent(screen.getByRole('dialog', { name: 'Паўза' }), createEvent('cancel', screen.getByRole('dialog', { name: 'Паўза' }), { cancelable: true }))
      expect(dispatch.mock.calls).toEqual([[{ type: 'resume' }]])
    })

    it('пасля працягу і новай паўзы пацверджанне не ўсплывае само', () => {
      const { dispatch, update } = setup(pausedState())
      fireEvent.click(screen.getByRole('button', { name: 'Скончыць гульню' }))
      fireEvent.click(screen.getByRole('button', { name: 'Працягнуць' }))
      expect(dispatch).toHaveBeenLastCalledWith({ type: 'resume' })
      update({ ...playing(), endsAt: NOW + 30_000 })
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
      update(pausedState())
      expect(screen.getByRole('dialog', { name: 'Паўза' })).toBeInTheDocument()
      expect(confirmDialog()).not.toBeInTheDocument()
    })

    it('у лацінцы', () => {
      setup(pausedState(), 'lat')
      fireEvent.click(screen.getByRole('button', { name: 'Skončyć hulniu' }))
      expect(screen.getByRole('dialog', { name: 'Skončyć hulniu?' })).toBeInTheDocument()
      expect(screen.getByRole('button', { name: 'Skončyć' })).toBeInTheDocument()
    })
  })

  it('калі час выйшаў — сігнал, вібрацыя і timeUp; апошнія 5 секунд цікаюць', () => {
    const { dispatch } = setup()
    advance(54_000, 1000)
    expect(sounds.tick).not.toHaveBeenCalled()
    advance(6_000)
    expect(sounds.tick).toHaveBeenCalledTimes(5)
    expect(sounds.timeUp).toHaveBeenCalledTimes(1)
    expect(vibrate).toHaveBeenCalledWith([200, 100, 200])
    expect(dispatch).toHaveBeenCalledWith({ type: 'timeUp' })
    expect(dispatch).toHaveBeenCalledTimes(1)
  })

  it('Escape таксама ставіць паўзу, а на паўзе — працягвае, разблакаваўшы аўдыя', () => {
    const { dispatch } = setup()
    fireEvent.keyDown(window, { key: 'Escape' })
    expect(dispatch).toHaveBeenLastCalledWith({ type: 'pause' })
    expect(unlockAudio).not.toHaveBeenCalled()
    cleanup()

    const paused = setup({ ...playing(), endsAt: null, pausedLeft: 30_000 })
    const dialog = screen.getByRole('dialog', { name: 'Паўза' })
    const cancel = createEvent('cancel', dialog, { cancelable: true })
    fireEvent(dialog, cancel)
    expect(cancel.defaultPrevented).toBe(true)
    expect(unlockAudio).toHaveBeenCalledTimes(1)
    expect(paused.dispatch).toHaveBeenLastCalledWith({ type: 'resume' })
  })

  it('без гуку працяг пасля паўзы не чапае аўдыя', () => {
    const state = { ...playing(), endsAt: null, pausedLeft: 30_000 }
    state.settings = { ...state.settings, sound: false }
    const { dispatch } = setup(state)
    fireEvent.click(screen.getByRole('button', { name: 'Працягнуць' }))
    expect(dispatch).toHaveBeenCalledWith({ type: 'resume' })
    expect(unlockAudio).not.toHaveBeenCalled()
  })

  it('на паўзе картка схаваная ад чытачоў экрана і не рэагуе на свайп', () => {
    const { dispatch, container } = setup({ ...playing(), endsAt: null, pausedLeft: 30_000 })
    const card = container.querySelector('.card')
    expect(card).toHaveAttribute('aria-hidden', 'true')
    fireEvent.pointerDown(card, { clientX: 0, clientY: 0, pointerId: 1, button: 0 })
    fireEvent.pointerUp(card, { clientX: 200, clientY: 0, pointerId: 1 })
    expect(dispatch).not.toHaveBeenCalled()
    expect(sounds.tick).not.toHaveBeenCalled()
  })

  it('адказ пасля выхаду часу без правіла апошняга слова завяршае раунд, а не лічыцца', () => {
    const state = playing()
    state.settings = { ...state.settings, lastWordRule: false }
    const { dispatch } = setup(state)
    // укладка была ў фоне: гадзіннік пайшоў наперад, а таймер яшчэ не цікнуў
    vi.setSystemTime(NOW + 61_000)
    fireEvent.click(screen.getByRole('button', { name: 'Адгадана' }))
    expect(dispatch).toHaveBeenCalledTimes(1)
    expect(dispatch).toHaveBeenCalledWith({ type: 'timeUp' })
    expect(sounds.correct).not.toHaveBeenCalled()
    expect(vibrate).not.toHaveBeenCalled()
  })

  it('з правілам апошняга слова запознены адказ яшчэ залічваецца', () => {
    const { dispatch } = setup()
    vi.setSystemTime(NOW + 61_000)
    fireEvent.click(screen.getByRole('button', { name: 'Пас' }))
    expect(dispatch).toHaveBeenCalledTimes(1)
    expect(dispatch).toHaveBeenCalledWith({ type: 'answer', guessed: false })
  })

  it('кожная з апошніх секунд цікае адзін раз, нават калі экран перамалёўваецца', () => {
    const state = { ...playing(), endsAt: NOW + 4_000 }
    const { rerender } = setup(state)
    expect(sounds.tick).toHaveBeenCalledTimes(1)
    rerender(
      <ScriptContext.Provider value="cyr">
        <PlayScreen state={{ ...state, settings: { ...state.settings, vibration: false } }} dispatch={vi.fn()} />
      </ScriptContext.Provider>,
    )
    rerender(
      <ScriptContext.Provider value="cyr">
        <PlayScreen state={{ ...state, settings: { ...state.settings, sound: false } }} dispatch={vi.fn()} />
      </ScriptContext.Provider>,
    )
    rerender(
      <ScriptContext.Provider value="cyr">
        <PlayScreen state={state} dispatch={vi.fn()} />
      </ScriptContext.Provider>,
    )
    expect(sounds.tick).toHaveBeenCalledTimes(1)
  })

  it('без гуку і вібрацыі канец часу ціхі', () => {
    const state = playing()
    state.settings = { ...state.settings, sound: false, vibration: false }
    const { dispatch } = setup({ ...state, endsAt: NOW + 3_000 })
    advance(3_000)
    expect(dispatch).toHaveBeenCalledWith({ type: 'timeUp' })
    expect(sounds.tick).not.toHaveBeenCalled()
    expect(sounds.timeUp).not.toHaveBeenCalled()
    expect(vibrate).not.toHaveBeenCalled()
  })

  it('у рэжыме 18+ картка пазначаная', () => {
    const { container, unmount } = setup()
    expect(container.querySelector('.card__adult')).not.toBeInTheDocument()
    unmount()
    setup({ ...playing(), current: 'любошчы', settings: { ...initialState.settings, level: 'adult' } })
    expect(screen.getByText('любошчы')).toBeInTheDocument()
    expect(screen.getByText('18+')).toHaveClass('card__adult')
  })

  it('без бягучага слова картка пустая, але экран не падае', () => {
    const { container } = setup({ ...playing(), current: null })
    expect(container.querySelector('.card__word')).toBeEmptyDOMElement()
  })

  it('палоска часу адлюстроўвае долю раунда, а на апошнім слове пустая', () => {
    const { container } = setup({ ...playing(), endsAt: NOW + 30_000 })
    expect(container.querySelector('.timer__fill').style.transform).toBe('scaleX(0.5)')
    cleanup()
    const paused = setup({ ...playing(), endsAt: null, pausedLeft: 15_000 })
    expect(paused.container.querySelector('.timer__fill').style.transform).toBe('scaleX(0.25)')
    expect(screen.getByRole('timer')).toHaveTextContent('15')
    cleanup()
    const last = setup({ ...playing(), endsAt: null, lastWord: true })
    expect(last.container.querySelector('.timer__fill').style.transform).toBe('scaleX(0)')
    expect(last.container.querySelector('.timer')).toHaveClass('is-last')
    expect(last.container.querySelector('.timer')).not.toHaveClass('is-urgent')
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

  describe('падказка да слова', () => {
    it('кнопка з пытальнікам стаіць паміж «Пас» і «Адгадана» і адкрывае пераклады', () => {
      const { container, dispatch } = setup(hinted())
      const names = [...container.querySelectorAll('.answers button')].map((button) => button.getAttribute('aria-label') ?? button.textContent)
      expect(names).toEqual(['✕Пас', 'Падказка', '✓Адгадана'])
      expect(container.querySelector('.answers')).toHaveClass('answers--hint')
      expect(hintButton()).toHaveTextContent('?')
      expect(hintButton()).toHaveAttribute('aria-expanded', 'false')
      expect(container.querySelector('.card__hint')).not.toBeInTheDocument()

      fireEvent.click(hintButton())
      expect(hintButton()).toHaveAttribute('aria-expanded', 'true')
      const hint = container.querySelector('.card__hint')
      expect(hint).toHaveAttribute('id', hintButton().getAttribute('aria-controls'))
      const [ru, en] = hint.querySelectorAll('.card__hint-row')
      expect(ru).toHaveAttribute('lang', 'ru')
      expect(ru).toHaveTextContent('RUлопата')
      expect(en).toHaveAttribute('lang', 'en')
      expect(en).toHaveTextContent('ENspade')
      // слова застаецца на месцы, падказка — у той самай картцы
      expect(container.querySelector('.card .card__word')).toHaveTextContent('рыдлёўка')
      expect(container.querySelector('.card')).toContainElement(hint)

      fireEvent.click(hintButton())
      expect(container.querySelector('.card__hint')).not.toBeInTheDocument()
      expect(hintButton()).toHaveAttribute('aria-expanded', 'false')
      // падказка нічога не мяняе ў гульні: ні адказу, ні паўзы, ні гуку
      expect(dispatch).not.toHaveBeenCalled()
      expect(sounds.correct).not.toHaveBeenCalled()
      expect(sounds.skip).not.toHaveBeenCalled()
      expect(vibrate).not.toHaveBeenCalled()
    })

    it('на лёгкім узроўні кнопкі няма зусім, і клавішы падказкі нічога не робяць', () => {
      const { container, dispatch } = setup()
      expect(hintButton()).not.toBeInTheDocument()
      expect(container.querySelector('.answers')).not.toHaveClass('answers--hint')
      fireEvent.keyDown(window, { key: 'ArrowUp' })
      fireEvent.keyDown(window, { key: '?' })
      expect(container.querySelector('.card__hint')).not.toBeInTheDocument()
      expect(dispatch).not.toHaveBeenCalled()
    })

    it('з выключанай наладай падказак кнопкі няма нават на рэдкім слове, клавішы маўчаць', () => {
      const off = { settings: { ...initialState.settings, hints: false } }
      const { container, dispatch, update } = setup(hinted(off))
      expect(hintButton()).not.toBeInTheDocument()
      expect(container.querySelector('.answers')).not.toHaveClass('answers--hint')
      fireEvent.keyDown(window, { key: 'ArrowUp' })
      fireEvent.keyDown(window, { key: '?' })
      expect(container.querySelector('.card__hint')).not.toBeInTheDocument()
      expect(dispatch).not.toHaveBeenCalled()
      // налада ўключаная назад — кнопка вяртаецца, падказка закрытая
      update(hinted())
      expect(hintButton()).toHaveAttribute('aria-expanded', 'false')
    })

    it('на слове без падказкі кнопкі няма — застаюцца дзве шырокія', () => {
      // «кавярня» — часта ўжыванае слова, «парадокс» па-расейску пішацца гэтаксама
      for (const [level, current] of [['medium', 'кавярня'], ['hard', 'парадокс'], ['adult', 'каханне']]) {
        const { container, dispatch } = setup({ ...playing(), current, settings: { ...initialState.settings, level } })
        expect(hintButton()).not.toBeInTheDocument()
        expect(container.querySelector('.answers')).not.toHaveClass('answers--hint')
        expect(container.querySelectorAll('.answers button')).toHaveLength(2)
        fireEvent.keyDown(window, { key: 'ArrowUp' })
        expect(container.querySelector('.card__hint')).not.toBeInTheDocument()
        expect(dispatch).not.toHaveBeenCalled()
        cleanup()
      }
    })

    it('ва «Усе разам» кнопка ёсць толькі на словах з падказкай', () => {
      const all = { settings: { ...initialState.settings, level: 'all' } }
      const { container, update } = setup(hinted(all))
      expect(hintButton()).toBeInTheDocument()
      expect(hintButton()).toBeEnabled()
      update({ ...hinted(all), current: 'хлеб', results: [{ word: 'рыдлёўка', guessed: true }] })
      expect(hintButton()).not.toBeInTheDocument()
      expect(container.querySelector('.answers')).not.toHaveClass('answers--hint')
      update({ ...hinted(all), current: 'кудмень', results: [{ word: 'рыдлёўка', guessed: true }, { word: 'хлеб', guessed: true }] })
      expect(hintButton()).toBeEnabled()
    })

    it('без прамога перакладу паказвае сціплае тлумачэнне па-беларуску', () => {
      const { container } = setup(hinted({ current: 'талака' }))
      fireEvent.click(hintButton())
      expect(container.querySelector('.card__hint-note')).toHaveTextContent('звязана з калектыўнай дапамогай задарма')
      expect(container.querySelector('.card__hint-row')).not.toBeInTheDocument()
      expect(container.querySelector('.card__hint').textContent).not.toMatch(/талак/i)
    })

    it('у лацінцы расейскі пераклад застаецца кірыліцай, а тлумачэнне транслітаруецца', () => {
      const view = setup(hinted(), 'lat')
      fireEvent.click(screen.getByRole('button', { name: 'Padkazka' }))
      expect(screen.getByText('rydloŭka')).toBeInTheDocument()
      expect(view.container.querySelector('.card__hint-row[lang="ru"]')).toHaveTextContent('лопата')
      expect(view.container.querySelector('.card__hint-row[lang="en"]')).toHaveTextContent('spade')
      cleanup()

      const note = setup(hinted({ current: 'Дзяды' }), 'lat')
      fireEvent.click(screen.getByRole('button', { name: 'Padkazka' }))
      expect(note.container.querySelector('.card__hint-note')).toHaveTextContent('zviazana z paminalnym abradam')
    })

    it('з новым словам падказка закрываецца сама — і пасля адказу, і пасля паса', () => {
      const { container, update } = setup(hinted())
      fireEvent.click(hintButton())
      expect(container.querySelector('.card__hint')).toBeInTheDocument()

      update(hinted({ current: 'ланцуг', results: [{ word: 'рыдлёўка', guessed: true }] }))
      expect(screen.getByText('ланцуг')).toBeInTheDocument()
      expect(container.querySelector('.card__hint')).not.toBeInTheDocument()
      expect(hintButton()).toHaveAttribute('aria-expanded', 'false')

      fireEvent.click(hintButton())
      expect(container.querySelector('.card__hint-row[lang="ru"]')).toHaveTextContent('цепь')
      update(hinted({ current: 'збан', results: [{ word: 'рыдлёўка', guessed: true }, { word: 'ланцуг', guessed: false }] }))
      expect(container.querySelector('.card__hint')).not.toBeInTheDocument()
    })

    it('тое самае слова запар (калода ператасавалася) таксама прыходзіць без падказкі', () => {
      const { container, update } = setup(hinted())
      fireEvent.click(hintButton())
      update(hinted({ results: [{ word: 'рыдлёўка', guessed: false }] }))
      expect(container.querySelector('.card__hint')).not.toBeInTheDocument()
    })

    it('клавіятура: ↑ і ? пераключаюць падказку', () => {
      const { container, dispatch } = setup(hinted())
      fireEvent.keyDown(window, { key: 'ArrowUp' })
      expect(container.querySelector('.card__hint')).toBeInTheDocument()
      fireEvent.keyDown(window, { key: '?', shiftKey: true })
      expect(container.querySelector('.card__hint')).not.toBeInTheDocument()
      fireEvent.keyDown(window, { key: '?', shiftKey: true })
      expect(container.querySelector('.card__hint')).toBeInTheDocument()
      expect(dispatch).not.toHaveBeenCalled()
    })

    it('з адкрытай падказкай адказы, свайп і паўза працуюць як звычайна', () => {
      const { container, dispatch } = setup(hinted())
      fireEvent.click(hintButton())
      fireEvent.click(screen.getByRole('button', { name: 'Адгадана' }))
      expect(dispatch).toHaveBeenLastCalledWith({ type: 'answer', guessed: true })
      act(() => vi.advanceTimersByTime(ANSWER_LOCK_MS))
      const card = container.querySelector('.card')
      fireEvent.pointerDown(card, { clientX: 200, clientY: 0, pointerId: 1, button: 0 })
      fireEvent.pointerUp(card, { clientX: 60, clientY: 0, pointerId: 1 })
      expect(dispatch).toHaveBeenLastCalledWith({ type: 'answer', guessed: false })
      fireEvent.keyDown(window, { key: ' ' })
      expect(dispatch).toHaveBeenLastCalledWith({ type: 'pause' })
    })

    it('націск на падказку не лічыцца адказам і не ставіць блакаванне ад падвойнага націску', () => {
      const { dispatch } = setup(hinted())
      fireEvent.click(hintButton())
      fireEvent.click(screen.getByRole('button', { name: 'Пас' }))
      expect(dispatch).toHaveBeenCalledTimes(1)
      expect(dispatch).toHaveBeenCalledWith({ type: 'answer', guessed: false })
    })

    it('на паўзе падказка схаваная разам са словам, кнопка заблакаваная; пасля паўзы вяртаецца', () => {
      const { container, update } = setup(hinted())
      fireEvent.click(hintButton())
      update(hinted({ endsAt: null, pausedLeft: 30_000 }))
      expect(container.querySelector('.card__hint')).not.toBeInTheDocument()
      expect(screen.getByRole('button', { name: 'Падказка', hidden: true })).toBeDisabled()
      fireEvent.keyDown(window, { key: 'ArrowUp' })
      expect(container.querySelector('.card__hint')).not.toBeInTheDocument()

      update(hinted({ endsAt: NOW + 30_000 }))
      expect(container.querySelector('.card__hint')).toBeInTheDocument()
      expect(hintButton()).toBeEnabled()
    })

    it('на апошнім слове падказка даступная, у рэжыме 18+ — таксама', () => {
      const { container } = setup(hinted({ endsAt: null, lastWord: true }))
      fireEvent.click(hintButton())
      expect(container.querySelector('.card__hint')).toBeInTheDocument()
      cleanup()

      const adult = setup({ ...playing(), current: 'шмаравідла', settings: { ...initialState.settings, level: 'adult' } })
      fireEvent.click(hintButton())
      expect(adult.container.querySelector('.card__hint-row[lang="ru"]')).toHaveTextContent('смазка, лубрикант')
      expect(adult.container.querySelector('.card__adult')).toBeInTheDocument()
    })

    it('без бягучага слова кнопкі няма', () => {
      setup({ ...playing(), current: null })
      expect(hintButton()).not.toBeInTheDocument()
    })
  })

  describe('стылі экрана гульні', () => {
    const css = readFileSync(resolve(process.cwd(), 'src/styles/app.css'), 'utf8')

    it('на мабільных экранах падказка са стрэлкамі схаваная, на шырокіх — застаецца', () => {
      setup()
      expect(screen.getByText('← пас · адгадана →')).toHaveClass('card__swipe')
      expect(css).toMatch(/@media \(max-width: 699px\) \{\s*\.card__swipe \{\s*display: none;\s*\}\s*\}/)
      // па-за медыя-запытамі радок бачны
      const base = css.match(/^\.card__swipe \{[^}]*\}/m)[0]
      expect(base).not.toMatch(/display:\s*none/)
    })

    it('кнопка падказкі — асобны слупок паміж кнопкамі: вузейшая за іх, але на ўсю вышыню', () => {
      const columns = css.match(/^\.answers--hint \{[^}]*\}/m)[0]
      expect(columns).toMatch(/grid-template-columns: minmax\(0, 1fr\) minmax\(56px, 0\.55fr\) minmax\(0, 1fr\)/)
      const rule = css.match(/^\.hintbtn \{[^}]*\}/m)[0]
      expect(rule).not.toMatch(/position: absolute/)
      expect(rule).toMatch(/min-height: 84px/)
      expect(css.match(/^\.answer \{[^}]*\}/m)[0]).toMatch(/min-height: 84px/)
    })
  })
})
