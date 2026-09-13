import ScoreBoard from './ScoreBoard.jsx'
import { unlockAudio } from '../game/feedback.js'

export default function ReadyScreen({ state, dispatch, onRules }) {
  const team = state.teams[state.turnIndex]

  const begin = () => {
    if (state.settings.sound) unlockAudio()
    dispatch({ type: 'startTurn' })
  }

  return (
    <div className="screen screen--scroll" style={{ '--team': team.color }}>
      <header className="topbar">
        <button type="button" className="topbar__btn" onClick={() => dispatch({ type: 'toSetup' })}>
          Налады
        </button>
        <span className="topbar__title">Раунд {state.roundNo}</span>
        <button type="button" className="topbar__btn" onClick={onRules}>
          Правілы
        </button>
      </header>

      <div className="ready">
        <p className="ready__eyebrow">Тлумачыць</p>
        <h2 className="ready__team">{team.name}</h2>
        <p className="ready__hint">
          Перадайце тэлефон таму, хто тлумачыць. Астатнія ў камандзе адгадваюць слова —
          называць аднакаранёвыя словы нельга.
        </p>
        <button type="button" className="bigbtn" onClick={begin}>
          Пачаць раунд
          <span className="bigbtn__sub">{state.settings.roundSeconds} секунд</span>
        </button>
      </div>

      <section className="panel">
        <h2 className="panel__title">Рахунак — да {state.settings.targetScore}</h2>
        <ScoreBoard teams={state.teams} activeIndex={state.turnIndex} target={state.settings.targetScore} />
      </section>

      <div className="actions">
        <button type="button" className="btn btn--ghost" onClick={() => dispatch({ type: 'finishNow' })}>
          Скончыць гульню
        </button>
      </div>
    </div>
  )
}
