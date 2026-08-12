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

test('rejects an out-of-range prediction probability even when the total is one', async () => {
  const root = await mkdtemp(path.join(tmpdir(), 'worldcup-validation-'))
  const fixture = path.join(root, 'worldcup.json')
  const data = JSON.parse(await readFile(path.join(projectRoot, 'public/data/worldcup.json'), 'utf8'))
  data.predictions.m001.probabilities = { home: -0.1, draw: 0.5, away: 0.6 }
  await writeFile(fixture, JSON.stringify(data))

  try {
    const result = spawnSync(process.execPath, [validator, fixture], {
      cwd: projectRoot,
      encoding: 'utf8',
    })
    assert.notEqual(result.status, 0, `validator unexpectedly passed:\n${result.stdout}`)
    assert.match(result.stderr, /prediction probability home out of range for m001: -0\.1/)
  } finally {
    await rm(root, { recursive: true, force: true })
  }
})

test('rejects a non-numeric prediction probability even when coercion preserves the total', async () => {
  const root = await mkdtemp(path.join(tmpdir(), 'worldcup-validation-'))
  const fixture = path.join(root, 'worldcup.json')
  const data = JSON.parse(await readFile(path.join(projectRoot, 'public/data/worldcup.json'), 'utf8'))
  data.predictions.m001.probabilities = { home: null, draw: 0.4, away: 0.6 }
  await writeFile(fixture, JSON.stringify(data))

  try {
    const result = spawnSync(process.execPath, [validator, fixture], {
      cwd: projectRoot,
      encoding: 'utf8',
    })
    assert.notEqual(result.status, 0, `validator unexpectedly passed:\n${result.stdout}`)
    assert.match(result.stderr, /prediction probability home out of range for m001: null/)
  } finally {
    await rm(root, { recursive: true, force: true })
  }
})

test('rejects null values in a finished match score', async () => {
  const root = await mkdtemp(path.join(tmpdir(), 'worldcup-validation-'))
  const fixture = path.join(root, 'worldcup.json')
  const data = JSON.parse(await readFile(path.join(projectRoot, 'public/data/worldcup.json'), 'utf8'))
  const match = data.matches.find((item) => item.status === 'finished')
  assert.ok(match, 'fixture must contain a finished match')
  match.score = [null, 1]
  await writeFile(fixture, JSON.stringify(data))

  try {
    const result = spawnSync(process.execPath, [validator, fixture], {
      cwd: projectRoot,
      encoding: 'utf8',
    })
    assert.notEqual(result.status, 0, `validator unexpectedly passed:\n${result.stdout}`)
    assert.ok(result.stderr.includes(`finished match ${match.id} is missing a valid score`))
  } finally {
    await rm(root, { recursive: true, force: true })
  }
})

test('rejects a malformed non-null score on a scheduled match', async () => {
  const root = await mkdtemp(path.join(tmpdir(), 'worldcup-validation-'))
  const fixture = path.join(root, 'worldcup.json')
  const data = JSON.parse(await readFile(path.join(projectRoot, 'public/data/worldcup.json'), 'utf8'))
  const match = data.matches[0]
  match.status = 'scheduled'
  match.score = [null, 1]
  await writeFile(fixture, JSON.stringify(data))

  try {
    const result = spawnSync(process.execPath, [validator, fixture], {
      cwd: projectRoot,
      encoding: 'utf8',
    })
    assert.notEqual(result.status, 0, `validator unexpectedly passed:\n${result.stdout}`)
    assert.ok(result.stderr.includes(`scheduled match ${match.id} has a malformed score`))
  } finally {
    await rm(root, { recursive: true, force: true })
  }
})
