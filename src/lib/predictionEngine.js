export const TEAM_PRIORS = {
  Argentina: 97, France: 96, Spain: 95, England: 94, Brazil: 94, Portugal: 93,
  Netherlands: 90, Belgium: 88, Germany: 88, Croatia: 86, Uruguay: 85, Morocco: 84,
  USA: 82, Mexico: 81, Switzerland: 81, Colombia: 81, Japan: 80, Senegal: 79,
  Austria: 78, Sweden: 78, Turkey: 77, Ecuador: 77, Iran: 75, Australia: 74,
  Scotland: 74, 'South Korea': 74, Norway: 76, Ghana: 73, 'Ivory Coast': 73,
  Algeria: 73, Qatar: 70, Tunisia: 70, Egypt: 72, Paraguay: 72, 'South Africa': 69,
  'Saudi Arabia': 69, 'Czech Republic': 72, Canada: 72, Panama: 68, Uzbekistan: 68,
  Jordan: 66, Iraq: 66, Haiti: 64, 'New Zealand': 64, 'Bosnia & Herzegovina': 72,
  Curaçao: 63, 'Democratic Republic of the Congo': 70, 'Cape Verde': 66,
}

const ALIASES = {
  'United States': 'USA', 'United States of America': 'USA', 'Korea Republic': 'South Korea',
  Korea: 'South Korea', Czechia: 'Czech Republic', 'Côte d’Ivoire': 'Ivory Coast',
  "Cote d'Ivoire": 'Ivory Coast', Curacao: 'Curaçao', 'Bosnia and Herzegovina': 'Bosnia & Herzegovina',
  'DR Congo': 'Democratic Republic of the Congo', CongoDR: 'Democratic Republic of the Congo',
}

export function canonicalTeam(name) {
  if (!name) return 'TBD'
  const text = String(name)
  if (/^(TBD|暫無|Winner|Loser|[A-L][1-4]|[A-L][123])/.test(text)) return text
  return ALIASES[text] || text
}

export function flattenStandings(standings) {
  if (!standings) return {}
  const first = Object.values(standings)[0]
  if (!Array.isArray(first)) return standings
  return Object.fromEntries(Object.values(standings).flat().map((row) => [row.team, row]))
}

export function teamRating(name, standings = {}) {
  const canonical = canonicalTeam(name)
  const prior = TEAM_PRIORS[canonical] ?? TEAM_PRIORS[name] ?? 67
  const table = flattenStandings(standings)[canonical] || flattenStandings(standings)[name]
  if (!table) return prior
  const formBoost = table.played ? ((table.points / (table.played * 3)) - 0.5) * 8 + table.goalDiff * 0.65 : 0
  return Math.max(45, Math.min(104, prior + formBoost))
}

export function computeStandings(groups, matches) {
  const tables = {}
  for (const group of groups) {
    tables[group.name] = (group.teams || []).map((team) => ({
      team: canonicalTeam(team), group: group.name, played: 0, won: 0, drawn: 0, lost: 0,
      goalsFor: 0, goalsAgainst: 0, goalDiff: 0, points: 0,
    }))
  }
  const byTeam = Object.fromEntries(Object.values(tables).flat().map((row) => [row.team, row]))
  for (const match of matches) {
    const score = match.score?.ft || match.score
    if (!Array.isArray(score) || score.length !== 2 || score.some((v) => !Number.isFinite(Number(v)))) continue
    const t1 = byTeam[canonicalTeam(match.team1)]
    const t2 = byTeam[canonicalTeam(match.team2)]
    if (!t1 || !t2) continue
    const [g1, g2] = score.map(Number)
    t1.played += 1; t2.played += 1
    t1.goalsFor += g1; t1.goalsAgainst += g2
    t2.goalsFor += g2; t2.goalsAgainst += g1
    if (g1 > g2) { t1.won += 1; t2.lost += 1; t1.points += 3 }
    else if (g2 > g1) { t2.won += 1; t1.lost += 1; t2.points += 3 }
    else { t1.drawn += 1; t2.drawn += 1; t1.points += 1; t2.points += 1 }
  }
  for (const rows of Object.values(tables)) {
    for (const row of rows) row.goalDiff = row.goalsFor - row.goalsAgainst
    rows.sort((a, b) => b.points - a.points || b.goalDiff - a.goalDiff || b.goalsFor - a.goalsFor || a.team.localeCompare(b.team))
  }
  return tables
}

function poisson(k, lambda) {
  let factorial = 1
  for (let i = 2; i <= k; i += 1) factorial *= i
  return Math.exp(-lambda) * Math.pow(lambda, k) / factorial
}
function clamp(value, min, max) { return Math.max(min, Math.min(max, value)) }
function isUnresolved(team) { return /^(TBD|暫無|Winner|Loser|[A-L][1-4]|[A-L][123])/.test(String(team)) }

function labelRisk(confidence, home, draw, away) {
  const top = Math.max(home, draw, away)
  if (confidence >= 0.72 && top >= 0.58) return '我敢站隊'
  if (Math.abs(home - away) < 0.08 || draw >= 0.29) return '膠著到煩'
  if (top < 0.48) return '這場有妖氣'
  return '有邊但不裝穩'
}

function buildNarrative({ team1, team2, pick, confidence, home, draw, away, lambda1, lambda2, r1, r2, best }) {
  const gap = Math.abs(r1 - r2)
  const underdog = r1 < r2 ? team1 : team2
  const favorite = r1 >= r2 ? team1 : team2
  const confidenceText = confidence >= 0.72 ? '偏明確' : confidence >= 0.58 ? '中等' : '保守'
  const opener = pick === '平手'
    ? `${team1} 對 ${team2} 這場像在鋼索上踢球，平局味道濃到我都不想裝帥。`
    : `我這場${confidenceText}站 ${pick}，但平局還有 ${pctForNarrative(draw)}；別急著開香檳，足球最會打臉。`
  const angle = gap < 4
    ? '兩隊底牌差不多，誰先犯蠢誰就把方向盤交出去。'
    : `${favorite} 底牌比較硬；${underdog} 想偷走比賽，前 30 分鐘不能先自爆。`
  const tempo = lambda1 + lambda2 >= 2.75
    ? '進球期望偏高，這場有機會從試探變互捅。'
    : '進球期望偏低，大概率是一球差、低比分、看誰先失手。'
  return {
    headline: opener,
    story: `${angle} ${tempo}`,
    keyFactors: [
      { label: '底牌差', value: gap.toFixed(1), note: gap < 4 ? '誰也別裝大哥' : `${favorite} 比較有本錢` },
      { label: '進球味', value: `${lambda1.toFixed(2)} : ${lambda2.toFixed(2)}`, note: `最像 ${best.g1}-${best.g2}` },
      { label: '翻車率', value: pctForNarrative(Math.min(home, away)), note: `${underdog} 的偷雞窗口` },
    ],
  }
}

function pctForNarrative(v) { return `${Math.round((v || 0) * 100)}%` }

export function predictMatch(match, standings = {}) {
  const team1 = canonicalTeam(match.team1)
  const team2 = canonicalTeam(match.team2)
  if ([team1, team2].some(isUnresolved)) {
    return { pick: '待定', confidence: 0.34, probabilities: { home: 0.33, draw: 0.34, away: 0.33 }, expectedGoals: [1.1, 1.1], score: '—', reasons: ['這格還沒開獎，現在硬猜只是裝神', '等晉級名單落地，我再把刀磨起來'] }
  }
  const flat = flattenStandings(standings)
  const r1 = teamRating(team1, flat)
  const r2 = teamRating(team2, flat)
  const form1 = flat[team1]?.goalDiff ?? 0
  const form2 = flat[team2]?.goalDiff ?? 0
  const neutral = (r1 - r2) / 20
  const formTilt = clamp((form1 - form2) * 0.08, -0.22, 0.22)
  const lambda1 = clamp(1.22 + neutral * 0.42 + formTilt, 0.25, 3.2)
  const lambda2 = clamp(1.16 - neutral * 0.42 - formTilt, 0.25, 3.2)
  let home = 0, draw = 0, away = 0
  let best = { g1: 0, g2: 0, p: 0 }
  for (let g1 = 0; g1 <= 6; g1 += 1) {
    for (let g2 = 0; g2 <= 6; g2 += 1) {
      const p = poisson(g1, lambda1) * poisson(g2, lambda2)
      if (g1 > g2) home += p
      else if (g1 === g2) draw += p
      else away += p
      if (p > best.p) best = { g1, g2, p }
    }
  }
  const total = home + draw + away
  home /= total; draw /= total; away /= total
  const entries = Object.entries({ home, draw, away }).sort((a, b) => b[1] - a[1])
  const pick = entries[0][0] === 'home' ? team1 : entries[0][0] === 'away' ? team2 : '平手'
  const confidence = clamp(entries[0][1] + Math.abs(home - away) * 0.18, 0.35, 0.82)
  const tag = labelRisk(confidence, home, draw, away)
  return {
    pick, confidence, tag, probabilities: { home, draw, away },
    expectedGoals: [Number(lambda1.toFixed(2)), Number(lambda2.toFixed(2))], score: `${best.g1}-${best.g2}`,
    commentary: buildNarrative({ team1, team2, pick, confidence, home, draw, away, lambda1, lambda2, r1, r2, best }),
    reasons: [
      `底牌分：${team1} ${r1.toFixed(1)}；${team2} ${r2.toFixed(1)}`,
      `預期進球 ${lambda1.toFixed(2)} : ${lambda2.toFixed(2)}，先用 Poisson 把嘴砲壓成數字`,
      Math.abs(r1 - r2) < 4 ? '兩邊差距薄，平局和一球差都很有戲' : `底牌差約 ${Math.abs(r1-r2).toFixed(1)} 分，我暫時站 ${pick}`,
    ],
  }
}

export function scorePrediction(prediction, match) {
  const score = match.score?.ft || match.score
  if (!Array.isArray(score) || score.length !== 2) return null
  const [g1, g2] = score.map(Number)
  const actual = g1 > g2 ? canonicalTeam(match.team1) : g2 > g1 ? canonicalTeam(match.team2) : '平手'
  const exact = prediction.score === `${g1}-${g2}`
  const pick = prediction.pick === actual
  return { pick, exact, points: exact ? 3 : pick ? 1 : 0, actual }
}
