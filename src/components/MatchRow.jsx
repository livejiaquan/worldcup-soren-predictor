import { Flag, ProbBar, Verdict } from './ui.jsx'
import { teamName } from '../lib/teams.js'
import { pickText, wentToExtraTime } from '../lib/view.js'
import { fmtTime, fmtDay, pct, predScoreText } from '../lib/format.js'

export function ScoreBox({ match, t, size = 'md' }) {
  const note = match.shootoutScore
    ? t('pens', { a: match.shootoutScore[0], b: match.shootoutScore[1] })
    : wentToExtraTime(match) ? t('aet') : null
  return (
    <span className={`scorebox scorebox-${size}`}>
      <span className="scorebox-main">{match.score[0]}<span className="scorebox-dash">–</span>{match.score[1]}</span>
      {note && <span className="scorebox-note">{note}</span>}
    </span>
  )
}

/** One finished match: teams, real score, the pre-match probability split and the verdict. */
export function MatchRow({ row, lang, t, onOpen, showDate = false }) {
  const { match } = row
  const w = match.winner || (match.score[0] > match.score[1] ? match.team1 : match.score[1] > match.score[0] ? match.team2 : null)
  const labels = [teamName(match.team1, lang), t('draw'), teamName(match.team2, lang)]
  return (
    <li>
      <button type="button" className="match-row" onClick={() => onOpen(match.id)}
        aria-label={[`${labels[0]} ${match.score[0]}–${match.score[1]} ${labels[2]}`, `${t('predicted')} ${pickText(row, lang)} ${pct(row.pickProb)}`, row.exact ? t('exactHit') : row.hit ? t('hit') : t('miss')].join(lang === 'en' ? ', ' : '，')}>
        <span className="mr-meta">
          {showDate && <span>{fmtDay(match.kickoffUtc, lang)}</span>}
          <span className="mr-time">{fmtTime(match.kickoffUtc, lang)}</span>
          <span className="mr-stage">{t(`stages.${row.stage}`)}{match.group ? ` ${match.group.replace('Group ', '')}` : ''}</span>
        </span>
        <span className={`mr-team mr-home ${w === match.team1 ? 'is-winner' : ''}`}>
          <span className="team-name">{labels[0]}</span><Flag team={match.team1} />
        </span>
        <ScoreBox match={match} t={t} />
        <span className={`mr-team mr-away ${w === match.team2 ? 'is-winner' : ''}`}>
          <Flag team={match.team2} /><span className="team-name">{labels[2]}</span>
        </span>
        <span className="mr-pred">
          <ProbBar probs={row.pred.probabilities} outcome={row.outcome} labels={labels} />
          <span className="mr-pick">
            <span className="mr-pick-label">{t('predicted')}</span> <b>{pickText(row, lang)}</b> <span className="num">{pct(row.pickProb)}</span>{' '}
            <span className="mr-pick-score num">· {predScoreText(row.pred.score)}</span>
          </span>
        </span>
        <span className="mr-verdict"><Verdict row={row} t={t} /></span>
      </button>
    </li>
  )
}
