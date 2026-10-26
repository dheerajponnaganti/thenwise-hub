export const FootnoteMark = ({ n }: { n: number }) => (
  <sup className="fn-mark">
    <a href={`#fn-${n}`} id={`fnref-${n}`} aria-label={`Source ${n}`}>{n}</a>
  </sup>
)

/** Sources set like a printed book's notes, at the foot of the card. */
export function Footnotes({ sources }: { sources: string[] }) {
  if (!sources.length) return null
  return (
    <aside className="footnotes" aria-label="Sources">
      <ol>
        {sources.map((s, i) => (
          <li key={i} id={`fn-${i + 1}`}>{s}</li>
        ))}
      </ol>
    </aside>
  )
}
