import { useT } from '../i18n/script.js'
import { Band } from './Ornament.jsx'

export default function RulesSheet({ onClose }) {
  const t = useT()
  return (
    <div className="sheet" role="dialog" aria-modal="true" aria-label={t('Правілы гульні')}>
      <div className="sheet__backdrop" onClick={onClose} />
      <div className="sheet__body">
        <div className="sheet__grip" aria-hidden="true" />
        <h2 className="sheet__title">{t('Правілы')}</h2>
        <Band pattern="chain" height={10} className="sheet__band" />
        <ol className="rules">
          <li>{t('Гульцы дзеляцца на каманды (ад 1 да 5). Каманды тлумачаць словы па чарзе.')}</li>
          <li>{t('Адзін гулец бярэ тэлефон і тлумачыць слова з экрана, астатнія ў камандзе адгадваюць.')}</li>
          <li>
            {t('Нельга называць аднакаранёвыя словы, перакладаць слова на іншую мову і паказваць яго жэстамі. ')}
            {t('Можна тлумачыць сінонімамі, антонімамі, апісаннем і асацыяцыямі.')}
          </li>
          <li>
            {t('Адгадалі — націсніце ')}
            <b>{t('Адгадана')}</b>
            {t(' (ці свайпніце направа): +1 ачко. Не ведаеце слова — ')}
            <b>{t('Пас')}</b>
            {t(' (свайп налева): −1 ачко, калі ўключаны штраф.')}
          </li>
          <li>{t('Раунд доўжыцца зададзены час. Пасля сігналу можна дагуляць апошняе слова, калі правіла ўключана.')}</li>
          <li>{t('Пасля раунда паказваецца спіс словаў — спрэчныя адзнакі можна выправіць націскам.')}</li>
          <li>
            {t('Гульня сканчаецца, калі нейкая каманда набірае мэтавую колькасць ачкоў; круг дагульваецца да канца, ')}
            {t('каб ва ўсіх была роўная колькасць раундаў.')}
          </li>
        </ol>
        <button type="button" className="btn btn--primary" onClick={onClose}>
          {t('Зразумела')}
        </button>
      </div>
    </div>
  )
}
