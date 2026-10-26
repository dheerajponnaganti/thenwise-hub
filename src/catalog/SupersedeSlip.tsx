import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { api, type NoteBrief } from '../api/client'
import { supersedeProblem } from '../api/supersede'
import { Sheet } from './Confirm'

/** The slip that picks the newer card: a small search, then a tap. It sits at the bottom of a phone screen. */
export function SupersedeSlip({ open, onClose, old, onPick, busy, error }: { open: boolean; onClose: () => void; old: { owner: string; id: string; title: string }; onPick: (n: NoteBrief) => void; busy?: boolean; error?: string }) {
  const [text, setText] = useState('')
  const [asked, setAsked] = useState('')
  const [problem, setProblem] = useState('')
  const res = useQuery({ queryKey: ['search', 'pick', asked], queryFn: () => api.search(asked), enabled: !!asked })
  return (
    <Sheet open={open} onClose={onClose} title="Pick the newer card">
      <p className="muted">{old.title} will point at the card you pick.</p>
      <form className="row" role="search" onSubmit={(e) => { e.preventDefault(); setAsked(text.trim()); setProblem('') }}>
        <div><label htmlFor="pick-q">Search for the newer card</label><input id="pick-q" type="search" value={text} onChange={(e) => setText(e.target.value)} /></div>
        <button className="btn fit">Search</button>
      </form>
      {res.isPending && asked && <p className="muted" role="status">Searching…</p>}
      {res.data && res.data.length === 0 && <p className="empty">No card matches.</p>}
      <ul className="picks">
        {(res.data ?? []).map((n) => (
          <li key={`${n.owner}/${n.id}`}>
            <button type="button" className="pick" disabled={busy} onClick={() => { const p = supersedeProblem(old, n); setProblem(p ?? ''); if (!p) onPick(n) }}>
              <span className="call">{n.owner}/{n.id}</span>
              <span>{n.title}</span>
            </button>
          </li>
        ))}
      </ul>
      {(problem || error) && <p className="problem" role="alert">{problem || error}</p>}
      <div className="row actions"><button type="button" className="btn ghost fit" onClick={onClose}>Cancel</button></div>
    </Sheet>
  )
}
