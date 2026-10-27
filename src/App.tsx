import { useQuery, useQueryClient } from '@tanstack/react-query'
import { useEffect } from 'react'
import { Navigate, NavLink, Route, Routes, useLocation, useNavigate } from 'react-router-dom'
import { ApiError, api, onAuthLost } from './api/client'
import { can } from './api/roles'
import { MeContext, authNote } from './auth'
import { applyTheme, savedTheme, THEMES } from './theme'
import { Activity } from './pages/Activity'
import { CatalogPage } from './pages/Catalog'
import { Home } from './pages/Home'
import { ChatPage } from './pages/Chat'
import { Join } from './pages/Join'
import { Members } from './pages/Members'
import { MyNotes } from './pages/MyNotes'
import { MyShares } from './pages/MyShares'
import { SharingLedger } from './pages/SharingLedger'
import { Pending } from './pages/Pending'
import { NotePage } from './pages/Note'
import { Project } from './pages/Project'
import { Search } from './pages/Search'
import { Settings } from './pages/Settings'
import { SignIn } from './pages/SignIn'
import { Card } from './catalog'

function Masthead({ signedIn, role }: { signedIn: boolean; role?: string }) {
  const health = useQuery({ queryKey: ['health'], queryFn: api.health })
  const qc = useQueryClient()
  const nav = useNavigate()
  const queue = useQuery({ queryKey: ['settings'], queryFn: api.settings, enabled: signedIn && can(role, 'admin') })
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
            {can(role, 'admin') && (
              <>
                {queue.data?.review_queue && <NavLink to="/pending">Pending</NavLink>}
                <NavLink to="/members">Members</NavLink>
                <NavLink to="/activity">Activity</NavLink>
                <NavLink to="/settings">Settings</NavLink>
              </>
            )}
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

  // Admin screens. Anyone else sees a one-card page, never the server's 403.
  const admin = (page: React.ReactNode) =>
    can(user?.role, 'admin') ? page : (
      <Card call="LIBRARIANS ONLY" at={Date.now()}>
        <h1>Librarians only</h1>
        <p>This desk is for admins. Ask one of them if you need something changed.</p>
        <p><NavLink to="/">Back to the cabinet</NavLink></p>
      </Card>
    )

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
          <Route path="/chats/:owner/:session" element={<ChatPage />} />
          <Route path="/mine" element={can(user.role, 'share') ? <MyNotes /> : <Navigate to="/" replace />} />
          <Route path="/my-shares" element={can(user.role, 'share') ? <MyShares /> : (
            <Card call="MEMBERS ONLY" at={Date.now()}>
              <h1>Members only</h1>
              <p>Sharing chats is for members and up. Viewers can read every volume.</p>
              <p><NavLink to="/">Back to the cabinet</NavLink></p>
            </Card>
          )} />
          <Route path="/shares" element={admin(<SharingLedger />)} />
          <Route path="/pending" element={admin(<Pending />)} />
          <Route path="/members" element={admin(<Members />)} />
          <Route path="/activity" element={admin(<Activity />)} />
          <Route path="/settings" element={admin(<Settings />)} />
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
