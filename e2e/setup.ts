import { spawn, type ChildProcess } from 'node:child_process'
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join, resolve } from 'node:path'

export const PORT = Number(process.env.HUB_E2E_PORT ?? 4170)
const SRC = process.env.THENWISE_SRC ?? '/Users/dheeraj/memory-v2/.claude/worktrees/agent-a094e86fc81071c45'
let child: ChildProcess | undefined
let dir = ''

export default async function setup() {
  dir = mkdtempSync(join(tmpdir(), 'hub-e2e-'))
  const { seed } = await import('./seed.mjs')
  const tokens = await seed(join(dir, 'team'), SRC)
  mkdirSync('.e2e', { recursive: true })
  writeFileSync('.e2e/state.json', JSON.stringify({ tokens }))
  child = spawn('node', [join(SRC, 'src/cli.ts'), 'team', 'serve', '--port', String(PORT), '--dir', join(dir, 'team'), '--console', resolve('dist')], { stdio: 'inherit' })
  for (let i = 0; i < 100; i++) {
    try {
      if ((await fetch(`http://127.0.0.1:${PORT}/v1/health`)).ok) break
    } catch {
      await new Promise((r) => setTimeout(r, 100))
    }
  }
  return async () => {
    child?.kill()
    rmSync(dir, { recursive: true, force: true })
  }
}
