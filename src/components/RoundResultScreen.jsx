import { roundScore } from '../game/gameState.js'

export default function RoundResultScreen({ state, dispatch }) {
  const { results, settings } = state
  const team = state.teams[state.turnIndex]
  const delta = roundScore(results, settings.skipPenalty)
  const guessed = results.filter((r) => r.guessed).length

  return (
    <div className="screen screen--scroll" style={{ '--team': team.color }}>
      <header className="topbar">
        <span className="topbar__title">{team.name}</span>
      </header>

      <div className="result">
        <p className="result__delta">{delta > 0 ? `+${delta}` : delta}</p>
        <p className="result__summary">
          адгадана {guessed} з {results.length}
        </p>
        {results.length > 0 && <p className="hint">Націсніце на слова, каб выправіць адзнаку.</p>}
      </div>

      {results.length === 0 ? (
        <p className="hint hint--center">Ніводнага слова не паказана.</p>
      ) : (
        <ul className="wordlist">
          {results.map((r, i) => (
            <li key={`${r.word}-${i}`}>
              <button
                type="button"
                className={`wordlist__item${r.guessed ? ' is-ok' : ' is-skip'}`}
                onClick={() => dispatch({ type: 'toggleResult', index: i })}
              >
                <span className="wordlist__word">{r.word}</span>
                <span className="wordlist__mark">{r.guessed ? '✓' : '✕'}</span>
              </button>
            </li>
          ))}
        </ul>
      )}

      <div className="actions actions--sticky">
        <button type="button" className="btn btn--primary" onClick={() => dispatch({ type: 'commitRound' })}>
          Далей
        </button>
      </div>
    </div>
  )
}
