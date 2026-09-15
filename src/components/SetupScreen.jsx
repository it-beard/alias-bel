import { LEVELS, LEVEL_ORDER } from '../data/words.js'
import { MAX_TEAMS, MIN_TEAMS, ROUND_TIMES, SCRIPTS, TARGET_SCORES, THEMES } from '../game/constants.js'
import { unlockAudio } from '../game/feedback.js'
import { inProgress } from '../game/gameState.js'
import { words } from '../game/plural.js'
import { useScript, useT } from '../i18n/script.js'
import Chips from './Chips.jsx'
import Toggle from './Toggle.jsx'
import { Band, Motif } from './Ornament.jsx'

const teamCounts = Array.from({ length: MAX_TEAMS - MIN_TEAMS + 1 }, (_, i) => i + MIN_TEAMS)

export default function SetupScreen({ state, dispatch, onRules }) {
  const t = useT()
  const script = useScript()
  const { settings, teams } = state
  const set = (key) => (value) => dispatch({ type: 'setSetting', key, value })
  const canContinue = inProgress(state)

  const start = () => {
    if (settings.sound) unlockAudio()
    dispatch({ type: 'startGame' })
  }
  const resume = () => {
    if (settings.sound) unlockAudio()
    dispatch({ type: 'continueGame' })
  }

  return (
    <div className="screen screen--scroll">
      <header className="brand">
        <Band pattern="dotted" height={12} lines className="brand__band" />
        <h1 className="brand__title">{script === 'lat' ? 'Alias' : 'Аліяс'}</h1>
        <p className="brand__subtitle">{t('тлумач словы па-беларуску')}</p>
        <Band pattern="dotted" height={12} lines className="brand__band" />
      </header>

      {canContinue && (
        <section className="panel panel--accent resume" style={{ '--team': teams[state.turnIndex]?.color }}>
          <div className="resume__text">
            <h2 className="panel__title">{t('Незавершаная гульня')}</h2>
            <p className="resume__line">
              {t('Раунд')} {state.roundNo} · {teams.map((team) => `${t(team.name)} ${team.score}`).join(' · ')}
            </p>
          </div>
          <button type="button" className="btn btn--primary btn--compact" onClick={resume}>
            {t('Працягнуць')}
          </button>
        </section>
      )}

      <section className="panel">
        <h2 className="panel__title">{t('Каманды')}</h2>
        <Chips
          label={t('Колькасць каманд')}
          options={teamCounts.map((n) => ({ value: n, label: n }))}
          value={teams.length}
          onChange={(count) => dispatch({ type: 'setTeamCount', count })}
        />
        <ul className="teamlist">
          {teams.map((team, i) => (
            <li key={team.id} className="teamlist__item" style={{ '--team': team.color }}>
              <Motif name={team.motif} size={22} className="teamlist__motif" />
              <input
                className="teamlist__input"
                value={team.name}
                maxLength={18}
                autoComplete="off"
                enterKeyHint="done"
                aria-label={`${t('Назва каманды')} ${i + 1}`}
                onChange={(e) => dispatch({ type: 'renameTeam', id: team.id, name: e.target.value })}
              />
            </li>
          ))}
        </ul>
        {teams.length === 1 && (
          <p className="hint">{t('Сола-рэжым: гуляеце адной камандай і спрабуеце дабіцца мэты за найменшую колькасць раундаў.')}</p>
        )}
      </section>

      <section className="panel">
        <h2 className="panel__title">{t('Словы')}</h2>
        <div className="levels" role="radiogroup" aria-label={t('Складанасць слоў')}>
          {LEVEL_ORDER.map((id) => {
            const level = LEVELS[id]
            const on = settings.level === id
            return (
              <button
                key={id}
                type="button"
                role="radio"
                aria-checked={on}
                className={`level${on ? ' is-on' : ''}`}
                onClick={() => set('level')(id)}
              >
                <span className="level__label">{t(level.label)}</span>
                <span className="level__hint">{t(level.hint)}</span>
                <span className="level__count">{t(words(new Set(level.words).size))}</span>
              </button>
            )
          })}
        </div>
        <div className="row">
          <span className="row__label">{t('Алфавіт')}</span>
          <Chips
            label={t('Алфавіт')}
            options={SCRIPTS.map((s) => ({ value: s.id, label: t(s.label) }))}
            value={settings.script}
            onChange={set('script')}
          />
        </div>
      </section>

      <section className="panel">
        <h2 className="panel__title">{t('Раунд')}</h2>
        <div className="row">
          <span className="row__label">{t('Час раунда')}</span>
          <Chips
            label={t('Час раунда')}
            options={ROUND_TIMES.map((s) => ({ value: s, label: `${s} ${t('с')}` }))}
            value={settings.roundSeconds}
            onChange={set('roundSeconds')}
          />
        </div>
        <div className="row">
          <span className="row__label">{t('Гуляем да')}</span>
          <Chips
            label={t('Мэтавы лік')}
            options={TARGET_SCORES.map((s) => ({ value: s, label: s }))}
            value={settings.targetScore}
            onChange={set('targetScore')}
          />
        </div>
      </section>

      <section className="panel">
        <h2 className="panel__title">{t('Дадаткова')}</h2>
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
        <div className="row">
          <span className="row__label">{t('Тэма')}</span>
          <Chips
            label={t('Тэма')}
            size="sm"
            options={THEMES.map((th) => ({ value: th.id, label: t(th.label) }))}
            value={settings.theme}
            onChange={set('theme')}
          />
        </div>
      </section>

      <div className="actions actions--sticky">
        <button type="button" className="btn btn--ghost" onClick={onRules}>
          {t('Правілы')}
        </button>
        <button type="button" className="btn btn--primary" onClick={start}>
          {t(canContinue ? 'Новая гульня' : 'Пачаць гульню')}
        </button>
      </div>
    </div>
  )
}
