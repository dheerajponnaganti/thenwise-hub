import type { components } from './types'

type S = components['schemas']
export type Note = S['Note']
export type NoteBrief = S['NoteBrief']
export type Member = S['Member']
export type Revision = S['Revision']
export type Settings = S['Settings']
export type AuditEntry = S['AuditList']['entries'][number]
export type Stats = S['Stats']
export type Kind = Note['kind']
export type Me = { id: string; name: string; role: string }

export class ApiError extends Error {
  constructor(public status: number, public code: string, message: string, public body: { rev?: number | null } = {}) {
    super(message)
  }
}

let authLost: () => void = () => {}
/** Called when the server says the session is gone. The app sends the reader back to the card desk. */
export const onAuthLost = (fn: () => void) => { authLost = fn }

const csrf = () => document.cookie.split('; ').find((c) => c.startsWith('tw_csrf='))?.slice(8) ?? ''

async function call<T>(method: string, path: string, body?: unknown, o: { match?: number; quiet?: boolean } = {}): Promise<T> {
  const headers: Record<string, string> = {}
  if (body !== undefined) headers['content-type'] = 'application/json'
  if (method !== 'GET') headers['x-thenwise-csrf'] = csrf()
  if (o.match !== undefined) headers['if-match'] = String(o.match)
  const res = await fetch(path, { method, headers, credentials: 'same-origin', body: body === undefined ? undefined : JSON.stringify(body) })
  if (res.ok) return (res.headers.get('content-type')?.includes('json') ? res.json() : undefined) as Promise<T>
  const j = (await res.json().catch(() => ({}))) as { error?: { code?: string; message?: string }; rev?: number | null }
  if (res.status === 401 && !o.quiet) authLost()
  const message = res.status === 403 ? 'Not allowed for your role.' : (j.error?.message ?? `The server answered ${res.status}.`)
  throw new ApiError(res.status, j.error?.code ?? 'error', message, { rev: j.rev })
}

const q = (p: Record<string, string | number | undefined>) => {
  const s = new URLSearchParams()
  for (const [k, v] of Object.entries(p)) if (v !== undefined && v !== '') s.set(k, String(v))
  return s.size ? `?${s}` : ''
}
const np = (owner: string, id: string) => `/v1/notes/${encodeURIComponent(owner)}/${encodeURIComponent(id)}`

export const api = {
  health: () => call<S['Health']>('GET', '/v1/health'),
  // Without the readable csrf cookie there is no session, so the question is not sent (it would only log a 401).
  me: () => (csrf() ? call<Me>('GET', '/v1/me', undefined, { quiet: true }) : Promise.reject(new ApiError(401, 'unauthorized', 'Not signed in.'))),
  signIn: (token: string) => call<Member>('POST', '/v1/session', { token }, { quiet: true }),
  signOut: () => call<S['Ok']>('DELETE', '/v1/session', undefined, { quiet: true }),
  join: (code: string, name: string) => call<S['Joined']>('POST', '/v1/join', { code, name, session: true }, { quiet: true }),
  notes: async (p: { owner?: string; project?: string; kind?: string; status?: string; limit?: number; offset?: number } = {}) =>
    (await call<S['NoteList']>('GET', `/v1/notes${q(p)}`)).notes,
  search: async (text: string) => (await call<S['NoteList']>('GET', `/v1/search${q({ q: text, limit: 50 })}`)).notes,
  note: (owner: string, id: string) => call<Note>('GET', np(owner, id)),
  revisions: async (owner: string, id: string) => (await call<S['RevisionList']>('GET', `${np(owner, id)}/revisions`)).revisions,
  unshare: (id: string, rev: number) => call<S['Rev']>('DELETE', `/v1/notes/${encodeURIComponent(id)}`, undefined, { match: rev }),
  members: async () => (await call<S['MemberList']>('GET', '/v1/members')).members,
  invite: (role: string, days: number) => call<S['InviteOut']>('POST', '/v1/invites', { role, days }),
  patchMember: (id: string, p: S['MemberPatch']) => call<Member>('PATCH', `/v1/members/${id}`, p),
  removeMember: (id: string, notes: 'keep' | 'delete') => call<S['Ok']>('DELETE', `/v1/members/${id}?notes=${notes}`),
  rotate: (id: string) => call<S['Token']>('POST', `/v1/members/${id}/rotate`, {}),
  settings: () => call<Settings>('GET', '/v1/settings'),
  patchSettings: (p: Partial<Settings>) => call<Settings>('PATCH', '/v1/settings', p),
  audit: async (p: { actor?: string; action?: string; limit?: number }) => (await call<S['AuditList']>('GET', `/v1/audit${q({ limit: 100, ...p })}`)).entries,
  stats: () => call<Stats>('GET', '/v1/stats'),
  edit: (owner: string, id: string, rev: number, patch: S['NotePatch']) => call<Note>('PATCH', np(owner, id), patch, { match: rev }),
  curate: (owner: string, id: string, action: 'retire' | 'pin' | 'unpin' | 'approve') => call<Note>('POST', `${np(owner, id)}/${action}`, {}),
  supersede: (owner: string, id: string, by: string) => call<Note>('POST', `${np(owner, id)}/supersede`, { by }),
}

/** Every shared note, newest first. The server has no project list, so the cabinet is built from the notes. */
export async function allNotes(p: { owner?: string; project?: string; status?: string } = {}): Promise<NoteBrief[]> {
  const out: NoteBrief[] = []
  for (let offset = 0; offset < 5000; offset += 200) {
    const page = await api.notes({ ...p, limit: 200, offset })
    out.push(...page)
    if (page.length < 200) break
  }
  return out
}
