import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'
import { Link } from 'react-router-dom'
import { api, type SharedProject } from '../api/client'
import { byteLabel } from '../api/chats'
import { stampDate } from '../api/format'
import { Ledger, LedgerCell, LedgerRow, Stamp } from '../catalog'
import { PauseStamp } from './PauseStamp'
import { UnshareProject } from './MyShares'

/** Admin desk: who shares which project, how many chats and bytes, and when they last pushed. */
export function SharingLedger() {
  const qc = useQueryClient()
  const shared = useQuery({ queryKey: ['shared'], queryFn: api.sharedProjects })
  const [target, setTarget] = useState<SharedProject | null>(null)
  const unshare = useMutation({
    mutationFn: (p: SharedProject) => api.unshareProject(p.owner, p.project),
    onSuccess: () => { setTarget(null); void qc.invalidateQueries({ queryKey: ['shared'] }); void qc.invalidateQueries({ queryKey: ['chats'] }); void qc.invalidateQueries({ queryKey: ['audit'] }) },
  })
  return (
    <>
      <h1>Sharing ledger</h1>
      <p className="muted"><Link to="/members">Back to the members</Link></p>
      {shared.isPending ? <p className="muted" role="status">Opening the ledger…</p> : shared.isError ? <p className="problem" role="alert">{shared.error.message}</p> : shared.data.length === 0 ? <p className="empty">Nobody shares chats yet.</p> : (
        <Ledger caption="Shared projects" columns={['Member', 'Project', 'Chats', 'Size', 'Last push', 'Stamps']}>
          {shared.data.map((p) => (
            <LedgerRow key={`${p.owner}/${p.project}`}>
              <LedgerCell label="Member"><span className="who">{p.owner}</span></LedgerCell>
              <LedgerCell label="Project"><Link to={`/projects/${encodeURIComponent(p.project)}`}>{p.project}</Link>{p.status === 'paused' && <> <Stamp tone="muted">PAUSED</Stamp></>}</LedgerCell>
              <LedgerCell label="Chats" className="mono">{p.chats}</LedgerCell>
              <LedgerCell label="Size" className="mono">{byteLabel(p.bytes)}</LedgerCell>
              <LedgerCell label="Last push" className="mono">{stampDate(p.last_push)}</LedgerCell>
              <LedgerCell label="Stamps" className="tray-cell"><PauseStamp p={p} /><button type="button" className="stamp red" aria-label={`Unshare ${p.project} of ${p.owner}`} onClick={() => setTarget(p)}>Unshare</button></LedgerCell>
            </LedgerRow>
          ))}
        </Ledger>
      )}
      <UnshareProject target={target} onClose={() => setTarget(null)} busy={unshare.isPending} error={unshare.isError ? unshare.error.message : ''} onYes={() => target && unshare.mutate(target)} />
    </>
  )
}
