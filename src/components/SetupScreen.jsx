import { useState } from 'react'
import { ADULT_LEVEL, LEVELS, LEVEL_ORDER } from '../data/words.js'
import { APP_NAME, MAX_TEAMS, MIN_TEAMS, ROUND_TIMES, TARGET_SCORES } from '../game/constants.js'
import { unlockAudio, vibrate } from '../game/feedback.js'
import { inProgress } from '../game/gameState.js'
import { words } from '../game/plural.js'
import { useScript, useT } from '../i18n/script.js'
import Segmented from './Segmented.jsx'
import SettingsSheet from './SettingsSheet.jsx'
import ConfirmSheet from './ConfirmSheet.jsx'
import AdultGate from './AdultGate.jsx'
import { Mark, Motif } from './Ornament.jsx'

const teamCounts = Array.from({ length: MAX_TEAMS - MIN_TEAMS + 1 }, (_, i) => i + MIN_TEAMS)

/** Пацвярджэнні для дзеянняў, якія абрываюць незавершаную гульню. */
const CONFIRMS = {
  teams: { title: 'Змяніць каманды?', text: 'Рахунак бягучай партыі будзе скінуты.', confirmLabel: 'Змяніць' },
  start: { title: 'Пачаць новую гульню?', text: 'Рахунак бягучай партыі будзе скінуты.', confirmLabel: 'Пачаць нанова' },
  finish: { title: 'Завяршыць гульню?', text: 'Пераможца вызначыцца па бягучым рахунку.', confirmLabel: 'Завяршыць', danger: true },
}

export default function SetupScreen({ state, dispatch, onRules }) {
  const t = useT()
  const script = useScript()
  const [settingsOpen, setSettingsOpen] = useState(false)
  const [rolls, setRolls] = useState(0)
  const [pending, setPending] = useState(null)
  const [ageGate, setAgeGate] = useState(false)
  const { settings, teams } = state
  const set = (key, value) => dispatch({ type: 'setSetting', key, value })
  const canContinue = inProgress(state)
  const level = LEVELS[settings.level] ?? LEVELS.easy

  const start = () => {
    if (settings.sound) unlockAudio()
    dispatch({ type: 'startGame' })
  }
  const changeTeamCount = (count) => {
    if (count === teams.length) return
    if (canContinue) setPending({ type: 'teams', count })
    else dispatch({ type: 'setTeamCount', count })
  }
  const confirmChange = () => {
    if (pending.type === 'teams') dispatch({ type: 'setTeamCount', count: pending.count })
    else if (pending.type === 'finish') dispatch({ type: 'finishNow' })
    else start()
    setPending(null)
  }
  const changeLevel = (value) => {
    if (value === ADULT_LEVEL && settings.level !== ADULT_LEVEL) setAgeGate(true)
    else set('level', value)
  }
  const confirmAge = () => {
    set('level', ADULT_LEVEL)
    setAgeGate(false)
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
            {script === 'lat' ? APP_NAME.lat : APP_NAME.cyr}
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
            <div className="resume__actions">
              <button type="button" className="btn btn--ghost btn--compact" onClick={() => setPending({ type: 'finish' })}>
                {t('Завяршыць')}
              </button>
              <button type="button" className="btn btn--primary btn--compact" onClick={resume}>
                {t('Працягнуць')}
              </button>
            </div>
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
          onChange={changeTeamCount}
        />
        <ul className="teamlist" aria-label={t('Каманды')}>
          {teams.map((team) => (
            <li key={team.id} className="teamlist__item" style={{ '--team': team.color }}>
              <Motif name={team.motif} size={20} className="teamlist__motif" />
              <span key={rolls} className={`teamlist__name${rolls > 0 ? ' is-rolled' : ''}`}>
                {t(team.name)}
              </span>
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
          className="seg--levels"
          label={t('Складанасць слоў')}
          options={LEVEL_ORDER.map((id) => ({
            value: id,
            label: t(LEVELS[id].short),
            className: id === ADULT_LEVEL ? 'seg__btn--adult' : undefined,
          }))}
          value={settings.level}
          onChange={changeLevel}
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

      <details className="game-info">
        <summary className="game-info__toggle">{t('Пра гульню')}<span>{t('886 слоў · кірыліца і лацінка')}</span></summary>
        <section className="game-info__body" aria-labelledby="game-info-title">
          <h2 className="panel__title" id="game-info-title">{t('Што такое «Аліяс па-беларуску»?')}</h2>
          <p className="game-info__lead">
            {t('Гэта бясплатная браўзерная гульня, у якой трэба тлумачыць беларускія словы, не называючы іх. У гульні 886 слоў, тры ўзроўні складанасці і рэжымы для 1–5 каманд.')}
          </p>
          <ul className="game-info__facts" aria-label={t('Магчымасці гульні')}>
            <li>{t('886 беларускіх слоў')}</li>
            <li>{t('Ад 1 да 5 каманд')}</li>
            <li>{t('Тры ўзроўні складанасці')}</li>
            <li>{t('Рэжым 18+')}</li>
            <li>{t('Кірыліца і лацінка')}</li>
          </ul>
          <details className="game-info__question">
            <summary>{t('Як гуляць у «Аліяс»?')}</summary>
            <p>{t('Адзін гулец тлумачыць слова з экрана, а яго каманда адгадвае. За адгаданае слова каманда атрымлівае ачко; перамагае каманда, якая набярэ зададзеную колькасць ачкоў.')}</p>
          </details>
          <details className="game-info__question">
            <summary>{t('Ці трэба спампоўваць або рэгістравацца?')}</summary>
            <p>{t('Не. Гульня бясплатна працуе проста ў сучасным браўзеры без рэгістрацыі. Яе таксама можна дадаць на хатні экран тэлефона.')}</p>
          </details>
        </section>
      </details>

      <footer className="site-links" aria-label={t('Карысныя спасылкі')}>
        <a href="https://itbeard.com/support/" target="_blank" rel="noreferrer">
          {t('Падзякаваць')}
        </a>
        <span aria-hidden="true">·</span>
        <a href="https://github.com/it-beard/alias-bel" target="_blank" rel="noreferrer">
          {t('Гульня на GitHub')}
        </a>
      </footer>

      <div className="actions actions--sticky">
        <button type="button" className="btn btn--ghost" onClick={onRules}>
          {t('Правілы')}
        </button>
        <button type="button" className="btn btn--primary" onClick={() => canContinue ? setPending({ type: 'start' }) : start()}>
          {t(canContinue ? 'Новая гульня' : 'Пачаць гульню')}
        </button>
      </div>

      {settingsOpen && <SettingsSheet settings={settings} onChange={set} onClose={() => setSettingsOpen(false)} />}
      {ageGate && <AdultGate onConfirm={confirmAge} onClose={() => setAgeGate(false)} />}
      {pending && (
        <ConfirmSheet
          title={t(CONFIRMS[pending.type].title)}
          text={t(CONFIRMS[pending.type].text)}
          confirmLabel={t(CONFIRMS[pending.type].confirmLabel)}
          danger={CONFIRMS[pending.type].danger}
          onConfirm={confirmChange}
          onClose={() => setPending(null)}
        />
      )}
    </div>
  )
}
