// Small presentation helpers shared by several components.
import { teamName, teamMatches, DRAW } from './teams.js'

export const pickText = (row, lang) => (row.pred.pick === DRAW ? (lang === 'en' ? 'Draw' : '平手') : teamName(row.pred.pick, lang))

export const wentToExtraTime = (match) => /\bAET\b|extra time/i.test(match.source || '')

export function filterRows(rows, { query, stage, result }) {
  return rows.filter((r) => {
    if (stage !== 'all' && r.stage !== stage) return false
    if (result === 'hit' && !r.hit) return false
    if (result === 'miss' && r.hit) return false
    if (result === 'exact' && !r.exact) return false
    if (query && !teamMatches(r.match.team1, query) && !teamMatches(r.match.team2, query)) return false
    return true
  })
}
