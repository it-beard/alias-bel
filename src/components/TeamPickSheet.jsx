import { useT } from '../i18n/script.js'
import { Motif } from './Ornament.jsx'
import Dialog from './Dialog.jsx'

/**
 * Ніжняя шторка «хто адгадаў»: агульнае апошняе слова можа ўзяць любая каманда.
 * `onNobody` дадае варыянт «ніхто» — для выпраўлення адзнакі пасля раунда.
 */
export default function TeamPickSheet({ teams, activeIndex, word, onPick, onNobody, onClose }) {
  const t = useT()
  return (
    <Dialog label={t('Хто адгадаў?')} onClose={onClose}>
      <div className="sheet__backdrop" onClick={onClose} />
      <div className="sheet__body sheet__body--compact">
        <h2 className="sheet__title">{t('Хто адгадаў?')}</h2>
        {word && <p className="sheet__text">{t(word)}</p>}
        <ul className="teampick">
          {teams.map((team, i) => (
            <li key={team.id}>
              <button type="button" className="teampick__item" style={{ '--team': team.color }} onClick={() => onPick(i)}>
                <Motif name={team.motif} size={20} />
                <span className="teampick__name">{t(team.name)}</span>
                {i === activeIndex && <span className="teampick__note">{t('іх раунд')}</span>}
              </button>
            </li>
          ))}
        </ul>
        <div className="actions">
          <button type="button" className={`btn btn--ghost${onNobody ? '' : ' btn--wide'}`} onClick={onClose}>
            {t('Назад')}
          </button>
          {onNobody && (
            <button type="button" className="btn btn--ghost btn--wide" onClick={onNobody}>
              {t('Ніхто не адгадаў')}
            </button>
          )}
        </div>
      </div>
    </Dialog>
  )
}
