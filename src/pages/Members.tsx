import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'
import { Link } from 'react-router-dom'
import { api, ApiError, type Member } from '../api/client'
import { byteLabel, sharesOf } from '../api/chats'
import { stampDate } from '../api/format'
import { Ledger, LedgerCell, LedgerRow, Stamp } from '../catalog'
import { Confirm, Sheet } from '../catalog/Confirm'
import { SlipOnce } from '../catalog/SlipOnce'

const ROLES = ['viewer', 'member', 'editor', 'admin']
const DAY = 864e5
type Action = { kind: 'role' | 'expiry' | 'rotate' | 'remove'; m: Member }

/** The circulation desk ledger: everyone on the team, and the stamps an admin uses on them. */
export function Members() {
  const qc = useQueryClient()
  const members = useQuery({ queryKey: ['members'], queryFn: api.members })
  // The shares column is a bonus. A server without chats leaves it as a dash.
  const shared = useQuery({ queryKey: ['shared'], queryFn: api.sharedProjects, retry: false })
  const [action, setAction] = useState<Action | null>(null)
  const [inviting, setInviting] = useState(false)
  const [secret, setSecret] = useState<{ label: string; value: string } | null>(null)
  const [notice, setNotice] = useState('')
  const refresh = () => qc.invalidateQueries({ queryKey: ['members'] })
  const close = () => { setAction(null); setInviting(false) }

  return (
    <>
      <h1>Members</h1>
      <p className="row actions">
        <button type="button" className="btn fit" onClick={() => { setNotice(''); setInviting(true) }}>Invite someone</button>
        {shared.isSuccess && <Link className="btn ghost fit" to="/shares">Sharing ledger</Link>}
      </p>
      {notice && <p className="problem" role="status">{notice}</p>}
      {members.isPending ? <p className="muted" role="status">Opening the ledger…</p> : members.isError ? <p className="problem" role="alert">{members.error.message}</p> : (
        <Ledger caption="Team members" columns={['Name', 'Role', 'Expires', 'Last seen', 'Shares', 'Stamps']}>
          {members.data.map((m) => (
            <LedgerRow key={m.id} struck={m.disabled}>
              <LedgerCell label="Name"><span className="who">{m.name}</span>{m.disabled && <> <Stamp tone="muted">REMOVED</Stamp></>}</LedgerCell>
              <LedgerCell label="Role"><Stamp tone={m.role === 'owner' ? 'red' : 'ink'}>{m.role.toUpperCase()}</Stamp></LedgerCell>
              <LedgerCell label="Expires" className="mono">{m.expires_at ? stampDate(m.expires_at) : 'NEVER'}</LedgerCell>
              <LedgerCell label="Last seen" className="mono">{stampDate(m.last_seen)}</LedgerCell>
              <LedgerCell label="Shares" className="mono">{shared.data ? (({ projects, chats, bytes }) => (chats ? `${projects} ${projects === 1 ? 'project' : 'projects'}, ${chats} ${chats === 1 ? 'chat' : 'chats'}, ${byteLabel(bytes)}` : 'none'))(sharesOf(shared.data, m.name)) : '-'}</LedgerCell>
              <LedgerCell label="Stamps" className="tray-cell">
                {!m.disabled && m.role !== 'owner' && (
                  <>
                    <button type="button" className="stamp" aria-label={`Change role of ${m.name}`} onClick={() => setAction({ kind: 'role', m })}>Role</button>
                    <button type="button" className="stamp" aria-label={`Set expiry of ${m.name}`} onClick={() => setAction({ kind: 'expiry', m })}>Expiry</button>
                    <button type="button" className="stamp" aria-label={`Rotate token of ${m.name}`} onClick={() => setAction({ kind: 'rotate', m })}>Rotate</button>
                    <button type="button" className="stamp red" aria-label={`Remove ${m.name}`} onClick={() => setAction({ kind: 'remove', m })}>Remove</button>
                  </>
                )}
              </LedgerCell>
            </LedgerRow>
          ))}
        </Ledger>
      )}

      <InviteSheet open={inviting} onClose={close} onSecret={(value) => { close(); setSecret({ label: 'Invite link', value }); void qc.invalidateQueries({ queryKey: ['audit'] }) }} />
      <RoleSheet key={action?.m.id} action={action?.kind === 'role' ? action : null} onClose={close} onDone={() => { close(); void refresh() }} />
      <ExpirySheet key={action?.m.id} action={action?.kind === 'expiry' ? action : null} onClose={close} onDone={() => { close(); void refresh() }} />
      <RotateSheet action={action?.kind === 'rotate' ? action : null} onClose={close} onSecret={(value, name) => { close(); setSecret({ label: `New token for ${name}`, value }) }} />
      <RemoveSheet key={action?.m.id} action={action?.kind === 'remove' ? action : null} onClose={close} onDone={(msg) => { close(); setNotice(msg); void refresh() }} />
      <Sheet open={!!secret} onClose={() => setSecret(null)} title={secret?.label ?? ''}>
        {secret && <SlipOnce label={secret.label} secret={secret.value} onDone={() => setSecret(null)} />}
      </Sheet>
    </>
  )
}

function InviteSheet({ open, onClose, onSecret }: { open: boolean; onClose: () => void; onSecret: (link: string) => void }) {
  const [role, setRole] = useState('member')
  const [days, setDays] = useState(7)
  const make = useMutation({ mutationFn: () => api.invite(role, days), onSuccess: (r) => onSecret(`${location.origin}/join?code=${r.code}`) })
  return (
    <Sheet open={open} onClose={onClose} title="Invite someone">
      <form onSubmit={(e) => { e.preventDefault(); make.mutate() }}>
        <label htmlFor="inv-role">Role</label>
        <select id="inv-role" value={role} onChange={(e) => setRole(e.target.value)}>{ROLES.map((r) => <option key={r}>{r}</option>)}</select>
        <label htmlFor="inv-days">Link works for (days)</label>
        <input id="inv-days" type="number" min={1} max={365} value={days} onChange={(e) => setDays(Math.min(365, Math.max(1, Number(e.target.value) || 1)))} />
        {make.isError && <p className="problem" role="alert">{make.error.message}</p>}
        <div className="row actions">
          <button className="btn fit" disabled={make.isPending}>Make the link</button>
          <button type="button" className="btn ghost fit" onClick={onClose}>Cancel</button>
        </div>
      </form>
    </Sheet>
  )
}

function RoleSheet({ action, onClose, onDone }: { action: Action | null; onClose: () => void; onDone: () => void }) {
  const [role, setRole] = useState('')
  const m = action?.m
  const save = useMutation({ mutationFn: () => api.patchMember(m!.id, { role: (role || m!.role) as 'viewer' }), onSuccess: onDone })
  return (
    <Confirm open={!!action} onOpenChange={(o) => !o && onClose()} title={`Change the role of ${m?.name ?? ''}`} yes="Change role" busy={save.isPending} onYes={() => save.mutate()}>
      <label htmlFor="new-role">New role</label>
      <select id="new-role" value={role || m?.role} onChange={(e) => setRole(e.target.value)}>{ROLES.map((r) => <option key={r}>{r}</option>)}</select>
      {save.isError && <p className="problem" role="alert">{save.error.message}</p>}
    </Confirm>
  )
}

function ExpirySheet({ action, onClose, onDone }: { action: Action | null; onClose: () => void; onDone: () => void }) {
  const [date, setDate] = useState('')
  const m = action?.m
  // The token works through the end of the chosen day (UTC). An empty date means it never expires.
  const save = useMutation({ mutationFn: () => api.patchMember(m!.id, { expires_at: date ? Date.parse(`${date}T00:00:00Z`) + DAY - 1 : null }), onSuccess: onDone })
  return (
    <Confirm open={!!action} onOpenChange={(o) => !o && onClose()} title={`Set the expiry of ${m?.name ?? ''}`} yes="Set expiry" busy={save.isPending} onYes={() => save.mutate()}>
      <label htmlFor="exp-date">Last day the token works</label>
      <input id="exp-date" type="date" value={date} onChange={(e) => setDate(e.target.value)} />
      <p className="muted note-line">Leave it empty for no expiry.</p>
      {save.isError && <p className="problem" role="alert">{save.error.message}</p>}
    </Confirm>
  )
}

function RotateSheet({ action, onClose, onSecret }: { action: Action | null; onClose: () => void; onSecret: (token: string, name: string) => void }) {
  const m = action?.m
  const go = useMutation({ mutationFn: () => api.rotate(m!.id), onSuccess: (r) => onSecret(r.token, m!.name) })
  return (
    <Confirm open={!!action} onOpenChange={(o) => !o && onClose()} title={`Rotate the token of ${m?.name ?? ''}?`} yes="Rotate" busy={go.isPending} onYes={() => go.mutate()}>
      <p>{m?.name} gets a new token. The old token and any browser session stop working at once.</p>
      {go.isError && <p className="problem" role="alert">{go.error.message}</p>}
    </Confirm>
  )
}

function RemoveSheet({ action, onClose, onDone }: { action: Action | null; onClose: () => void; onDone: (msg: string) => void }) {
  const [notes, setNotes] = useState<'keep' | 'delete'>('keep')
  const m = action?.m
  const go = useMutation({
    mutationFn: async () => {
      // Another admin may have removed this person already. Look again before sending.
      const now = (await api.members()).find((x) => x.id === m!.id)
      if (!now || now.disabled) return 'already'
      try {
        await api.removeMember(m!.id, notes)
      } catch (e) {
        if (e instanceof ApiError && e.status === 404) return 'already'
        throw e
      }
      return 'removed'
    },
    onSuccess: (r) => onDone(r === 'already' ? `${m!.name} was already removed.` : `${m!.name} is removed.`),
  })
  return (
    <Confirm open={!!action} onOpenChange={(o) => !o && onClose()} title={`Remove ${m?.name ?? ''}?`} yes="Remove" busy={go.isPending} onYes={() => go.mutate()}>
      <p>Their token stops working at once. What happens to the cards they shared?</p>
      <fieldset>
        <legend>Their cards</legend>
        <label className="check"><input type="radio" name="notes" checked={notes === 'keep'} onChange={() => setNotes('keep')} /> Keep their cards. They stay in the catalog and the name cannot be reused.</label>
        <label className="check"><input type="radio" name="notes" checked={notes === 'delete'} onChange={() => setNotes('delete')} /> Pull their cards. Every card they shared is deleted.</label>
      </fieldset>
      {go.isError && <p className="problem" role="alert">{go.error.message}</p>}
    </Confirm>
  )
}
