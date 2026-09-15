import { useT } from '../i18n/script.js'
import { Motif } from './Ornament.jsx'

export default function ScoreBoard({ teams, activeIndex, target }) {
  const t = useT()
  const leader = Math.max(...teams.map((team) => team.score), 0)
  const scale = Math.max(target, leader, 1)

  return (
    <ul className="scoreboard">
      {teams.map((team, i) => (
        <li
          key={team.id}
          className={`scoreboard__row${i === activeIndex ? ' is-active' : ''}`}
          style={{ '--team': team.color }}
          aria-current={i === activeIndex ? 'true' : undefined}
        >
          <Motif name={team.motif} size={20} className="scoreboard__motif" />
          <span className="scoreboard__name">{t(team.name)}</span>
          <span className="scoreboard__bar" aria-hidden="true">
            <span className="scoreboard__fill" style={{ width: `${Math.min(100, (Math.max(0, team.score) / scale) * 100)}%` }} />
          </span>
          <span className="scoreboard__score">{team.score}</span>
        </li>
      ))}
    </ul>
  )
}
