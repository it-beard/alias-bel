import { useEffect, useState } from 'react'
import ScoreBoard from './ScoreBoard.jsx'
import ConfirmSheet from './ConfirmSheet.jsx'
import { Motif } from './Ornament.jsx'
import { sounds, unlockAudio, vibrate } from '../game/feedback.js'
import { COUNTDOWN_STEP_MS } from '../game/constants.js'
import { useT } from '../i18n/script.js'

export default function ReadyScreen({ state, dispatch, onRules }) {
  const t = useT()
  const { settings } = state
  const team = state.teams[state.turnIndex]
  const [count, setCount] = useState(null)
  const [confirmEnd, setConfirmEnd] = useState(false)

  const begin = () => {
    if (settings.sound) unlockAudio()
    setCount(3)
  }

  useEffect(() => {
    if (count === null) return
    if (settings.sound) sounds.tick()
    if (settings.vibration) vibrate(15)
    const id = setTimeout(() => {
      if (count > 1) {
        setCount(count - 1)
        return
      }
      if (settings.sound) sounds.start()
      dispatch({ type: 'startTurn' })
    }, COUNTDOWN_STEP_MS)
    return () => clearTimeout(id)
  }, [count, settings.sound, settings.vibration, dispatch])

  return (
    <div className="screen screen--scroll" style={{ '--team': team.color }}>
      <header className="topbar">
        <button type="button" className="topbar__btn" onClick={() => dispatch({ type: 'toSetup' })}>
          {t('Налады')}
        </button>
        <span className="topbar__title">
          {t('Раунд')} {state.roundNo}
        </span>
        <button type="button" className="topbar__btn" onClick={onRules}>
          {t('Правілы')}
        </button>
      </header>

      <div className="ready">
        <Motif name={team.motif} size={56} className="ready__motif" title={t('Знак каманды')} />
        <p className="ready__eyebrow">{t('Тлумачыць')}</p>
        <h2 className="ready__team">{t(team.name)}</h2>
        <p className="ready__hint">
          {t('Перадайце тэлефон таму, хто тлумачыць. Астатнія ў камандзе адгадваюць слова — называць аднакаранёвыя словы нельга.')}
        </p>
        <button type="button" className="bigbtn" onClick={begin}>
          {t('Пачаць раунд')}
          <span className="bigbtn__sub">
            {settings.roundSeconds} {t('секунд')}
          </span>
        </button>
      </div>

      <section className="panel">
        <h2 className="panel__title">
          {t('Рахунак — да')} {settings.targetScore}
        </h2>
        <ScoreBoard teams={state.teams} activeIndex={state.turnIndex} target={settings.targetScore} />
      </section>

      <div className="actions">
        <button type="button" className="btn btn--ghost btn--wide" onClick={() => setConfirmEnd(true)}>
          {t('Скончыць гульню')}
        </button>
      </div>

      {count !== null && (
        <button type="button" className="overlay overlay--count" onClick={() => setCount(null)} aria-label={t('Скасаваць')}>
          <span className="count__team">{t(team.name)}</span>
          <span className="count__num" key={count} aria-live="assertive">
            {count}
          </span>
          <span className="count__hint">{t('Націсніце, каб скасаваць')}</span>
        </button>
      )}

      {confirmEnd && (
        <ConfirmSheet
          title={t('Скончыць гульню?')}
          text={t('Пераможца вызначыцца па бягучым рахунку.')}
          confirmLabel={t('Скончыць')}
          danger
          onConfirm={() => dispatch({ type: 'finishNow' })}
          onClose={() => setConfirmEnd(false)}
        />
      )}
    </div>
  )
}
