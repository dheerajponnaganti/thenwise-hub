import { expect, it } from 'vitest'
import { lineDiff } from './diff'
import { supersedeProblem } from './supersede'

it('diffs by line', () => {
  expect(lineDiff('a\nb\nc', 'a\nx\nc')).toEqual([
    { type: 'same', text: 'a' }, { type: 'del', text: 'b' }, { type: 'add', text: 'x' }, { type: 'same', text: 'c' },
  ])
  expect(lineDiff('same', 'same').every((l) => l.type === 'same')).toBe(true)
  expect(lineDiff('', 'new').map((l) => l.type)).toEqual(['del', 'add'])
})

it('C3-B3 refuses a card that replaces itself, or a pending one, with a plain reason', () => {
  const old = { owner: 'alice', id: 'a' }
  expect(supersedeProblem(old, { owner: 'alice', id: 'a', status: 'active' })).toMatch(/cannot replace itself/)
  expect(supersedeProblem(old, { owner: 'bob', id: 'b', status: 'pending' })).toMatch(/waiting for review/)
  expect(supersedeProblem(old, { owner: 'bob', id: 'b', status: 'retired' })).toMatch(/retired/)
  expect(supersedeProblem(old, { owner: 'bob', id: 'b', status: 'superseded' })).toMatch(/replaced already/)
  expect(supersedeProblem(old, { owner: 'bob', id: 'b', status: 'active' })).toBeNull()
})
