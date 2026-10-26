import { useState } from 'react'
import type { Revision } from '../api/client'
import { stampDate } from '../api/format'

/** Circulation history: every revision as a dated line, each one openable, with "restore this" for editors. */
export function History({ revisions, canRestore, onRestore, busy }: { revisions: Revision[]; canRestore: boolean; onRestore: (r: Revision) => void; busy?: boolean }) {
  const [open, setOpen] = useState<number | null>(null)
  return (
    <ol className="history" aria-label="Revisions">
      {revisions.map((r, i) => (
        <li key={r.rev}>
          <div className="line">
            <span className="mono">{stampDate(r.edited_at)} · REV {r.rev}</span> edited by {r.edited_by_name || 'unknown'}: {r.title}
          </div>
          <div className="row actions">
            <button type="button" className="stamp fit" aria-expanded={open === r.rev} onClick={() => setOpen(open === r.rev ? null : r.rev)}>{open === r.rev ? 'Close' : 'Open'} rev {r.rev}</button>
            {canRestore && i > 0 && <button type="button" className="stamp fit" disabled={busy} onClick={() => onRestore(r)}>Restore rev {r.rev}</button>}
          </div>
          {open === r.rev && <pre className="oldtext">{r.text}</pre>}
        </li>
      ))}
    </ol>
  )
}
