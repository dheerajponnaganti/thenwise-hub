// What a shared turn's text marks, read the same way thenwise reads it (src/ingest/deadend.ts and parts.ts): the line a
// tool leaves when it stops a chat, and [question] / [answer] lines that agents leave for whoever picks the work up.
import type { Turn } from './client'

const STOP = /^\(stopped by the tool: (.*)\)$/m

/** Why the tool stopped this turn (a usage limit, an error), or undefined. */
export const stopOf = (text: string): string | undefined => STOP.exec(text)?.[1]?.trim()
/** The text without the stop line, which the leaf shows as a stamp instead. */
export const withoutStop = (text: string): string => text.replace(/\n*^\(stopped by the tool: .*\)$\n*/m, '\n').trim()

export const questionsOf = (text: string): string[] => [...text.matchAll(/^\s*\[question\]\s*(\S.*)$/gim)].map((m) => m[1]!.trim().slice(0, 300))
export const answersOf = (text: string): { id: string; text: string }[] =>
  [...text.matchAll(/^\s*\[answer(?:\s+(q-[0-9a-f]{4}))?\]\s*(\S.*)$/gim)].map((m) => ({ id: m[1] ?? '', text: m[2]!.trim().slice(0, 300) }))

/** A question's short id, the same one thenwise prints: q- and four hex digits of the SHA-1 of its text. */
export async function questionId(q: string): Promise<string> {
  const d = await crypto.subtle.digest('SHA-1', new TextEncoder().encode(q.toLowerCase().replace(/\s+/g, ' ').trim()))
  return `q-${[...new Uint8Array(d).slice(0, 2)].map((b) => b.toString(16).padStart(2, '0')).join('')}`
}

const grams = (s: string) => {
  const t = ` ${s.toLowerCase().replace(/[^\p{L}\p{N}]+/gu, ' ').trim()} `
  const g = new Set<string>()
  for (let i = 0; i + 3 <= t.length; i++) g.add(t.slice(i, i + 3))
  return g
}
/** Trigram overlap, as thenwise uses to match an [answer] that names its question instead of giving the id. */
export function trigramSim(a: string, b: string): number {
  const x = grams(a), y = grams(b)
  let both = 0
  for (const g of x) if (y.has(g)) both++
  return both / (x.size + y.size - both || 1)
}

export type Question = { id: string; text: string; answered: boolean }
export const turnText = (t: Pick<Turn, 'passages'>) => t.passages.join('\n\n')

/** Each turn's questions, and whether a later turn of the same chat answered it (by id, or by naming it closely). */
export async function chatQuestions(turns: Pick<Turn, 'id' | 'passages'>[]): Promise<Record<string, Question[]>> {
  const out: Record<string, Question[]> = {}
  for (const [i, t] of turns.entries()) {
    const qs = questionsOf(turnText(t))
    if (!qs.length) continue
    const later = turns.slice(i + 1).flatMap((u) => answersOf(turnText(u)))
    out[t.id] = await Promise.all(qs.map(async (text) => {
      const id = await questionId(text)
      return { id, text, answered: later.some((a) => a.id === id || (!a.id && trigramSim(a.text, text) >= 0.5)) }
    }))
  }
  return out
}
