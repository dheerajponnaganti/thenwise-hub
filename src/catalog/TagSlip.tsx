import { useState } from 'react'

/** Tags as small slips. With `onChange` an editor can add and remove them. */
export function TagSlips({ tags, onChange, busy }: { tags: string[]; onChange?: (tags: string[]) => void; busy?: boolean }) {
  const [text, setText] = useState('')
  if (!tags.length && !onChange) return null
  return (
    <div className="tagslips" aria-label="Tags">
      {tags.map((t) => (
        <span className="tagslip" key={t}>
          {t}
          {onChange && <button type="button" aria-label={`Remove tag ${t}`} disabled={busy} onClick={() => onChange(tags.filter((x) => x !== t))}>×</button>}
        </span>
      ))}
      {onChange && (
        <form className="tagadd" onSubmit={(e) => { e.preventDefault(); const t = text.trim(); if (t && !tags.includes(t)) onChange([...tags, t]); setText('') }}>
          <label className="sr" htmlFor="tag-new">Add a tag</label>
          <input id="tag-new" type="text" value={text} maxLength={40} placeholder="add a tag" onChange={(e) => setText(e.target.value)} />
          <button className="stamp" disabled={busy || !text.trim()}>Tag</button>
        </form>
      )}
    </div>
  )
}
