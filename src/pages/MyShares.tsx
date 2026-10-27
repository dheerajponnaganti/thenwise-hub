import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'
import { Link } from 'react-router-dom'
import { PauseStamp } from './PauseStamp'
import { allChats, api, type ChatBrief, type SharedProject } from '../api/client'
import { byteLabel } from '../api/chats'
import { stampDate } from '../api/format'
import { useMe } from '../auth'
import { Ledger, LedgerCell, LedgerRow, Stamp, Volume } from '../catalog'
import { Confirm } from '../catalog/Confirm'

/** The projects whose chats I share, with counts and sizes, and a stamp to take one back. */
export function MyShares() {
  const me = useMe()
  const qc = useQueryClient()
  const shared = useQuery({ queryKey: ['shared'], queryFn: api.sharedProjects })
  const [target, setTarget] = useState<SharedProject | null>(null)
  const unshare = useMutation({
    mutationFn: (p: SharedProject) => api.unshareProject(p.owner, p.project),
    onSuccess: () => { setTarget(null); void qc.invalidateQueries({ queryKey: ['shared'] }); void qc.invalidateQueries({ queryKey: ['chats'] }) },
  })
  const [volume, setVolume] = useState<ChatBrief | null>(null)
  const gone = useMutation({
    mutationFn: (c: ChatBrief) => api.unshareChat(c.session, c.rev),
    onSuccess: () => { setVolume(null); void qc.invalidateQueries({ queryKey: ['shared'] }); void qc.invalidateQueries({ queryKey: ['chats'] }) },
  })
  const mine = (shared.data ?? []).filter((p) => p.owner === me.name)
  return (
    <>
      <h1>My shares</h1>
      <p className="muted">Chats are shared a project at a time, from your machine. To unshare one volume, open it and use its stamp.</p>
      {shared.isPending ? <p className="muted" role="status">Counting your volumes…</p> : shared.isError ? <p className="problem" role="alert">{shared.error.message}</p> : mine.length === 0 ? <p className="empty">You share no chats.</p> : (
        <Ledger caption="Projects I share" columns={['Project', 'Chats', 'Size', 'Last push', 'Stamps']}>
          {mine.map((p) => (
            <LedgerRow key={p.project}>
              <LedgerCell label="Project"><Link to={`/projects/${encodeURIComponent(p.project)}`}>{p.project}</Link>{p.status === 'paused' && <> <Stamp tone="muted">PAUSED</Stamp></>}</LedgerCell>
              <LedgerCell label="Chats" className="mono">{p.chats}</LedgerCell>
              <LedgerCell label="Size" className="mono">{byteLabel(p.bytes)}</LedgerCell>
              <LedgerCell label="Last push" className="mono">{stampDate(p.last_push)}</LedgerCell>
              <LedgerCell label="Stamps" className="tray-cell"><PauseStamp p={p} /><button type="button" className="stamp red" aria-label={`Unshare ${p.project}`} onClick={() => setTarget(p)}>Unshare</button></LedgerCell>
            </LedgerRow>
          ))}
        </Ledger>
      )}
      {mine.map((p) => <Volumes key={p.project} project={p.project} onPick={setVolume} />)}
      <Confirm open={!!volume} onOpenChange={(o) => !o && setVolume(null)} title="Unshare this volume?" yes="Unshare" busy={gone.isPending} onYes={() => volume && gone.mutate(volume)}>
        <p>{volume?.head}</p>
        <p className="muted">The team loses this chat and its search entries. The original stays on your machine.</p>
        {gone.isError && <p className="problem" role="alert">{gone.error.message}</p>}
      </Confirm>
      <UnshareProject target={target} onClose={() => setTarget(null)} busy={unshare.isPending} error={unshare.isError ? unshare.error.message : ''} onYes={() => target && unshare.mutate(target)} />
    </>
  )
}

export function UnshareProject({ target, onClose, onYes, busy, error }: { target: SharedProject | null; onClose: () => void; onYes: () => void; busy: boolean; error: string }) {
  return (
    <Confirm open={!!target} onOpenChange={(o) => !o && onClose()} title={`Unshare ${target?.project ?? ''}?`} yes="Unshare" busy={busy} onYes={onYes}>
      <p>{target?.chats} {target?.chats === 1 ? 'chat' : 'chats'} of {target?.owner} leave the team server. Teammates drop their copies at their next sync.</p>
      {error && <p className="problem" role="alert">{error}</p>}
    </Confirm>
  )
}

/** My own volumes of one project, each with an unshare stamp. */
function Volumes({ project, onPick }: { project: string; onPick: (c: ChatBrief) => void }) {
  const chats = useQuery({ queryKey: ['chats', 'mine', project], queryFn: () => allChats(project, 'only') })
  if (!chats.data?.length) return null
  return (
    <section aria-label={`My volumes in ${project}`}>
      <h2>{project}</h2>
      {chats.data.map((c) => (
        <Volume key={c.session} c={c} yours action={<button type="button" className="stamp red" aria-label={`Unshare ${c.head}`} onClick={() => onPick(c)}>Unshare</button>} />
      ))}
    </section>
  )
}
