import { afterEach, describe, expect, it, vi } from 'vitest'
import { createEvent, fireEvent, render, screen } from '@testing-library/react'
import Dialog from './Dialog.jsx'

// jsdom не мае showModal/close — падстаўляем іх самі і вяртаем як было.
const proto = HTMLDialogElement.prototype
const native = { showModal: proto.showModal, close: proto.close }

describe('Dialog', () => {
  afterEach(() => Object.assign(proto, native))

  it('паказвае змесціва як мадальны дыялог з назвай і класам шторкі', () => {
    render(
      <Dialog label="Паўза" onClose={() => {}}>
        <p>Змесціва</p>
      </Dialog>,
    )
    const dialog = screen.getByRole('dialog', { name: 'Паўза' })
    expect(dialog).toHaveAttribute('aria-modal', 'true')
    expect(dialog).toHaveAttribute('open')
    expect(dialog).toHaveClass('sheet')
    expect(dialog).toHaveTextContent('Змесціва')
  })

  it('прымае ўласны клас замест шторкі', () => {
    render(<Dialog label="Адлік" className="overlay overlay--count" onClose={() => {}} />)
    const dialog = screen.getByRole('dialog', { name: 'Адлік' })
    expect(dialog).toHaveClass('overlay', 'overlay--count')
    expect(dialog).not.toHaveClass('sheet')
  })

  it('Escape не зачыняе дыялог сам, а паведамляе праз onClose', () => {
    const onClose = vi.fn()
    render(<Dialog label="Паўза" onClose={onClose} />)
    const dialog = screen.getByRole('dialog')
    const cancel = createEvent('cancel', dialog, { cancelable: true })
    fireEvent(dialog, cancel)
    expect(cancel.defaultPrevented).toBe(true)
    expect(onClose).toHaveBeenCalledTimes(1)
    expect(dialog).toBeInTheDocument()
  })

  it('у браўзеры адкрываецца праз showModal і зачыняецца пры размантаванні', () => {
    const showModal = vi.fn()
    const close = vi.fn()
    Object.assign(proto, { showModal, close })
    const { unmount } = render(<Dialog label="Паўза" onClose={() => {}} />)
    expect(showModal).toHaveBeenCalledTimes(1)
    expect(close).not.toHaveBeenCalled()
    unmount()
    expect(close).toHaveBeenCalledTimes(1)
  })

  it('пасля зачынення вяртае фокус туды, дзе ён быў', () => {
    const opener = document.createElement('button')
    document.body.append(opener)
    opener.focus()
    const { unmount } = render(
      <Dialog label="Паўза" onClose={() => {}}>
        <button type="button">Працягнуць</button>
      </Dialog>,
    )
    screen.getByRole('button', { name: 'Працягнуць' }).focus()
    unmount()
    expect(opener).toHaveFocus()
    opener.remove()
  })

  it('не вяртае фокус элементу, якога ўжо няма на старонцы', () => {
    const opener = document.createElement('button')
    document.body.append(opener)
    opener.focus()
    const focus = vi.spyOn(opener, 'focus')
    const { unmount } = render(<Dialog label="Паўза" onClose={() => {}} />)
    opener.remove()
    unmount()
    expect(focus).not.toHaveBeenCalled()
  })
})
