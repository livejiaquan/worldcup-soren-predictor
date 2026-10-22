import { Flag } from './ui.jsx'
import { teamName } from '../lib/teams.js'

export default function Groups({ data, archive, lang, t }) {
  const groups = Object.entries(data.standings || {})
  return (
    <>
      <header className="page-head">
        <h1>{t('groupsTitle')}</h1>
        <p className="lede">{t('groupsSub')}</p>
      </header>
      <ul className="legend legend-inline" aria-hidden="true">
        <li><span className="q-dot q-top" />{t('qualified')}</li>
        <li><span className="q-dot q-third" />{t('bestThird')}</li>
      </ul>
      <div className="groups">
        {groups.map(([name, rows]) => {
          const letter = name.replace('Group ', '')
          const groupRows = archive.rows.filter((r) => r.match.group === name)
          const hits = groupRows.filter((r) => r.hit).length
          return (
            <section key={name} className="card group" aria-labelledby={`g-${letter}`}>
              <header className="group-head">
                <h2 id={`g-${letter}`}>{t('groupName', { g: letter })}</h2>
                <span className="muted num">{t('groupHits', { hits, n: groupRows.length })}</span>
              </header>
              <table className="table">
                <thead>
                  <tr>
                    <th scope="col" className="col-team">{t('cols.team')}</th>
                    <th scope="col">{t('cols.p')}</th>
                    <th scope="col" className="hide-xs">{t('cols.w')}</th>
                    <th scope="col" className="hide-xs">{t('cols.d')}</th>
                    <th scope="col" className="hide-xs">{t('cols.l')}</th>
                    <th scope="col">{t('cols.gd')}</th>
                    <th scope="col">{t('cols.pts')}</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((r, i) => {
                    const q = i < 2 ? 'top' : archive.r32Teams.has(r.team) ? 'third' : null
                    return (
                      <tr key={r.team} className={q ? `q-${q}` : 'q-out'}>
                        <th scope="row" className="col-team">
                          <span className="team-cell">
                            <span className="rank-pos num">{i + 1}</span>
                            <Flag team={r.team} size="sm" />
                            <span className="team-name">{teamName(r.team, lang)}</span>
                            {q && <span className="sr-only"> – {q === 'top' ? t('qualified') : t('bestThird')}</span>}
                          </span>
                        </th>
                        <td className="num">{r.played}</td>
                        <td className="num hide-xs">{r.won}</td>
                        <td className="num hide-xs">{r.drawn}</td>
                        <td className="num hide-xs">{r.lost}</td>
                        <td className="num">{r.goalDiff > 0 ? `+${r.goalDiff}` : r.goalDiff}</td>
                        <td className="num"><b>{r.points}</b></td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </section>
          )
        })}
      </div>
    </>
  )
}
