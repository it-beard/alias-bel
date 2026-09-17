import { describe, expect, it, vi } from 'vitest'
import { act, fireEvent, render, screen } from '@testing-library/react'
import SettingsSheet from './SettingsSheet.jsx'
import { DEFAULT_SETTINGS } from '../game/constants.js'
import { ScriptContext } from '../i18n/script.js'
import { canVibrate, vibrate } from '../game/feedback.js'
import { CLOSE_MS } from '../hooks/useSheetDrag.js'
import { swipeDown } from '../test/touch.js'

vi.mock('../game/feedback.js', () => ({ canVibrate: vi.fn(() => true), vibrate: vi.fn() }))

function setup(settings = DEFAULT_SETTINGS, script = 'cyr') {
  const onChange = vi.fn()
  const onClose = vi.fn()
  const view = render(
    <ScriptContext.Provider value={script}>
      <SettingsSheet settings={settings} onChange={onChange} onClose={onClose} />
    </ScriptContext.Provider>,
  )
  return { onChange, onClose, ...view }
}

describe('SettingsSheet', () => {
  it('паказвае бягучыя налады', () => {
    setup()
    expect(screen.getByRole('dialog', { name: 'Налады' })).toBeInTheDocument()
    expect(screen.getByRole('radio', { name: 'Кірыліца' })).toHaveAttribute('aria-checked', 'true')
    expect(screen.getByRole('radio', { name: 'Аўта' })).toHaveAttribute('aria-checked', 'true')
    expect(screen.getByRole('switch', { name: /Штраф за пас/ })).toHaveAttribute('aria-checked', 'true')
    expect(screen.getByRole('switch', { name: /Апошняе слова/ })).toHaveAttribute('aria-checked', 'true')
    expect(screen.getByRole('switch', { name: /Падказкі да слоў/ })).toHaveAttribute('aria-checked', 'true')
    expect(screen.getByRole('switch', { name: 'Гук' })).toHaveAttribute('aria-checked', 'true')
    expect(screen.getByRole('switch', { name: /Вібрацыя/ })).toHaveAttribute('aria-checked', 'true')
  })

  it('перадае змены наверх', () => {
    const { onChange } = setup()
    fireEvent.click(screen.getByRole('radio', { name: 'Лацінка' }))
    fireEvent.click(screen.getByRole('radio', { name: 'Цёмная' }))
    fireEvent.click(screen.getByRole('switch', { name: /Штраф за пас/ }))
    fireEvent.click(screen.getByRole('switch', { name: /Апошняе слова/ }))
    fireEvent.click(screen.getByRole('switch', { name: /Падказкі да слоў/ }))
    fireEvent.click(screen.getByRole('switch', { name: 'Гук' }))
    fireEvent.click(screen.getByRole('switch', { name: /Вібрацыя/ }))
    expect(onChange.mock.calls).toEqual([
      ['script', 'lat'],
      ['theme', 'dark'],
      ['skipPenalty', false],
      ['lastWordRule', false],
      ['hints', false],
      ['sound', false],
      ['vibration', false],
    ])
  })

  it('падказкі да слоў па змаўчанні ўключаныя; выключаныя — уключаюцца назад', () => {
    expect(DEFAULT_SETTINGS.hints).toBe(true)
    const { onChange } = setup({ ...DEFAULT_SETTINGS, hints: false })
    const toggle = screen.getByRole('switch', { name: /Падказкі да слоў/ })
    expect(toggle).toHaveAttribute('aria-checked', 'false')
    expect(toggle).toHaveTextContent('Кнопка «?» паказвае пераклад рэдкага слова')
    fireEvent.click(toggle)
    expect(onChange).toHaveBeenCalledWith('hints', true)
  })

  it('уключэнне вібрацыі дае пробны імпульс', () => {
    vi.mocked(vibrate).mockClear()
    const { onChange } = setup({ ...DEFAULT_SETTINGS, vibration: false })
    const toggle = screen.getByRole('switch', { name: /Вібрацыя/ })
    expect(toggle).toHaveTextContent('Не працуе ў бязгучным рэжыме і пры эканоміі зараду')
    fireEvent.click(toggle)
    expect(vibrate).toHaveBeenCalledWith(60)
    expect(onChange).toHaveBeenCalledWith('vibration', true)
  })

  it('выключэнне вібрацыі не вібруе; без падтрымкі пра гэта сказана', () => {
    vi.mocked(vibrate).mockClear()
    vi.mocked(canVibrate).mockReturnValueOnce(false)
    setup()
    const toggle = screen.getByRole('switch', { name: /Вібрацыя/ })
    expect(toggle).toHaveTextContent('Гэтая прылада або браўзер не падтрымлівае вібрацыю')
    fireEvent.click(toggle)
    expect(vibrate).not.toHaveBeenCalled()
  })

  it('зачыняецца кнопкай або фонам', () => {
    const { onClose, container } = setup()
    fireEvent.click(screen.getByRole('button', { name: 'Гатова' }))
    fireEvent.click(container.querySelector('.sheet__backdrop'))
    expect(onClose).toHaveBeenCalledTimes(2)
  })

  it('зачыняецца змахам уніз, нічога не мяняючы ў наладах', () => {
    vi.useFakeTimers()
    const { onChange, onClose, container } = setup()
    swipeDown(container.querySelector('.sheet__body'), 160)
    act(() => vi.advanceTimersByTime(CLOSE_MS))
    expect(onClose).toHaveBeenCalledTimes(1)
    expect(onChange).not.toHaveBeenCalled()
  })

  it('у рэжыме лацінкі', () => {
    setup({ ...DEFAULT_SETTINGS, script: 'lat' }, 'lat')
    expect(screen.getByRole('dialog', { name: 'Nałady' })).toBeInTheDocument()
    expect(screen.getByRole('radio', { name: 'Łacinka' })).toHaveAttribute('aria-checked', 'true')
    expect(screen.getByRole('switch', { name: /Štraf za pas/ })).toBeInTheDocument()
    expect(screen.getByRole('switch', { name: /Padkazki da słoŭ/ })).toBeInTheDocument()
  })
})
