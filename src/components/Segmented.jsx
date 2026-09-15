/** Сегментаваны перамыкальнік з адзіным выбарам. */
export default function Segmented({ options, value, onChange, label, className = '' }) {
  return (
    <div className={`seg ${className}`.trim()} role="radiogroup" aria-label={label}>
      {options.map((option, index) => {
        const on = option.value === value
        return (
          <button
            key={String(option.value)}
            type="button"
            role="radio"
            aria-checked={on}
            tabIndex={on || (!options.some((item) => item.value === value) && index === 0) ? 0 : -1}
            className={`seg__btn${on ? ' is-on' : ''}`}
            onClick={() => onChange(option.value)}
            onKeyDown={(event) => {
              const direction = { ArrowRight: 1, ArrowDown: 1, ArrowLeft: -1, ArrowUp: -1 }[event.key]
              if (!direction && event.key !== 'Home' && event.key !== 'End') return
              event.preventDefault()
              const next = event.key === 'Home' ? 0 : event.key === 'End' ? options.length - 1
                : (index + direction + options.length) % options.length
              onChange(options[next].value)
              event.currentTarget.parentElement.querySelectorAll('[role="radio"]')[next]?.focus()
            }}
          >
            {option.label}
          </button>
        )
      })}
    </div>
  )
}
