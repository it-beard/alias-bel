import { useEffect } from 'react'
import ScoreBoard from './ScoreBoard.jsx'
import { sounds, vibrate } from '../game/feedback.js'
import { points, rounds } from '../game/plural.js'

export default function FinishScreen({ state, dispatch }) {
  const sorted = [...state.teams].sort((a, b) => b.score - a.score)
  const best = sorted[0]
  const draw = sorted.length > 1 && sorted[1].score === best.score
  const solo = state.teams.length === 1
  const reached = best.score >= state.settings.targetScore

  useEffect(() => {
    if (state.settings.sound) sounds.win()
    if (state.settings.vibration) vibrate([60, 40, 60, 40, 120])
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return (
    <div className="screen screen--scroll" style={{ '--team': best.color }}>
      <div className="finish">
        <p className="finish__eyebrow">{draw ? 'Нічыя' : solo ? (reached ? 'Мэта дасягнута' : 'Вынік') : 'Перамога'}</p>
        <h2 className="finish__team">{draw ? 'Роўны рахунак' : best.name}</h2>
        <p className="finish__score">
          {points(best.score)} за {rounds(state.roundNo)}
        </p>
      </div>

      <section className="panel">
        <h2 className="panel__title">Выніковая табліца</h2>
        <ScoreBoard teams={sorted} activeIndex={-1} target={state.settings.targetScore} />
      </section>

      <div className="actions actions--sticky">
        <button type="button" className="btn btn--ghost" onClick={() => dispatch({ type: 'toSetup' })}>
          Налады
        </button>
        <button type="button" className="btn btn--primary" onClick={() => dispatch({ type: 'startGame' })}>
          Яшчэ раз
        </button>
      </div>
    </div>
  )
}
