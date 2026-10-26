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
