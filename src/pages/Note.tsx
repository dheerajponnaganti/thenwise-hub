import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { api } from '../api/client'
import { can } from '../api/roles'
import { useMe } from '../auth'
import { sourcesOf } from '../api/format'
import { BorrowerSlip, Card, FootnoteMark, Footnotes, NoteStamps } from '../catalog'
import { Prose } from '../catalog/Prose'
import { supersederPath } from '../catalog/Card'

/** The card: call number, date stamp, title, text, stamps, borrower's slip, footnotes. */
export function NotePage() {
  const { owner = '', id = '' } = useParams()
  const me = useMe()
  const qc = useQueryClient()
  const note = useQuery({ queryKey: ['note', owner, id], queryFn: () => api.note(owner, id) })
  const [copied, setCopied] = useState(false)
  const approve = useMutation({ mutationFn: () => api.curate(owner, id, 'approve'), onSuccess: () => qc.invalidateQueries() })
  if (note.isPending) return <p className="muted" role="status">Pulling the card…</p>
  if (note.isError) return <p className="problem" role="alert">{note.error.message.includes('no such note') ? 'No such card. It may have been unshared.' : note.error.message}</p>
  const n = note.data
  const path = `/notes/${encodeURIComponent(n.owner)}/${encodeURIComponent(n.id)}`
  const sources = sourcesOf(n.source)
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(path)
      setCopied(true)
    } catch {
      setCopied(false)
    }
  }
  return (
    <Card call={`${n.owner}/${n.id}`} at={n.updated_at} label={n.title}>
      <h1>{n.title}{sources.map((_, i) => <FootnoteMark key={i} n={i + 1} />)}</h1>
      <NoteStamps n={n} />
      {n.status === 'pending' && can(me.role, 'admin') && (
        <p>
          <button type="button" className="stamp blue" onClick={() => approve.mutate()} disabled={approve.isPending}>Approve</button>
          {approve.isError && <span className="problem" role="alert">{approve.error.message}</span>}
        </p>
      )}
      <Prose text={n.text} />
      <BorrowerSlip owner={n.owner} at={n.created_at} rev={n.rev} />
      <Footnotes sources={sources} />
      <div className="see">
        Project: {n.project || 'none'}{n.tags.length > 0 && <> · Tags: {n.tags.join(', ')}</>}
        {n.status === 'superseded' && n.superseded_by && <> · Newer card: <Link to={`/notes/${supersederPath(n)}`}>{n.superseded_by}</Link></>}
      </div>
      <p><button type="button" className="btn ghost" onClick={copy}>Copy link</button> <span className="note-line" role="status">{copied ? `Copied ${path}` : ''}</span></p>
    </Card>
  )
}
