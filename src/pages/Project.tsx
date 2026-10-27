import * as Tabs from '@radix-ui/react-tabs'
import { useQuery } from '@tanstack/react-query'
import { useParams } from 'react-router-dom'
import { useMe } from '../auth'
import { allChats, allNotes } from '../api/client'
import { stampDate } from '../api/format'
import { Link } from 'react-router-dom'
import { CardSummary, Drawer, Stamp, Volume } from '../catalog'
import { kindLabel } from '../api/format'

/** A drawer: the project's cards filed by date, with a tab per month. */
export function Project() {
  const { project = '' } = useParams()
  const me = useMe()
  const notes = useQuery({ queryKey: ['notes', 'project', project], queryFn: () => allNotes({ project }) })
  // An older server has no chats route. The tab simply stays away then.
  const chats = useQuery({ queryKey: ['chats', 'project', project], queryFn: () => allChats(project), retry: false })
  const volumes = chats.data ?? []
  const timeline = (notes.data ?? []).filter((n) => (n.kind === 'decision' || n.kind === 'dead_end') && n.status !== 'pending')
  return (
    <>
      <h1>{project || 'No project'}</h1>
      {notes.isPending ? <p className="muted" role="status">Opening the drawer…</p> : notes.isError ? <p className="problem" role="alert">{notes.error.message}</p> : notes.data.length === 0 && volumes.length === 0 ? <p className="empty">This drawer is empty.</p> : (
        <Tabs.Root defaultValue="cards">
          <Tabs.List className="tabs" aria-label="Drawer view">
            <Tabs.Trigger value="cards" className="tab">Cards</Tabs.Trigger>
            <Tabs.Trigger value="timeline" className="tab">Timeline</Tabs.Trigger>
            {volumes.length > 0 && <Tabs.Trigger value="chats" className="tab">Chats</Tabs.Trigger>}
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
          <Tabs.Content value="chats">
            <Drawer items={volumes.map((c) => ({ ...c, updated_at: c.started_at }))} render={(c) => <Volume key={`${c.owner}/${c.session}`} c={c} yours={c.owner === me.name} />} />
          </Tabs.Content>
        </Tabs.Root>
      )}
    </>
  )
}
