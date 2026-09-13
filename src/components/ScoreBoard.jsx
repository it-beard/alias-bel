export default function ScoreBoard({ teams, activeIndex, target }) {
  const leader = Math.max(...teams.map((t) => t.score), 0)

  return (
    <ul className="scoreboard">
      {teams.map((team, i) => (
        <li
          key={team.id}
          className={`scoreboard__row${i === activeIndex ? ' is-active' : ''}`}
          style={{ '--team': team.color }}
        >
          <span className="scoreboard__dot" />
          <span className="scoreboard__name">{team.name}</span>
          <span className="scoreboard__bar">
            <span
              className="scoreboard__fill"
              style={{ width: `${Math.min(100, (Math.max(0, team.score) / Math.max(target, leader, 1)) * 100)}%` }}
            />
          </span>
          <span className="scoreboard__score">{team.score}</span>
        </li>
      ))}
    </ul>
  )
}
