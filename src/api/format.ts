const MONTHS = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC']

/** 06 OCT 2026, in UTC so every reader sees the same day. */
export function stampDate(ms: number | null | undefined): string {
  if (ms === null || ms === undefined) return 'NEVER'
  const d = new Date(ms)
  return `${String(d.getUTCDate()).padStart(2, '0')} ${MONTHS[d.getUTCMonth()]} ${d.getUTCFullYear()}`
}

/** OCT 2026, the label of a drawer tab. */
export const monthLabel = (ms: number): string => stampDate(ms).slice(3)

/** The sort key of a month: 2026-10. */
export const monthKey = (ms: number): string => new Date(ms).toISOString().slice(0, 7)

/** A pasted token loses spaces and line breaks. */
export const cleanToken = (s: string): string => s.replace(/\s+/g, '')

/** The server marks search hits with ** on both sides; this splits a snippet into plain and marked parts. */
export function snippetParts(s: string): { text: string; hit: boolean }[] {
  return s.split('**').map((text, i) => ({ text, hit: i % 2 === 1 })).filter((p) => p.text)
}

export const kindLabel = (k: string): string => ({ decision: 'DECIDED', dead_end: 'ABANDONED', rule: 'RULE', finding: 'FINDING', note: 'NOTE' })[k] ?? k.toUpperCase()

/** The source field is free text; the plugin writes comma separated ids. */
export const sourcesOf = (s: string): string[] => s.split(',').map((x) => x.trim()).filter(Boolean)
