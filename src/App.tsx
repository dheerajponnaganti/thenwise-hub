import { useQuery, useQueryClient } from '@tanstack/react-query'
import { useEffect } from 'react'
import { Navigate, NavLink, Route, Routes, useLocation, useNavigate } from 'react-router-dom'
import { ApiError, api, onAuthLost } from './api/client'
import { can } from './api/roles'
import { MeContext, authNote } from './auth'
import { applyTheme, savedTheme, THEMES } from './theme'
import { CatalogPage } from './pages/Catalog'
import { Home } from './pages/Home'
import { Join } from './pages/Join'
import { MyNotes } from './pages/MyNotes'
import { NotePage } from './pages/Note'
import { Project } from './pages/Project'
import { Search } from './pages/Search'
import { SignIn } from './pages/SignIn'

function Masthead({ signedIn, role }: { signedIn: boolean; role?: string }) {
  const health = useQuery({ queryKey: ['health'], queryFn: api.health })
  const qc = useQueryClient()
  const nav = useNavigate()
  const cycle = () => {
    const now = savedTheme()
    applyTheme(THEMES[(THEMES.indexOf(now) + 1) % THEMES.length]!)
    qc.setQueryData(['theme'], Date.now())
  }
  const theme = savedTheme()
  return (
    <header className="masthead">
      <NavLink className="team" to="/">{health.data?.team ?? 'Thenwise Hub'}</NavLink>
      <nav className="nav" aria-label="Main">
        {signedIn && (
          <>
            <NavLink to="/" end>Cabinet</NavLink>
            <NavLink to="/search">Search</NavLink>
            {can(role, 'share') && <NavLink to="/mine">My notes</NavLink>}
          </>
        )}
        <span className="grow" />
        <button type="button" className="linkish" onClick={cycle} aria-label={`Theme: ${theme}. Change theme`}>Theme: {theme}</button>
        {signedIn && (
          <button type="button" className="linkish" onClick={async () => { await api.signOut().catch(() => {}); qc.clear(); nav('/signin') }}>Sign out</button>
        )}
      </nav>
    </header>
  )
}

export function App() {
  const qc = useQueryClient()
  const nav = useNavigate()
  const loc = useLocation()
  const me = useQuery({ queryKey: ['me'], queryFn: api.me })

  useEffect(() => {
    onAuthLost(() => {
      authNote.text = 'Your session ended. Sign in again to go on.'
      qc.clear()
      qc.setQueryData(['me'], null)
      nav('/signin')
    })
  }, [qc, nav])

  const user = me.data ?? null
  const signedOut = me.isError && me.error instanceof ApiError && me.error.status === 401
  const publicPath = ['/signin', '/join', '/catalog'].includes(loc.pathname)

  let body
  if (publicPath) {
    body = (
      <Routes>
        <Route path="/signin" element={<SignIn />} />
        <Route path="/join" element={<Join />} />
        <Route path="/catalog" element={<CatalogPage />} />
      </Routes>
    )
  } else if (me.isPending) body = <p className="muted" role="status">Opening the cabinet…</p>
  else if (!user || signedOut) body = <Navigate to="/signin" replace />
  else if (me.isError) body = <p className="problem" role="alert">The server cannot be reached. Reload to try again.</p>
  else
    body = (
      <MeContext.Provider value={user}>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/search" element={<Search />} />
          <Route path="/notes/:owner/:id" element={<NotePage />} />
          <Route path="/projects/:project" element={<Project />} />
          <Route path="/mine" element={can(user.role, 'share') ? <MyNotes /> : <Navigate to="/" replace />} />
          <Route path="*" element={<p className="empty">No such page. <NavLink to="/">Back to the cabinet.</NavLink></p>} />
        </Routes>
      </MeContext.Provider>
    )

  return (
    <div className="shell">
      <Masthead signedIn={!!user && !publicPath} role={user?.role} />
      <main>{body}</main>
    </div>
  )
}
