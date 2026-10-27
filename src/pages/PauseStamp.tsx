import { useMutation, useQueryClient } from '@tanstack/react-query'
import { api, type SharedProject } from '../api/client'

/** Pause or resume pushing a project's chats. The server allows the owner and admins; the stamp is shown to them. */
export function PauseStamp({ p }: { p: SharedProject }) {
  const qc = useQueryClient()
  const paused = p.status === 'paused'
  const go = useMutation({
    mutationFn: () => api.setProjectStatus(p.owner, p.project, paused ? 'active' : 'paused'),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['shared'] }),
  })
  return <button type="button" className="stamp" disabled={go.isPending} aria-label={`${paused ? 'Resume' : 'Pause'} ${p.project}`} onClick={() => go.mutate()}>{paused ? 'Resume' : 'Pause'}</button>
}
