import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, expect, it, vi } from 'vitest'
import { fireEvent, render, screen, within } from '@testing-library/react'
import SetupScreen from './SetupScreen.jsx'
import { initialState, makeTeams } from '../game/gameState.js'
import { ScriptContext } from '../i18n/script.js'
import { unlockAudio, vibrate } from '../game/feedback.js'
import { fixedTeams } from '../test/fixtures.js'
import { ADULT, getWords } from '../data/words.js'
import { words } from '../game/plural.js'

vi.mock('../game/feedback.js', () => ({
  unlockAudio: vi.fn(),
  sounds: {},
  vibrate: vi.fn(),
  canVibrate: vi.fn(() => true),
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

  it('у «Пра гульню» сказана, колькі слоў у 18+ і што яны не змешваюцца з астатнімі', () => {
    setup()
    const count = words(ADULT.length)
    expect(getWords('adult')).toHaveLength(ADULT.length)
    const stat = screen.getByText('Пра гульню').querySelector('span')
    expect(stat).toHaveTextContent(`886 слоў · 18+: ${count} · кірыліца і лацінка`)
    expect(screen.getByText(/Ёсць і асобны рэжым 18\+/)).toHaveTextContent(
      `Ёсць і асобны рэжым 18+ — ${count} беларускай секс-лексікі. Дарослыя словы не змешваюцца з астатнімі: у рэжыме «Усе» іх няма.`,
    )
    expect(within(screen.getByRole('list', { name: 'Магчымасці гульні' })).getByText(`Рэжым 18+: ${count}`)).toBeInTheDocument()
    // абяцанне з апісання праўдзівае: у «Усе» няма ніводнага слова, якое ёсць толькі ў 18+
    const family = new Set(getWords('all'))
    expect(ADULT.filter((word) => family.has(word))).toEqual(['каханне'])
  })

  it('першы абзац апісання і адказы на пытанні супадаюць з FAQ-разметкай у index.html', () => {
    setup()
    const html = readFileSync(resolve(process.cwd(), 'index.html'), 'utf8')
    const graph = JSON.parse(html.match(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/)[1])['@graph']
    const faq = graph.find((item) => item['@type'] === 'FAQPage').mainEntity
    for (const { acceptedAnswer } of faq) expect(screen.getByText(acceptedAnswer.text)).toBeInTheDocument()
  })

  it('у падвале — падзяка, кантакты для паведамленняў пра памылкі і GitHub', () => {
    setup()
    const links = within(screen.getByRole('contentinfo', { name: 'Карысныя спасылкі' })).getAllByRole('link')
    expect(links.map((link) => [link.textContent, link.getAttribute('href')])).toEqual([
      ['Падзякаваць', 'https://itbeard.com/support/'],
      ['Знайшлі памылку?', 'https://itbeard.com/contacts'],
      ['Гульня на GitHub', 'https://github.com/it-beard/alias-bel'],
    ])
    for (const link of links) {
      expect(link).toHaveAttribute('target', '_blank')
      expect(link).toHaveAttribute('rel', 'noreferrer')
    }
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

  it('паўторны выбар той жа колькасці камандаў нічога не робіць', () => {
    const { dispatch } = setup()
    fireEvent.click(screen.getByRole('radio', { name: '2' }))
    expect(dispatch).not.toHaveBeenCalled()
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  })

  it('кнопка «Выпадковыя назвы» раздае назвы з вібрацыяй', () => {
    vi.mocked(vibrate).mockClear()
    const { dispatch } = setup()
    expect(screen.getByText('Вусы Мулявіна')).not.toHaveClass('is-rolled')
    fireEvent.click(screen.getByRole('button', { name: 'Выпадковыя назвы' }))
    expect(dispatch).toHaveBeenCalledWith({ type: 'randomizeTeamNames' })
    expect(vibrate).toHaveBeenCalledWith(30)
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

  it('з невядомым узроўнем падказка бярэцца ад лёгкага', () => {
    setup({ ...base, settings: { ...initialState.settings, level: 'wat' } })
    expect(screen.getByText(/^Простыя штодзённыя словы · /)).toBeInTheDocument()
    screen.getAllByRole('radio', { name: /Лёгкі|Сярэдні|Складаны|Усе/ }).forEach((radio) => {
      expect(radio).toHaveAttribute('aria-checked', 'false')
    })
  })

  it('рэжым 18+ стаіць у адным радзе з узроўнямі і ўключаецца толькі пасля пацвярджэння ўзросту', () => {
    const { dispatch } = setup()
    const levels = within(screen.getByRole('radiogroup', { name: 'Складанасць слоў' })).getAllByRole('radio')
    expect(levels.map((radio) => radio.textContent)).toEqual(['Лёгкі', 'Сярэдні', 'Складаны', 'Усе', '18+'])
    const adult = screen.getByRole('radio', { name: '18+' })
    expect(adult).toHaveClass('seg__btn--adult')
    expect(adult).toHaveAttribute('aria-checked', 'false')

    fireEvent.click(adult)
    expect(screen.getByRole('dialog', { name: 'Вам дакладна ёсць 18 гадоў?' })).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: 'Не, вярнуцца' }))
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    expect(dispatch).not.toHaveBeenCalled()

    fireEvent.click(adult)
    fireEvent.click(screen.getByRole('button', { name: 'Так, мне ёсць 18' }))
    expect(dispatch).toHaveBeenCalledWith({ type: 'setSetting', key: 'level', value: 'adult' })
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  })

  it('стрэлкамі ў рэжым 18+ таксама не трапіць без пацвярджэння ўзросту', () => {
    const { dispatch } = setup({ ...base, settings: { ...initialState.settings, level: 'all' } })
    fireEvent.keyDown(screen.getByRole('radio', { name: 'Усе' }), { key: 'ArrowRight' })
    expect(dispatch).not.toHaveBeenCalled()
    expect(screen.getByRole('dialog', { name: 'Вам дакладна ёсць 18 гадоў?' })).toBeInTheDocument()
    fireEvent(screen.getByRole('dialog'), new Event('cancel', { cancelable: true }))
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    expect(dispatch).not.toHaveBeenCalled()
    expect(screen.getByRole('radio', { name: 'Усе' })).toHaveAttribute('aria-checked', 'true')

    // з «Лёгкага» стрэлка ўлева па крузе вядзе да 18+ — і зноў праз пытанне
    fireEvent.keyDown(screen.getByRole('radio', { name: 'Лёгкі' }), { key: 'ArrowLeft' })
    fireEvent.click(screen.getByRole('button', { name: 'Так, мне ёсць 18' }))
    expect(dispatch).toHaveBeenCalledTimes(1)
    expect(dispatch).toHaveBeenCalledWith({ type: 'setSetting', key: 'level', value: 'adult' })
  })

  it('уключаны рэжым 18+ паўторна пра ўзрост не пытаецца і выключаецца выбарам іншага ўзроўню', () => {
    const { dispatch } = setup({ ...base, settings: { ...initialState.settings, level: 'adult' } })
    const adult = screen.getByRole('radio', { name: '18+' })
    expect(adult).toHaveAttribute('aria-checked', 'true')
    expect(screen.getByText('Ад заляцанняў да любошчаў · 106 слоў')).toBeInTheDocument()
    fireEvent.click(adult)
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    fireEvent.click(screen.getByRole('radio', { name: 'Складаны' }))
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    expect(dispatch).toHaveBeenLastCalledWith({ type: 'setSetting', key: 'level', value: 'hard' })
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

  it('незавершаную гульню можна завяршыць з плашкі — толькі пасля пацвярджэння', () => {
    const { dispatch } = setup({ ...base, teams: fixedTeams(2, [7, 3]), roundNo: 2 })
    const panel = screen.getByRole('heading', { name: 'Незавершаная гульня' }).closest('section')
    const finish = within(panel).getByRole('button', { name: 'Завяршыць' })

    fireEvent.click(finish)
    const dialog = screen.getByRole('dialog', { name: 'Завяршыць гульню?' })
    expect(dialog).toHaveTextContent('Пераможца вызначыцца па бягучым рахунку.')
    fireEvent.click(within(dialog).getByRole('button', { name: 'Не, вярнуцца' }))
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    expect(dispatch).not.toHaveBeenCalled()

    fireEvent.click(finish)
    const confirm = within(screen.getByRole('dialog')).getByRole('button', { name: 'Завяршыць' })
    expect(confirm).toHaveClass('btn--danger')
    fireEvent.click(confirm)
    expect(dispatch).toHaveBeenCalledTimes(1)
    expect(dispatch).toHaveBeenCalledWith({ type: 'finishNow' })
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  })

  it('без незавершанай гульні кнопкі «Завяршыць» няма', () => {
    setup()
    expect(screen.queryByRole('button', { name: 'Завяршыць' })).not.toBeInTheDocument()
    expect(screen.queryByRole('heading', { name: 'Незавершаная гульня' })).not.toBeInTheDocument()
  })

  it('пацвярджэнні для змены каманд і новай гульні засталіся звычайнымі, не «небяспечнымі»', () => {
    setup({ ...base, teams: fixedTeams(2, [7, 3]), roundNo: 2 })
    fireEvent.click(screen.getByRole('radio', { name: '3' }))
    expect(screen.getByRole('dialog', { name: 'Змяніць каманды?' })).toHaveTextContent('Рахунак бягучай партыі будзе скінуты.')
    expect(screen.getByRole('button', { name: 'Змяніць' })).toHaveClass('btn--primary')
    fireEvent.click(screen.getByRole('button', { name: 'Не, вярнуцца' }))
    fireEvent.click(screen.getByRole('button', { name: 'Новая гульня' }))
    expect(screen.getByRole('button', { name: 'Пачаць нанова' })).toHaveClass('btn--primary')
  })

  it('працяг гульні без гуку не чапае аўдыя, а новую гульню можна не пацвярджаць', () => {
    vi.mocked(unlockAudio).mockClear()
    const { dispatch } = setup({ ...base, gameActive: true, settings: { ...initialState.settings, sound: false } })
    fireEvent.click(screen.getByRole('button', { name: 'Працягнуць' }))
    expect(dispatch).toHaveBeenCalledWith({ type: 'continueGame' })
    expect(unlockAudio).not.toHaveBeenCalled()
    fireEvent.click(screen.getByRole('button', { name: 'Новая гульня' }))
    fireEvent.click(screen.getByRole('button', { name: 'Не, вярнуцца' }))
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    expect(dispatch).not.toHaveBeenCalledWith({ type: 'startGame' })
  })

  it('працяг гульні з гукам разблакоўвае аўдыя', () => {
    vi.mocked(unlockAudio).mockClear()
    setup({ ...base, gameActive: true })
    fireEvent.click(screen.getByRole('button', { name: 'Працягнуць' }))
    expect(unlockAudio).toHaveBeenCalledTimes(1)
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
