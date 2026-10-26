import { useQuery } from '@tanstack/react-query'
import { useParams } from 'react-router-dom'
import { allNotes } from '../api/client'
import { CardSummary, Drawer } from '../catalog'

/** A drawer: the project's cards filed by date, with a tab per month. */
export function Project() {
  const { project = '' } = useParams()
  const notes = useQuery({ queryKey: ['notes', 'project', project], queryFn: () => allNotes({ project }) })
  return (
    <>
      <h1>{project || 'No project'}</h1>
      {notes.isPending ? <p className="muted" role="status">Opening the drawer…</p> : notes.isError ? <p className="problem" role="alert">{notes.error.message}</p> : notes.data.length === 0 ? <p className="empty">This drawer is empty.</p> : (
        <Drawer items={notes.data} render={(n) => <CardSummary key={`${n.owner}/${n.id}`} n={n} see={<span className="mono">{n.kind}</span>} />} />
      )}
    </>
  )
}
