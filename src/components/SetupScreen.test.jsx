import { describe, expect, it, vi } from 'vitest'
import { fireEvent, render, screen, within } from '@testing-library/react'
import SetupScreen from './SetupScreen.jsx'
import { initialState, makeTeams } from '../game/gameState.js'
import { ScriptContext } from '../i18n/script.js'
import { unlockAudio, vibrate } from '../game/feedback.js'
import { fixedTeams } from '../test/fixtures.js'

vi.mock('../game/feedback.js', () => ({
  unlockAudio: vi.fn(),
  sounds: {},
  vibrate: vi.fn(),
}))

const base = { ...initialState, teams: fixedTeams(2) }

const teamNames = (label = 'Каманды') =>
  within(screen.getByRole('list', { name: label }))
    .getAllByRole('listitem')
    .map((item) => item.textContent)

function setup(state = base, script = 'cyr') {
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
  it('паказвае назву, дзве каманды і бягучыя налады раунда', () => {
    setup()
    expect(screen.getByRole('heading', { level: 1, name: 'Аліяс' })).toBeInTheDocument()
    expect(teamNames()).toEqual(['Вусы Мулявіна', 'Крынж Еўфрасінні'])
    expect(screen.getByRole('radio', { name: '2' })).toHaveAttribute('aria-checked', 'true')
    expect(screen.getByRole('radio', { name: 'Лёгкі' })).toHaveAttribute('aria-checked', 'true')
    expect(screen.getByRole('radio', { name: '60 с' })).toHaveAttribute('aria-checked', 'true')
    expect(screen.getByRole('radio', { name: '30' })).toHaveAttribute('aria-checked', 'true')
    expect(screen.queryByText(/Сола-рэжым/)).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Працягнуць' })).not.toBeInTheDocument()
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Падзякаваць' })).toHaveAttribute('href', 'https://itbeard.com/support/')
    expect(screen.getByRole('link', { name: 'Гульня на GitHub' })).toHaveAttribute('href', 'https://github.com/it-beard/alias-bel')
    expect(screen.getByRole('heading', { name: 'Што такое «Аліяс па-беларуску»?' })).toBeInTheDocument()
    expect(screen.getByText(/бясплатная браўзерная гульня/)).toHaveTextContent('886 слоў')
    expect(screen.getByText('Як гуляць у «Аліяс»?')).toBeInTheDocument()
    expect(screen.getByText('Ці трэба спампоўваць або рэгістравацца?')).toBeInTheDocument()
  })

  it('рэдкія налады схаваныя ў шторцы', () => {
    const { dispatch } = setup()
    expect(screen.queryByRole('radio', { name: 'Лацінка' })).not.toBeInTheDocument()
    expect(screen.queryByRole('switch')).not.toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: 'Налады' }))
    expect(screen.getByRole('dialog', { name: 'Налады' })).toBeInTheDocument()
    fireEvent.click(screen.getByRole('radio', { name: 'Лацінка' }))
    expect(dispatch).toHaveBeenCalledWith({ type: 'setSetting', key: 'script', value: 'lat' })
    fireEvent.click(screen.getByRole('switch', { name: 'Гук' }))
    expect(dispatch).toHaveBeenCalledWith({ type: 'setSetting', key: 'sound', value: false })
    fireEvent.click(screen.getByRole('button', { name: 'Гатова' }))
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  })

  it('мяняе колькасць камандаў, а назвы рэдагаваць нельга', () => {
    const { dispatch } = setup()
    fireEvent.click(screen.getByRole('radio', { name: '3' }))
    expect(dispatch).toHaveBeenCalledWith({ type: 'setTeamCount', count: 3 })
    expect(screen.queryByRole('textbox')).not.toBeInTheDocument()
    expect(document.querySelector('input, textarea, [contenteditable]')).toBeNull()
  })

  it('кнопка «Выпадковыя назвы» раздае назвы з вібрацыяй', () => {
    vi.mocked(vibrate).mockClear()
    const { dispatch } = setup()
    expect(screen.getByText('Вусы Мулявіна')).not.toHaveClass('is-rolled')
    fireEvent.click(screen.getByRole('button', { name: 'Выпадковыя назвы' }))
    expect(dispatch).toHaveBeenCalledWith({ type: 'randomizeTeamNames' })
    expect(vibrate).toHaveBeenCalledWith(12)
    expect(screen.getByText('Вусы Мулявіна')).toHaveClass('is-rolled')
  })

  it('без вібрацыі кнопка выпадковых назваў не вібруе', () => {
    vi.mocked(vibrate).mockClear()
    const { dispatch } = setup({ ...base, settings: { ...initialState.settings, vibration: false } })
    fireEvent.click(screen.getByRole('button', { name: 'Выпадковыя назвы' }))
    expect(dispatch).toHaveBeenCalledWith({ type: 'randomizeTeamNames' })
    expect(vibrate).not.toHaveBeenCalled()
  })

  it('мяняе ўзровень, час і мэту', () => {
    const { dispatch } = setup()
    fireEvent.click(screen.getByRole('radio', { name: 'Складаны' }))
    fireEvent.click(screen.getByRole('radio', { name: '45 с' }))
    fireEvent.click(screen.getByRole('radio', { name: '50' }))
    expect(dispatch.mock.calls.map((c) => c[0])).toEqual([
      { type: 'setSetting', key: 'level', value: 'hard' },
      { type: 'setSetting', key: 'roundSeconds', value: 45 },
      { type: 'setSetting', key: 'targetScore', value: 50 },
    ])
  })

  it('падказвае, што за словы ў выбраным узроўні', () => {
    setup()
    expect(screen.getByText('Простыя штодзённыя словы · 340 слоў')).toBeInTheDocument()
  })

  it('для рэжыму «усе разам» паказвае агульную колькасць', () => {
    setup({ ...base, settings: { ...initialState.settings, level: 'all' } })
    expect(screen.getByText('Мяшанка ўсіх узроўняў · 886 слоў')).toBeInTheDocument()
    expect(screen.getByRole('radio', { name: 'Усе' })).toHaveAttribute('aria-checked', 'true')
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
    setup({ ...base, settings: { ...initialState.settings, sound: false } })
    fireEvent.click(screen.getByRole('button', { name: 'Пачаць гульню' }))
    expect(unlockAudio).not.toHaveBeenCalled()
  })

  it('сола-рэжым паказвае падказку', () => {
    setup({ ...base, teams: makeTeams(1) })
    expect(screen.getByText(/Сола-рэжым/)).toBeInTheDocument()
  })

  it('прапануе працягнуць незавершаную гульню', () => {
    const teams = fixedTeams(2, [7, 3])
    const { dispatch } = setup({ ...base, teams, roundNo: 2, turnIndex: 1 })
    const panel = screen.getByRole('heading', { name: 'Незавершаная гульня' }).closest('section')
    expect(panel).toHaveTextContent('Раунд 2')
    expect(panel).toHaveTextContent('Вусы Мулявіна 7')
    expect(panel).toHaveTextContent('Крынж Еўфрасінні 3')
    expect(panel.querySelectorAll('[data-motif]')).toHaveLength(2)
    fireEvent.click(screen.getByRole('button', { name: 'Працягнуць' }))
    expect(dispatch).toHaveBeenCalledWith({ type: 'continueGame' })
    fireEvent.click(screen.getByRole('button', { name: 'Новая гульня' }))
    expect(screen.getByRole('dialog', { name: 'Пачаць новую гульню?' })).toBeInTheDocument()
    expect(dispatch).not.toHaveBeenCalledWith({ type: 'startGame' })
    fireEvent.click(screen.getByRole('button', { name: 'Пачаць нанова' }))
    expect(dispatch).toHaveBeenCalledWith({ type: 'startGame' })
  })

  it('скід рахунку пры змене каманд можна скасаваць', () => {
    const { dispatch } = setup({ ...base, gameActive: true, turnIndex: 1 })
    fireEvent.click(screen.getByRole('radio', { name: '1' }))
    expect(screen.getByRole('dialog', { name: 'Змяніць каманды?' })).toBeInTheDocument()
    expect(dispatch).not.toHaveBeenCalled()
    fireEvent.click(screen.getByRole('button', { name: 'Не, вярнуцца' }))
    expect(dispatch).not.toHaveBeenCalled()
    fireEvent.click(screen.getByRole('radio', { name: '1' }))
    fireEvent.click(screen.getByRole('button', { name: 'Змяніць' }))
    expect(dispatch).toHaveBeenCalledWith({ type: 'setTeamCount', count: 1 })
  })

  it('у рэжыме лацінкі інтэрфейс і назвы камандаў на лацінцы', () => {
    setup({ ...base, settings: { ...initialState.settings, script: 'lat' } }, 'lat')
    expect(screen.getByRole('heading', { level: 1, name: 'Alias' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Pačać hulniu' })).toBeInTheDocument()
    expect(screen.getByRole('radio', { name: 'Lohki' })).toHaveAttribute('aria-checked', 'true')
    expect(teamNames('Kamandy')).toEqual(['Vusy Mulavina', 'Krynž Jeŭfrasinni'])
    expect(screen.getByRole('button', { name: 'Vypadkovyja nazvy' })).toBeInTheDocument()
    expect(screen.getByText('Prostyja štodzionnyja słovy · 340 słoŭ')).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Padziakavać' })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Hulnia na GitHub' })).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'Što takoje «Alijas pa-biełarusku»?' })).toBeInTheDocument()
  })

})
