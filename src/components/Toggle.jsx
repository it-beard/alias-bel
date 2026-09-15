export default function Toggle({ label, hint, value, onChange }) {
  return (
    <button type="button" className="toggle" onClick={() => onChange(!value)} role="switch" aria-checked={value}>
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
