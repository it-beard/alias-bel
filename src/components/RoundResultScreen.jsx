import { useState } from 'react'
import { isStolen, roundScore } from '../game/gameState.js'
import { useT } from '../i18n/script.js'
import { Motif } from './Ornament.jsx'
import TeamPickSheet from './TeamPickSheet.jsx'

export default function RoundResultScreen({ state, dispatch }) {
  const t = useT()
  const { results, settings } = state
  const team = state.teams[state.turnIndex]
  const delta = roundScore(results, settings.skipPenalty)
  const own = results.filter((r) => !isStolen(r))
  const guessed = own.filter((r) => r.guessed).length
  const skipped = own.length - guessed
  // індэкс агульнага апошняга слова, для якога выбіраюць каманду
  const [assigning, setAssigning] = useState(null)

  const assign = (by) => {
    dispatch({ type: 'assignResult', index: assigning, by })
    setAssigning(null)
  }

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
          {results.map((r, i) => {
            const thief = isStolen(r) ? state.teams[r.by] : null
            return (
              <li key={`${r.word}-${i}`}>
                {r.shared ? (
                  <button
                    type="button"
                    className={`wordlist__item${thief ? ' is-stolen' : r.guessed ? ' is-ok' : ' is-skip'}`}
                    style={thief ? { '--team': thief.color } : undefined}
                    aria-haspopup="dialog"
                    onClick={() => setAssigning(i)}
                  >
                    <span className="wordlist__text">
                      <span className="wordlist__word">{t(r.word)}</span>
                      <span className="wordlist__note">
                        {t('агульнае апошняе слова')}
                        {thief && ` · +1 ${t(thief.name)}`}
                      </span>
                    </span>
                    {thief ? (
                      <Motif name={thief.motif} size={18} className="wordlist__mark" />
                    ) : (
                      <span className="wordlist__mark" aria-hidden="true">
                        {r.guessed ? '✓' : '✕'}
                      </span>
                    )}
                  </button>
                ) : (
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
                )}
              </li>
            )
          })}
        </ul>
      )}

      <div className="actions actions--sticky">
        <button type="button" className="btn btn--primary" onClick={() => dispatch({ type: 'commitRound' })}>
          {t('Далей')}
        </button>
      </div>

      {assigning !== null && (
        <TeamPickSheet
          teams={state.teams}
          activeIndex={state.turnIndex}
          word={results[assigning]?.word}
          onPick={assign}
          onNobody={() => assign(null)}
          onClose={() => setAssigning(null)}
        />
      )}
    </div>
  )
}
