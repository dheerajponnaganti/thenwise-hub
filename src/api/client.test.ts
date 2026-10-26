import { afterEach, expect, it, vi } from 'vitest'
import { api, ApiError } from './client'

afterEach(() => vi.unstubAllGlobals())

it('C2-H5 a 403 reads as not allowed for your role, never the raw server text', async () => {
  vi.stubGlobal('fetch', async () => new Response(JSON.stringify({ error: { code: 'forbidden', message: 'this needs the editor role' } }), { status: 403, headers: { 'content-type': 'application/json' } }))
  const err = await api.note('a', 'b').catch((e) => e)
  expect(err).toBeInstanceOf(ApiError)
  expect(err.message).toBe('Not allowed for your role.')
})

it('a stale edit carries the current revision', async () => {
  vi.stubGlobal('fetch', async () => new Response(JSON.stringify({ error: { code: 'stale', message: 'x' }, rev: 7 }), { status: 409, headers: { 'content-type': 'application/json' } }))
  const err = await api.note('a', 'b').catch((e) => e)
  expect(err.status).toBe(409)
  expect(err.body.rev).toBe(7)
})
