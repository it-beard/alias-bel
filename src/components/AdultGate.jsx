import { useT } from '../i18n/script.js'
import Dialog from './Dialog.jsx'

/** Праверка ўзросту перад уключэннем рэжыму 18+. */
export default function AdultGate({ onConfirm, onClose }) {
  const t = useT()
  const title = t('Вам дакладна ёсць 18 гадоў?')
  return (
    <Dialog label={title} onClose={onClose}>
      <div className="sheet__backdrop" onClick={onClose} />
      <div className="sheet__body sheet__body--compact gate">
        <span className="gate__badge" aria-hidden="true">
          18+
        </span>
        <h2 className="sheet__title">{title}</h2>
        <p className="sheet__text">
          {t('У гэтым рэжыме — беларуская секс-лексіка: словы шчырыя, пікантныя, а месцамі і брутальныя. Дзецям і цнатлівым вушам тут не месца.')}
        </p>
        <div className="actions">
          <button type="button" className="btn btn--ghost" onClick={onClose}>
            {t('Не, вярнуцца')}
          </button>
          <button type="button" className="btn btn--adult" onClick={onConfirm}>
            {t('Так, мне ёсць 18')}
          </button>
        </div>
      </div>
    </Dialog>
  )
}
