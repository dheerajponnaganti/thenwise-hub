import { expect, test, type Page } from '@playwright/test'
import { execFileSync } from 'node:child_process'
import { existsSync, mkdtempSync, readdirSync, readFileSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { asOwner, login, makeMember, share, tokens } from './helpers'

const dialog = (page: Page) => page.getByRole('dialog')
const bearer = (t: string) => ({ authorization: `Bearer ${t}` })

async function author(request: import('@playwright/test').APIRequestContext, name: string, notes: Record<string, { title: string; text: string }>) {
  const m = await makeMember(request, name, 'member')
  for (const [id, n] of Object.entries(notes)) await share(request, m.token, id, n)
  return m
}

test('C3-H1 edit a card: a new revision, the old text in history, the audit line names the editor', async ({ page, request }) => {
  await author(request, 'writer1', { 'edit-me': { title: 'Edit me', text: 'First version.' } })
  await login(page, 'edie', '/notes/writer1/edit-me')
  await page.getByRole('button', { name: 'Edit', exact: true }).click()
  await page.getByLabel('Text (Markdown)').fill('Second version.')
  await page.getByRole('button', { name: 'Save' }).click()
  await expect(page.getByText('Second version.')).toBeVisible()
  await page.getByText('Circulation history').click()
  const hist = page.getByRole('list', { name: 'Revisions' })
  await expect(hist.getByRole('listitem')).toHaveCount(2)
  await expect(hist).toContainText('edited by edie')
  await hist.getByRole('button', { name: 'Open rev' }).last().click()
  await expect(page.locator('.oldtext')).toHaveText('First version.')
  const log = await (await request.get('/v1/audit?action=note.edit&limit=50', { headers: asOwner() })).json()
  expect(log.entries.some((e: { target: string; actor_name: string }) => e.target === 'note:writer1/edit-me' && e.actor_name === 'edie')).toBe(true)
})

test('C3-H2 supersede A by B', async ({ page, request }) => {
  await author(request, 'writer2', {
    'sup-a': { title: 'Gamma legacy approach', text: 'Old way.' },
    'sup-b': { title: 'Gamma fresh approach', text: 'New way.' },
  })
  await login(page, 'edie', '/notes/writer2/sup-a')
  await page.getByRole('button', { name: 'Superseded by →' }).click()
  await dialog(page).getByLabel('Search for the newer card').fill('fresh')
  await dialog(page).getByRole('button', { name: 'Search', exact: true }).click()
  await dialog(page).getByRole('button', { name: /Gamma fresh approach/ }).click()
  const slip = page.getByRole('link', { name: /SUPERSEDED BY →/ })
  await expect(slip).toBeVisible()
  await page.goto('/search?q=legacy')
  await expect(page.getByText('No card matches')).toBeVisible()
  await page.getByLabel('Include retired and superseded cards').check()
  await expect(page.getByRole('link', { name: 'Gamma legacy approach' })).toBeVisible()
  await page.getByRole('link', { name: 'Gamma legacy approach' }).click()
  await page.getByRole('link', { name: /SUPERSEDED BY →/ }).click()
  await expect(page.getByRole('heading', { name: 'Gamma fresh approach' })).toBeVisible()
  // The change travels in the since feed too.
  const feed = await (await request.get('/v1/notes?since=0&limit=200', { headers: bearer(tokens().bob!) })).json()
  expect(feed.notes.find((n: { id: string }) => n.id === 'sup-a').status).toBe('superseded')
})

test('C3-H3 pin two cards: start here lists them in pin order', async ({ page, request }) => {
  await author(request, 'writer3', { 'pin-1': { title: 'Pin one', text: 'a' }, 'pin-2': { title: 'Pin two', text: 'b' } })
  await login(page, 'edie', '/notes/writer3/pin-1')
  await page.getByRole('button', { name: 'Pinned', exact: true }).click()
  await expect(page.getByRole('button', { name: 'Unpin' })).toBeVisible()
  await page.goto('/notes/writer3/pin-2')
  await page.getByRole('button', { name: 'Pinned', exact: true }).click()
  await expect(page.getByRole('button', { name: 'Unpin' })).toBeVisible()
  await page.goto('/')
  const items = await page.getByRole('region', { name: 'Start here' }).getByRole('listitem').allTextContents()
  const a = items.findIndex((t) => t.includes('Pin one'))
  const b = items.findIndex((t) => t.includes('Pin two'))
  expect(a).toBeGreaterThanOrEqual(0)
  expect(b).toBeGreaterThan(a)
})

test('C3-H4 review queue: pending for the owner only, approve from the Pending tray', async ({ page, request, browser }) => {
  const m = await makeMember(request, 'writer4', 'member')
  await login(page, 'alice', '/settings')
  await page.getByLabel('Review queue').click()
  await expect(page.getByLabel('Review queue')).toBeChecked()
  try {
    await share(request, m.token, 'wait-1', { title: 'Waiting card', text: 'Please review.' })
    await share(request, m.token, 'wait-2', { title: 'Unwanted card', text: 'Please refuse.' })
    const before = await (await request.get('/v1/notes?since=0&limit=200', { headers: asOwner() })).json()
    expect(before.notes.some((n: { id: string }) => n.id === 'wait-1')).toBe(false)

    const mine = await browser.newContext()
    await mine.request.post('/v1/session', { data: { token: m.token } })
    const mp = await mine.newPage()
    await mp.goto('/mine')
    await expect(mp.getByRole('article').filter({ hasText: 'Waiting card' }).locator('.stamp', { hasText: 'PENDING' })).toBeVisible()
    await mine.close()

    await page.goto('/')
    await page.getByRole('link', { name: 'Pending' }).click()
    await page.getByRole('button', { name: 'Approve Waiting card' }).click()
    await expect(page.getByRole('link', { name: 'Waiting card' })).toHaveCount(0)
    await page.getByRole('button', { name: 'Refuse Unwanted card' }).click()
    await expect(page.getByText('The tray is empty')).toBeVisible()

    const after = await (await request.get('/v1/notes?since=0&limit=200', { headers: asOwner() })).json()
    expect(after.notes.some((n: { id: string }) => n.id === 'wait-1')).toBe(true)
    await page.goto('/')
    await expect(page.getByRole('link', { name: 'Waiting card' })).toBeVisible()
  } finally {
    await request.patch('/v1/settings', { headers: asOwner(), data: { review_queue: false } })
  }
})

test('C3-H5 export opens as a folder of cards with working links', async ({ page, request }) => {
  await login(page, 'alice', '/settings')
  const [dl] = await Promise.all([page.waitForEvent('download'), page.getByRole('link', { name: 'Export as a zip' }).click()])
  expect(dl.suggestedFilename()).toBe('thenwise-export.zip')

  const res = await request.get('/v1/export.zip', { headers: asOwner() })
  expect(res.headers()['content-type']).toBe('application/zip')
  const dir = mkdtempSync(join(tmpdir(), 'hub-export-'))
  writeFileSync(join(dir, 'x.zip'), await res.body())
  execFileSync('unzip', ['-q', join(dir, 'x.zip'), '-d', join(dir, 'out')])
  const out = join(dir, 'out')
  let cards = 0
  for (const proj of readdirSync(out)) {
    const files = readdirSync(join(out, proj))
    expect(files).toContain('Index.md')
    for (const f of files.filter((x) => x !== 'Index.md')) {
      cards++
      const text = readFileSync(join(out, proj, f), 'utf8')
      expect(text).toMatch(/^---\nthenwise: 1\nproject: .*\nsources: \[.*\]\nshared_by: .*\nkind: \w+\nstatus: \w+\n---\n/)
    }
    const links = [...readFileSync(join(out, proj, 'Index.md'), 'utf8').matchAll(/\[\[([^|\]]+)\|/g)].map((m) => m[1]!)
    expect(links.length).toBeGreaterThan(0)
    for (const l of links) expect(existsSync(join(out, proj, `${l}.md`)), l).toBe(true)
  }
  expect(cards).toBeGreaterThanOrEqual(7)
})

test('C3-H6 restore an old revision', async ({ page, request }) => {
  await author(request, 'writer6', { 'restore-me': { title: 'Restore me', text: 'Original text.' } })
  await login(page, 'edie', '/notes/writer6/restore-me')
  await page.getByRole('button', { name: 'Edit', exact: true }).click()
  await page.getByLabel('Text (Markdown)').fill('Changed text.')
  await page.getByRole('button', { name: 'Save' }).click()
  await expect(page.getByText('Changed text.')).toBeVisible()
  await page.getByText('Circulation history').click()
  await page.getByRole('button', { name: 'Restore rev' }).last().click()
  await expect(page.getByText('Original text.').first()).toBeVisible()
  const revs = await (await request.get('/v1/notes/writer6/restore-me/revisions', { headers: asOwner() })).json()
  expect(revs.revisions).toHaveLength(3)
  expect(revs.revisions[0].text).toBe('Original text.')
  expect(revs.revisions.map((r: { text: string }) => r.text)).toContain('Changed text.')
  await expect(page.getByRole('list', { name: 'Revisions' }).getByRole('listitem')).toHaveCount(3)
})

test('C3-B1 two editors edit one card: the second sees the conflict, takes theirs over, nothing is lost', async ({ page, request, browser }) => {
  await author(request, 'writer7', { 'clash': { title: 'Clash', text: 'line one\nline two' } })
  const two = await makeMember(request, 'edtwo', 'editor')
  const ctx = await browser.newContext()
  await ctx.request.post('/v1/session', { data: { token: two.token } })
  const p2 = await ctx.newPage()

  await login(page, 'edie', '/notes/writer7/clash')
  await page.getByRole('button', { name: 'Edit', exact: true }).click()
  await p2.goto('/notes/writer7/clash')
  await p2.getByRole('button', { name: 'Edit', exact: true }).click()

  await p2.getByLabel('Text (Markdown)').fill('line one\nline two by edtwo')
  await p2.getByRole('button', { name: 'Save' }).click()
  await expect(p2.getByText('line two by edtwo')).toBeVisible()

  await page.getByLabel('Text (Markdown)').fill('line one\nline two by edie')
  await page.getByRole('button', { name: 'Save' }).click()
  const conflict = page.getByRole('region', { name: 'Conflict' })
  await expect(conflict).toContainText('Someone edited this card')
  await expect(conflict.getByLabel('Difference')).toContainText('line two by edtwo')
  await expect(conflict.getByLabel('Difference')).toContainText('line two by edie')
  // Nothing was overwritten yet.
  expect((await (await request.get('/v1/notes/writer7/clash', { headers: asOwner() })).json()).text).toBe('line one\nline two by edtwo')

  await conflict.getByRole('button', { name: 'Take mine over it' }).click()
  await expect(page.locator('.prose')).toContainText('line two by edie')
  await expect(page.getByRole('region', { name: 'Conflict' })).toHaveCount(0)
  const revs = (await (await request.get('/v1/notes/writer7/clash/revisions', { headers: asOwner() })).json()).revisions
  expect(revs.map((r: { text: string }) => r.text)).toEqual(['line one\nline two by edie', 'line one\nline two by edtwo', 'line one\nline two'])
  await ctx.close()
})

test('C3-B2 a member sees no stamps and a forged PATCH is refused', async ({ page }) => {
  await login(page, 'bob', '/notes/alice/idempotency-keys')
  await expect(page.getByRole('heading', { name: 'Use idempotency keys on payments' })).toBeVisible()
  await expect(page.getByRole('group', { name: 'Stamp tray' })).toHaveCount(0)
  await expect(page.locator('button.stamp')).toHaveCount(0)
  const csrf = (await page.context().cookies()).find((c) => c.name === 'tw_csrf')!.value
  const status = await page.evaluate(async (c) => (await fetch('/v1/notes/alice/idempotency-keys', { method: 'PATCH', headers: { 'content-type': 'application/json', 'if-match': '2', 'x-thenwise-csrf': c }, body: '{"title":"x"}' })).status, csrf)
  expect(status).toBe(403)
})

test('C3-B4 phone: the stamp tray and the picker are within reach', async ({ page, request }) => {
  await author(request, 'writer8', { 'phone-a': { title: 'Delta first', text: 'a' }, 'phone-b': { title: 'Delta second', text: 'b' } })
  await page.setViewportSize({ width: 390, height: 780 })
  await login(page, 'edie', '/notes/writer8/phone-a')
  const tray = page.getByRole('group', { name: 'Stamp tray' })
  await expect(tray).toBeVisible()
  for (const b of await tray.getByRole('button').all()) {
    const box = (await b.boundingBox())!
    expect(box.x).toBeGreaterThanOrEqual(0)
    expect(box.x + box.width).toBeLessThanOrEqual(390)
    expect(box.height).toBeGreaterThanOrEqual(44)
  }
  await page.getByRole('button', { name: 'Superseded by →' }).click()
  const d = dialog(page)
  await d.getByLabel('Search for the newer card').fill('second')
  await d.getByRole('button', { name: 'Search', exact: true }).click()
  const pick = d.getByRole('button', { name: /Delta second/ })
  await expect(pick).toBeVisible()
  const db = (await d.boundingBox())!
  expect(db.y + db.height).toBeGreaterThan(780 - 4) // the slip sits at the bottom, under the thumb
  const pb = (await pick.boundingBox())!
  expect(pb.y).toBeGreaterThan(780 / 3)
  expect(pb.height).toBeGreaterThanOrEqual(44)
  await pick.click()
  await expect(page.getByRole('link', { name: /SUPERSEDED BY →/ })).toBeVisible()
  const w = await page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth)
  expect(w).toBe(true)
})

test('project timeline lists decisions and dead ends by date', async ({ page }) => {
  await login(page, 'bob', '/projects/payments')
  await page.getByRole('tab', { name: 'Timeline' }).click()
  const lines = page.locator('.timeline-line')
  await expect(lines).toHaveCount(2)
  await expect(lines.first()).toContainText('Retry storms')
  await expect(page.getByRole('button', { name: 'AUG 2026' })).toBeVisible()
  await expect(page.getByText('Webhook order is not guaranteed')).toHaveCount(0)
})
