import { expect, test, type Page } from '@playwright/test'
import { asOwner, login, makeMember, noHorizontalScroll, share, tokens } from './helpers'

const bearer = (t: string) => ({ authorization: `Bearer ${t}` })
const row = (page: Page, name: string) => page.getByRole('row').filter({ hasText: name })
const dialog = (page: Page) => page.getByRole('dialog')

test('C2-H1 admin invites by link, the invitee joins', async ({ page, context, browser }) => {
  await context.grantPermissions(['clipboard-read', 'clipboard-write'])
  await login(page, 'alice', '/members')
  await page.getByRole('button', { name: 'Invite someone' }).click()
  await dialog(page).getByLabel('Role').selectOption('editor')
  await dialog(page).getByRole('button', { name: 'Make the link' }).click()
  const link = (await page.getByTestId('secret').textContent())!
  expect(link).toMatch(/\/join\?code=twi_[0-9a-f]+$/)
  await page.getByRole('button', { name: 'Copy' }).click()
  expect(await page.evaluate(() => navigator.clipboard.readText())).toBe(link)
  await page.getByRole('button', { name: 'I have saved it' }).click()

  const guest = await browser.newContext()
  const g = await guest.newPage()
  await g.goto(link)
  await g.getByLabel('Choose a name').fill('inviteeone')
  await g.getByRole('button', { name: 'Join' }).click()
  await g.getByRole('button', { name: 'I have saved it' }).click()
  await expect(g.getByRole('list', { name: 'Projects' })).toBeVisible()
  await guest.close()

  await page.reload()
  await expect(row(page, 'inviteeone').locator('.stamp', { hasText: 'EDITOR' })).toBeVisible()
  await page.getByRole('link', { name: 'Activity' }).click()
  await expect(page.getByRole('list', { name: 'Audit log' })).toContainText('invite.create')
  await expect(page.getByRole('list', { name: 'Audit log' })).toContainText('inviteeone member.join')
  await page.getByLabel('Action').selectOption('member.join')
  await expect(page.getByRole('list', { name: 'Audit log' }).getByRole('listitem').first()).toContainText('member.join')
  await expect(page.getByRole('list', { name: 'Audit log' })).not.toContainText('invite.create')
})

test('C2-H2 remove a member and keep their cards', async ({ page, request, browser }) => {
  const m = await makeMember(request, 'leaver', 'member')
  await share(request, m.token, 'leaver-note', { title: 'Leaver note', text: 'Still here.' })
  const ctx = await browser.newContext()
  await ctx.request.post('/v1/session', { data: { token: m.token } })
  expect((await ctx.request.get('/v1/me')).status()).toBe(200)

  await login(page, 'alice', '/members')
  await page.getByRole('button', { name: 'Remove leaver' }).click()
  await dialog(page).getByRole('button', { name: 'Remove', exact: true }).click()
  await expect(page.getByText('leaver is removed.')).toBeVisible()
  await expect(page.locator('tr.struck', { hasText: 'leaver' })).toBeVisible()
  await expect(page.getByRole('button', { name: 'Remove leaver' })).toHaveCount(0)
  await page.goto('/notes/leaver/leaver-note')
  await expect(page.getByRole('heading', { name: 'Leaver note' })).toBeVisible()
  expect((await ctx.request.get('/v1/me')).status()).toBe(401)
  await ctx.close()
})

test('C2-H3 rotate a token', async ({ page, request }) => {
  const m = await makeMember(request, 'rotator', 'member')
  await login(page, 'alice', '/members')
  await page.getByRole('button', { name: 'Rotate token of rotator' }).click()
  await dialog(page).getByRole('button', { name: 'Rotate', exact: true }).click()
  const fresh = (await page.getByTestId('secret').textContent())!
  expect(fresh).toMatch(/^tw_/)
  expect(fresh).not.toBe(m.token)
  await page.getByRole('button', { name: 'I have saved it' }).click()
  await expect(page.getByTestId('secret')).toHaveCount(0)
  expect((await request.get('/v1/me', { headers: bearer(m.token) })).status()).toBe(401)
  expect((await request.get('/v1/me', { headers: bearer(fresh) })).status()).toBe(200)
})

test('C2-H4 review queue on: pending to the owner only, an admin approves', async ({ page, request, browser }) => {
  const owner = await makeMember(request, 'queuer', 'member')
  const other = await makeMember(request, 'watcher', 'member')
  await login(page, 'alice', '/settings')
  await page.getByLabel('Review queue').click()
  await expect(page.getByLabel('Review queue')).toBeChecked()
  try {
    await share(request, owner.token, 'q-1', { title: 'Queued card', text: 'Waiting.' })

    const mine = await browser.newContext()
    await mine.request.post('/v1/session', { data: { token: owner.token } })
    const mp = await mine.newPage()
    await mp.goto('/mine')
    await expect(mp.getByRole('article').filter({ hasText: 'Queued card' }).locator('.stamp', { hasText: 'PENDING' })).toBeVisible()
    await mine.close()

    const theirs = await browser.newContext()
    await theirs.request.post('/v1/session', { data: { token: other.token } })
    const tp = await theirs.newPage()
    await tp.goto('/notes/queuer/q-1')
    await expect(tp.getByText('No such card')).toBeVisible()
    await tp.goto('/search?q=Queued')
    await expect(tp.getByText('No card matches')).toBeVisible()

    await page.goto('/notes/queuer/q-1')
    await page.getByRole('button', { name: 'Approve' }).click()
    await expect(page.getByRole('button', { name: 'Approve' })).toHaveCount(0)
    await expect(page.locator('.stamp', { hasText: 'PENDING' })).toHaveCount(0)
    await tp.goto('/notes/queuer/q-1')
    await expect(tp.getByRole('heading', { name: 'Queued card' })).toBeVisible()
    await theirs.close()
  } finally {
    await request.patch('/v1/settings', { headers: asOwner(), data: { review_queue: false } })
  }
})

test('C2-H5 a viewer has no stamp actions', async ({ page }) => {
  await login(page, 'vera')
  await expect(page.getByRole('list', { name: 'Projects' })).toBeVisible()
  await expect(page.getByRole('link', { name: 'My notes' })).toHaveCount(0)
  await expect(page.getByRole('link', { name: 'Members' })).toHaveCount(0)
  for (const path of ['/', '/search?q=idempotency', '/notes/alice/idempotency-keys', '/projects/payments']) {
    await page.goto(path)
    await expect(page.getByRole('heading').first()).toBeVisible()
    await expect(page.locator('button.stamp, a.stamp')).toHaveCount(0)
  }
  await page.goto('/mine')
  await expect(page).toHaveURL(/\/$/)
  const csrf = (await page.context().cookies()).find((c) => c.name === 'tw_csrf')!.value
  const status = await page.evaluate(async (c) => (await fetch('/v1/notes/alice/idempotency-keys', { method: 'PATCH', headers: { 'content-type': 'application/json', 'if-match': '1', 'x-thenwise-csrf': c }, body: '{"title":"x"}' })).status, csrf)
  expect(status).toBe(403)
})

test('C2-B1 a member opens /members by URL', async ({ page }) => {
  const asked: string[] = []
  page.on('request', (r) => asked.push(new URL(r.url()).pathname))
  await login(page, 'bob', '/members')
  await expect(page.getByRole('heading', { name: 'Librarians only' })).toBeVisible()
  await expect(page.getByText(/forbidden|needs the admin role/i)).toHaveCount(0)
  expect(asked).not.toContain('/v1/members')
})

test('C2-B2 two admins remove the same member', async ({ page, request, browser }) => {
  const two = await makeMember(request, 'admintwo', 'admin')
  const doomed = await makeMember(request, 'doomed', 'member')
  const ctx = await browser.newContext()
  await ctx.request.post('/v1/session', { data: { token: two.token } })
  const p2 = await ctx.newPage()
  await p2.goto('/members')
  await login(page, 'alice', '/members')
  await expect(row(p2, 'doomed')).toBeVisible()

  await page.getByRole('button', { name: 'Remove doomed' }).click()
  await dialog(page).getByRole('button', { name: 'Remove', exact: true }).click()
  await expect(page.getByText('doomed is removed.')).toBeVisible()

  await p2.getByRole('button', { name: 'Remove doomed' }).click()
  await dialog(p2).getByRole('button', { name: 'Remove', exact: true }).click()
  await expect(p2.getByText('doomed was already removed.')).toBeVisible()

  const log = await (await request.get('/v1/audit?action=member.remove&limit=200', { headers: asOwner() })).json()
  expect(log.entries.filter((e: { target: string }) => e.target === `member:${doomed.id}`)).toHaveLength(1)
  await ctx.close()
})

test('C2-B3 phone: the invite slip copies and is not cut', async ({ page, context }) => {
  await context.grantPermissions(['clipboard-read', 'clipboard-write'])
  await page.setViewportSize({ width: 390, height: 800 })
  await login(page, 'alice', '/members')
  await noHorizontalScroll(page)
  await page.getByRole('button', { name: 'Invite someone' }).click()
  await dialog(page).getByRole('button', { name: 'Make the link' }).click()
  const secret = page.getByTestId('secret')
  const link = (await secret.textContent())!
  await page.getByRole('button', { name: 'Copy' }).click()
  expect(await page.evaluate(() => navigator.clipboard.readText())).toBe(link)
  const box = (await secret.boundingBox())!
  expect(box.x).toBeGreaterThanOrEqual(0)
  expect(box.x + box.width).toBeLessThanOrEqual(390)
  expect(await secret.evaluate((e) => e.scrollWidth <= e.clientWidth)).toBe(true)
  await noHorizontalScroll(page)
})

test('the ledger is one card per member on a phone', async ({ page }) => {
  await page.setViewportSize({ width: 360, height: 800 })
  await login(page, 'alice', '/members')
  await expect(row(page, 'vera')).toBeVisible()
  await noHorizontalScroll(page)
  await expect(page.getByRole('columnheader')).toHaveCount(6)
})

test('settings: rename the team and the export link', async ({ page, request }) => {
  await login(page, 'alice', '/settings')
  await page.getByLabel('Team name').fill('Reading Circle')
  await page.getByRole('button', { name: 'Save name' }).click()
  await expect(page.getByRole('link', { name: 'Reading Circle' })).toBeVisible()
  await expect(page.getByRole('link', { name: 'Export as a zip' })).toHaveAttribute('href', '/v1/export.zip')
  await request.patch('/v1/settings', { headers: asOwner(), data: { name: 'Team' } })
  expect(tokens().alice).toBeTruthy()
})
