import { LEVELS, LEVEL_ORDER } from '../data/words.js'
import { MAX_TEAMS, MIN_TEAMS, ROUND_TIMES, TARGET_SCORES } from '../game/constants.js'
import { unlockAudio } from '../game/feedback.js'
import { words } from '../game/plural.js'

const teamCounts = Array.from({ length: MAX_TEAMS - MIN_TEAMS + 1 }, (_, i) => i + MIN_TEAMS)

export default function SetupScreen({ state, dispatch, onRules }) {
  const { settings, teams } = state
  const set = (key) => (value) => dispatch({ type: 'setSetting', key, value })

  const start = () => {
    if (settings.sound) unlockAudio()
    dispatch({ type: 'startGame' })
  }

  return (
    <div className="screen screen--scroll">
      <header className="brand">
        <h1 className="brand__title">Аліяс</h1>
        <p className="brand__subtitle">тлумач словы па-беларуску</p>
      </header>

      <section className="panel">
        <h2 className="panel__title">Колькі каманд</h2>
        <div className="chips">
          {teamCounts.map((n) => (
            <button
              key={n}
              type="button"
              className={`chip${teams.length === n ? ' is-on' : ''}`}
              onClick={() => dispatch({ type: 'setTeamCount', count: n })}
            >
              {n}
            </button>
          ))}
        </div>
        <ul className="teamlist">
          {teams.map((team, i) => (
            <li key={team.id} className="teamlist__item" style={{ '--team': team.color }}>
              <span className="teamlist__dot" />
              <input
                className="teamlist__input"
                value={team.name}
                maxLength={18}
                aria-label={`Назва каманды ${i + 1}`}
                onChange={(e) => dispatch({ type: 'renameTeam', id: team.id, name: e.target.value })}
              />
            </li>
          ))}
        </ul>
        {teams.length === 1 && (
          <p className="hint">Сола-рэжым: гуляеце адной камандай і спрабуеце дабіцца мэты за найменшую колькасць раундаў.</p>
        )}
      </section>

      <section className="panel">
        <h2 className="panel__title">Складанасць слоў</h2>
        <div className="levels">
          {LEVEL_ORDER.map((id) => {
            const level = LEVELS[id]
            return (
              <button
                key={id}
                type="button"
                className={`level${settings.level === id ? ' is-on' : ''}`}
                onClick={() => set('level')(id)}
              >
                <span className="level__label">{level.label}</span>
                <span className="level__hint">{level.hint}</span>
                <span className="level__count">{words(new Set(level.words).size)}</span>
              </button>
            )
          })}
        </div>
      </section>

      <section className="panel">
        <h2 className="panel__title">Раунд</h2>
        <div className="row">
          <span className="row__label">Час раунда</span>
          <div className="chips">
            {ROUND_TIMES.map((t) => (
              <button
                key={t}
                type="button"
                className={`chip${settings.roundSeconds === t ? ' is-on' : ''}`}
                onClick={() => set('roundSeconds')(t)}
              >
                {t} с
              </button>
            ))}
          </div>
        </div>
        <div className="row">
          <span className="row__label">Гуляем да</span>
          <div className="chips">
            {TARGET_SCORES.map((t) => (
              <button
                key={t}
                type="button"
                className={`chip${settings.targetScore === t ? ' is-on' : ''}`}
                onClick={() => set('targetScore')(t)}
              >
                {t}
              </button>
            ))}
          </div>
        </div>
      </section>

      <section className="panel">
        <h2 className="panel__title">Дадаткова</h2>
        <Toggle
          label="Штраф за пас"
          hint="Прапушчанае слова адымае адно ачко"
          value={settings.skipPenalty}
          onChange={set('skipPenalty')}
        />
        <Toggle
          label="Апошняе слова"
          hint="Пасля сігналу дазваляецца дагуляць слова на экране"
          value={settings.lastWordRule}
          onChange={set('lastWordRule')}
        />
        <Toggle label="Гук" value={settings.sound} onChange={set('sound')} />
        <Toggle label="Вібрацыя" value={settings.vibration} onChange={set('vibration')} />
      </section>

      <div className="actions actions--sticky">
        <button type="button" className="btn btn--ghost" onClick={onRules}>
          Правілы
        </button>
        <button type="button" className="btn btn--primary" onClick={start}>
          Пачаць гульню
        </button>
      </div>
    </div>
  )
}

function Toggle({ label, hint, value, onChange }) {
  return (
    <button type="button" className="toggle" onClick={() => onChange(!value)} aria-pressed={value}>
      <span className="toggle__text">
        <span className="toggle__label">{label}</span>
        {hint && <span className="toggle__hint">{hint}</span>}
      </span>
      <span className={`switch${value ? ' is-on' : ''}`} aria-hidden="true">
        <span className="switch__knob" />
      </span>
    </button>
  )
}
