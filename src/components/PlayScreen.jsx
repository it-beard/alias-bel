import { useEffect, useRef } from 'react'
import { useCountdown } from '../hooks/useCountdown.js'
import { useWakeLock } from '../hooks/useWakeLock.js'
import { useSwipe } from '../hooks/useSwipe.js'
import { sounds, vibrate } from '../game/feedback.js'
import { roundScore } from '../game/gameState.js'

export default function PlayScreen({ state, dispatch }) {
  const { settings, current, results, lastWord, endsAt, pausedLeft } = state
  const team = state.teams[state.turnIndex]
  const paused = pausedLeft !== null
  const lastTick = useRef(null)

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
    if (settings.sound) (guessed ? sounds.correct : sounds.skip)()
    if (settings.vibration) vibrate(guessed ? 30 : [20, 40, 20])
    dispatch({ type: 'answer', guessed })
  }

  const swipe = useSwipe({ onRight: () => answer(true), onLeft: () => answer(false) })

  const shownLeft = paused ? Math.ceil(pausedLeft / 1000) : left
  const progress = lastWord ? 0 : Math.max(0, Math.min(1, shownLeft / settings.roundSeconds))
  const running = roundScore(results, settings.skipPenalty)

  return (
    <div className="screen screen--play" style={{ '--team': team.color }}>
      <header className="playbar">
        <button type="button" className="playbar__btn" onClick={() => dispatch({ type: 'pause' })} aria-label="Паўза">
          ❚❚
        </button>
        <span className="playbar__team">{team.name}</span>
        <span className="playbar__score" aria-label="Ачкі за раунд">
          {running > 0 ? `+${running}` : running}
        </span>
      </header>

      <div className={`timer${!lastWord && !paused && left <= 5 ? ' is-urgent' : ''}`}>
        <div className="timer__track">
          <div className="timer__fill" style={{ transform: `scaleX(${progress})` }} />
        </div>
        <span className="timer__value">{lastWord ? 'Апошняе слова!' : `${shownLeft} с`}</span>
      </div>

      <div className="card" {...swipe}>
        <p className="card__word" style={{ fontSize: wordSize(current) }}>
          {current}
        </p>
        <p className="card__swipe">← пас&nbsp;&nbsp;·&nbsp;&nbsp;адгадана →</p>
      </div>

      <div className="answers">
        <button type="button" className="answer answer--skip" onClick={() => answer(false)}>
          <span className="answer__icon">✕</span>
          Пас
        </button>
        <button type="button" className="answer answer--ok" onClick={() => answer(true)}>
          <span className="answer__icon">✓</span>
          Адгадана
        </button>
      </div>

      {paused && (
        <div className="overlay">
          <div className="overlay__box">
            <h2 className="overlay__title">Паўза</h2>
            <p className="overlay__text">Засталося {Math.ceil((pausedLeft ?? 0) / 1000)} с</p>
            <button type="button" className="btn btn--primary" onClick={() => dispatch({ type: 'resume' })}>
              Працягнуць
            </button>
            <button type="button" className="btn btn--ghost" onClick={() => dispatch({ type: 'endRound' })}>
              Спыніць раунд
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

/** Доўгія словы паказваем драбнейшым кеглем, каб змяшчаліся на вузкім экране. */
function wordSize(word) {
  const n = (word ?? '').length
  if (n <= 7) return 'clamp(2.6rem, 15vw, 4.2rem)'
  if (n <= 11) return 'clamp(2rem, 11vw, 3.4rem)'
  if (n <= 15) return 'clamp(1.6rem, 8.5vw, 2.8rem)'
  return 'clamp(1.3rem, 7vw, 2.2rem)'
}
