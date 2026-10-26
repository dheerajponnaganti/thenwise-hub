import { useState } from 'react'

/** A secret shown once, on a slip: the text, a copy button, and "I have saved it". */
export function SlipOnce({ label, secret, onDone }: { label: string; secret: string; onDone: () => void }) {
  const [copied, setCopied] = useState(false)
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(secret)
      setCopied(true)
    } catch {
      setCopied(false)
    }
  }
  return (
    <div className="slip-once">
      <p className="label">{label}</p>
      <p className="secret mono" data-testid="secret">{secret}</p>
      <p className="muted">It is shown once. Copy it before you close this slip.</p>
      <div className="row actions">
        <button type="button" className="btn ghost fit" onClick={copy}>Copy</button>
        <button type="button" className="btn fit" onClick={onDone}>I have saved it</button>
      </div>
      <p className="note-line" role="status">{copied ? 'Copied.' : ''}</p>
    </div>
  )
}
