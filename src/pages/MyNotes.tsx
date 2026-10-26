import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'
import { allNotes, api, type NoteBrief } from '../api/client'
import { CardSummary } from '../catalog'
import { Confirm } from '../catalog/Confirm'

/** My cards, each with an unshare stamp. */
export function MyNotes() {
  const qc = useQueryClient()
  const notes = useQuery({ queryKey: ['notes', 'mine'], queryFn: () => allNotes({ owner: 'me' }) })
  const [target, setTarget] = useState<NoteBrief | null>(null)
  const unshare = useMutation({
    mutationFn: (n: NoteBrief) => api.unshare(n.id, n.rev),
    onSuccess: () => { setTarget(null); void qc.invalidateQueries({ queryKey: ['notes'] }) },
  })
  return (
    <>
      <h1>My notes</h1>
      {notes.isPending ? <p className="muted" role="status">Pulling your cards…</p> : notes.isError ? <p className="problem" role="alert">{notes.error.message}</p> : notes.data.length === 0 ? <p className="empty">You have not shared a card yet.</p> : notes.data.map((n) => (
        <div key={n.id}>
          <CardSummary n={n} see={<button type="button" className="stamp red" onClick={() => setTarget(n)} aria-label={`Unshare ${n.title}`}>Unshare</button>} />
        </div>
      ))}
      <Confirm open={!!target} onOpenChange={(o) => !o && setTarget(null)} title="Unshare this card?" yes="Unshare" busy={unshare.isPending} onYes={() => target && unshare.mutate(target)}>
        <p>{target?.title}</p>
        <p className="muted">The team loses the card and its history. Your own copy stays on your machine.</p>
        {unshare.isError && <p className="problem" role="alert">{unshare.error.message}</p>}
      </Confirm>
    </>
  )
}
