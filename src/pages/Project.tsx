import * as Tabs from '@radix-ui/react-tabs'
import { useQuery } from '@tanstack/react-query'
import { useParams } from 'react-router-dom'
import { allNotes } from '../api/client'
import { stampDate } from '../api/format'
import { Link } from 'react-router-dom'
import { CardSummary, Drawer, Stamp } from '../catalog'
import { kindLabel } from '../api/format'

/** A drawer: the project's cards filed by date, with a tab per month. */
export function Project() {
  const { project = '' } = useParams()
  const notes = useQuery({ queryKey: ['notes', 'project', project], queryFn: () => allNotes({ project }) })
  const timeline = (notes.data ?? []).filter((n) => (n.kind === 'decision' || n.kind === 'dead_end') && n.status !== 'pending')
  return (
    <>
      <h1>{project || 'No project'}</h1>
      {notes.isPending ? <p className="muted" role="status">Opening the drawer…</p> : notes.isError ? <p className="problem" role="alert">{notes.error.message}</p> : notes.data.length === 0 ? <p className="empty">This drawer is empty.</p> : (
        <Tabs.Root defaultValue="cards">
          <Tabs.List className="tabs" aria-label="Drawer view">
            <Tabs.Trigger value="cards" className="tab">Cards</Tabs.Trigger>
            <Tabs.Trigger value="timeline" className="tab">Timeline</Tabs.Trigger>
          </Tabs.List>
          <Tabs.Content value="cards">
            <Drawer items={notes.data} render={(n) => <CardSummary key={`${n.owner}/${n.id}`} n={n} see={<span className="mono">{n.kind}</span>} />} />
          </Tabs.Content>
          <Tabs.Content value="timeline">
            {timeline.length === 0 ? <p className="empty">No decisions or dead ends in this drawer yet.</p> : (
              <Drawer items={timeline} render={(n) => (
                <div className="timeline-line" key={`${n.owner}/${n.id}`}>
                  <span className="datestamp">{stampDate(n.updated_at)}</span>
                  <Stamp>{kindLabel(n.kind)}</Stamp>
                  <Link to={`/notes/${encodeURIComponent(n.owner)}/${encodeURIComponent(n.id)}`}>{n.title}</Link>
                </div>
              )} />
            )}
          </Tabs.Content>
        </Tabs.Root>
      )}
    </>
  )
}
