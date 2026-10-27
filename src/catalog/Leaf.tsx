import { leafBody, leafId } from '../api/chats'
import type { Turn } from '../api/client'
import { Card } from './Card'
import { Footnotes } from './Footnote'
import { Prose } from './Prose'
import { Stamp } from './Stamp'

/** One turn of a chat: the prompt as the heading, the reply as text, dead ends stamped, paths and commits as footnotes. */
export function Leaf({ t, n }: { t: Turn; n: number }) {
  const notes = [...(t.paths ?? []), ...(t.shas ?? []).map((s) => `commit ${s}`), ...(t.prs ?? [])]
  return (
    <div id={leafId(t.id)} className="leaf">
      <Card call={`leaf ${n}`} at={t.at} label={`Leaf ${n}`}>
        <h2>{t.kind === 'summary' ? 'Compaction summary' : t.line || 'Turn'}</h2>
        <div className="stamps">
          {t.kind === 'summary' && <Stamp tone="muted">SUMMARY</Stamp>}
          {t.dead_end && <Stamp>ABANDONED</Stamp>}
        </div>
        {t.dead_end && t.dead_text && <p className="dead-text">{t.dead_text}</p>}
        <Prose text={leafBody(t)} />
        <Footnotes sources={notes} />
      </Card>
    </div>
  )
}
