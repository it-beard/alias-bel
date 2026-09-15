import { describe, expect, it, vi } from 'vitest'
import { fireEvent, render, screen } from '@testing-library/react'
import SetupScreen from './SetupScreen.jsx'
import { initialState, makeTeams } from '../game/gameState.js'
import { ScriptContext } from '../i18n/script.js'
import { unlockAudio } from '../game/feedback.js'

vi.mock('../game/feedback.js', () => ({
  unlockAudio: vi.fn(),
  sounds: {},
  vibrate: vi.fn(),
}))

function setup(state = initialState, script = 'cyr') {
  const dispatch = vi.fn()
  const onRules = vi.fn()
  render(
    <ScriptContext.Provider value={script}>
      <SetupScreen state={state} dispatch={dispatch} onRules={onRules} />
    </ScriptContext.Provider>,
  )
  return { dispatch, onRules }
}

describe('SetupScreen', () => {
  it('паказвае назву, дзве каманды і бягучыя налады', () => {
    setup()
    expect(screen.getByRole('heading', { level: 1, name: 'Аліяс' })).toBeInTheDocument()
    expect(screen.getByLabelText('Назва каманды 1')).toHaveValue('Зубры')
    expect(screen.getByLabelText('Назва каманды 2')).toHaveValue('Буслы')
    expect(screen.getByRole('radio', { name: '2' })).toHaveAttribute('aria-checked', 'true')
    expect(screen.getByRole('radio', { name: /Лёгкі/ })).toHaveAttribute('aria-checked', 'true')
    expect(screen.getByRole('radio', { name: '60 с' })).toHaveAttribute('aria-checked', 'true')
    expect(screen.getByRole('radio', { name: '30' })).toHaveAttribute('aria-checked', 'true')
    expect(screen.getByRole('radio', { name: 'Кірыліца' })).toHaveAttribute('aria-checked', 'true')
    expect(screen.getByRole('radio', { name: 'Як у сістэме' })).toHaveAttribute('aria-checked', 'true')
    expect(screen.getByRole('switch', { name: /Штраф за пас/ })).toHaveAttribute('aria-checked', 'true')
    expect(screen.queryByText(/Сола-рэжым/)).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Працягнуць' })).not.toBeInTheDocument()
  })

  it('мяняе колькасць камандаў і назвы', () => {
    const { dispatch } = setup()
    fireEvent.click(screen.getByRole('radio', { name: '3' }))
    expect(dispatch).toHaveBeenCalledWith({ type: 'setTeamCount', count: 3 })
    fireEvent.change(screen.getByLabelText('Назва каманды 1'), { target: { value: 'Каты' } })
    expect(dispatch).toHaveBeenCalledWith({ type: 'renameTeam', id: 0, name: 'Каты' })
  })

  it('мяняе ўзровень, час, мэту, алфавіт і тэму', () => {
    const { dispatch } = setup()
    fireEvent.click(screen.getByRole('radio', { name: /Складаны/ }))
    fireEvent.click(screen.getByRole('radio', { name: '45 с' }))
    fireEvent.click(screen.getByRole('radio', { name: '50' }))
    fireEvent.click(screen.getByRole('radio', { name: 'Лацінка' }))
    fireEvent.click(screen.getByRole('radio', { name: 'Цёмная' }))
    expect(dispatch.mock.calls.map((c) => c[0])).toEqual([
      { type: 'setSetting', key: 'level', value: 'hard' },
      { type: 'setSetting', key: 'roundSeconds', value: 45 },
      { type: 'setSetting', key: 'targetScore', value: 50 },
      { type: 'setSetting', key: 'script', value: 'lat' },
      { type: 'setSetting', key: 'theme', value: 'dark' },
    ])
  })

  it('пераключальнікі мяняюць налады', () => {
    const { dispatch } = setup()
    fireEvent.click(screen.getByRole('switch', { name: /Штраф за пас/ }))
    fireEvent.click(screen.getByRole('switch', { name: /Апошняе слова/ }))
    fireEvent.click(screen.getByRole('switch', { name: 'Гук' }))
    fireEvent.click(screen.getByRole('switch', { name: 'Вібрацыя' }))
    expect(dispatch.mock.calls.map((c) => c[0])).toEqual([
      { type: 'setSetting', key: 'skipPenalty', value: false },
      { type: 'setSetting', key: 'lastWordRule', value: false },
      { type: 'setSetting', key: 'sound', value: false },
      { type: 'setSetting', key: 'vibration', value: false },
    ])
  })

  it('паказвае колькасць слоў кожнага ўзроўню', () => {
    setup()
    expect(screen.getByText('340 слоў')).toBeInTheDocument()
    expect(screen.getByText('304 словы')).toBeInTheDocument()
    expect(screen.getByText('242 словы')).toBeInTheDocument()
    expect(screen.getByText('886 слоў')).toBeInTheDocument()
  })

  it('пачынае гульню, разблакаваўшы аўдыя, і адкрывае правілы', () => {
    const { dispatch, onRules } = setup()
    fireEvent.click(screen.getByRole('button', { name: 'Пачаць гульню' }))
    expect(unlockAudio).toHaveBeenCalled()
    expect(dispatch).toHaveBeenCalledWith({ type: 'startGame' })
    fireEvent.click(screen.getByRole('button', { name: 'Правілы' }))
    expect(onRules).toHaveBeenCalledTimes(1)
  })

  it('без гуку не чапае аўдыя', () => {
    vi.mocked(unlockAudio).mockClear()
    setup({ ...initialState, settings: { ...initialState.settings, sound: false } })
    fireEvent.click(screen.getByRole('button', { name: 'Пачаць гульню' }))
    expect(unlockAudio).not.toHaveBeenCalled()
  })

  it('сола-рэжым паказвае падказку', () => {
    setup({ ...initialState, teams: makeTeams(1) })
    expect(screen.getByText(/Сола-рэжым/)).toBeInTheDocument()
  })

  it('прапануе працягнуць незавершаную гульню', () => {
    const teams = makeTeams(2).map((t, i) => ({ ...t, score: [7, 3][i] }))
    const { dispatch } = setup({ ...initialState, teams, roundNo: 2, turnIndex: 1 })
    expect(screen.getByText('Раунд 2 · Зубры 7 · Буслы 3')).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: 'Працягнуць' }))
    expect(dispatch).toHaveBeenCalledWith({ type: 'continueGame' })
    fireEvent.click(screen.getByRole('button', { name: 'Новая гульня' }))
    expect(dispatch).toHaveBeenCalledWith({ type: 'startGame' })
  })

  it('у рэжыме лацінкі інтэрфейс на лацінцы, а назвы камандаў рэдагуюцца як ёсць', () => {
    setup({ ...initialState, settings: { ...initialState.settings, script: 'lat' } }, 'lat')
    expect(screen.getByRole('heading', { level: 1, name: 'Alias' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Pačać hulniu' })).toBeInTheDocument()
    expect(screen.getByRole('radio', { name: 'Łacinka' })).toHaveAttribute('aria-checked', 'true')
    expect(screen.getByLabelText('Nazva kamandy 1')).toHaveValue('Зубры')
    expect(screen.getByText('340 słoŭ')).toBeInTheDocument()
  })
})
