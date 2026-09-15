import { describe, expect, it, vi } from 'vitest'
import { fireEvent, render, screen } from '@testing-library/react'
import RoundResultScreen from './RoundResultScreen.jsx'
import { initialState } from '../game/gameState.js'
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
})
