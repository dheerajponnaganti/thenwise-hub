import type { ReactNode } from 'react'
import { Link } from 'react-router-dom'

type Tone = 'ink' | 'red' | 'blue' | 'muted'
const tone: Record<string, Tone> = { DECIDED: 'blue', ABANDONED: 'red', RETIRED: 'muted', PENDING: 'red', PINNED: 'blue', MASKED: 'ink', RULE: 'ink', FINDING: 'ink', NOTE: 'muted' }

/** A rubber stamp. Words in capitals; the tone follows the word unless given. */
export function Stamp({ children, tone: t, dashed }: { children: string; tone?: Tone; dashed?: boolean }) {
  const c = t ?? tone[children] ?? 'ink'
  return <span className={`stamp ${c === 'ink' ? '' : c} ${dashed ? 'dashed' : ''}`}>{children}</span>
}

export const AsOf = ({ date }: { date: string }) => <span className="stamp double">AS OF {date}</span>

/** SUPERSEDED BY → : a slip clipped to the old card, pointing at the newer one. */
export function SupersededSlip({ to, label }: { to: string; label?: ReactNode }) {
  return (
    <Link className="slip flip" to={`/notes/${to}`}>
      SUPERSEDED BY → {label ?? to}
    </Link>
  )
}
