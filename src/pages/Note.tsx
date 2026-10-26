import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { api, ApiError, type Note, type Revision } from '../api/client'
import { lineDiff } from '../api/diff'
import { sourcesOf } from '../api/format'
import { can } from '../api/roles'
import { useMe } from '../auth'
import { BorrowerSlip, Card, FootnoteMark, Footnotes, History, NoteStamps, StampTray, SupersedeSlip, TagSlips } from '../catalog'
import { supersederPath } from '../catalog/Card'
import { Prose } from '../catalog/Prose'

type Draft = { title: string; text: string; rev: number }

/** The card: call number, date stamp, title, text, stamps, borrower's slip, footnotes. Editors also get the stamp tray. */
export function NotePage() {
  const { owner = '', id = '' } = useParams()
  const me = useMe()
  const qc = useQueryClient()
  const note = useQuery({ queryKey: ['note', owner, id], queryFn: () => api.note(owner, id) })
  const [copied, setCopied] = useState(false)
  const [draft, setDraft] = useState<Draft | null>(null)
  const [theirs, setTheirs] = useState<Note | null>(null)
  const [picking, setPicking] = useState(false)
  const [historyOpen, setHistoryOpen] = useState(false)
  const revisions = useQuery({ queryKey: ['revisions', owner, id], queryFn: () => api.revisions(owner, id), enabled: historyOpen })
  const refresh = () => qc.invalidateQueries()

  const act = useMutation({
    mutationFn: async (f: () => Promise<unknown>) => f(),
    onSuccess: () => { setPicking(false); return refresh() },
  })
  const save = useMutation({
    mutationFn: (d: Draft) => api.edit(owner, id, d.rev, { title: d.title, text: d.text }),
    onSuccess: () => { setDraft(null); setTheirs(null); return refresh() },
    onError: async (e) => {
      if (e instanceof ApiError && e.status === 409) setTheirs(await api.note(owner, id))
    },
  })

  if (note.isPending) return <p className="muted" role="status">Pulling the card…</p>
  if (note.isError) return <p className="problem" role="alert">{note.error.message.includes('no such note') ? 'No such card. It may have been unshared.' : note.error.message}</p>
  const n = note.data
  const curate = can(me.role, 'curate')
  const path = `/notes/${encodeURIComponent(n.owner)}/${encodeURIComponent(n.id)}`
  const sources = sourcesOf(n.source)
  const edit = (patch: Parameters<typeof api.edit>[3]) => act.mutate(() => api.edit(owner, id, n.rev, patch))
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(path)
      setCopied(true)
    } catch {
      setCopied(false)
    }
  }
  const restore = (r: Revision) => act.mutate(() => api.edit(owner, id, n.rev, { title: r.title, text: r.text, tags: r.tags }))

  return (
    <Card call={`${n.owner}/${n.id}`} at={n.updated_at} label={n.title}>
      <h1>{n.title}{sources.map((_, i) => <FootnoteMark key={i} n={i + 1} />)}</h1>
      <NoteStamps n={n} />
      <TagSlips tags={n.tags} onChange={curate ? (tags) => edit({ tags }) : undefined} busy={act.isPending} />
      {curate && (
        <StampTray
          state={{ kind: n.kind, status: n.status, pinned: n.pinned }}
          busy={act.isPending}
          on={{
            decide: () => edit({ kind: 'decision' }),
            abandon: () => edit({ kind: 'dead_end' }),
            retire: () => act.mutate(() => api.curate(owner, id, 'retire')),
            supersede: () => setPicking(true),
            pin: () => act.mutate(() => api.curate(owner, id, n.pinned ? 'unpin' : 'pin')),
            edit: () => setDraft({ title: n.title, text: n.text, rev: n.rev }),
          }}
        />
      )}
      {act.isError && <p className="problem" role="alert">{act.error.message}</p>}
      {n.status === 'pending' && can(me.role, 'admin') && (
        <p><button type="button" className="stamp blue" onClick={() => act.mutate(() => api.curate(owner, id, 'approve'))} disabled={act.isPending}>Approve</button></p>
      )}

      {draft ? (
        <form onSubmit={(e) => { e.preventDefault(); save.mutate(draft) }}>
          <label htmlFor="e-title">Title</label>
          <input id="e-title" type="text" value={draft.title} maxLength={500} onChange={(e) => setDraft({ ...draft, title: e.target.value })} />
          <label htmlFor="e-text">Text (Markdown)</label>
          <textarea id="e-text" value={draft.text} onChange={(e) => setDraft({ ...draft, text: e.target.value })} />
          {theirs && (
            <section className="problem" aria-label="Conflict">
              <h2>Someone edited this card</h2>
              <p>Here is theirs, at revision {theirs.rev}. Lines only in theirs are struck. Lines only in yours are marked.</p>
              <div className="diff" aria-label="Difference">
                {lineDiff(theirs.text, draft.text).map((l, i) => <span key={i} className={l.type === 'same' ? '' : l.type}>{l.type === 'add' ? '+ ' : l.type === 'del' ? '- ' : '  '}{l.text}</span>)}
              </div>
              <div className="row actions">
                <button type="button" className="btn red fit" disabled={save.isPending} onClick={() => save.mutate({ ...draft, rev: theirs.rev })}>Take mine over it</button>
                <button type="button" className="btn ghost fit" onClick={() => { setDraft(null); setTheirs(null); void refresh() }}>Keep theirs</button>
              </div>
            </section>
          )}
          {save.isError && !theirs && <p className="problem" role="alert">{save.error.message}</p>}
          {!theirs && (
            <div className="row actions">
              <button className="btn fit" disabled={save.isPending || !draft.title.trim()}>Save</button>
              <button type="button" className="btn ghost fit" onClick={() => { setDraft(null); setTheirs(null) }}>Cancel</button>
            </div>
          )}
        </form>
      ) : (
        <Prose text={n.text} />
      )}

      <BorrowerSlip owner={n.owner} at={n.created_at} rev={n.rev} />
      <Footnotes sources={sources} />
      <div className="see">
        Project: {n.project || 'none'}
        {n.status === 'superseded' && n.superseded_by && <> · Newer card: <Link to={`/notes/${supersederPath(n)}`}>{n.superseded_by}</Link></>}
      </div>
      <p><button type="button" className="btn ghost" onClick={copy}>Copy link</button> <span className="note-line" role="status">{copied ? `Copied ${path}` : ''}</span></p>

      <details className="hist" onToggle={(e) => setHistoryOpen((e.currentTarget as HTMLDetailsElement).open)}>
        <summary>Circulation history</summary>
        {revisions.isPending && historyOpen ? <p className="muted" role="status">Reading the history…</p> : revisions.data && <History revisions={revisions.data} canRestore={curate} busy={act.isPending} onRestore={restore} />}
      </details>

      <SupersedeSlip open={picking} onClose={() => setPicking(false)} old={n} busy={act.isPending} error={act.isError ? act.error.message : undefined}
        onPick={(p) => act.mutate(() => api.supersede(owner, id, `${p.owner}/${p.id}`))} />
    </Card>
  )
}
