import { useQuery } from '@tanstack/react-query'
import { useState } from 'react'
import { Link } from 'react-router-dom'
import { api } from '../api/client'
import { stampDate } from '../api/format'

const ACTIONS = ['invite.create', 'member.join', 'member.update', 'member.remove', 'member.rotate', 'member.make_owner', 'settings.update', 'note.edit', 'note.retire', 'note.supersede', 'note.pin', 'note.unpin', 'note.approve', 'denied']
const time = (ms: number) => new Date(ms).toISOString().slice(11, 16)

/** The ledger: the audit log as dated lines, and the most-read cards. */
export function Activity() {
  const [actor, setActor] = useState('')
  const [action, setAction] = useState('')
  const members = useQuery({ queryKey: ['members'], queryFn: api.members })
  const log = useQuery({ queryKey: ['audit', actor, action], queryFn: () => api.audit({ actor, action }) })
  const stats = useQuery({ queryKey: ['stats'], queryFn: api.stats })
  const names = new Map((members.data ?? []).map((m) => [m.id, m.name]))
  const target = (t: string) => (t.startsWith('member:') ? `member:${names.get(t.slice(7)) ?? t.slice(7, 13)}` : t)

  return (
    <>
      <h1>Activity</h1>
      <div className="row">
        <div><label htmlFor="a-actor">Who</label>
          <select id="a-actor" value={actor} onChange={(e) => setActor(e.target.value)}><option value="">Anyone</option>{(members.data ?? []).map((m) => <option key={m.id} value={m.id}>{m.name}</option>)}</select></div>
        <div><label htmlFor="a-action">Action</label>
          <select id="a-action" value={action} onChange={(e) => setAction(e.target.value)}><option value="">Any</option>{ACTIONS.map((a) => <option key={a}>{a}</option>)}</select></div>
      </div>
      {log.isPending ? <p className="muted" role="status">Reading the ledger…</p> : log.isError ? <p className="problem" role="alert">{log.error.message}</p> : log.data.length === 0 ? <p className="empty">Nothing is written here yet.</p> : (
        <ol className="audit" aria-label="Audit log">
          {log.data.map((e) => (
            <li key={e.id}>
              <span className="at">{stampDate(e.at)} {time(e.at)}</span> {e.actor_name ?? 'system'} <span className={e.action === 'denied' ? 'action denied' : 'action'}>{e.action}</span> {target(e.target)}
            </li>
          ))}
        </ol>
      )}
      <h2 className="spaced">Most read</h2>
      <p className="muted note-line">Counts from the last {stats.data?.days ?? 90} days. They stay on this server.</p>
      {stats.data && (stats.data.top.length === 0 ? <p className="empty">No card has been read from a browser yet.</p> : (
        <ol>{stats.data.top.slice(0, 10).map((t) => <li key={`${t.owner}/${t.id}`}><Link to={`/notes/${encodeURIComponent(t.owner)}/${encodeURIComponent(t.id)}`}>{t.title}</Link> <span className="mono">{t.reads}</span></li>)}</ol>
      ))}
    </>
  )
}
