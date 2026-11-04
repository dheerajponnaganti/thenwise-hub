import { Link } from 'react-router-dom'
import { spineLabel, volumePath } from '../api/chats'
import { stampDate } from '../api/format'
import type { ChatBrief } from '../api/client'
import { Stamp } from './Stamp'

/** A bound volume on the project's shelf: the owner's slip, the tool it was written in, the date, the first prompt on the
 * spine, the turn count. STOPPED when the tool cut its last turn off, so half-done work shows on the shelf. */
export function Volume({ c, snippet, turn, yours, action, stopped }: { c: ChatBrief; snippet?: React.ReactNode; turn?: string; yours?: boolean; action?: React.ReactNode; stopped?: string }) {
  return (
    <article className="volume" aria-label={`Chat by ${c.owner}`}>
      <div className="owner-slip">
        <span className="call">{c.owner}{yours && ' (yours)'}</span>
        {c.tool && <span className="tool">{c.tool}</span>}
        <span className="datestamp">{stampDate(c.started_at)}</span>
      </div>
      <h2 className="spine-label"><Link to={volumePath(c.owner, c.session, turn)}>{spineLabel(c.head)}</Link></h2>
      {stopped && <p className="stopped"><Stamp>STOPPED</Stamp> <span>{stopped}</span></p>}
      {snippet && <p className="excerpt">{snippet}</p>}
      <p className="count">{c.turn_count} {c.turn_count === 1 ? 'leaf' : 'leaves'}</p>
      {action}
    </article>
  )
}

/** The spine of an open volume. It stays at the top of the screen while the leaves scroll under it. */
export function Spine({ c, stopped }: { c: Pick<ChatBrief, 'owner' | 'head' | 'started_at' | 'turn_count' | 'tool'>; stopped?: string }) {
  return (
    <header className="spine">
      <span className="call">{c.owner}</span>
      {c.tool && <span className="tool">{c.tool}</span>}
      <span className="datestamp">{stampDate(c.started_at)}</span>
      <h1>{spineLabel(c.head, 140)}</h1>
      <span className="count">{c.turn_count} {c.turn_count === 1 ? 'leaf' : 'leaves'}</span>
      {stopped && <span className="stopped"><Stamp>STOPPED</Stamp> <span>{stopped}</span></span>}
    </header>
  )
}
