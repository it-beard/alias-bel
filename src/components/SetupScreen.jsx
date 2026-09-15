import { useState } from 'react'
import { LEVELS, LEVEL_ORDER } from '../data/words.js'
import { MAX_TEAMS, MIN_TEAMS, ROUND_TIMES, TARGET_SCORES, TEAM_NAME_MAX } from '../game/constants.js'
import { unlockAudio, vibrate } from '../game/feedback.js'
import { inProgress } from '../game/gameState.js'
import { words } from '../game/plural.js'
import { useScript, useT } from '../i18n/script.js'
import Segmented from './Segmented.jsx'
import SettingsSheet from './SettingsSheet.jsx'
import { Mark, Motif } from './Ornament.jsx'

const teamCounts = Array.from({ length: MAX_TEAMS - MIN_TEAMS + 1 }, (_, i) => i + MIN_TEAMS)

export default function SetupScreen({ state, dispatch, onRules }) {
  const t = useT()
  const script = useScript()
  const [settingsOpen, setSettingsOpen] = useState(false)
  const [rolls, setRolls] = useState(0)
  const { settings, teams } = state
  const set = (key, value) => dispatch({ type: 'setSetting', key, value })
  const canContinue = inProgress(state)
  const level = LEVELS[settings.level] ?? LEVELS.easy

  const start = () => {
    if (settings.sound) unlockAudio()
    dispatch({ type: 'startGame' })
  }
  const randomizeNames = () => {
    if (settings.vibration) vibrate(12)
    setRolls((n) => n + 1)
    dispatch({ type: 'randomizeTeamNames' })
  }
  const resume = () => {
    if (settings.sound) unlockAudio()
    dispatch({ type: 'continueGame' })
  }

  return (
    <div className="screen screen--scroll">
      <header className="brand">
        <div className="brand__row">
          <h1 className="brand__title">
            <Mark className="brand__mark" />
            {script === 'lat' ? 'Alias' : 'Аліяс'}
          </h1>
          <button type="button" className="iconbtn" onClick={() => setSettingsOpen(true)} aria-label={t('Налады')}>
            <svg viewBox="0 0 24 24" width="22" height="22" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <path d="M4 7h16M4 12h16M4 17h16" />
              <circle cx="9" cy="7" r="2.2" fill="currentColor" stroke="none" />
              <circle cx="15" cy="12" r="2.2" fill="currentColor" stroke="none" />
              <circle cx="7" cy="17" r="2.2" fill="currentColor" stroke="none" />
            </svg>
          </button>
        </div>
        <p className="brand__subtitle">{t('тлумач словы па-беларуску')}</p>
      </header>

      {canContinue && (
        <section className="panel resume" style={{ '--team': teams[state.turnIndex]?.color }}>
          <div className="panel__head">
            <h2 className="panel__title">{t('Незавершаная гульня')}</h2>
            <button type="button" className="btn btn--primary btn--compact" onClick={resume}>
              {t('Працягнуць')}
            </button>
          </div>
          <p className="resume__line">
            <span className="resume__round">
              {t('Раунд')} {state.roundNo}
            </span>
            {teams.map((team) => (
              <span key={team.id} className="resume__team" style={{ '--team': team.color }}>
                <Motif name={team.motif} size={14} />
                <span className="sr-only">{t(team.name)} </span>
                {team.score}
              </span>
            ))}
          </p>
        </section>
      )}

      <section className="panel">
        <div className="panel__head">
          <h2 className="panel__title">{t('Каманды')}</h2>
          <button type="button" className="pillbtn" onClick={randomizeNames}>
            <svg
              className="pillbtn__icon"
              viewBox="0 0 24 24"
              width="18"
              height="18"
              aria-hidden="true"
              style={{ transform: `rotate(${rolls * 90}deg)` }}
            >
              <rect x="3.5" y="3.5" width="17" height="17" rx="4" fill="none" stroke="currentColor" strokeWidth="2" />
              <circle cx="8.5" cy="8.5" r="1.7" fill="currentColor" />
              <circle cx="12" cy="12" r="1.7" fill="currentColor" />
              <circle cx="15.5" cy="15.5" r="1.7" fill="currentColor" />
            </svg>
            {t('Выпадковыя назвы')}
          </button>
        </div>
        <Segmented
          label={t('Колькасць каманд')}
          options={teamCounts.map((n) => ({ value: n, label: n }))}
          value={teams.length}
          onChange={(count) => dispatch({ type: 'setTeamCount', count })}
        />
        <ul className="teamlist">
          {teams.map((team, i) => (
            <li key={team.id} className="teamlist__item" style={{ '--team': team.color }}>
              <Motif name={team.motif} size={20} className="teamlist__motif" />
              <input
                key={rolls}
                className={`teamlist__input${rolls > 0 ? ' is-rolled' : ''}`}
                value={team.name}
                maxLength={TEAM_NAME_MAX}
                autoComplete="off"
                enterKeyHint="done"
                aria-label={`${t('Назва каманды')} ${i + 1}`}
                onChange={(e) => dispatch({ type: 'renameTeam', id: team.id, name: e.target.value })}
              />
            </li>
          ))}
        </ul>
        {teams.length === 1 && (
          <p className="panel__hint">{t('Сола-рэжым: адна каманда імкнецца да мэты за найменшую колькасць раундаў.')}</p>
        )}
      </section>

      <section className="panel">
        <h2 className="panel__title">{t('Словы')}</h2>
        <Segmented
          label={t('Складанасць слоў')}
          options={LEVEL_ORDER.map((id) => ({ value: id, label: t(LEVELS[id].short) }))}
          value={settings.level}
          onChange={(value) => set('level', value)}
        />
        <p className="panel__hint">
          {t(level.hint)} · {t(words(new Set(level.words).size))}
        </p>
      </section>

      <section className="panel">
        <h2 className="panel__title">{t('Раунд')}</h2>
        <div className="field">
          <span className="field__label">{t('Час')}</span>
          <Segmented
            label={t('Час раунда')}
            options={ROUND_TIMES.map((s) => ({ value: s, label: `${s} ${t('с')}` }))}
            value={settings.roundSeconds}
            onChange={(value) => set('roundSeconds', value)}
          />
        </div>
        <div className="field">
          <span className="field__label">{t('Гуляем да')}</span>
          <Segmented
            label={t('Мэтавы лік')}
            options={TARGET_SCORES.map((s) => ({ value: s, label: s }))}
            value={settings.targetScore}
            onChange={(value) => set('targetScore', value)}
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

      {settingsOpen && <SettingsSheet settings={settings} onChange={set} onClose={() => setSettingsOpen(false)} />}
    </div>
  )
}
