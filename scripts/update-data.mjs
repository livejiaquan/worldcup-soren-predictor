import { mkdir, readFile, writeFile } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { computeStandings, predictMatch, scorePrediction, canonicalTeam, TEAM_PRIORS } from '../src/lib/predictionEngine.js'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const root = path.resolve(__dirname, '..')
const MATCHES_URL = 'https://raw.githubusercontent.com/openfootball/worldcup.json/refs/heads/master/2026/worldcup.json'
const GROUPS_URL = 'https://raw.githubusercontent.com/openfootball/worldcup.json/master/2026/worldcup.groups.json'
const FINAL_RESULT_GRACE_MINUTES = 150

const RESULT_OVERRIDES = new Map()

async function loadResultOverrides() {
  const file = path.join(root, 'data/result-overrides.json')
  try {
    const parsed = JSON.parse(await readFile(file, 'utf8'))
    for (const item of parsed.overrides || []) {
      const team1 = canonicalTeam(item.team1)
      const team2 = canonicalTeam(item.team2)
      if (!item.date || !team1 || !team2 || !Array.isArray(item.score) || item.score.length !== 2) continue
      RESULT_OVERRIDES.set(`${item.date}|${team1}|${team2}`, {
        score: item.score.map(Number),
        shootoutScore: Array.isArray(item.shootoutScore) && item.shootoutScore.length === 2 ? item.shootoutScore.map(Number) : null,
        winner: item.winner ? canonicalTeam(item.winner) : null,
        source: item.source || 'source-backed override',
      })
    }
  } catch (error) {
    if (error.code !== 'ENOENT') throw error
  }
}

async function getJson(url) {
  const response = await fetch(url, { headers: { 'user-agent': 'soren-worldcup-predictor/1.0' } })
  if (!response.ok) throw new Error(`Fetch failed ${response.status} ${url}`)
  return response.json()
}

function parseKickoff(date, time) {
  if (!date) return null
  const raw = String(time || '00:00 UTC+0')
  const match = raw.match(/(\d{1,2}):(\d{2})\s*UTC([+-])(\d{1,2})?/)
  const hh = match?.[1] || '00'
  const mm = match?.[2] || '00'
  const offset = Number(`${match?.[3] || '+'}${match?.[4] || 0}`)
  const utcMs = Date.UTC(Number(date.slice(0, 4)), Number(date.slice(5, 7)) - 1, Number(date.slice(8, 10)), Number(hh) - offset, Number(mm), 0)
  return new Date(utcMs).toISOString()
}
function classifyLifecycle(match, nowMs) {
  if (match.status === 'finished' || Array.isArray(match.score)) return 'final'
  const kickoffMs = Date.parse(match.kickoffUtc || '')
  if (!Number.isFinite(kickoffMs)) return 'unscheduled'
  if (nowMs >= kickoffMs + FINAL_RESULT_GRACE_MINUTES * 60 * 1000) return 'result-pending'
  if (nowMs >= kickoffMs) return 'live-window'
  return 'pre-match'
}
function resultTrustLabel(match, hasOverride) {
  if (match.lifecycle === 'final') return hasOverride ? 'manual-source-override final' : 'upstream-final-score'
  if (match.lifecycle === 'pre-match') return 'pre-match fixture'
  if (match.lifecycle === 'live-window') return 'kickoff-started; final score not trusted yet'
  if (match.lifecycle === 'result-pending') return 'awaiting source-backed final score'
  return 'kickoff-time unavailable'
}
function stageLabel(match) { return match.group ? `${match.group.replace('Group ', '小組 ')} · ${match.round || '小組賽'}` : (match.round || '淘汰賽') }
function normalizeMatch(match, index, nowMs) {
  const overrideKey = `${match.date}|${canonicalTeam(match.team1)}|${canonicalTeam(match.team2)}`
  const override = RESULT_OVERRIDES.get(overrideKey)
  const upstreamFinalScore = match.score?.et || match.score?.ft
  const ft = override?.score || upstreamFinalScore?.map(Number)
  const rawShootout = match.score?.penalties || match.score?.p
  const shootoutScore = override?.shootoutScore || rawShootout?.map(Number) || null
  const hasScore = Array.isArray(ft) && ft.length === 2 && ft.every(Number.isFinite)
  const shootoutWinner = Array.isArray(shootoutScore) && shootoutScore.length === 2 && shootoutScore[0] !== shootoutScore[1]
    ? (shootoutScore[0] > shootoutScore[1] ? canonicalTeam(match.team1) : canonicalTeam(match.team2))
    : null
  const scoreWinner = hasScore && ft[0] !== ft[1]
    ? (ft[0] > ft[1] ? canonicalTeam(match.team1) : canonicalTeam(match.team2))
    : null
  const winner = override?.winner || (match.winner ? canonicalTeam(match.winner) : null) || shootoutWinner || scoreWinner
  const normalized = { id: `m${String(index + 1).padStart(3, '0')}`, round: match.round || '', stage: stageLabel(match), group: match.group || null, date: match.date, time: match.time || '', kickoffUtc: parseKickoff(match.date, match.time), team1: canonicalTeam(match.team1), team2: canonicalTeam(match.team2), venue: match.ground || '待定', status: hasScore ? 'finished' : 'scheduled', score: hasScore ? ft : null, source: override ? `openfootball/worldcup.json + override: ${override.source}` : 'openfootball/worldcup.json' }
  normalized.lifecycle = classifyLifecycle(normalized, nowMs)
  normalized.resultTrust = resultTrustLabel(normalized, Boolean(override))
  if (hasScore && shootoutScore) normalized.shootoutScore = shootoutScore
  if (hasScore && !normalized.group && winner) normalized.winner = winner
  return normalized
}
function normalizedToEngineMatch(m) { return { team1: m.team1, team2: m.team2, score: m.score ? { ft: m.score } : null } }
function computeStandingsFromNormalized(groups, matches) { return computeStandings(groups, matches.map(normalizedToEngineMatch)) }
function ratingBaseline(match) {
  const r1 = TEAM_PRIORS[match.team1] ?? 67
  const r2 = TEAM_PRIORS[match.team2] ?? 67
  return { pick: Math.abs(r1 - r2) < 2 ? '平手' : r1 > r2 ? match.team1 : match.team2, score: Math.abs(r1 - r2) < 2 ? '1-1' : r1 > r2 ? '2-1' : '1-2' }
}
function buildLeaderboard(groups, matches) {
  const rows = [
    { id: 'soren', name: 'Soren Poisson', desc: '強度先驗 × 即時戰績 × Poisson 進球分布', points: 0, correct: 0, exact: 0, total: 0 },
    { id: 'rating', name: 'Rating Baseline', desc: '只看隊伍強度先驗', points: 0, correct: 0, exact: 0, total: 0 },
    { id: 'draw', name: 'Draw Baseline', desc: '保守押平局', points: 0, correct: 0, exact: 0, total: 0 },
  ]
  const finishedSoFar = []
  for (const match of matches) {
    if (match.status === 'finished') {
      const standingsBefore = computeStandingsFromNormalized(groups, finishedSoFar)
      const preds = [predictMatch(match, standingsBefore), ratingBaseline(match), { pick: '平手', score: '1-1' }]
      preds.forEach((pred, idx) => {
        const result = scorePrediction(pred, match)
        if (!result) return
        rows[idx].total += 1
        rows[idx].points += result.points
        if (result.pick) rows[idx].correct += 1
        if (result.exact) rows[idx].exact += 1
      })
      finishedSoFar.push(match)
    }
  }
  return rows.sort((a, b) => b.points - a.points || b.correct - a.correct).map((row, i) => ({ ...row, rank: i + 1, accuracy: row.total ? row.correct / row.total : 0 }))
}
function fixtureWindow(matches) {
  const now = Date.now()
  const upcoming = matches.filter((m) => m.status !== 'finished' && m.lifecycle === 'pre-match' && m.kickoffUtc && new Date(m.kickoffUtc).getTime() >= now).slice(0, 12)
  return upcoming.length ? upcoming : matches.filter((m) => m.status !== 'finished' && m.lifecycle === 'pre-match').slice(0, 12)
}

const PAPER_BANKROLL_START = '2026-06-26T08:00:00.000Z'
const PAPER_INITIAL_BANKROLL = 100

function impliedMarketProb(match, outcome) {
  const r1 = TEAM_PRIORS[match.team1] ?? 67
  const r2 = TEAM_PRIORS[match.team2] ?? 67
  const diff = (r1 - r2) / 18
  let home = 0.37 + diff * 0.08
  let away = 0.34 - diff * 0.08
  let draw = 0.29 - Math.min(Math.abs(diff), 1.6) * 0.025
  home = Math.max(0.12, Math.min(0.76, home))
  away = Math.max(0.12, Math.min(0.76, away))
  draw = Math.max(0.16, Math.min(0.34, draw))
  const total = home + draw + away
  const probs = { home: home / total, draw: draw / total, away: away / total }
  return probs[outcome]
}

function outcomeFromPick(match, pick) {
  if (pick === match.team1) return 'home'
  if (pick === match.team2) return 'away'
  if (pick === '平手') return 'draw'
  return null
}

function outcomeLabel(match, outcome) {
  if (outcome === 'home') return match.team1
  if (outcome === 'away') return match.team2
  return '平手'
}
function kickoffMinus(match, minutes) {
  return match.kickoffUtc ? new Date(new Date(match.kickoffUtc).getTime() - minutes * 60 * 1000).toISOString() : null
}

function actualOutcome(match) {
  if (!Array.isArray(match.score)) return null
  const [a, b] = match.score.map(Number)
  if (a > b) return 'home'
  if (b > a) return 'away'
  return 'draw'
}

function buildPaperBankroll(matches, predictions) {
  let bankroll = PAPER_INITIAL_BANKROLL
  const settled = []
  const pending = []
  const candidates = []
  for (const match of matches) {
    if (!match.kickoffUtc || new Date(match.kickoffUtc) < new Date(PAPER_BANKROLL_START)) continue
    const pred = predictions[match.id]
    const outcome = outcomeFromPick(match, pred.pick)
    if (!outcome) continue
    const sorenProb = pred.probabilities[outcome]
    const marketProb = impliedMarketProb(match, outcome)
    const decimalOdds = Number(Math.max(1.25, Math.min(7.5, 0.94 / marketProb)).toFixed(2))
    const edge = sorenProb * decimalOdds - 1
    const stake = Number(Math.max(1, Math.min(8, PAPER_INITIAL_BANKROLL * Math.max(0.01, edge) * 0.22)).toFixed(2))
    const bet = { matchId: match.id, kickoffUtc: match.kickoffUtc, stage: match.stage, team1: match.team1, team2: match.team2, pick: outcomeLabel(match, outcome), outcome, stake, decimalOdds, edge: Number(edge.toFixed(3)), modelProbability: Number(sorenProb.toFixed(3)), marketProxyProbability: Number(marketProb.toFixed(3)), marketReference: '主流 1X2 賽前盤紙上模擬（FanDuel/DraftKings/Bet365 類型，不導流）', lockedAtUtc: kickoffMinus(match, 60), cutoffRule: '開賽前 60 分鐘鎖單；若官方先發/重大傷停晚於鎖單才出現，記入復盤不追改。', reason: pred.commentary?.headline || pred.reasons?.[0] || '模型判讀' }
    if (match.status === 'finished') {
      const won = actualOutcome(match) === outcome
      const profit = Number((won ? stake * (decimalOdds - 1) : -stake).toFixed(2))
      bankroll = Number((bankroll + profit).toFixed(2))
      settled.push({ ...bet, status: won ? 'won' : 'lost', score: match.score, profit })
    } else if (edge > -0.08 && pending.length < 5) {
      pending.push({ ...bet, status: match.lifecycle === 'pre-match' ? 'pending' : 'awaiting-final' })
    } else {
      candidates.push({ ...bet, status: 'watchlist' })
    }
  }
  const openStake = Number(pending.reduce((sum, bet) => sum + bet.stake, 0).toFixed(2))
  return {
    disclaimer: '純娛樂紙上模擬，不是真實金錢、不連結任何投注平台、不構成投注建議。',
    startedAt: PAPER_BANKROLL_START,
    currency: 'USD-paper',
    initialBankroll: PAPER_INITIAL_BANKROLL,
    bankroll,
    openStake,
    totalValue: Number((bankroll).toFixed(2)),
    roi: Number(((bankroll - PAPER_INITIAL_BANKROLL) / PAPER_INITIAL_BANKROLL).toFixed(3)),
    rules: 'Soren 只用紙上本金 100 美金；以模型機率對比主流 1X2 賽前盤紙上代理價格挑選少量標的；單筆約 1–8 美金；90 分鐘勝平負口徑；開賽前 60 分鐘鎖單，賽後公開結算與復盤。',
    settled: settled.slice(-12),
    pending,
    watchlist: candidates.sort((a, b) => b.edge - a.edge).slice(0, 5),
  }
}

function buildDataQuality({ generatedAt, groups, matches, predictions, leaderboard, paperBankroll }) {
  const errors = []
  const warnings = []
  const matchIds = new Set()
  for (const match of matches) {
    if (matchIds.has(match.id)) errors.push(`duplicate match id ${match.id}`)
    matchIds.add(match.id)
    if (match.status === 'finished' && !Array.isArray(match.score)) errors.push(`${match.id} is finished without a score`)
    if (match.status !== 'finished' && Array.isArray(match.score)) errors.push(`${match.id} has a score but is not finished`)
  }
  const predictionIds = Object.keys(predictions || {})
  if (predictionIds.length !== matches.length) errors.push(`prediction count ${predictionIds.length} does not match match count ${matches.length}`)
  const lifecycleCounts = matches.reduce((acc, match) => {
    acc[match.lifecycle] = (acc[match.lifecycle] || 0) + 1
    return acc
  }, {})
  const pendingFinal = matches.filter((m) => m.lifecycle === 'live-window' || m.lifecycle === 'result-pending')
  if (pendingFinal.length) warnings.push(`${pendingFinal.length} match(es) have kicked off but do not have source-backed final scores yet`)
  const finishedMatches = matches.filter((m) => m.status === 'finished').length
  const scheduledMatches = matches.length - finishedMatches
  return {
    status: errors.length ? 'fail' : warnings.length ? 'watch' : 'pass',
    checkedAt: generatedAt,
    thresholds: { finalResultGraceMinutes: FINAL_RESULT_GRACE_MINUTES },
    counts: {
      totalMatches: matches.length,
      groups: groups.length,
      teams: new Set(groups.flatMap((g) => g.teams || [])).size,
      finishedMatches,
      scheduledMatches,
      predictions: predictionIds.length,
      leaderboardRows: leaderboard.length,
      paperSettled: paperBankroll.settled.length,
      paperPending: paperBankroll.pending.length,
      resultOverrides: RESULT_OVERRIDES.size,
      groupStageMatches: matches.filter((m) => m.group).length,
      lifecycle: lifecycleCounts,
    },
    labels: [
      { key: 'feed', label: 'Open fixture feed parsed', status: errors.length ? 'fail' : 'pass', detail: `${matches.length} matches from openfootball/worldcup.json` },
      { key: 'settlement', label: 'Final-only settlement guard', status: 'pass', detail: 'Leaderboards, paper bankroll, and public postmortems settle only when a score exists.' },
      { key: 'liveGuard', label: 'Live is not final', status: pendingFinal.length ? 'watch' : 'pass', detail: pendingFinal.length ? `${pendingFinal.length} match(es) hidden behind final-score pending labels.` : 'No kicked-off match is waiting for a final result.' },
      { key: 'overrides', label: 'Manual score overrides', status: RESULT_OVERRIDES.size ? 'watch' : 'pass', detail: RESULT_OVERRIDES.size ? `${RESULT_OVERRIDES.size} source-backed override(s) applied.` : 'No manual result overrides applied.' },
    ],
    pendingFinalMatchIds: pendingFinal.map((m) => m.id),
    warnings,
    errors,
  }
}

await loadResultOverrides()
const [rawMatches, rawGroups] = await Promise.all([getJson(MATCHES_URL), getJson(GROUPS_URL)])
const generatedAt = new Date().toISOString()
const generatedAtMs = Date.parse(generatedAt)
const groups = (rawGroups.groups || []).map((g) => ({ name: g.name, teams: g.teams.map(canonicalTeam) }))
const matches = (rawMatches.matches || []).map((match, index) => normalizeMatch(match, index, generatedAtMs)).sort((a, b) => String(a.kickoffUtc).localeCompare(String(b.kickoffUtc)))
const predictionStandings = computeStandingsFromNormalized(groups, matches)
const groupStandings = computeStandingsFromNormalized(groups, matches.filter((m) => m.group))
const predictions = Object.fromEntries(matches.map((match) => [match.id, predictMatch(match, predictionStandings)]))
const paperBankroll = buildPaperBankroll(matches, predictions)
const leaderboard = buildLeaderboard(groups, matches)
const dataQuality = buildDataQuality({ generatedAt, groups, matches, predictions, leaderboard, paperBankroll })
const data = { generatedAt, source: { matches: MATCHES_URL, groups: GROUPS_URL, note: 'Public openfootball data; predictions are deterministic research/entertainment estimates, not betting advice.' }, summary: { totalMatches: matches.length, finishedMatches: matches.filter((m) => m.status === 'finished').length, scheduledMatches: matches.filter((m) => m.status !== 'finished').length, finalPendingMatches: dataQuality.pendingFinalMatchIds.length, nextWindow: fixtureWindow(matches).map((m) => m.id) }, dataQuality, groups, standings: groupStandings, matches, predictions, leaderboard, paperBankroll }
await mkdir(path.join(root, 'public/data'), { recursive: true })
await writeFile(path.join(root, 'public/data/worldcup.json'), JSON.stringify(data, null, 2), 'utf8')
console.log(`Generated public/data/worldcup.json with ${matches.length} matches at ${data.generatedAt}`)
