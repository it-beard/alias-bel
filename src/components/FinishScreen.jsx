import { useEffect } from 'react'
import ScoreBoard from './ScoreBoard.jsx'
import { Band, Motif } from './Ornament.jsx'
import { sounds, vibrate } from '../game/feedback.js'
import { points, rounds } from '../game/plural.js'
import { useT } from '../i18n/script.js'

export default function FinishScreen({ state, dispatch }) {
  const t = useT()
  const sorted = [...state.teams].sort((a, b) => b.score - a.score)
  const best = sorted[0]
  const draw = sorted.length > 1 && sorted[1].score === best.score
  const solo = state.teams.length === 1
  const reached = best.score >= state.settings.targetScore
  const { sound, vibration } = state.settings

  useEffect(() => {
    if (sound) sounds.win()
    if (vibration) vibrate([60, 40, 60, 40, 120])
  }, [sound, vibration])

  const eyebrow = draw ? 'Нічыя' : solo ? (reached ? 'Мэта дасягнута' : 'Вынік') : 'Перамога'

  return (
    <div className="screen screen--scroll" style={{ '--team': best.color }}>
      <div className="finish">
        <Band pattern="dotted" height={12} lines className="finish__band" />
        {!draw && <Motif name={best.motif} size={80} className="finish__motif" />}
        <p className="finish__eyebrow">{t(eyebrow)}</p>
        <h2 className="finish__team">{draw ? t('Роўны рахунак') : t(best.name)}</h2>
        <p className="finish__score">
          {t(points(best.score))} {t('за')} {t(rounds(state.roundNo))}
        </p>
        <Band pattern="dotted" height={12} lines className="finish__band" />
      </div>

      <section className="panel">
        <h2 className="panel__title">{t('Выніковая табліца')}</h2>
        <ScoreBoard teams={sorted} activeIndex={-1} target={state.settings.targetScore} />
      </section>

      <div className="actions actions--sticky">
        <button type="button" className="btn btn--ghost" onClick={() => dispatch({ type: 'toSetup' })}>
          {t('Налады')}
        </button>
        <button type="button" className="btn btn--primary" onClick={() => dispatch({ type: 'startGame' })}>
          {t('Яшчэ раз')}
        </button>
      </div>
    </div>
  )
}
