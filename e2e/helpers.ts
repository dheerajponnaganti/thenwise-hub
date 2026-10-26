import { expect, type APIRequestContext, type Page } from '@playwright/test'
import { readFileSync } from 'node:fs'

export const tokens = (): Record<string, string> => JSON.parse(readFileSync('.e2e/state.json', 'utf8')).tokens
const auth = (t: string) => ({ authorization: `Bearer ${t}` })

/** Signs in through the API so the browser holds the cookies, then opens a page. */
export async function login(page: Page, who: string, path = '/') {
  const res = await page.request.post('/v1/session', { data: { token: tokens()[who] } })
  expect(res.ok()).toBeTruthy()
  await page.goto(path)
}

/** Fails the test on any console error or page error. Call before the first goto. */
export function watchConsole(page: Page): string[] {
  const bad: string[] = []
  page.on('console', (m) => m.type() === 'error' && bad.push(m.text()))
  page.on('pageerror', (e) => bad.push(String(e)))
  return bad
}

/** Makes a member through the API as the owner and returns its name, id and token. */
export async function makeMember(request: APIRequestContext, name: string, role: string) {
  const inv = await request.post('/v1/invites', { headers: auth(tokens().alice!), data: { role, days: 1 } })
  const { code } = await inv.json()
  const j = await request.post('/v1/join', { data: { code, name } })
  const m = await j.json()
  return { ...m, code } as { id: string; name: string; role: string; token: string; code: string }
}

export const asOwner = () => auth(tokens().alice!)
export const asMember = (token: string) => auth(token)

/** Shares a note as a given member. */
export async function share(request: APIRequestContext, token: string, id: string, n: Record<string, unknown>) {
  const r = await request.put(`/v1/notes/${id}`, { headers: { ...auth(token), 'if-match': '*' }, data: { project: 'payments', ...n } })
  expect(r.ok(), await r.text()).toBeTruthy()
}

export async function noHorizontalScroll(page: Page) {
  const w = await page.evaluate(() => ({ s: document.documentElement.scrollWidth, c: document.documentElement.clientWidth }))
  expect(w.s).toBeLessThanOrEqual(w.c)
}
