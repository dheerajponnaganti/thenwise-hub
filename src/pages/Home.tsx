import { useQuery } from '@tanstack/react-query'
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { allNotes } from '../api/client'
import { Cabinet, CardSummary } from '../catalog'

export function SearchSlip({ initial = '' }: { initial?: string }) {
  const nav = useNavigate()
  const [text, setText] = useState(initial)
  return (
    <form className="slipform" role="search" onSubmit={(e) => { e.preventDefault(); nav(`/search?q=${encodeURIComponent(text)}`) }}>
      <label htmlFor="q">Search the catalog</label>
      <div className="row">
        <input id="q" type="search" value={text} onChange={(e) => setText(e.target.value)} />
        <button className="btn fit">Search</button>
      </div>
    </form>
  )
}

/** The cabinet: a drawer per project, the start-here tray, the newest cards. */
export function Home() {
  const notes = useQuery({ queryKey: ['notes', 'all'], queryFn: () => allNotes() })
  return (
    <>
      <SearchSlip />
      <section className="tray" aria-labelledby="start">
        <h2 id="start">Start here</h2>
        <p className="empty">Pinned cards for new teammates will be filed here.</p>
      </section>
      <h2>Drawers</h2>
      {notes.isPending ? <p className="muted" role="status">Pulling the drawers…</p> : notes.isError ? <p className="problem" role="alert">{notes.error.message}</p> : (
        <>
          <Cabinet notes={notes.data} />
          <h2>Newest cards</h2>
          {notes.data.slice(0, 8).map((n) => <CardSummary key={`${n.owner}/${n.id}`} n={n} />)}
        </>
      )}
    </>
  )
}
