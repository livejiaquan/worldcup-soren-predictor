// Pure, framework-free view model for the archived tournament.
//
// Why replay? `data.predictions` in worldcup.json is regenerated on every pipeline run with the
// *latest* standings, so after the tournament it contains hindsight (it scores 74/104, while the
// official leaderboard — itself a deterministic pre-match replay — scores 64/104). For an honest
// "prediction vs result" review we re-run the same engine with only the matches that finished
// before each kickoff, exactly like scripts/update-data.mjs#buildLeaderboard and
// scripts/validate-data.mjs#replayLeaderboard do.
import { TEAM_PRIORS, computeStandings, predictMatch, scorePrediction } from './predictionEngine.js'

export const DRAW = '平手'
export const STAGES = ['group', 'r32', 'r16', 'qf', 'sf', 'third', 'final']
const ROUND_TO_STAGE = {
  'Round of 32': 'r32', 'Round of 16': 'r16', 'Quarter-final': 'qf', 'Semi-final': 'sf',
  'Match for third place': 'third', Final: 'final',
}
export const KNOCKOUT_ROUNDS = ['r32', 'r16', 'qf', 'sf', 'final']

export const stageOf = (match) => (match.group ? 'group' : ROUND_TO_STAGE[match.round] || 'group')

export function outcomeOf(score) {
  if (!Array.isArray(score) || score.length !== 2) return null
  const [a, b] = score.map(Number)
  return a > b ? 'home' : b > a ? 'away' : 'draw'
}

export function pickOutcome(match, pick) {
  if (pick === match.team1) return 'home'
  if (pick === match.team2) return 'away'
  if (pick === DRAW) return 'draw'
  return null
}

/** Team that advanced (knockouts) or won (group); null for a group-stage draw. */
export function winnerOf(match) {
  if (match.winner) return match.winner
  const o = outcomeOf(match.score)
  return o === 'home' ? match.team1 : o === 'away' ? match.team2 : null
}

export function loserOf(match) {
  const w = winnerOf(match)
  if (!w) return null
  return w === match.team1 ? match.team2 : match.team1
}

/** Pre-match predictions: each match only sees results that were final before it. */
export function replayPredictions(data) {
  const finishedSoFar = []
  const out = {}
  for (const match of data.matches || []) {
    const standings = computeStandings(data.groups || [], finishedSoFar.map((m) => ({ team1: m.team1, team2: m.team2, score: { ft: m.score } })))
    out[match.id] = predictMatch(match, standings)
    if (match.status === 'finished' && Array.isArray(match.score)) finishedSoFar.push(match)
  }
  return out
}

/** Ranked probability score for an ordered 3-way outcome (home < draw < away). Lower is better. */
export function rps(probs, outcome) {
  const o = { home: [1, 0, 0], draw: [0, 1, 0], away: [0, 0, 1] }[outcome]
  if (!o) return null
  const p = [probs.home || 0, probs.draw || 0, probs.away || 0]
  const c1 = p[0] - o[0]
  const c2 = p[0] + p[1] - (o[0] + o[1])
  return (c1 * c1 + c2 * c2) / 2
}

export function brier(probs, outcome) {
  const o = { home: [1, 0, 0], draw: [0, 1, 0], away: [0, 0, 1] }[outcome]
  if (!o) return null
  const p = [probs.home || 0, probs.draw || 0, probs.away || 0]
  return p.reduce((sum, v, i) => sum + (v - o[i]) ** 2, 0)
}

const UNIFORM = { home: 1 / 3, draw: 1 / 3, away: 1 / 3 }

export function buildRows(data, predictions) {
  return (data.matches || [])
    .filter((m) => m.status === 'finished' && Array.isArray(m.score))
    .map((match) => {
      const pred = predictions[match.id]
      const outcome = outcomeOf(match.score)
      const picked = pickOutcome(match, pred.pick)
      const scored = scorePrediction(pred, match)
      const [pa, pb] = String(pred.score || '0-0').split('-').map((n) => Number(n) || 0)
      return {
        id: match.id,
        match,
        pred,
        stage: stageOf(match),
        outcome,
        picked,
        pickProb: picked ? pred.probabilities[picked] : 0,
        hit: Boolean(scored?.pick),
        exact: Boolean(scored?.exact),
        points: scored?.points || 0,
        goalError: Math.abs(match.score[0] - pa) + Math.abs(match.score[1] - pb),
        rps: rps(pred.probabilities, outcome),
        brier: brier(pred.probabilities, outcome),
        uniformRps: rps(UNIFORM, outcome),
      }
    })
}

export function summarize(rows) {
  const n = rows.length
  const sum = (key) => rows.reduce((s, r) => s + (Number(r[key]) || 0), 0)
  const hits = rows.filter((r) => r.hit).length
  const exact = rows.filter((r) => r.exact).length
  return {
    n,
    hits,
    exact,
    misses: n - hits,
    points: sum('points'),
    accuracy: n ? hits / n : 0,
    exactRate: n ? exact / n : 0,
    avgPickProb: n ? sum('pickProb') / n : 0,
    rps: n ? sum('rps') / n : 0,
    uniformRps: n ? sum('uniformRps') / n : 0,
    brier: n ? sum('brier') / n : 0,
    avgGoalError: n ? sum('goalError') / n : 0,
  }
}

export function byStage(rows) {
  return STAGES.map((stage) => ({ stage, ...summarize(rows.filter((r) => r.stage === stage)) })).filter((s) => s.n)
}

export const PROB_BANDS = [
  { id: 'lt45', min: 0, max: 0.45, label: '< 45%' },
  { id: '45', min: 0.45, max: 0.55, label: '45–55%' },
  { id: '55', min: 0.55, max: 0.65, label: '55–65%' },
  { id: '65', min: 0.65, max: 1.01, label: '≥ 65%' },
]

/** Reliability: does a pick made at X% come true about X% of the time? */
export function calibration(rows) {
  return PROB_BANDS.map((band) => {
    const inBand = rows.filter((r) => r.pickProb >= band.min && r.pickProb < band.max)
    const s = summarize(inBand)
    return { ...band, n: s.n, hits: s.hits, stated: s.avgPickProb, actual: s.accuracy, gap: s.accuracy - s.avgPickProb }
  })
}

export function byTag(rows) {
  const groups = {}
  for (const r of rows) (groups[r.pred.tag || 'untagged'] ||= []).push(r)
  return Object.entries(groups)
    .map(([tag, list]) => ({ tag, ...summarize(list) }))
    .sort((a, b) => b.accuracy - a.accuracy)
}

// ---- Paper bankroll -------------------------------------------------------------------------
// Mirrors scripts/update-data.mjs#buildPaperBankroll (same constants and formulas). Kept in sync
// by scripts/archive-view.test.mjs, which checks that feeding it the stored predictions
// reproduces data.paperBankroll.bankroll to the cent.
export const PAPER_START = '2026-06-26T08:00:00.000Z'
export const PAPER_INITIAL = 100

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
  return { home: home / total, draw: draw / total, away: away / total }[outcome]
}

export function paperLedger(data, predictions) {
  let bankroll = PAPER_INITIAL
  const bets = []
  for (const match of data.matches || []) {
    if (!match.kickoffUtc || new Date(match.kickoffUtc) < new Date(PAPER_START)) continue
    if (match.status !== 'finished' || !Array.isArray(match.score)) continue
    const pred = predictions[match.id]
    const outcome = pickOutcome(match, pred.pick)
    if (!outcome) continue
    const modelProb = pred.probabilities[outcome]
    const marketProb = impliedMarketProb(match, outcome)
    const odds = Number(Math.max(1.25, Math.min(7.5, 0.94 / marketProb)).toFixed(2))
    const edge = modelProb * odds - 1
    const stake = Number(Math.max(1, Math.min(8, PAPER_INITIAL * Math.max(0.01, edge) * 0.22)).toFixed(2))
    const won = outcomeOf(match.score) === outcome
    const profit = Number((won ? stake * (odds - 1) : -stake).toFixed(2))
    bankroll = Number((bankroll + profit).toFixed(2))
    bets.push({ id: match.id, match, pick: pred.pick, outcome, odds, stake, edge, modelProb, marketProb, won, profit, bankroll })
  }
  const staked = bets.reduce((s, b) => s + b.stake, 0)
  const wins = bets.filter((b) => b.won).length
  return {
    initial: PAPER_INITIAL,
    bankroll,
    pnl: Number((bankroll - PAPER_INITIAL).toFixed(2)),
    roi: (bankroll - PAPER_INITIAL) / PAPER_INITIAL,
    yield: staked ? (bankroll - PAPER_INITIAL) / staked : 0,
    staked: Number(staked.toFixed(2)),
    wins,
    losses: bets.length - wins,
    bets,
  }
}

// ---- Bracket ----------------------------------------------------------------------------------
/** Knockout rounds ordered so that adjacent matches feed the same next-round match. */
export function bracketRounds(matches) {
  const byStage = Object.fromEntries(KNOCKOUT_ROUNDS.map((s) => [s, matches.filter((m) => stageOf(m) === s)]))
  const final = byStage.final[0]
  if (!final) return KNOCKOUT_ROUNDS.map((stage) => ({ stage, matches: byStage[stage] }))
  const ordered = { final: [final] }
  for (let i = KNOCKOUT_ROUNDS.length - 2; i >= 0; i -= 1) {
    const stage = KNOCKOUT_ROUNDS[i]
    const next = ordered[KNOCKOUT_ROUNDS[i + 1]]
    const pool = [...byStage[stage]]
    const list = []
    for (const parent of next) {
      for (const team of [parent.team1, parent.team2]) {
        const idx = pool.findIndex((m) => winnerOf(m) === team)
        if (idx >= 0) list.push(pool.splice(idx, 1)[0])
      }
    }
    ordered[stage] = [...list, ...pool] // anything unmatched (data gaps) is appended, never dropped
  }
  return KNOCKOUT_ROUNDS.map((stage) => ({ stage, matches: ordered[stage] }))
}

// ---- Everything the UI needs, computed once ---------------------------------------------------
export function buildArchive(data) {
  const predictions = replayPredictions(data)
  const rows = buildRows(data, predictions)
  const rowById = Object.fromEntries(rows.map((r) => [r.id, r]))
  const matches = data.matches || []
  const final = matches.find((m) => m.round === 'Final')
  const third = matches.find((m) => m.round === 'Match for third place')
  const r32Teams = new Set(matches.filter((m) => stageOf(m) === 'r32').flatMap((m) => [m.team1, m.team2]))
  const knockouts = matches.filter((m) => !m.group)
  return {
    predictions,
    rows,
    rowById,
    summary: summarize(rows),
    stages: byStage(rows),
    calibration: calibration(rows),
    tags: byTag(rows),
    ledger: paperLedger(data, predictions),
    bracket: bracketRounds(knockouts),
    third,
    final,
    champion: final && final.status === 'finished' ? winnerOf(final) : null,
    runnerUp: final && final.status === 'finished' ? loserOf(final) : null,
    r32Teams,
    leaderboard: data.leaderboard || [],
    complete: data.summary?.totalMatches > 0 && data.summary.finishedMatches === data.summary.totalMatches,
  }
}
