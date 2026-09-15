import { roundScore } from '../game/gameState.js'
import { useT } from '../i18n/script.js'
import { Motif } from './Ornament.jsx'

export default function RoundResultScreen({ state, dispatch }) {
  const t = useT()
  const { results, settings } = state
  const team = state.teams[state.turnIndex]
  const delta = roundScore(results, settings.skipPenalty)
  const guessed = results.filter((r) => r.guessed).length
  const skipped = results.length - guessed

  return (
    <div className="screen screen--scroll" style={{ '--team': team.color }}>
      <header className="topbar topbar--center">
        <span className="topbar__title topbar__title--team">
          <Motif name={team.motif} size={18} />
          {t(team.name)}
        </span>
      </header>

      <div className="result">
        <p className="result__delta">{delta > 0 ? `+${delta}` : delta}</p>
        <p className="result__summary">
          {t('адгадана')} {guessed} · {t('пас')} {skipped}
        </p>
        {results.length > 0 && <p className="hint">{t('Націсніце на слова, каб выправіць адзнаку.')}</p>}
      </div>

      {results.length === 0 ? (
        <p className="hint hint--center">{t('Пакуль няма адказаў.')}</p>
      ) : (
        <ul className="wordlist">
          {results.map((r, i) => (
            <li key={`${r.word}-${i}`}>
              <button
                type="button"
                className={`wordlist__item${r.guessed ? ' is-ok' : ' is-skip'}`}
                aria-pressed={r.guessed}
                onClick={() => dispatch({ type: 'toggleResult', index: i })}
              >
                <span className="wordlist__word">{t(r.word)}</span>
                <span className="wordlist__mark" aria-hidden="true">
                  {r.guessed ? '✓' : '✕'}
                </span>
              </button>
            </li>
          ))}
        </ul>
      )}

      <div className="actions actions--sticky">
        <button type="button" className="btn btn--primary" onClick={() => dispatch({ type: 'commitRound' })}>
          {t('Далей')}
        </button>
      </div>
    </div>
  )
}
