import { execFileSync } from 'node:child_process'
import { mkdtempSync, readFileSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { expect, it } from 'vitest'

const run = (env: Record<string, string>) => execFileSync('node', ['scripts/gen-types.mjs', '--check'], { env: { ...process.env, ...env }, stdio: 'pipe' })

it('C1-B4 the committed types match the spec', () => {
  expect(() => run({})).not.toThrow()
})

it('C1-B4 a changed spec fails the check and names the difference', () => {
  const dir = mkdtempSync(join(tmpdir(), 'spec-'))
  const spec = JSON.parse(readFileSync('api/openapi.json', 'utf8'))
  spec.components.schemas.Settings.properties.review_queue_renamed = { type: 'boolean' }
  writeFileSync(join(dir, 'openapi.json'), JSON.stringify(spec))
  let err = ''
  try {
    run({ HUB_SPEC: join(dir, 'openapi.json') })
  } catch (e) {
    err = String((e as { stderr: Buffer }).stderr)
  }
  expect(err).toContain('out of date')
  expect(err).toContain('first difference at line')
})
