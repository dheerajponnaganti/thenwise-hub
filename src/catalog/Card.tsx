import type { ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { snippetParts, stampDate } from '../api/format'
import type { NoteBrief } from '../api/client'
import { kindLabel } from '../api/format'
import { Stamp, SupersededSlip } from './Stamp'

/** The superseding card is stored as `id` (same owner) or `owner/id`. */
export const supersederPath = (n: { owner: string; superseded_by: string | null }): string => {
  const [o, id] = n.superseded_by?.includes('/') ? n.superseded_by.split('/', 2) : [n.owner, n.superseded_by ?? '']
  return `${encodeURIComponent(o!)}/${encodeURIComponent(id!)}`
}

/** Stamps that say what a note is and where it stands. */
export function NoteStamps({ n }: { n: Pick<NoteBrief, 'owner' | 'kind' | 'status' | 'pinned' | 'superseded_by'> }) {
  return (
    <div className="stamps">
      <Stamp>{kindLabel(n.kind)}</Stamp>
      {n.status === 'retired' && <Stamp>RETIRED</Stamp>}
      {n.status === 'pending' && <Stamp dashed>PENDING</Stamp>}
      {n.status === 'superseded' && n.superseded_by && <SupersededSlip to={supersederPath(n)} label={n.superseded_by} />}
      {n.pinned && <Stamp>PINNED</Stamp>}
    </div>
  )
}

/** The frame of an index card: call number, date stamp, then the content. */
export function Card({ call, at, children, label }: { call: string; at: number; children: ReactNode; label?: string }) {
  return (
    <article className="card" aria-label={label}>
      <div className="head">
        <span className="call">{call}</span>
        <span className="datestamp">{stampDate(at)}</span>
      </div>
      {children}
    </article>
  )
}

/** A card in a list: title as a link, the snippet (hits in highlighter) or the first lines. */
export function CardSummary({ n, see }: { n: NoteBrief; see?: ReactNode }) {
  const snip = n.snippet ?? ''
  return (
    <Card call={`${n.owner}/${n.id}`} at={n.updated_at}>
      <h2><Link to={`/notes/${encodeURIComponent(n.owner)}/${encodeURIComponent(n.id)}`}>{n.title}</Link></h2>
      <NoteStamps n={n} />
      <p className="excerpt">{snippetParts(snip).map((p, i) => (p.hit ? <mark key={i}>{p.text}</mark> : <span key={i}>{p.text}</span>))}</p>
      <div className="see">{see ?? <>Project: <Link to={`/projects/${encodeURIComponent(n.project)}`}>{n.project || 'no project'}</Link></>}</div>
    </Card>
  )
}
