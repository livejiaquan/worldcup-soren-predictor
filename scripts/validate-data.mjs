import { readFile } from 'node:fs/promises'

const data = JSON.parse(await readFile('public/data/worldcup.json', 'utf8'))
const errors = []
if (!data.generatedAt) errors.push('missing generatedAt')
if (!Array.isArray(data.matches) || data.matches.length < 100) errors.push(`expected at least 100 matches, got ${data.matches?.length}`)
if (!Array.isArray(data.groups) || data.groups.length !== 12) errors.push(`expected 12 groups, got ${data.groups?.length}`)
if (!data.predictions || Object.keys(data.predictions).length !== data.matches.length) errors.push('prediction count mismatch')
if (!Array.isArray(data.leaderboard) || data.leaderboard.length < 3) errors.push('leaderboard missing')
for (const match of data.matches || []) {
  if (!match.id || !match.team1 || !match.team2) errors.push(`bad match identity ${JSON.stringify(match)}`)
  const pred = data.predictions?.[match.id]
  if (!pred || !pred.probabilities || typeof pred.confidence !== 'number') errors.push(`bad prediction for ${match.id}`)
}
if (errors.length) {
  console.error(errors.join('\n'))
  process.exit(1)
}
console.log(`Validated ${data.matches.length} matches, ${data.groups.length} groups, ${Object.keys(data.predictions).length} predictions.`)
