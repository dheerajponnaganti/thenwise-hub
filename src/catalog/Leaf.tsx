import { leafBody, leafId } from '../api/chats'
import type { Turn } from '../api/client'
import { stopOf, withoutStop, type Question } from '../api/marks'
import { Card } from './Card'
import { Footnotes } from './Footnote'
import { Prose } from './Prose'
import { Stamp } from './Stamp'

/** One turn of a chat: the prompt as the heading, the reply as text, dead ends stamped, paths and commits as footnotes.
 * A turn the tool cut off (a usage limit, an error) is stamped STOPPED with its reason, and a [question] it left for the
 * next agent is a slip: OPEN QUESTION until a later turn of the chat answers it. */
export function Leaf({ t, n, questions = [] }: { t: Turn; n: number; questions?: Question[] }) {
  const notes = [...(t.paths ?? []), ...(t.shas ?? []).map((s) => `commit ${s}`), ...(t.prs ?? [])]
  const body = leafBody(t)
  const stop = stopOf(body)
  return (
    <div id={leafId(t.id)} className="leaf">
      <Card call={`leaf ${n}`} at={t.at} label={`Leaf ${n}`}>
        <h2>{t.kind === 'summary' ? 'Compaction summary' : t.line || 'Turn'}</h2>
        <div className="stamps">
          {t.kind === 'summary' && <Stamp tone="muted">SUMMARY</Stamp>}
          {t.dead_end && <Stamp>ABANDONED</Stamp>}
          {stop && <Stamp>STOPPED</Stamp>}
        </div>
        {t.dead_end && t.dead_text && <p className="dead-text">{t.dead_text}</p>}
        {stop && <p className="dead-text">Stopped by the tool: {stop}</p>}
        {questions.map((q) => (
          <p key={q.id} className="question">
            <Stamp>{q.answered ? 'ANSWERED' : 'OPEN QUESTION'}</Stamp> <span className="call">{q.id}</span> {q.text}
          </p>
        ))}
        <Prose text={stop ? withoutStop(body) : body} />
        <Footnotes sources={notes} />
      </Card>
    </div>
  )
}
