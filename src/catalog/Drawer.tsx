import type { ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { monthKey, monthLabel } from '../api/format'

/** A drawer's face in the cabinet: the project's label card and a count. */
export function DrawerFace({ project, count }: { project: string; count: number }) {
  return (
    <Link className="drawer" to={`/projects/${encodeURIComponent(project)}`}>
      <span className="label">{project || 'No project'}</span>
      <span className="count">{count} {count === 1 ? 'card' : 'cards'}</span>
    </Link>
  )
}

export interface Dated { updated_at: number }

/** Month groups, newest first, in the order the cards come. */
export function byMonth<T extends Dated>(items: T[]): { key: string; label: string; items: T[] }[] {
  const out: { key: string; label: string; items: T[] }[] = []
  for (const it of items) {
    const key = monthKey(it.updated_at)
    const last = out.at(-1)
    if (last?.key === key) last.items.push(it)
    else out.push({ key, label: monthLabel(it.updated_at), items: [it] })
  }
  return out
}

/** A drawer: cards filed by date, with a tab per month that jumps to its group. */
export function Drawer<T extends Dated>({ items, render }: { items: T[]; render: (n: T) => ReactNode }) {
  const groups = byMonth(items)
  const jump = (key: string) => {
    const el = document.getElementById(`month-${key}`)
    el?.scrollIntoView({ block: 'start' })
    el?.focus()
  }
  return (
    <div>
      <div className="tabs" role="toolbar" aria-label="Months">
        {groups.map((g) => (
          <button key={g.key} type="button" className="tab" onClick={() => jump(g.key)}>{g.label}</button>
        ))}
      </div>
      {groups.map((g) => (
        <section key={g.key} aria-labelledby={`month-${g.key}`}>
          <h2 className="month" id={`month-${g.key}`} tabIndex={-1}>{g.label}</h2>
          {g.items.map(render)}
        </section>
      ))}
    </div>
  )
}
