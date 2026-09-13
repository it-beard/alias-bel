import { useEffect, useReducer, useState } from 'react'
import { initialState, reducer } from './game/gameState.js'
import { STORAGE_KEY } from './game/constants.js'
import SetupScreen from './components/SetupScreen.jsx'
import ReadyScreen from './components/ReadyScreen.jsx'
import PlayScreen from './components/PlayScreen.jsx'
import RoundResultScreen from './components/RoundResultScreen.jsx'
import FinishScreen from './components/FinishScreen.jsx'
import RulesSheet from './components/RulesSheet.jsx'

function loadSaved() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return null
    const saved = JSON.parse(raw)
    return {
      ...saved,
      settings: { ...initialState.settings, ...saved.settings },
      // незавершаны раунд аднаўляць несумленна — вяртаемся да экрана гатоўнасці
      screen: saved.screen === 'play' || saved.screen === 'result' ? 'ready' : saved.screen,
      current: null,
      results: [],
      endsAt: null,
      pausedLeft: null,
      lastWord: false,
    }
  } catch {
    return null
  }
}

export default function App() {
  const [state, dispatch] = useReducer(reducer, initialState, (base) => ({ ...base, ...loadSaved() }))
  const [rulesOpen, setRulesOpen] = useState(false)

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
    } catch {
      /* прыватны рэжым браўзера — проста не захоўваем */
    }
  }, [state])

  const screens = {
    setup: <SetupScreen state={state} dispatch={dispatch} onRules={() => setRulesOpen(true)} />,
    ready: <ReadyScreen state={state} dispatch={dispatch} onRules={() => setRulesOpen(true)} />,
    play: <PlayScreen state={state} dispatch={dispatch} />,
    result: <RoundResultScreen state={state} dispatch={dispatch} />,
    finish: <FinishScreen state={state} dispatch={dispatch} />,
  }

  return (
    <div className="app" data-screen={state.screen}>
      {screens[state.screen] ?? screens.setup}
      {rulesOpen && <RulesSheet onClose={() => setRulesOpen(false)} />}
    </div>
  )
}
