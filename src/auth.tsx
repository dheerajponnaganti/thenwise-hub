import { createContext, useContext } from 'react'
import type { Me } from './api/client'

export const MeContext = createContext<Me | null>(null)
export const useMe = (): Me => {
  const me = useContext(MeContext)
  if (!me) throw new Error('useMe outside the signed-in area')
  return me
}

/** Why the reader was sent back to the card desk, shown once. */
export const authNote = { text: '' }
