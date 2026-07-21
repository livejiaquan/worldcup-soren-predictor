import { readFile } from 'node:fs/promises'

const data = JSON.parse(await readFile('public/data/worldcup.json', 'utf8'))

const matches = Array.isArray(data.matches) ? data.matches : []
const predictions = data.predictions || {}
const leaderboard = Array.isArray(data.leaderboard) ? data.leaderboard : []
const paperBankroll = data.paperBankroll || {}

function pct(value) {
  return `${Math.round(Number(value || 0) * 100)}%`
}

function money(value) {
  return `$${Number(value || 0).toFixed(2)}`
}

function resultOf(match) {
  if (!Array.isArray(match?.score)) return 'TBD'
  return `${match.score[0]}-${match.score[1]}`
}

function outcomeFor(match) {
  if (!Array.isArray(match.score)) return null
  if (match.score[0] > match.score[1]) return match.team1
  if (match.score[1] > match.score[0]) return match.team2
  return match.winner || 'Draw'
}

function pickedCorrect(match, prediction) {
  if (!prediction?.pick) return false
  return prediction.pick === outcomeFor(match)
}

function scoreError(match, prediction) {
  const predicted = String(prediction?.score || '').match(/^(\d+)-(\d+)$/)
  if (!predicted || !Array.isArray(match.score)) return null
  return Math.abs(Number(predicted[1]) - match.score[0]) + Math.abs(Number(predicted[2]) - match.score[1])
}

const finished = matches.filter((match) => match.status === 'finished')
const final = [...finished].reverse().find((match) => match.stage === 'Final')
const soren = leaderboard.find((row) => row.id === 'soren')
const rating = leaderboard.find((row) => row.id === 'rating')
const draw = leaderboard.find((row) => row.id === 'draw')

const sorenRows = finished
  .map((match) => ({
    match,
    prediction: predictions[match.id],
    correct: pickedCorrect(match, predictions[match.id]),
    error: scoreError(match, predictions[match.id]),
  }))
  .filter((row) => row.prediction)

const highConfidence = sorenRows
  .filter((row) => Number(row.prediction.confidence) >= 0.8)
  .sort((a, b) => Number(b.prediction.confidence) - Number(a.prediction.confidence))

const highConfidenceHits = highConfidence.filter((row) => row.correct).slice(0, 5)
const highConfidenceMisses = highConfidence.filter((row) => !row.correct).slice(0, 5)
const biggestScoreMisses = sorenRows
  .filter((row) => Number.isFinite(row.error))
  .sort((a, b) => b.error - a.error)
  .slice(0, 5)

const lines = []
lines.push('# Soren World Cup Archive Summary')
lines.push('')
lines.push(`Generated at: ${data.generatedAt}`)
lines.push(`Matches: ${data.summary?.finishedMatches || finished.length}/${data.summary?.totalMatches || matches.length} finished`)
if (final) lines.push(`Champion: ${final.winner || outcomeFor(final)} (${final.team1} ${resultOf(final)} ${final.team2})`)
lines.push('')
lines.push('## Model table')
lines.push('')
lines.push('| Model | Points | Accuracy | Exact scores | Correct picks |')
lines.push('|---|---:|---:|---:|---:|')
for (const row of leaderboard) {
  lines.push(`| ${row.name} | ${row.points} | ${pct(row.accuracy)} | ${row.exact} | ${row.correct}/${row.total} |`)
}
lines.push('')
lines.push('## Paper bankroll')
lines.push('')
lines.push(`- Initial bankroll: ${money(paperBankroll.initialBankroll)}`)
lines.push(`- Final bankroll: ${money(paperBankroll.bankroll)}`)
lines.push(`- ROI: ${pct(paperBankroll.roi)}`)
lines.push(`- Settled bets: ${paperBankroll.settled?.length || 0}; open stake: ${money(paperBankroll.openStake)}`)
lines.push('')
lines.push('## Soren audit')
lines.push('')
if (soren && rating) lines.push(`- Soren vs rating baseline: ${soren.points - rating.points} points`)
if (soren && draw) lines.push(`- Soren vs draw baseline: ${soren.points - draw.points} points`)
lines.push(`- High-confidence matches (>=80%): ${highConfidence.length}`)
lines.push('')
lines.push('### High-confidence hits')
lines.push('')
for (const { match, prediction } of highConfidenceHits) {
  lines.push(`- ${match.team1} ${resultOf(match)} ${match.team2}: picked ${prediction.pick} (${pct(prediction.confidence)})`)
}
lines.push('')
lines.push('### High-confidence misses')
lines.push('')
for (const { match, prediction } of highConfidenceMisses) {
  lines.push(`- ${match.team1} ${resultOf(match)} ${match.team2}: picked ${prediction.pick} (${pct(prediction.confidence)}), actual ${outcomeFor(match)}`)
}
lines.push('')
lines.push('### Biggest score misses')
lines.push('')
for (const { match, prediction, error } of biggestScoreMisses) {
  lines.push(`- ${match.team1} ${resultOf(match)} ${match.team2}: predicted ${prediction.score}, absolute goal error ${error}`)
}

console.log(lines.join('\n'))
