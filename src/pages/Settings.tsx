import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'
import { api } from '../api/client'

/** The librarian's desk: team name, the review queue, the export. */
export function Settings() {
  const qc = useQueryClient()
  const s = useQuery({ queryKey: ['settings'], queryFn: api.settings })
  const [name, setName] = useState<string | null>(null)
  const save = useMutation({
    mutationFn: (p: { name?: string; review_queue?: boolean }) => api.patchSettings(p),
    onSuccess: (r) => { qc.setQueryData(['settings'], r); setName(null); void qc.invalidateQueries({ queryKey: ['health'] }) },
  })
  if (s.isPending) return <p className="muted" role="status">Opening the desk…</p>
  if (s.isError) return <p className="problem" role="alert">{s.error.message}</p>
  return (
    <>
      <h1>Settings</h1>
      <form className="slipform" onSubmit={(e) => { e.preventDefault(); if (name !== null && name.trim()) save.mutate({ name: name.trim() }) }}>
        <label htmlFor="team-name">Team name</label>
        <div className="row">
          <input id="team-name" type="text" value={name ?? s.data.name} maxLength={80} onChange={(e) => setName(e.target.value)} />
          <button className="btn fit" disabled={name === null || !name.trim() || save.isPending}>Save name</button>
        </div>
      </form>
      <div className="slipform">
        <label className="check"><input type="checkbox" checked={s.data.review_queue} disabled={save.isPending} onChange={(e) => save.mutate({ review_queue: e.target.checked })} /> Review queue</label>
        <p className="muted note-line">When it is on, a new share waits for an admin. Only its owner and admins can see it until it is approved.</p>
      </div>
      <Retention />
      <div className="slipform">
        <p className="label">Export</p>
        <p className="muted note-line">A zip of Markdown files, one per card, with an Index.md per project. It opens in Obsidian.</p>
        <a className="btn" href="/v1/export.zip" download>Export as a zip</a>
      </div>
      {save.isError && <p className="problem" role="alert">{save.error.message}</p>}
      {save.isSuccess && <p className="note-line" role="status">Saved.</p>}
    </>
  )
}

/** How long shared chats stay on the server. Empty keeps them until someone unshares. */
function Retention() {
  const qc = useQueryClient()
  // A server without chats has no such setting, so the slip is not shown.
  const cs = useQuery({ queryKey: ['chat-settings'], queryFn: api.chatSettings, retry: false })
  const [days, setDays] = useState<string | null>(null)
  const save = useMutation({
    mutationFn: (d: number | null) => api.patchChatSettings({ chat_retention_days: d }),
    onSuccess: (r) => { qc.setQueryData(['chat-settings'], r); setDays(null) },
  })
  if (!cs.data) return null
  const shown = days ?? (cs.data.chat_retention_days === null ? '' : String(cs.data.chat_retention_days))
  const n = shown === '' ? null : Number(shown)
  const ok = n === null || (Number.isInteger(n) && n >= 1 && n <= 3650)
  return (
    <form className="slipform" onSubmit={(e) => { e.preventDefault(); if (days !== null && ok) save.mutate(n) }}>
      <label htmlFor="retention">Chat retention (days)</label>
      <div className="row">
        <input id="retention" type="number" min={1} max={3650} value={shown} placeholder="Keep" onChange={(e) => setDays(e.target.value)} />
        <button className="btn fit" disabled={days === null || !ok || save.isPending}>Save retention</button>
      </div>
      <p className="muted note-line">The server deletes shared chats older than this and tells members to drop them. Leave it empty to keep chats until someone unshares them.</p>
      {save.isError && <p className="problem" role="alert">{save.error.message}</p>}
      {save.isSuccess && <p className="note-line" role="status">Saved.</p>}
    </form>
  )
}
