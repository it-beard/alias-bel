/** Сегментаваны перамыкальнік з адзіным выбарам. */
export default function Segmented({ options, value, onChange, label, className = '' }) {
  return (
    <div className={`seg ${className}`.trim()} role="radiogroup" aria-label={label}>
      {options.map((option) => {
        const on = option.value === value
        return (
          <button
            key={String(option.value)}
            type="button"
            role="radio"
            aria-checked={on}
            className={`seg__btn${on ? ' is-on' : ''}`}
            onClick={() => onChange(option.value)}
          >
            {option.label}
          </button>
        )
      })}
    </div>
  )
}
