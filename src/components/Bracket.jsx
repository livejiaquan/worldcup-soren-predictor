import { useState } from 'react'
import { Flag, Icon, Verdict } from './ui.jsx'
import { wentToExtraTime } from '../lib/view.js'
import { teamName } from '../lib/teams.js'
import { winnerOf } from '../lib/archive.js'
import { fmtShortDate } from '../lib/format.js'

function TieCard({ match, row, lang, t, onOpen }) {
  const w = winnerOf(match)
  const note = match.shootoutScore ? t('pens', { a: match.shootoutScore[0], b: match.shootoutScore[1] }) : wentToExtraTime(match) ? t('aet') : null
  const sides = [
    { team: match.team1, goals: match.score?.[0], pens: match.shootoutScore?.[0] },
    { team: match.team2, goals: match.score?.[1], pens: match.shootoutScore?.[1] },
  ]
  return (
    <button type="button" className="tie" onClick={() => onOpen(match.id)}
      aria-label={`${teamName(match.team1, lang)} ${match.score?.[0]}–${match.score?.[1]} ${teamName(match.team2, lang)}${note ? ` (${note})` : ''}`}>
      {sides.map((s) => (
        <span key={s.team} className={`tie-team ${s.team === w ? 'is-winner' : 'is-loser'}`}>
          <Flag team={s.team} size="sm" />
          <span className="team-name">{teamName(s.team, lang)}</span>
          <span className="tie-goals num">{s.goals}{s.pens != null && <sup>({s.pens})</sup>}</span>
        </span>
      ))}
      <span className="tie-foot">
        <span className="muted num">{fmtShortDate(match.kickoffUtc, lang)}{note ? ` · ${note}` : ''}</span>
        {row && <Verdict row={row} t={t} compact />}
      </span>
    </button>
  )
}

export default function Bracket({ archive, lang, t, onOpen }) {
  const rounds = archive.bracket
  const [active, setActive] = useState('r32')
  const { champion, third } = archive
  return (
    <>
      <header className="page-head">
        <h1>{t('bracketTitle')}</h1>
        <p className="lede">{t('bracketSub')}</p>
      </header>
      <div className="segmented round-picker" role="group" aria-label={t('roundPicker')}>
        {rounds.map((r) => (
          <button key={r.stage} type="button" aria-pressed={active === r.stage} className={active === r.stage ? 'is-active' : ''}
            onClick={() => setActive(r.stage)}>{t(`stages.${r.stage}`)}</button>
        ))}
      </div>
      <div className="bracket" data-active={active}>
        {rounds.map((r) => (
          <section key={r.stage} className={`round round-${r.stage} ${active === r.stage ? 'is-active' : ''}`} aria-label={t(`stages.${r.stage}`)}>
            <h2 className="round-head">{t(`stages.${r.stage}`)}</h2>
            <ol className="round-list">
              {r.matches.map((m) => (
                <li key={m.id}><TieCard match={m} row={archive.rowById[m.id]} lang={lang} t={t} onOpen={onOpen} /></li>
              ))}
            </ol>
            {r.stage === 'final' && (
              <div className="final-extras">
                {champion && (
                  <div className="trophy-card">
                    <Icon name="trophy" size={28} />
                    <span className="muted">{t('champion')}</span>
                    <b><Flag team={champion} />{teamName(champion, lang)}</b>
                  </div>
                )}
                {third && (
                  <div className="third-place">
                    <h3 className="round-head">{t('thirdPlace')}</h3>
                    <TieCard match={third} row={archive.rowById[third.id]} lang={lang} t={t} onOpen={onOpen} />
                  </div>
                )}
              </div>
            )}
          </section>
        ))}
      </div>
    </>
  )
}
