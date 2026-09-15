import { createContext, useContext, useMemo } from 'react'
import { identity, toLatin } from './latin.js'

/** Бягучы алфавіт інтэрфейсу: 'cyr' або 'lat'. */
export const ScriptContext = createContext('cyr')

export function useScript() {
  return useContext(ScriptContext)
}

/** Функцыя для тэкстаў інтэрфейсу: у рэжыме лацінкі транслітаруе, інакш вяртае як ёсць. */
export function useT() {
  const script = useScript()
  return useMemo(() => (script === 'lat' ? toLatin : identity), [script])
}
