import { useQuery, useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { api, ApiError } from '../api/client'

const NAME = /^[a-z0-9][a-z0-9_-]{0,31}$/

/** An invite link: choose a name, join, keep the token. */
export function Join() {
  const [params] = useSearchParams()
  const code = params.get('code') ?? ''
  const health = useQuery({ queryKey: ['health'], queryFn: api.health })
  const qc = useQueryClient()
  const nav = useNavigate()
  const [name, setName] = useState('')
  const [error, setError] = useState('')
  const [joined, setJoined] = useState<{ id: string; name: string; role: string; token: string } | null>(null)

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    try {
      setJoined(await api.join(code, name.trim()))
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'The server could not be reached.')
    }
  }
  const enter = () => {
    if (!joined) return
    qc.clear()
    qc.setQueryData(['me'], { id: joined.id, name: joined.name, role: joined.role })
    nav('/')
  }
  return (
    <section className="desk">
      <h1 className="teamname">{health.data?.team ?? 'Thenwise Hub'}</h1>
      {joined ? (
        <div className="card">
          <div className="head"><span className="call">YOUR TOKEN</span></div>
          <h2>Welcome, {joined.name}</h2>
          <p>Keep this token for Claude Code. It is shown once.</p>
          <p className="mono" data-testid="join-token">{joined.token}</p>
          <p><button className="btn" onClick={enter}>Open the cabinet</button></p>
        </div>
      ) : !code ? (
        <p className="problem" role="alert">This link has no invite code. Ask your admin for a new one.</p>
      ) : (
        <form className="card" onSubmit={submit}>
          <div className="head"><span className="call">NEW BORROWER</span></div>
          <h2>Join the team</h2>
          <label htmlFor="name">Choose a name</label>
          <input id="name" type="text" value={name} onChange={(e) => setName(e.target.value)} autoComplete="username" autoCapitalize="none" spellCheck={false} aria-describedby="name-hint" required />
          <p id="name-hint" className="muted note-line">Lower-case letters, digits, - and _, up to 32.</p>
          {error && <p className="problem" role="alert">{error}</p>}
          <p><button className="btn" disabled={!NAME.test(name.trim())}>Join</button></p>
        </form>
      )}
    </section>
  )
}
