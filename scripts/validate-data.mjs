import { readFile } from 'node:fs/promises'

const FINAL_RESULT_GRACE_MINUTES = 150
const SCORE_TOLERANCE = 0.02

const data = JSON.parse(await readFile('public/data/worldcup.json', 'utf8'))
const errors = []
const warnings = []

function isFiniteScore(score) {
  return Array.isArray(score)
    && score.length === 2
    && score.every((value) => Number.isInteger(Number(value)) && Number(value) >= 0)
}

function lifecycleFor(match, generatedMs) {
  if (match.status === 'finished' || isFiniteScore(match.score)) return 'final'
  const kickoffMs = Date.parse(match.kickoffUtc || '')
  if (!Number.isFinite(kickoffMs)) return 'unscheduled'
  if (generatedMs >= kickoffMs + FINAL_RESULT_GRACE_MINUTES * 60 * 1000) return 'result-pending'
  if (generatedMs >= kickoffMs) return 'live-window'
  return 'pre-match'
}

function probabilitySum(prediction) {
  const probabilities = prediction?.probabilities || {}
  return Number(probabilities.home || 0) + Number(probabilities.draw || 0) + Number(probabilities.away || 0)
}

function assert(condition, message) {
  if (!condition) errors.push(message)
}

const generatedMs = Date.parse(data.generatedAt || '')
assert(data.generatedAt && Number.isFinite(generatedMs), 'missing or invalid generatedAt')
if (Number.isFinite(generatedMs) && generatedMs - Date.now() > 10 * 60 * 1000) {
  errors.push(`generatedAt is more than 10 minutes in the future: ${data.generatedAt}`)
}

const matches = Array.isArray(data.matches) ? data.matches : []
const groups = Array.isArray(data.groups) ? data.groups : []
const predictions = data.predictions && typeof data.predictions === 'object' ? data.predictions : {}
const leaderboard = Array.isArray(data.leaderboard) ? data.leaderboard : []
const dataQuality = data.dataQuality && typeof data.dataQuality === 'object' ? data.dataQuality : null

assert(matches.length >= 100, `expected at least 100 matches, got ${matches.length}`)
assert(groups.length === 12, `expected 12 groups, got ${groups.length}`)
assert(Object.keys(predictions).length === matches.length, 'prediction count mismatch')
assert(leaderboard.length >= 3, 'leaderboard missing')
assert(data.paperBankroll && typeof data.paperBankroll.bankroll === 'number', 'paper bankroll missing')
if (data.paperBankroll && data.paperBankroll.disclaimer && !data.paperBankroll.disclaimer.includes('純娛樂')) {
  errors.push('paper bankroll disclaimer missing')
}

const matchIds = new Set()
let finishedMatches = 0
let scheduledMatches = 0
const lifecycleCounts = {}
const expectedPendingFinal = []
let previousKickoffMs = -Infinity

for (const match of matches) {
  assert(/^m\d{3}$/.test(match.id || ''), `bad match id ${match.id}`)
  assert(!matchIds.has(match.id), `duplicate match id ${match.id}`)
  matchIds.add(match.id)
  assert(match.team1 && match.team2, `bad match identity ${JSON.stringify(match)}`)
  assert(match.team1 !== match.team2, `match has identical teams ${match.id}`)
  assert(match.source && String(match.source).includes('openfootball/worldcup.json'), `missing source attribution for ${match.id}`)
  assert(match.resultTrust, `missing resultTrust for ${match.id}`)

  const kickoffMs = Date.parse(match.kickoffUtc || '')
  assert(Number.isFinite(kickoffMs), `invalid kickoffUtc for ${match.id}`)
  if (Number.isFinite(kickoffMs)) {
    assert(kickoffMs >= previousKickoffMs, `matches are not sorted by kickoff at ${match.id}`)
    previousKickoffMs = kickoffMs
  }

  const hasScore = isFiniteScore(match.score)
  if (match.status === 'finished') {
    finishedMatches += 1
    assert(hasScore, `finished match ${match.id} is missing a valid score`)
  } else {
    scheduledMatches += 1
    assert(!hasScore, `scheduled match ${match.id} already has a score`)
  }

  const expectedLifecycle = Number.isFinite(generatedMs) ? lifecycleFor(match, generatedMs) : match.lifecycle
  assert(match.lifecycle === expectedLifecycle, `bad lifecycle for ${match.id}: expected ${expectedLifecycle}, got ${match.lifecycle}`)
  lifecycleCounts[expectedLifecycle] = (lifecycleCounts[expectedLifecycle] || 0) + 1
  if (expectedLifecycle === 'live-window' || expectedLifecycle === 'result-pending') expectedPendingFinal.push(match.id)
  if (match.status === 'finished') assert(match.lifecycle === 'final', `finished match ${match.id} is not lifecycle=final`)

  const needsWinner = match.status === 'finished'
    && !match.group
    && hasScore
    && (Number(match.score[0]) !== Number(match.score[1]) || isFiniteScore(match.shootoutScore))
  if (needsWinner) assert(match.winner, `missing knockout winner for ${match.id}`)

  const pred = predictions[match.id]
  assert(pred && pred.probabilities && typeof pred.confidence === 'number', `bad prediction for ${match.id}`)
  if (pred?.probabilities) {
    const sum = probabilitySum(pred)
    assert(Math.abs(sum - 1) <= SCORE_TOLERANCE, `prediction probabilities do not sum to 1 for ${match.id}: ${sum}`)
    assert(pred.confidence >= 0 && pred.confidence <= 1, `prediction confidence out of range for ${match.id}`)
  }
}

assert(data.summary?.totalMatches === matches.length, 'summary totalMatches mismatch')
assert(data.summary?.finishedMatches === finishedMatches, 'summary finishedMatches mismatch')
assert(data.summary?.scheduledMatches === scheduledMatches, 'summary scheduledMatches mismatch')
assert(data.summary?.finalPendingMatches === expectedPendingFinal.length, 'summary finalPendingMatches mismatch')
assert(Array.isArray(data.summary?.nextWindow), 'summary nextWindow missing')
for (const id of data.summary?.nextWindow || []) {
  const match = matches.find((item) => item.id === id)
  assert(match && match.status !== 'finished', `nextWindow contains invalid match ${id}`)
}

const seenTeams = new Set()
for (const group of groups) {
  assert(group.name && /^Group [A-L]$/.test(group.name), `bad group name ${group.name}`)
  assert(Array.isArray(group.teams) && group.teams.length === 4, `expected 4 teams in ${group.name}`)
  for (const team of group.teams || []) {
    assert(!seenTeams.has(team), `team appears in multiple groups: ${team}`)
    seenTeams.add(team)
  }
  const rows = data.standings?.[group.name]
  assert(Array.isArray(rows) && rows.length === group.teams.length, `bad standings rows for ${group.name}`)
  for (const row of rows || []) {
    assert(group.teams.includes(row.team), `standings row ${row.team} is not in ${group.name}`)
    assert(row.played === row.won + row.drawn + row.lost, `played total mismatch for ${row.team}`)
    assert(row.played <= 3, `group standings include non-group matches for ${row.team}`)
    assert(row.points === row.won * 3 + row.drawn, `points mismatch for ${row.team}`)
    assert(row.goalDiff === row.goalsFor - row.goalsAgainst, `goalDiff mismatch for ${row.team}`)
  }
}
assert(seenTeams.size === 48, `expected 48 unique group teams, got ${seenTeams.size}`)

for (const row of leaderboard) {
  assert(row.id && typeof row.points === 'number' && typeof row.accuracy === 'number', `bad leaderboard row ${JSON.stringify(row)}`)
  assert(row.total === finishedMatches, `leaderboard total mismatch for ${row.id}`)
}

for (const bet of data.paperBankroll?.settled || []) {
  const match = matches.find((item) => item.id === bet.matchId)
  assert(match?.status === 'finished', `settled paper bet points to unfinished match ${bet.matchId}`)
}
for (const bet of [...(data.paperBankroll?.pending || []), ...(data.paperBankroll?.watchlist || [])]) {
  const match = matches.find((item) => item.id === bet.matchId)
  assert(match && match.status !== 'finished', `open paper bet points to finished/unknown match ${bet.matchId}`)
}

assert(dataQuality, 'dataQuality diagnostics missing')
if (dataQuality) {
  assert(['pass', 'watch', 'fail'].includes(dataQuality.status), `bad dataQuality status ${dataQuality.status}`)
  assert(dataQuality.thresholds?.finalResultGraceMinutes === FINAL_RESULT_GRACE_MINUTES, 'dataQuality final-result threshold mismatch')
  assert(dataQuality.counts?.totalMatches === matches.length, 'dataQuality totalMatches mismatch')
  assert(dataQuality.counts?.finishedMatches === finishedMatches, 'dataQuality finishedMatches mismatch')
  assert(dataQuality.counts?.scheduledMatches === scheduledMatches, 'dataQuality scheduledMatches mismatch')
  assert(dataQuality.counts?.predictions === Object.keys(predictions).length, 'dataQuality prediction count mismatch')
  assert(dataQuality.counts?.teams === seenTeams.size, 'dataQuality team count mismatch')
  assert(Array.isArray(dataQuality.pendingFinalMatchIds), 'dataQuality pendingFinalMatchIds missing')
  assert(JSON.stringify(dataQuality.pendingFinalMatchIds || []) === JSON.stringify(expectedPendingFinal), 'dataQuality pending-final ids mismatch')
  for (const [lifecycle, count] of Object.entries(lifecycleCounts)) {
    assert(dataQuality.counts?.lifecycle?.[lifecycle] === count, `dataQuality lifecycle count mismatch for ${lifecycle}`)
  }
  const labelKeys = new Set((dataQuality.labels || []).map((label) => label.key))
  assert(labelKeys.has('settlement'), 'dataQuality settlement trust label missing')
  assert(labelKeys.has('liveGuard'), 'dataQuality live guard trust label missing')
  if (dataQuality.errors?.length) errors.push(...dataQuality.errors.map((message) => `dataQuality error: ${message}`))
  if (dataQuality.warnings?.length) warnings.push(...dataQuality.warnings.map((message) => `dataQuality warning: ${message}`))
}

if (warnings.length) console.warn(warnings.join('\n'))
if (errors.length) {
  console.error(errors.join('\n'))
  process.exit(1)
}
console.log(`Validated ${matches.length} matches, ${groups.length} groups, ${Object.keys(predictions).length} predictions, ${expectedPendingFinal.length} pending-final guard(s).`)
