import type { NoteBrief } from '../api/client'
import { DrawerFace } from './Drawer'

export const projectCounts = (notes: NoteBrief[]): { project: string; count: number }[] => {
  const m = new Map<string, number>()
  for (const n of notes) m.set(n.project, (m.get(n.project) ?? 0) + 1)
  return [...m].map(([project, count]) => ({ project, count })).sort((a, b) => a.project.localeCompare(b.project))
}

/** The catalog cabinet: one drawer per project. */
export function Cabinet({ notes }: { notes: NoteBrief[] }) {
  const drawers = projectCounts(notes)
  if (!drawers.length) return <p className="empty">The cabinet is empty. Cards appear when a teammate shares a note.</p>
  return (
    <ul className="cabinet" aria-label="Projects">
      {drawers.map((d) => (
        <li key={d.project}><DrawerFace {...d} /></li>
      ))}
    </ul>
  )
}
