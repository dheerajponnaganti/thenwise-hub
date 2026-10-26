import { expect, test } from '@playwright/test'
import { asOwner, login, makeMember, noHorizontalScroll, watchConsole } from './helpers'

test('C1-H1 invite link, choose a name, land on Home', async ({ page, request }) => {
  const bad = watchConsole(page)
  const inv = await (await request.post('/v1/invites', { headers: asOwner(), data: { role: 'member', days: 1 } })).json()
  await page.goto(`/join?code=${inv.code}`)
  await page.getByLabel('Choose a name').fill('newbie')
  await page.getByRole('button', { name: 'Join' }).click()
  await expect(page.getByTestId('join-token')).toContainText('tw_')
  await page.getByRole('button', { name: 'Open the cabinet' }).click()
  await expect(page.getByRole('list', { name: 'Projects' }).getByRole('link')).toHaveCount(3)
  expect(bad).toEqual([])
})

test('C1-H2 search a word in a note body', async ({ page }) => {
  await login(page, 'bob')
  await page.getByLabel('Search the catalog').fill('zebrafish')
  await page.getByRole('button', { name: 'Search' }).click()
  const hit = page.locator('mark', { hasText: /zebrafish/i })
  await expect(hit).toBeVisible()
  await page.getByRole('link', { name: 'Webhook order is not guaranteed' }).click()
  await expect(page.getByText('The provider can deliver a refund before the charge.')).toBeVisible()
})

test('C1-H3 note page', async ({ page, context }) => {
  await context.grantPermissions(['clipboard-read', 'clipboard-write'])
  await login(page, 'bob', '/notes/alice/webhook-order')
  const card = page.getByRole('article')
  await expect(card.getByText('alice/webhook-order').first()).toBeVisible()
  await expect(card.locator('.datestamp')).toHaveText(/^\d\d [A-Z]{3} 2026$/)
  await expect(card.locator('.stamp', { hasText: 'FINDING' })).toBeVisible()
  await expect(page.getByRole('definition').filter({ hasText: 'alice' })).toBeVisible()
  await expect(page.getByRole('complementary', { name: 'Sources' })).toContainText('chat 2026-10-05')
  await page.getByRole('button', { name: 'Copy link' }).click()
  expect(await page.evaluate(() => navigator.clipboard.readText())).toBe('/notes/alice/webhook-order')
})

test('C1-H4 project drawer with month tabs', async ({ page }) => {
  await login(page, 'bob', '/projects/payments')
  await expect(page.getByRole('heading', { level: 2 }).filter({ hasText: /^(AUG|SEP|OCT) 2026$/ })).toHaveCount(3)
  const cards = page.getByRole('article')
  await expect(cards).toHaveCount(3)
  await page.getByRole('button', { name: 'AUG 2026' }).click()
  await expect(page.getByRole('heading', { name: 'AUG 2026' })).toBeFocused()
  // Filed by date, newest first.
  await expect(cards.first()).toContainText('Webhook order')
  await expect(cards.last()).toContainText('idempotency keys')
})

test('C1-H5 phone viewport, no horizontal scroll', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 800 })
  await page.goto('/signin')
  await noHorizontalScroll(page)
  await login(page, 'alice')
  for (const path of ['/', '/search?q=webhook', '/notes/alice/idempotency-keys', '/projects/payments', '/mine']) {
    await page.goto(path)
    await expect(page.getByRole('main')).not.toBeEmpty()
    await expect(page.getByRole('heading').first()).toBeVisible()
    await noHorizontalScroll(page)
  }
  await page.goto('/')
  await expect(page.getByLabel('Search the catalog')).toBeInViewport()
})

test('C1-B1 script and onerror image stay text', async ({ page }) => {
  const dialogs: string[] = []
  const requests: string[] = []
  page.on('dialog', (d) => { dialogs.push(d.message()); void d.dismiss() })
  page.on('request', (r) => { if (!r.url().startsWith('http://127.0.0.1')) requests.push(r.url()) })
  await login(page, 'bob', '/notes/alice/markup-test')
  await expect(page.locator('.prose')).toContainText('<script>window.__pwned=1')
  await expect(page.locator('.prose')).toContainText('<img src=x onerror=')
  await page.waitForTimeout(300)
  expect(dialogs).toEqual([])
  expect(requests).toEqual([])
  expect(await page.evaluate(() => (window as unknown as { __pwned?: number }).__pwned)).toBeUndefined()
  expect(await page.locator('.prose img, .prose script').count()).toBe(0)
})

test('C1-B2 expired session mid-use goes back to the card desk', async ({ page, context, request }) => {
  const m = await makeMember(request, 'shortlived', 'member')
  await page.request.post('/v1/session', { data: { token: m.token } })
  await page.goto('/')
  await expect(page.getByRole('list', { name: 'Projects' })).toBeVisible()
  await context.clearCookies()
  await page.getByRole('list', { name: 'Projects' }).getByRole('link').first().click()
  await expect(page).toHaveURL(/\/signin$/)
  await expect(page.getByRole('status')).toContainText('Your session ended')
  await expect(page.getByRole('heading', { name: 'Sign in' })).toBeVisible()
})

test('sign in with a pasted token that has spaces and a newline', async ({ page }) => {
  const m = await makeMember(page.request, 'pasty', 'member')
  await page.goto('/signin')
  await page.getByLabel('Token').fill(`  ${m.token.slice(0, 10)} ${m.token.slice(10)}\n`)
  await page.getByRole('button', { name: 'Sign in' }).click()
  await expect(page.getByRole('list', { name: 'Projects' })).toBeVisible()
})

test('a wrong token says so', async ({ page }) => {
  await page.goto('/signin')
  await page.getByLabel('Token').fill('nope')
  await page.getByRole('button', { name: 'Sign in' }).click()
  await expect(page.getByRole('alert')).toContainText('not valid')
})

test('reduced motion turns the animations off', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' })
  await login(page, 'bob', '/notes/alice/idempotency-keys')
  await expect(page.getByRole('article')).toBeVisible()
  expect(await page.locator('.card').evaluate((e) => getComputedStyle(e).animationName)).toBe('none')
  expect(await page.locator('.stamp').first().evaluate((e) => getComputedStyle(e).animationName)).toBe('none')
})

test('the catalog page shows both themes', async ({ page }) => {
  const bad = watchConsole(page)
  await page.goto('/catalog')
  await expect(page.getByRole('region', { name: 'Reading room' })).toBeVisible()
  await expect(page.getByRole('region', { name: 'Night archive' })).toBeVisible()
  expect(bad).toEqual([])
})

test('unshare dialog opens without console errors (CSP)', async ({ page, request }) => {
  const bad = watchConsole(page)
  const m = await makeMember(request, 'sharer', 'member')
  await request.put('/v1/notes/tmp-1', { headers: { authorization: `Bearer ${m.token}`, 'if-match': '*' }, data: { title: 'Temp card', text: 'x', project: 'scratch' } })
  await page.request.post('/v1/session', { data: { token: m.token } })
  await page.goto('/mine')
  await page.getByRole('button', { name: 'Unshare Temp card' }).click()
  await expect(page.getByRole('dialog')).toBeVisible()
  await page.getByRole('button', { name: 'Unshare', exact: true }).last().click()
  await expect(page.getByText('You have not shared a card yet.')).toBeVisible()
  expect(bad).toEqual([])
})
