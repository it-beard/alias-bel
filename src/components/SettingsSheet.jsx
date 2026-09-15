import { SCRIPTS, THEMES } from '../game/constants.js'
import { useT } from '../i18n/script.js'
import Segmented from './Segmented.jsx'
import Toggle from './Toggle.jsx'
import Dialog from './Dialog.jsx'

/** Шторка з наладамі, якія мяняюць рэдка: алфавіт, тэма, правілы падліку, гук. */
export default function SettingsSheet({ settings, onChange, onClose }) {
  const t = useT()
  const set = (key) => (value) => onChange(key, value)

  return (
    <Dialog label={t('Налады')} onClose={onClose}>
      <div className="sheet__backdrop" onClick={onClose} />
      <div className="sheet__body">
        <div className="sheet__grip" aria-hidden="true" />
        <h2 className="sheet__title">{t('Налады')}</h2>

        <div className="field">
          <span className="field__label">{t('Алфавіт')}</span>
          <Segmented
            label={t('Алфавіт')}
            options={SCRIPTS.map((s) => ({ value: s.id, label: t(s.label) }))}
            value={settings.script}
            onChange={set('script')}
          />
        </div>
        <div className="field">
          <span className="field__label">{t('Тэма')}</span>
          <Segmented
            label={t('Тэма')}
            options={THEMES.map((th) => ({ value: th.id, label: t(th.label) }))}
            value={settings.theme}
            onChange={set('theme')}
          />
        </div>

        <div className="toggles">
          <Toggle
            label={t('Штраф за пас')}
            hint={t('Прапушчанае слова адымае адно ачко')}
            value={settings.skipPenalty}
            onChange={set('skipPenalty')}
          />
          <Toggle
            label={t('Апошняе слова')}
            hint={t('Пасля сігналу дазваляецца дагуляць слова на экране')}
            value={settings.lastWordRule}
            onChange={set('lastWordRule')}
          />
          <Toggle label={t('Гук')} value={settings.sound} onChange={set('sound')} />
          <Toggle label={t('Вібрацыя')} value={settings.vibration} onChange={set('vibration')} />
        </div>

        <button type="button" className="btn btn--primary" onClick={onClose}>
          {t('Гатова')}
        </button>
      </div>
    </Dialog>
  )
}
