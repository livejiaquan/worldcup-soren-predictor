import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import test from 'node:test'
import { buildArchive, bracketRounds, paperLedger, rps, stageOf, winnerOf } from '../src/lib/archive.js'

const data = JSON.parse(await readFile(new URL('../public/data/worldcup.json', import.meta.url), 'utf8'))
const archive = buildArchive(data)

test('UI pre-match replay agrees with the published leaderboard', () => {
  const soren = data.leaderboard.find((row) => row.id === 'soren')
  assert.equal(archive.summary.n, soren.total)
  assert.equal(archive.summary.hits, soren.correct)
  assert.equal(archive.summary.exact, soren.exact)
  assert.equal(archive.summary.points, soren.points)
})

test('paper ledger formula mirrors the pipeline (stored predictions reproduce the data file)', () => {
  const ledger = paperLedger(data, data.predictions)
  assert.equal(ledger.bankroll, data.paperBankroll.bankroll)
  const retained = data.paperBankroll.settled || []
  for (const bet of retained) {
    const mine = ledger.bets.find((b) => b.id === bet.matchId)
    assert.ok(mine, `missing ${bet.matchId}`)
    assert.equal(mine.stake, bet.stake)
    assert.equal(mine.profit, bet.profit)
  }
})

test('pre-match paper ledger is internally consistent', () => {
  const { bets, bankroll, initial, wins, losses } = archive.ledger
  assert.equal(wins + losses, bets.length)
  const replayed = bets.reduce((sum, bet) => Number((sum + bet.profit).toFixed(2)), initial)
  assert.equal(replayed, bankroll)
  assert.equal(bets.at(-1)?.bankroll ?? initial, bankroll)
})

test('per-stage summaries add up to the whole tournament', () => {
  const total = archive.stages.reduce((sum, s) => sum + s.n, 0)
  const hits = archive.stages.reduce((sum, s) => sum + s.hits, 0)
  assert.equal(total, archive.summary.n)
  assert.equal(hits, archive.summary.hits)
  const calibrated = archive.calibration.reduce((sum, band) => sum + band.n, 0)
  assert.equal(calibrated, archive.summary.n)
})

test('bracket is ordered so adjacent winners meet in the next round', () => {
  const rounds = bracketRounds(data.matches.filter((m) => !m.group))
  assert.deepEqual(rounds.map((r) => r.matches.length), [16, 8, 4, 2, 1])
  for (let i = 0; i < rounds.length - 1; i += 1) {
    rounds[i + 1].matches.forEach((parent, j) => {
      const feeders = rounds[i].matches.slice(j * 2, j * 2 + 2).map(winnerOf)
      assert.deepEqual(feeders, [parent.team1, parent.team2], `${stageOf(parent)} ${parent.id}`)
    })
  }
  assert.equal(archive.champion, winnerOf(data.matches.find((m) => m.round === 'Final')))
})

test('ranked probability score behaves at the extremes', () => {
  assert.equal(rps({ home: 1, draw: 0, away: 0 }, 'home'), 0)
  assert.equal(rps({ home: 1, draw: 0, away: 0 }, 'away'), 1)
  assert.ok(archive.summary.rps < archive.summary.uniformRps, 'model should beat a uniform 1/3 guess')
})
