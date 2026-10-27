import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useEffect, useState } from 'react'
import { Link, useLocation, useNavigate, useParams } from 'react-router-dom'
import { api } from '../api/client'
import { can } from '../api/roles'
import { useMe } from '../auth'
import { Leaf, Spine } from '../catalog'
import { Confirm } from '../catalog/Confirm'

/** A volume opened as leaves, one card per turn. Everyone reads; nobody edits. */
export function ChatPage() {
  const { owner = '', session = '' } = useParams()
  const me = useMe()
  const nav = useNavigate()
  const qc = useQueryClient()
  const { hash } = useLocation()
  const chat = useQuery({ queryKey: ['chat', owner, session], queryFn: () => api.chat(owner, session), retry: false })
  const [asking, setAsking] = useState(false)
  const mine = owner === me.name
  const unshare = useMutation({
    mutationFn: () => (mine ? api.unshareChat(session, chat.data!.rev) : api.adminUnshareChat(owner, session, chat.data!.rev)),
    onSuccess: () => { void qc.invalidateQueries({ queryKey: ['chats'] }); void qc.invalidateQueries({ queryKey: ['shared'] }); nav(`/projects/${encodeURIComponent(chat.data!.project)}`) },
  })
  // The leaves load after the page, so the browser cannot jump to a #leaf link by itself.
  useEffect(() => {
    if (chat.data && hash) document.getElementById(decodeURIComponent(hash.slice(1)))?.scrollIntoView({ block: 'start' })
  }, [chat.data, hash])

  if (chat.isPending) return <p className="muted" role="status">Taking the volume down…</p>
  if (chat.isError) return <p className="problem" role="alert">{chat.error.message}</p>
  const c = chat.data
  return (
    <>
      <p className="note-line"><Link to={`/projects/${encodeURIComponent(c.project)}`}>{c.project || 'No project'}</Link></p>
      <Spine c={c} />
      {c.turns.map((t, i) => <Leaf key={t.id} t={t} n={i + 1} />)}
      {(mine ? can(me.role, 'share') : can(me.role, 'admin')) && (
        <p><button type="button" className="stamp red" onClick={() => setAsking(true)}>Unshare this volume</button></p>
      )}
      <Confirm open={asking} onOpenChange={setAsking} title="Unshare this volume?" yes="Unshare" busy={unshare.isPending} onYes={() => unshare.mutate()}>
        <p>{c.head}</p>
        <p className="muted">The team loses this chat and its search entries. The original stays on {mine ? 'your machine' : `${owner}'s machine`}.</p>
        {unshare.isError && <p className="problem" role="alert">{unshare.error.message}</p>}
      </Confirm>
    </>
  )
}
