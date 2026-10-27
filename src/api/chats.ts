import type { SharedProject, Turn } from './client'

/** The reply text of a turn. The first passage starts with the prompt; the card heading already shows its first line. */
export function leafBody(t: Pick<Turn, 'line' | 'passages'>): string {
  const [first = '', ...rest] = t.passages
  const line = t.line?.trim()
  const head = line && first.trimStart().startsWith(line) ? first.trimStart().slice(line.length).trimStart() : first
  return [head, ...rest].filter(Boolean).join('\n\n')
}

/** The label on a volume's spine: the first prompt on one line, cut at a word. */
export function spineLabel(head: string, max = 90): string {
  const one = head.replace(/\s+/g, ' ').trim()
  if (!one) return 'Untitled chat'
  if (one.length <= max) return one
  const cut = one.slice(0, max)
  return `${cut.slice(0, cut.lastIndexOf(' ') > max / 2 ? cut.lastIndexOf(' ') : max)}…`
}

export function byteLabel(n: number): string {
  if (n < 1024) return `${n} B`
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} KB`
  return `${(n / 1024 / 1024).toFixed(1)} MB`
}

/** Total chats and bytes a member shares, from the server's shared project list. */
export function sharesOf(projects: SharedProject[], owner: string): { projects: number; chats: number; bytes: number } {
  const mine = projects.filter((p) => p.owner === owner)
  return { projects: mine.length, chats: mine.reduce((a, p) => a + p.chats, 0), bytes: mine.reduce((a, p) => a + p.bytes, 0) }
}

export const volumePath = (owner: string, session: string, turn?: string): string =>
  `/chats/${encodeURIComponent(owner)}/${encodeURIComponent(session)}${turn ? `#${encodeURIComponent(`leaf-${turn}`)}` : ''}`

export const leafId = (turn: string): string => `leaf-${turn}`
