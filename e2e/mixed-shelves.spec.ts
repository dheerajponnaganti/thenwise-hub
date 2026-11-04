import { expect, test } from '@playwright/test'
import { login, noHorizontalScroll, tokens, watchConsole } from './helpers'

const now = Date.UTC(2026, 10, 4, 17, 0)
const q = 'Should the retry cap be 3 or 5? The pricing team never said.'

// A Copilot chat bob shared: its first turn leaves a question, its last one the tool cut off at a usage limit.
test('M1 a shared Copilot chat shows its tool, STOPPED where the tool cut it off, and its open question', async ({ page, request }) => {
  const r = await request.put('/v1/chats/cp-mixed-1', {
    headers: { authorization: `Bearer ${tokens().bob}`, 'if-match': '*' },
    data: {
      project: 'payments', head: 'Add retries with jitter to the price fetch', started_at: now - 30 * 60e3, ended_at: now, tool: 'Copilot', mask: 1,
      turns: [
        { id: 'cp-mixed-1-0', at: now - 30 * 60e3, line: 'Add retries with jitter to the price fetch', passages: [`Add retries with jitter to the price fetch\n[question] ${q}\n\nStarting with three retries and a jittered backoff.`] },
        { id: 'cp-mixed-1-1', at: now, line: 'run the tests', passages: ['run the tests\n\nThe new test fails: four calls, three expected.\n\n(stopped by the tool: premium request limit reached)'] },
      ],
    },
  })
  expect(r.ok(), await r.text()).toBeTruthy()

  const bad = watchConsole(page)
  await login(page, 'alice', '/')
  const shelf = page.getByRole('region', { name: 'Latest volumes' })
  const vol = shelf.getByRole('article', { name: 'Chat by bob' })
  await expect(vol).toContainText('Copilot')
  await expect(vol).toContainText('STOPPED')
  await expect(vol).toContainText('premium request limit reached')

  await vol.getByRole('link', { name: /Add retries with jitter/ }).click()
  await expect(page.locator('.spine')).toContainText('STOPPED')
  const last = page.getByRole('article', { name: 'Leaf 2' })
  await expect(last).toContainText('Stopped by the tool: premium request limit reached')
  await expect(last).not.toContainText('(stopped by the tool:')
  const first = page.getByRole('article', { name: 'Leaf 1' })
  await expect(first).toContainText('OPEN QUESTION')
  await expect(first).toContainText('q-fa41')
  await noHorizontalScroll(page)
  // On a phone, the shelf and the leaves still fit with no sideways scroll.
  await page.setViewportSize({ width: 375, height: 812 })
  await noHorizontalScroll(page)
  await page.goto('/')
  await expect(page.getByRole('region', { name: 'Latest volumes' })).toContainText('STOPPED')
  await noHorizontalScroll(page)
  expect(bad).toEqual([])
})
