import * as Tabs from '@radix-ui/react-tabs'
import { useQuery } from '@tanstack/react-query'
import { useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { api } from '../api/client'
import { kindLabel } from '../api/format'
import { CardSummary } from '../catalog'
import { SearchSlip } from './Home'

const KINDS = ['decision', 'dead_end', 'rule', 'finding', 'note']
const DAY = 864e5

export function Search() {
  const [params] = useSearchParams()
  const text = params.get('q') ?? ''
  const [kind, setKind] = useState('all')
  const [project, setProject] = useState('')
  const [owner, setOwner] = useState('')
  const [days, setDays] = useState(0)
  const [old, setOld] = useState(false)
  const res = useQuery({ queryKey: ['search', text], queryFn: () => api.search(text), enabled: !!text.trim() })

  const all = res.data ?? []
  const shown = all.filter((n) =>
    (kind === 'all' || n.kind === kind) && (!project || n.project === project) && (!owner || n.owner === owner) &&
    (!days || n.updated_at > Date.now() - days * DAY) && (old || (n.status !== 'retired' && n.status !== 'superseded')))
  const uniq = (f: (n: (typeof all)[number]) => string) => [...new Set(all.map(f))].sort()

  return (
    <>
      <h1>Search</h1>
      <SearchSlip key={text} initial={text} />
      {!text.trim() ? <p className="empty">Type a word to search every card.</p> : res.isPending ? <p className="muted" role="status">Searching…</p> : res.isError ? <p className="problem" role="alert">{res.error.message}</p> : (
        <>
          <Tabs.Root value={kind} onValueChange={setKind}>
            <Tabs.List className="tabs" aria-label="Kind">
              {['all', ...KINDS].map((k) => <Tabs.Trigger key={k} value={k} className="tab">{k === 'all' ? 'All' : kindLabel(k)}</Tabs.Trigger>)}
            </Tabs.List>
          </Tabs.Root>
          <div className="row">
            <div><label htmlFor="f-project">Project</label>
              <select id="f-project" value={project} onChange={(e) => setProject(e.target.value)}><option value="">Any</option>{uniq((n) => n.project).map((p) => <option key={p} value={p}>{p || 'No project'}</option>)}</select></div>
            <div><label htmlFor="f-owner">Owner</label>
              <select id="f-owner" value={owner} onChange={(e) => setOwner(e.target.value)}><option value="">Anyone</option>{uniq((n) => n.owner).map((o) => <option key={o}>{o}</option>)}</select></div>
            <div><label htmlFor="f-date">Date</label>
              <select id="f-date" value={days} onChange={(e) => setDays(Number(e.target.value))}><option value={0}>Any time</option><option value={7}>Last 7 days</option><option value={30}>Last 30 days</option><option value={90}>Last 90 days</option></select></div>
          </div>
          <p><label className="check"><input type="checkbox" checked={old} onChange={(e) => setOld(e.target.checked)} /> Include retired and superseded cards</label></p>
          <p className="note-line" role="status">{shown.length} {shown.length === 1 ? 'card' : 'cards'}</p>
          {shown.length === 0 && <p className="empty">No card matches. Try fewer words or clear a filter.</p>}
          {shown.map((n) => <CardSummary key={`${n.owner}/${n.id}`} n={n} />)}
        </>
      )}
    </>
  )
}
