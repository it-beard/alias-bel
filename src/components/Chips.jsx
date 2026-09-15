/** Радок кнопак-чыпаў з адзіным выбарам. */
export default function Chips({ options, value, onChange, label, size = 'md' }) {
  return (
    <div className={`chips chips--${size}`} role="radiogroup" aria-label={label}>
      {options.map((option) => {
        const on = option.value === value
        return (
          <button
            key={String(option.value)}
            type="button"
            role="radio"
            aria-checked={on}
            className={`chip${on ? ' is-on' : ''}`}
            onClick={() => onChange(option.value)}
          >
            {option.label}
          </button>
        )
      })}
    </div>
  )
}
