import { useEffect, useRef } from 'react'
import { useCountdown } from '../hooks/useCountdown.js'
import { useWakeLock } from '../hooks/useWakeLock.js'
import { useSwipe } from '../hooks/useSwipe.js'
import { useKeys } from '../hooks/useKeys.js'
import { sounds, unlockAudio, vibrate } from '../game/feedback.js'
import { roundScore } from '../game/gameState.js'
import { ANSWER_LOCK_MS } from '../game/constants.js'
import { wordSize } from '../game/wordSize.js'
import { ADULT_LEVEL } from '../data/words.js'
import { useScript, useT } from '../i18n/script.js'
import { Motif } from './Ornament.jsx'
import Dialog from './Dialog.jsx'

export default function PlayScreen({ state, dispatch }) {
  const t = useT()
  const script = useScript()
  const { settings, current, results, lastWord, endsAt, pausedLeft } = state
  const team = state.teams[state.turnIndex]
  const paused = pausedLeft !== null
  const lastTick = useRef(null)
  const lockUntil = useRef(0)

  const left = useCountdown(endsAt, () => {
    if (settings.sound) sounds.timeUp()
    if (settings.vibration) vibrate([120, 60, 120])
    dispatch({ type: 'timeUp' })
  })

  useWakeLock(!paused)

  useEffect(() => {
    if (paused || lastWord || left > 5 || left <= 0) return
    if (lastTick.current === left) return
    lastTick.current = left
    if (settings.sound) sounds.tick()
  }, [left, paused, lastWord, settings.sound])

  const answer = (guessed) => {
    if (paused) return
    const now = Date.now()
    if (!lastWord && endsAt !== null && now >= endsAt && !settings.lastWordRule) {
      dispatch({ type: 'timeUp' })
      return
    }
    if (now < lockUntil.current) return
    lockUntil.current = now + ANSWER_LOCK_MS
    if (settings.sound) (guessed ? sounds.correct : sounds.skip)()
    if (settings.vibration) vibrate(guessed ? 30 : [20, 40, 20])
    dispatch({ type: 'answer', guessed })
  }

  const togglePause = () => {
    if (lastWord) return
    if (paused && settings.sound) unlockAudio()
    dispatch({ type: paused ? 'resume' : 'pause' })
  }

  const swipe = useSwipe({ onRight: () => answer(true), onLeft: () => answer(false), enabled: !paused })
  useKeys({ ArrowRight: () => answer(true), ArrowLeft: () => answer(false), ' ': togglePause, Escape: togglePause }, !paused)

  const shownLeft = paused ? Math.ceil(pausedLeft / 1000) : left
  const progress = lastWord ? 0 : Math.max(0, Math.min(1, shownLeft / settings.roundSeconds))
  const urgent = !lastWord && !paused && left <= 5
  const running = roundScore(results, settings.skipPenalty)
  const word = t(current ?? '')
  const lean = Math.max(-1, Math.min(1, swipe.offset / swipe.threshold))

  return (
    <div className="screen screen--play" style={{ '--team': team.color }}>
      <header className="playbar">
        <button
          type="button"
          className="playbar__btn"
          onClick={togglePause}
          aria-label={t('Паўза')}
          disabled={lastWord}
        >
          <svg viewBox="0 0 20 20" width="18" height="18" aria-hidden="true">
            <rect x="4" y="3" width="4" height="14" rx="1" fill="currentColor" />
            <rect x="12" y="3" width="4" height="14" rx="1" fill="currentColor" />
          </svg>
        </button>
        <span className="playbar__team">
          <Motif name={team.motif} size={18} />
          <span className="playbar__name">{t(team.name)}</span>
        </span>
        <span className="playbar__score" aria-label={t('Ачкі за раунд')}>
          {running > 0 ? `+${running}` : running}
        </span>
      </header>

      <div className={`timer${urgent ? ' is-urgent' : ''}${lastWord ? ' is-last' : ''}`} role="timer" aria-live="off">
        <div className="timer__track">
          <div className="timer__fill" style={{ transform: `scaleX(${progress})` }} />
        </div>
        <span className="timer__value">{lastWord ? t('Апошняе слова!') : shownLeft}</span>
      </div>

      <div className="cardzone">
        <div
          className={`card${swipe.dragging ? ' is-dragging' : ''}`}
          style={{ transform: `translateX(${swipe.offset}px) rotate(${lean * 5}deg)` }}
          lang={script === 'lat' ? 'be-Latn' : 'be'}
          aria-hidden={paused || undefined}
          {...swipe.handlers}
        >
          <Motif name={team.motif} size={18} className="card__motif" />
          <p className="card__word" key={results.length} data-len={wordSize(word)}>
            {word}
          </p>
          <p className="card__index">{results.length + 1}</p>
          {settings.level === ADULT_LEVEL && <span className="tag18 card__adult">18+</span>}
          <span className="card__stamp card__stamp--ok" style={{ opacity: Math.max(0, lean) }} aria-hidden="true">
            ✓
          </span>
          <span className="card__stamp card__stamp--skip" style={{ opacity: Math.max(0, -lean) }} aria-hidden="true">
            ✕
          </span>
        </div>
        <p className="card__swipe">
          ← {t('пас')} · {t('адгадана')} →
        </p>
      </div>

      <div className="answers">
        <button type="button" className="answer answer--skip" onClick={() => answer(false)} disabled={paused}>
          <span className="answer__icon" aria-hidden="true">
            ✕
          </span>
          {t('Пас')}
        </button>
        <button type="button" className="answer answer--ok" onClick={() => answer(true)} disabled={paused}>
          <span className="answer__icon" aria-hidden="true">
            ✓
          </span>
          {t('Адгадана')}
        </button>
      </div>

      {paused && (
        <Dialog className="overlay" label={t('Паўза')} onClose={togglePause}>
          <div className="overlay__box">
            <h2 className="overlay__title">{t('Паўза')}</h2>
            <p className="overlay__text">
              {t('Засталося')} {Math.ceil((pausedLeft ?? 0) / 1000)} {t('с')}
            </p>
            <button type="button" className="btn btn--primary" onClick={togglePause}>
              {t('Працягнуць')}
            </button>
            <button type="button" className="btn btn--ghost" onClick={() => dispatch({ type: 'endRound' })}>
              {t('Спыніць раунд')}
            </button>
          </div>
        </Dialog>
      )}
    </div>
  )
}
