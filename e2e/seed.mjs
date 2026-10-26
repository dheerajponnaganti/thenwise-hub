// Fills a fresh team folder before the server starts. The server's own code runs here with a moved clock,
// so the cards are filed in different months. Set THENWISE_SRC to the thenwise checkout (0.1.12 or later).
import { pathToFileURL } from 'node:url'
import { join } from 'node:path'

const DAY = 864e5

export async function seed(dir, src) {
  const mod = await import(pathToFileURL(join(src, 'src/teams/server.ts')).href)
  const people = [['alice', 'owner'], ['bob', 'member'], ['edie', 'editor'], ['vera', 'viewer']]
  const db = mod.openTeamDb(dir)
  const tokens = {}
  for (const [name, role] of people) tokens[name] = mod.invite(db, name, undefined, { role })
  db.close()

  let clock = Date.UTC(2026, 6, 14)
  const app = mod.createTeamServer({ dir, now: () => clock })
  const { port } = await app.listen()
  const put = async (who, id, n) => {
    clock += DAY
    const res = await fetch(`http://127.0.0.1:${port}/v1/notes/${id}`, { method: 'PUT', headers: { authorization: `Bearer ${tokens[who]}`, 'content-type': 'application/json', 'if-match': '*' }, body: JSON.stringify(n) })
    if (!res.ok) throw new Error(`seed ${id}: ${res.status} ${await res.text()}`)
  }
  const at = (y, m, d) => { clock = Date.UTC(y, m, d) }
  at(2026, 6, 20)
  await put('alice', 'backups-nightly', { title: 'Backups run nightly', project: 'infra', kind: 'decision', text: 'Database backups run at 02:00 UTC. We keep fourteen days.' })
  at(2026, 7, 11)
  await put('alice', 'idempotency-keys', { title: 'Use idempotency keys on payments', project: 'payments', kind: 'decision', source: 'commit abc1234, PR 88', tags: ['api'], text: 'Every charge request carries an idempotency key. The server stores the key for a day.\n\n- Retries are safe.\n- Keys are per customer.' })
  at(2026, 8, 3)
  await put('alice', 'retry-storms', { title: 'Retry storms took the queue down', project: 'payments', kind: 'dead_end', text: 'Exponential retry without jitter made a storm. We dropped the plan.' })
  at(2026, 9, 5)
  await put('alice', 'webhook-order', { title: 'Webhook order is not guaranteed', project: 'payments', kind: 'finding', source: 'chat 2026-10-05', text: 'The provider can deliver a refund before the charge. The zebrafish test showed this twice.' })
  await put('alice', 'offline-cache', { title: 'Offline cache rules', project: 'mobile', kind: 'rule', text: 'The app caches the last 50 cards. It never caches a pending card.' })
  await put('alice', 'markup-test', { title: 'Markup test', project: 'mobile', kind: 'note', text: '<script>window.__pwned=1;alert("x")</script>\n\n<img src=x onerror="window.__pwned=1;alert(\'y\')">\n\nA plain tail.' })
  await put('bob', 'bob-launch', { title: 'Launch checklist', project: 'mobile', kind: 'note', text: 'Check the store listing and the privacy text before launch.' })
  await app.close()
  return tokens
}
