import { useQuery, useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { api, ApiError } from '../api/client'
import { cleanToken } from '../api/format'
import { authNote } from '../auth'

/** The library card desk: paste a token. */
export function SignIn() {
  const health = useQuery({ queryKey: ['health'], queryFn: api.health })
  const qc = useQueryClient()
  const nav = useNavigate()
  const [token, setToken] = useState('')
  const [why] = useState(() => { const t = authNote.text; authNote.text = ''; return t })
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    setBusy(true)
    setError('')
    try {
      await api.signIn(cleanToken(token))
      qc.clear()
      nav('/')
    } catch (err) {
      setError(err instanceof ApiError && err.status === 401 ? 'That token is not valid, or it has expired.' : 'The server could not be reached.')
    } finally {
      setBusy(false)
    }
  }
  return (
    <section className="desk">
      <h1 className="teamname">{health.data?.team ?? 'Thenwise Hub'}</h1>
      <form className="card" onSubmit={submit}>
        <div className="head"><span className="call">LIBRARY CARD</span></div>
        <h2>Sign in</h2>
        {why && <p className="problem" role="status">{why}</p>}
        <p className="muted">Paste your team token. An invite link opens its own page.</p>
        <label htmlFor="token">Token</label>
        <input id="token" type="password" autoComplete="off" spellCheck={false} value={token} onChange={(e) => setToken(e.target.value)} required />
        {error && <p className="problem" role="alert">{error}</p>}
        <p><button className="btn" disabled={busy || !token.trim()}>Sign in</button></p>
      </form>
    </section>
  )
}
