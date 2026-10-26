import { describe, expect, it } from 'vitest'
import { cleanToken, monthLabel, snippetParts, sourcesOf, stampDate } from './format'
import { can } from './roles'

describe('format', () => {
  it('C1-B3 trims a pasted token', () => {
    expect(cleanToken('  tw_ab cd\n')).toBe('tw_abcd')
  })
  it('sets dates in uppercase mono style, in UTC', () => {
    expect(stampDate(Date.UTC(2026, 9, 6, 23, 59))).toBe('06 OCT 2026')
    expect(monthLabel(Date.UTC(2026, 0, 31))).toBe('JAN 2026')
    expect(stampDate(null)).toBe('NEVER')
  })
  it('splits a snippet on the server marks', () => {
    expect(snippetParts('a **hit** b')).toEqual([{ text: 'a ', hit: false }, { text: 'hit', hit: true }, { text: ' b', hit: false }])
  })
  it('splits sources', () => {
    expect(sourcesOf('commit abc, PR 8 ,')).toEqual(['commit abc', 'PR 8'])
  })
})

describe('roles', () => {
  it('mirrors the server ladder', () => {
    expect(can('viewer', 'read')).toBe(true)
    expect(can('viewer', 'share')).toBe(false)
    expect(can('member', 'curate')).toBe(false)
    expect(can('editor', 'curate')).toBe(true)
    expect(can('editor', 'admin')).toBe(false)
    expect(can('owner', 'admin')).toBe(true)
    expect(can(undefined, 'read')).toBe(false)
  })
})
