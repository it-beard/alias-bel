import { describe, expect, it, vi } from 'vitest'
import { fireEvent, render, screen, within } from '@testing-library/react'
import RoundResultScreen from './RoundResultScreen.jsx'
import { initialState } from '../game/gameState.js'
import { fixedTeams } from '../test/fixtures.js'
import { ScriptContext } from '../i18n/script.js'

const results = [
  { word: 'хлеб', guessed: true },
  { word: 'соль', guessed: false },
  { word: 'мора', guessed: true },
]

function setup(state, script = 'cyr') {
  const dispatch = vi.fn()
  render(
    <ScriptContext.Provider value={script}>
      <RoundResultScreen state={{ ...initialState, screen: 'result', results, ...state }} dispatch={dispatch} />
    </ScriptContext.Provider>,
  )
  return { dispatch }
}

describe('RoundResultScreen', () => {
  it('лічыць ачкі са штрафам і паказвае спіс слоў', () => {
    setup()
    expect(screen.getByText('+1')).toBeInTheDocument()
    expect(screen.getByText('адгадана 2 · пас 1')).toBeInTheDocument()
    const items = screen.getAllByRole('button', { pressed: true })
    expect(items).toHaveLength(2)
    expect(screen.getByRole('button', { name: /соль/ })).toHaveAttribute('aria-pressed', 'false')
    expect(screen.getByRole('button', { name: /соль/ })).toHaveClass('is-skip')
  })

  it('без штрафу лічыць толькі адгаданыя', () => {
    setup({ settings: { ...initialState.settings, skipPenalty: false } })
    expect(screen.getByText('+2')).toBeInTheDocument()
  })

  it('адмоўны вынік без плюса', () => {
    setup({ results: [{ word: 'а', guessed: false }, { word: 'б', guessed: false }] })
    expect(screen.getByText('-2')).toBeInTheDocument()
  })

  it('пераключае адзнаку і ідзе далей', () => {
    const { dispatch } = setup()
    fireEvent.click(screen.getByRole('button', { name: /соль/ }))
    expect(dispatch).toHaveBeenCalledWith({ type: 'toggleResult', index: 1 })
    fireEvent.click(screen.getByRole('button', { name: 'Далей' }))
    expect(dispatch).toHaveBeenCalledWith({ type: 'commitRound' })
  })

  it('пусты раунд', () => {
    setup({ results: [] })
    expect(screen.getByText('Пакуль няма адказаў.')).toBeInTheDocument()
    expect(screen.getByText('0')).toBeInTheDocument()
    expect(screen.queryByText(/выправіць адзнаку/)).not.toBeInTheDocument()
  })

  it('у рэжыме лацінкі словы транслітаруюцца', () => {
    setup({}, 'lat')
    expect(screen.getByText('chleb')).toBeInTheDocument()
    expect(screen.getByText('sol')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Dalej' })).toBeInTheDocument()
  })

  describe('агульнае апошняе слова', () => {
    const teams = fixedTeams(3)
    const shared = (last) => ({ teams, turnIndex: 1, results: [{ word: 'хлеб', guessed: true }, { word: 'соль', guessed: false }, last] })
    const picker = () => screen.queryByRole('dialog', { name: 'Хто адгадаў?' })

    it('перахопленае слова падпісанае камандай і не ідзе ў залік раунда', () => {
      setup(shared({ word: 'мора', guessed: true, shared: true, by: 2 }))
      expect(screen.getByText('0')).toBeInTheDocument()
      expect(screen.getByText('адгадана 1 · пас 1')).toBeInTheDocument()
      const item = screen.getByRole('button', { name: /мора/ })
      expect(item).toHaveClass('is-stolen')
      expect(item).toHaveTextContent('агульнае апошняе слова · +1 Каласы пад сярпом ШІ')
      expect(item.style.getPropertyValue('--team')).toBe(teams[2].color)
      expect(item.querySelector('.wordlist__mark')).toHaveAttribute('data-motif', teams[2].motif)
      expect(item).not.toHaveAttribute('aria-pressed')
    })

    it('слова, якое ўзяла свая каманда або не ўзяў ніхто, лічыцца як звычайнае', () => {
      setup(shared({ word: 'мора', guessed: true, shared: true }))
      expect(screen.getByText('+1')).toBeInTheDocument()
      expect(screen.getByText('адгадана 2 · пас 1')).toBeInTheDocument()
      const item = screen.getByRole('button', { name: /мора/ })
      expect(item).toHaveClass('is-ok')
      expect(item).toHaveTextContent('агульнае апошняе слова')
      expect(item).not.toHaveTextContent('+1')
    })

    it('прапушчанае агульнае слова — штраф той камандзе, што тлумачыла', () => {
      setup(shared({ word: 'мора', guessed: false, shared: true }))
      expect(screen.getByText('-1')).toBeInTheDocument()
      expect(screen.getByRole('button', { name: /мора/ })).toHaveClass('is-skip')
    })

    it('націск адкрывае выбар каманды замест пераключэння адзнакі', () => {
      const { dispatch } = setup(shared({ word: 'мора', guessed: true, shared: true, by: 2 }))
      fireEvent.click(screen.getByRole('button', { name: /мора/ }))
      expect(dispatch).not.toHaveBeenCalled()
      expect(within(picker()).getByText('мора')).toBeInTheDocument()
      fireEvent.click(within(picker()).getByRole('button', { name: /Вусы Мулявіна/ }))
      expect(dispatch).toHaveBeenCalledWith({ type: 'assignResult', index: 2, by: 0 })
      expect(picker()).not.toBeInTheDocument()
    })

    it('«Ніхто не адгадаў» здымае адзнаку, «Назад» нічога не мяняе', () => {
      const { dispatch } = setup(shared({ word: 'мора', guessed: true, shared: true, by: 2 }))
      fireEvent.click(screen.getByRole('button', { name: /мора/ }))
      fireEvent.click(within(picker()).getByRole('button', { name: 'Назад' }))
      expect(picker()).not.toBeInTheDocument()
      expect(dispatch).not.toHaveBeenCalled()
      fireEvent.click(screen.getByRole('button', { name: /мора/ }))
      fireEvent.click(within(picker()).getByRole('button', { name: 'Ніхто не адгадаў' }))
      expect(dispatch).toHaveBeenCalledWith({ type: 'assignResult', index: 2, by: null })
    })

    it('звычайныя словы побач пераключаюцца як раней', () => {
      const { dispatch } = setup(shared({ word: 'мора', guessed: true, shared: true, by: 2 }))
      fireEvent.click(screen.getByRole('button', { name: /соль/ }))
      expect(dispatch).toHaveBeenCalledWith({ type: 'toggleResult', index: 1 })
      expect(picker()).not.toBeInTheDocument()
    })

    it('у лацінцы', () => {
      setup(shared({ word: 'мора', guessed: true, shared: true, by: 2 }), 'lat')
      expect(screen.getByRole('button', { name: /mora/ })).toHaveTextContent('ahulnaje apošniaje słova · +1 Kałasy pad siarpom ŠI')
    })
  })
})
