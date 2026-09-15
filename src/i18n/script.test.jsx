import { describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'
import { ScriptContext, useScript, useT } from './script.js'

function Probe() {
  const t = useT()
  const script = useScript()
  return (
    <p>
      {script}: {t('Пачаць гульню')}
    </p>
  )
}

describe('ScriptContext / useT', () => {
  it('па змаўчанні кірыліца без зменаў', () => {
    render(<Probe />)
    expect(screen.getByText('cyr: Пачаць гульню')).toBeInTheDocument()
  })

  it('у рэжыме лацінкі транслітаруе', () => {
    render(
      <ScriptContext.Provider value="lat">
        <Probe />
      </ScriptContext.Provider>,
    )
    expect(screen.getByText('lat: Pačać hulniu')).toBeInTheDocument()
  })
})
