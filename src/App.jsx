import { useEffect, useReducer, useState } from 'react'
import { initialState, reducer } from './game/gameState.js'
import { loadSaved, saveState } from './game/storage.js'
import { ScriptContext } from './i18n/script.js'
import { applyScript, applyTheme } from './theme.js'
import SetupScreen from './components/SetupScreen.jsx'
import ReadyScreen from './components/ReadyScreen.jsx'
import PlayScreen from './components/PlayScreen.jsx'
import RoundResultScreen from './components/RoundResultScreen.jsx'
import FinishScreen from './components/FinishScreen.jsx'
import RulesSheet from './components/RulesSheet.jsx'

export default function App() {
  const [state, dispatch] = useReducer(reducer, initialState, (base) => ({ ...base, ...loadSaved() }))
  const [rulesOpen, setRulesOpen] = useState(false)
  const { theme, script } = state.settings

  useEffect(() => {
    saveState(state)
  }, [state])

  useEffect(() => {
    applyTheme(theme)
    if (theme !== 'auto' || !window.matchMedia) return
    const query = window.matchMedia('(prefers-color-scheme: dark)')
    const onChange = () => applyTheme('auto')
    query.addEventListener?.('change', onChange)
    return () => query.removeEventListener?.('change', onChange)
  }, [theme])

  useEffect(() => {
    applyScript(script)
  }, [script])

  const openRules = () => setRulesOpen(true)
  const screens = {
    setup: <SetupScreen state={state} dispatch={dispatch} onRules={openRules} />,
    ready: <ReadyScreen state={state} dispatch={dispatch} onRules={openRules} />,
    play: <PlayScreen state={state} dispatch={dispatch} />,
    result: <RoundResultScreen state={state} dispatch={dispatch} />,
    finish: <FinishScreen state={state} dispatch={dispatch} />,
  }

  return (
    <ScriptContext.Provider value={script}>
      <main className="app" data-screen={state.screen}>
        {screens[state.screen] ?? screens.setup}
        {rulesOpen && <RulesSheet onClose={() => setRulesOpen(false)} />}
      </main>
    </ScriptContext.Provider>
  )
}
