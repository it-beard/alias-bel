import { useLayoutEffect, useRef } from 'react'

/** Натыўны modal: утрымлівае фокус, блакуе фон і зачыняецца праз Escape. */
export default function Dialog({ label, onClose, className = 'sheet', children }) {
  const ref = useRef(null)

  useLayoutEffect(() => {
    const dialog = ref.current
    const previousFocus = document.activeElement
    if (dialog.showModal) dialog.showModal()
    else dialog.setAttribute('open', '') // jsdom
    return () => {
      dialog.close?.()
      if (previousFocus?.isConnected) previousFocus.focus?.({ preventScroll: true })
    }
  }, [])

  return (
    <dialog
      ref={ref}
      className={className}
      aria-label={label}
      aria-modal="true"
      onCancel={(event) => {
        event.preventDefault()
        onClose()
      }}
    >
      {children}
    </dialog>
  )
}
