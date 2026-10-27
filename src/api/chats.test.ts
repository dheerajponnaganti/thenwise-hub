import { describe, expect, it } from 'vitest'
import { allChats, type ChatBrief, type SharedProject } from './client'
import { byteLabel, leafBody, sharesOf, spineLabel, volumePath } from './chats'

const chat = (rev: number, started_at = rev): ChatBrief => ({ owner: 'a', session: `s${rev}`, project: 'p', rev, started_at, ended_at: started_at, head: 'h', mask: 1, bytes: 1, turn_count: 0 })

describe('chat helpers', () => {
  it('C4-H1 drops the prompt line from the first passage', () => {
    expect(leafBody({ line: 'Why shards?', passages: ['Why shards?\n\nBecause of load.', 'More.'] })).toBe('Because of load.\n\nMore.')
    expect(leafBody({ line: 'x', passages: ['Other'] })).toBe('Other')
  })
  it('C4-H1 cuts a spine label at a word', () => {
    expect(spineLabel('  one\n two ')).toBe('one two')
    expect(spineLabel('word '.repeat(40), 20).endsWith('…')).toBe(true)
    expect(spineLabel('')).toBe('Untitled chat')
  })
  it('formats sizes', () => {
    expect([byteLabel(10), byteLabel(2048), byteLabel(3 * 1024 * 1024)]).toEqual(['10 B', '2.0 KB', '3.0 MB'])
  })
  it('C4-H4 adds up one member\'s shares', () => {
    const p = (owner: string, chats: number, bytes: number) => ({ owner, project: 'x', since: 0, status: 'active', last_push: 0, chats, bytes }) satisfies SharedProject
    expect(sharesOf([p('a', 2, 10), p('a', 1, 5), p('b', 9, 9)], 'a')).toEqual({ projects: 2, chats: 3, bytes: 15 })
  })
  it('C4-H2 links a hit to its leaf', () => {
    expect(volumePath('al ice', 's/1', 't1')).toBe('/chats/al%20ice/s%2F1#leaf-t1')
  })
})

describe('allChats', () => {
  it('pages by revision until a short page, newest chat first', async () => {
    const seen: number[] = []
    const pages = [Array.from({ length: 50 }, (_, i) => chat(i + 1)), [chat(51)]]
    const out = await allChats('p', 'include', async ({ since, mine, ...rest }) => { expect(rest).not.toHaveProperty('full'); expect(mine).toBe('include'); seen.push(since ?? -1); return pages.shift() ?? [] })
    expect(seen).toEqual([0, 50])
    expect(out).toHaveLength(51)
    expect(out[0]!.rev).toBe(51)
  })
})
