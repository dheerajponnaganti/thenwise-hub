import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { allNotes, api } from '../api/client'
import { CardSummary } from '../catalog'

/** The pending tray: cards waiting for an admin. Approve files them. Refuse retires them; their owner keeps a copy. */
export function Pending() {
  const qc = useQueryClient()
  const list = useQuery({ queryKey: ['notes', 'pending'], queryFn: () => allNotes({ status: 'pending' }) })
  const act = useMutation({
    mutationFn: ({ owner, id, what }: { owner: string; id: string; what: 'approve' | 'retire' }) => api.curate(owner, id, what),
    onSuccess: () => qc.invalidateQueries(),
  })
  return (
    <>
      <h1>Pending</h1>
      {list.isPending ? <p className="muted" role="status">Looking in the tray…</p> : list.isError ? <p className="problem" role="alert">{list.error.message}</p> : list.data.length === 0 ? <p className="empty">The tray is empty. No card is waiting for review.</p> : list.data.map((n) => (
        <CardSummary key={`${n.owner}/${n.id}`} n={n} see={
          <span className="stamps">
            <button type="button" className="stamp blue" disabled={act.isPending} aria-label={`Approve ${n.title}`} onClick={() => act.mutate({ owner: n.owner, id: n.id, what: 'approve' })}>Approve</button>
            <button type="button" className="stamp red" disabled={act.isPending} aria-label={`Refuse ${n.title}`} onClick={() => act.mutate({ owner: n.owner, id: n.id, what: 'retire' })}>Refuse</button>
          </span>
        } />
      ))}
      {act.isError && <p className="problem" role="alert">{act.error.message}</p>}
    </>
  )
}
