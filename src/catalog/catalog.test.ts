import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'
import { byMonth } from './Drawer'

const css = readFileSync('src/catalog/tokens.css', 'utf8')
const lum = (hex: string) => {
  const [r, g, b] = [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16) / 255).map((c) => (c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4))
  return 0.2126 * r! + 0.7152 * g! + 0.0722 * b!
}
const ratio = (a: string, b: string) => {
  const [x, y] = [lum(a), lum(b)].sort((p, q) => q - p)
  return (x! + 0.05) / (y! + 0.05)
}
/** Blends a colour with an 8 digit hex alpha over a solid one. */
const over = (fg: string, bg: string) => {
  const a = parseInt(fg.slice(7, 9), 16) / 255
  return '#' + [1, 3, 5].map((i) => Math.round(parseInt(fg.slice(i, i + 2), 16) * a + parseInt(bg.slice(i, i + 2), 16) * (1 - a)).toString(16).padStart(2, '0')).join('')
}
const block = (selector: string) => {
  const start = css.indexOf(selector)
  const body = css.slice(css.indexOf('{', start) + 1, css.indexOf('}', start))
  return Object.fromEntries([...body.matchAll(/--([\w-]+):\s*(#[0-9a-f]+)/gi)].map((m) => [m[1]!, m[2]!])) as Record<string, string>
}

describe.each([['reading room', ':root,'], ['night archive', "[data-theme='dark'] {"]])('contrast, %s', (_n, sel) => {
  const t = block(sel)
  it('C1-H6 has every token', () => {
    for (const k of ['paper', 'card', 'ink', 'ink-muted', 'rule', 'stamp', 'archive-blue', 'highlighter']) expect(t[k], k).toBeTruthy()
  })
  it('C1-H6 keeps text at 4.5:1 or better', () => {
    for (const bg of ['paper', 'card']) for (const fg of ['ink', 'ink-muted', 'stamp', 'archive-blue']) expect(ratio(t[fg]!, t[bg]!), `${fg} on ${bg}`).toBeGreaterThanOrEqual(4.5)
    for (const bg of ['paper', 'card']) expect(ratio(t.ink!, over(t.highlighter!, t[bg]!)), `ink on highlighter over ${bg}`).toBeGreaterThanOrEqual(4.5)
    expect(ratio(t.card!, t.stamp!), 'card on stamp button').toBeGreaterThanOrEqual(4.5)
  })
})

it('C1-H6 the dark column matches the brief', () => {
  const t = block("[data-theme='dark'] {")
  expect(t).toMatchObject({ paper: '#14161b', card: '#1c1f26', ink: '#e9e4da', 'archive-blue': '#8fb3d9' })
})

it('C1-B5 every animation has a reduced-motion switch', () => {
  const all = readFileSync('src/catalog/catalog.css', 'utf8')
  const reduce = all.slice(all.indexOf('@media (prefers-reduced-motion: reduce)'))
  const animated = [...all.matchAll(/(\.[\w-]+)[^{}]*\{[^}]*animation:/g)].map((m) => m[1]!)
  expect(animated.length).toBeGreaterThan(0)
  for (const cls of new Set(animated)) expect(reduce, cls).toContain(cls)
  expect(reduce).toContain('animation: none !important')
})

describe('drawer', () => {
  it('groups cards by month in order', () => {
    const g = byMonth([{ updated_at: Date.UTC(2026, 9, 2) }, { updated_at: Date.UTC(2026, 9, 1) }, { updated_at: Date.UTC(2026, 8, 30) }])
    expect(g.map((x) => [x.label, x.items.length])).toEqual([['OCT 2026', 2], ['SEP 2026', 1]])
  })
})
