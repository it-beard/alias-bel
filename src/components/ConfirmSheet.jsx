import { useT } from '../i18n/script.js'

/** Ніжняя шторка з пацверджаннем дзеяння, якое цяжка адкаціць. */
export default function ConfirmSheet({ title, text, confirmLabel, onConfirm, onClose, danger = false }) {
  const t = useT()
  return (
    <div className="sheet" role="dialog" aria-modal="true" aria-label={title}>
      <div className="sheet__backdrop" onClick={onClose} />
      <div className="sheet__body sheet__body--compact">
        <h2 className="sheet__title">{title}</h2>
        {text && <p className="sheet__text">{text}</p>}
        <div className="actions">
          <button type="button" className="btn btn--ghost" onClick={onClose}>
            {t('Не, вярнуцца')}
          </button>
          <button type="button" className={`btn ${danger ? 'btn--danger' : 'btn--primary'}`} onClick={onConfirm}>
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  )
}
