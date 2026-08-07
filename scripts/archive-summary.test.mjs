import assert from 'node:assert/strict'
import { mkdtemp, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import path from 'node:path'
import { spawnSync } from 'node:child_process'
import test from 'node:test'
import { fileURLToPath } from 'node:url'

const reporter = fileURLToPath(new URL('./archive-summary.mjs', import.meta.url))

test('rejects an incomplete tournament archive', async () => {
  const root = await mkdtemp(path.join(tmpdir(), 'worldcup-archive-'))
  const fixture = path.join(root, 'worldcup.json')
  await writeFile(fixture, JSON.stringify({
    generatedAt: '2026-07-01T00:00:00.000Z',
    matches: [{ id: 'm001', status: 'scheduled', stage: 'Group A' }],
    predictions: {},
    leaderboard: [],
    paperBankroll: {},
    summary: { totalMatches: 1, finishedMatches: 0 },
  }))

  try {
    const result = spawnSync(process.execPath, [reporter, fixture], {
      cwd: fileURLToPath(new URL('..', import.meta.url)),
      encoding: 'utf8',
    })
    assert.notEqual(result.status, 0, `reporter unexpectedly passed:\n${result.stdout}`)
    assert.match(result.stderr, /archive is incomplete: 0\/1 matches finished/)
  } finally {
    await rm(root, { recursive: true, force: true })
  }
})

test('counts a tied knockout prediction as a high-confidence draw hit', async () => {
  const root = await mkdtemp(path.join(tmpdir(), 'worldcup-archive-'))
  const fixture = path.join(root, 'worldcup.json')
  await writeFile(fixture, JSON.stringify({
    generatedAt: '2026-07-20T00:00:00.000Z',
    matches: [{
      id: 'm001',
      status: 'finished',
      stage: 'Final',
      team1: 'Japan',
      team2: 'USA',
      score: [1, 1],
      winner: 'USA',
    }],
    predictions: {
      m001: { pick: '平手', score: '1-1', confidence: 0.82 },
    },
    leaderboard: [],
    paperBankroll: {},
    summary: { totalMatches: 1, finishedMatches: 1 },
  }))

  try {
    const result = spawnSync(process.execPath, [reporter, fixture], {
      cwd: fileURLToPath(new URL('..', import.meta.url)),
      encoding: 'utf8',
    })
    assert.equal(result.status, 0, result.stderr)
    const hits = result.stdout.split('### High-confidence hits')[1].split('### High-confidence misses')[0]
    assert.match(hits, /Japan 1-1 USA: picked 平手 \(82%\)/)
  } finally {
    await rm(root, { recursive: true, force: true })
  }
})
