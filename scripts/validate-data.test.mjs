import assert from 'node:assert/strict'
import { mkdtemp, readFile, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import path from 'node:path'
import { spawnSync } from 'node:child_process'
import test from 'node:test'
import { fileURLToPath } from 'node:url'

const projectRoot = fileURLToPath(new URL('..', import.meta.url))
const validator = fileURLToPath(new URL('./validate-data.mjs', import.meta.url))

test('rejects an unknown match status', async () => {
  const root = await mkdtemp(path.join(tmpdir(), 'worldcup-validation-'))
  const fixture = path.join(root, 'worldcup.json')
  const data = JSON.parse(await readFile(path.join(projectRoot, 'public/data/worldcup.json'), 'utf8'))
  data.matches[0].status = 'cancelled'
  await writeFile(fixture, JSON.stringify(data))

  try {
    const result = spawnSync(process.execPath, [validator, fixture], {
      cwd: projectRoot,
      encoding: 'utf8',
    })
    assert.notEqual(result.status, 0, `validator unexpectedly passed:\n${result.stdout}`)
    assert.match(result.stderr, /bad match status cancelled for m001/)
  } finally {
    await rm(root, { recursive: true, force: true })
  }
})
