// Overview: three-column hub layout (focal card · predictions table · tabbed champion/groups),
// a dark full-width band of four ranked-list cards, the 104-cell grid card and two half cards.
// Column proportions, card chrome and rhythm are documented in docs/design-research.md.
import { useState } from 'react'
import { Flag, Icon, ProbBar, Section, Stat, Team, Verdict } from './ui.jsx'
import { BankrollChart, Calibration, LeaderboardTable, RankList, StageTable } from './charts.jsx'
import { pickText, wentToExtraTime } from '../lib/view.js'
import { teamName } from '../lib/teams.js'
import { STAGES } from '../lib/archive.js'
import { fmtDay, money, pct, signedPct } from '../lib/format.js'

function FocalCard({ archive, t, onNavigate }) {
  const s = archive.summary
  const l = archive.ledger
  return (
    <article className="ocard focal-card" aria-labelledby="focal-title">
      <div className="ocard-body">
        <p className="focal">
          <span className="focal-value">{pct(s.accuracy, 1)}</span>
          <span className="focal-label">{t('kpiAccuracy')}<span className="muted">{t('kpiAccuracySub', { hits: s.hits, n: s.n })}</span></span>
        </p>
        <h1 id="focal-title" className="focal-title">{t('heroTitle', { n: s.n, hits: s.hits })}</h1>
        <p className="lede">{t('heroLede')}</p>
        <dl className="kpi-rows">
          <Stat label={t('kpiExact')} value={s.exact} sub={t('kpiExactSub', { p: pct(s.exactRate, 1) })} />
          <Stat label={t('kpiPoints')} value={s.points} sub={t('kpiPointsSub', { rank: archive.leaderboard.find((r) => r.id === 'soren')?.rank ?? '–' })} />
          <Stat label={t('kpiBankroll')} value={money(l.bankroll)} sub={signedPct(l.roi)} />
        </dl>
      </div>
      <footer className="ocard-foot">
        <button type="button" className="more-link" onClick={() => onNavigate('matches')}>{t('allMatches')}<Icon name="right" size={16} /></button>
      </footer>
    </article>
  )
}

function PredictionsCard({ archive, t, onNavigate }) {
  return (
    <Section id="predictions" title={t('predictionsCard')} className="predictions-card">
      <LeaderboardTable archive={archive} t={t} caption={t('modelsTitle')} />
      <p className="dtable-note">{t('modelsSub')}</p>
      <StageTable archive={archive} t={t} />
      <footer className="ocard-foot">
        <button type="button" className="more-link" onClick={() => onNavigate('record')}>{t('allRecord')}<Icon name="right" size={16} /></button>
      </footer>
    </Section>
  )
}

function ChampionPane({ archive, lang, t, onOpen }) {
  const { final, champion, runnerUp } = archive
  if (!final || !champion) return null
  const row = archive.rowById[final.id]
  const labels = [teamName(final.team1, lang), t('draw'), teamName(final.team2, lang)]
  const score = champion === final.team1 ? `${final.score[0]}–${final.score[1]}` : `${final.score[1]}–${final.score[0]}`
  return (
    <div className="champ">
      <p className="champ-label"><Icon name="trophy" size={20} />{t('champion')}<span className="muted"> · {t('finalLabel')} {fmtDay(final.kickoffUtc, lang)}</span></p>
      <p className="champ-name"><Team team={champion} lang={lang} size="lg" /></p>
      <p className="champ-line">{t('championLine', { score, loser: teamName(runnerUp, lang) })}{wentToExtraTime(final) ? ` · ${t('aet')}` : ''}</p>
      {row && (
        <div className="champ-call">
          <p className="champ-call-head"><span>{t('sorenCall')}：<b>{pickText(row, lang)}</b> <span className="num">{pct(row.pickProb)}</span></span><Verdict row={row} t={t} /></p>
          <ProbBar probs={row.pred.probabilities} outcome={row.outcome} labels={labels} size="md" />
          <p className="probbar-legend" aria-hidden="true">
            <span>{labels[0]} {pct(row.pred.probabilities.home)}</span><span>{labels[1]} {pct(row.pred.probabilities.draw)}</span><span>{labels[2]} {pct(row.pred.probabilities.away)}</span>
          </p>
        </div>
      )}
      <footer className="ocard-foot">
        <button type="button" className="more-link" onClick={() => onOpen(final.id)}>{t('viewFinal')}<Icon name="right" size={16} /></button>
      </footer>
    </div>
  )
}

function GroupPane({ data, archive, lang, t, onNavigate }) {
  const groups = Object.entries(data.standings || {})
  const [i, setI] = useState(0)
  const [name, rows] = groups[i] || ['', []]
  const letter = name.replace('Group ', '')
  return (
    <div className="grouppane">
      <div className="pager">
        <button type="button" className="icon-btn" onClick={() => setI((i - 1 + groups.length) % groups.length)} aria-label={t('prevGroup')}><Icon name="left" size={20} /></button>
        <span className="pager-title">{t('groupName', { g: letter })}</span>
        <button type="button" className="icon-btn" onClick={() => setI((i + 1) % groups.length)} aria-label={t('nextGroup')}><Icon name="right" size={20} /></button>
      </div>
      <table className="dtable">
        <thead><tr><th scope="col">#</th><th scope="col" className="col-left">{t('cols.team')}</th><th scope="col">{t('cols.p')}</th><th scope="col">{t('cols.w')}</th><th scope="col">{t('cols.gd')}</th><th scope="col">{t('cols.pts')}</th></tr></thead>
        <tbody>
          {rows.map((r, idx) => {
            const q = idx < 2 ? 'top' : archive.r32Teams.has(r.team) ? 'third' : null
            return (
              <tr key={r.team} className={q ? `q-${q}` : ''}>
                <td>{idx + 1}</td>
                <th scope="row" className="col-left"><span className="team-cell"><Flag team={r.team} size="sm" /><span className="team-name">{teamName(r.team, lang)}</span>{q && <span className="sr-only"> – {q === 'top' ? t('qualified') : t('bestThird')}</span>}</span></th>
                <td>{r.played}</td><td>{r.won}</td><td>{r.goalDiff > 0 ? `+${r.goalDiff}` : r.goalDiff}</td><td><b>{r.points}</b></td>
              </tr>
            )
          })}
        </tbody>
      </table>
      <footer className="ocard-foot">
        <button type="button" className="more-link" onClick={() => onNavigate('groups')}>{t('allGroups')}<Icon name="right" size={16} /></button>
      </footer>
    </div>
  )
}

function TabbedCard({ data, archive, lang, t, onOpen, onNavigate }) {
  const [tab, setTab] = useState('champion')
  return (
    <section className="ocard tabbed-card" aria-label={t('tabs.overview')}>
      <div className="ocard-tabs" role="tablist">
        {['champion', 'groups'].map((k) => (
          <button key={k} type="button" role="tab" aria-selected={tab === k} className={tab === k ? 'is-active' : ''} onClick={() => setTab(k)}>{t(`cardTabs.${k}`)}</button>
        ))}
      </div>
      <div className="ocard-body" role="tabpanel">
        {tab === 'champion' ? <ChampionPane archive={archive} lang={lang} t={t} onOpen={onOpen} /> : <GroupPane data={data} archive={archive} lang={lang} t={t} onNavigate={onNavigate} />}
      </div>
    </section>
  )
}

function DarkBand({ archive, lang, t, onOpen }) {
  const sorted = [...archive.rows].sort((a, b) => b.pickProb - a.pickProb || new Date(b.match.kickoffUtc) - new Date(a.match.kickoffUtc))
  const label = (r) => `${teamName(r.match.team1, lang)} ${r.match.score[0]}–${r.match.score[1]} ${teamName(r.match.team2, lang)}`
  const best = sorted.filter((r) => r.hit).slice(0, 5).map((r) => ({ key: r.id, id: r.id, label: label(r), value: pct(r.pickProb) }))
  const worst = sorted.filter((r) => !r.hit).slice(0, 5).map((r) => ({ key: r.id, id: r.id, label: label(r), value: pct(r.pickProb) }))
  const stages = archive.stages.map((s) => ({ key: s.stage, label: t(`stages.${s.stage}`), value: `${s.hits}/${s.n}` }))
  const tags = archive.tags.map((g) => ({ key: g.tag, label: t(`tagNames.${g.tag}`), value: `${pct(g.accuracy)} · ${g.hits}/${g.n}` }))
  const cards = [
    { key: 'best', title: t('bestTitle'), rows: best, open: true },
    { key: 'worst', title: t('worstTitle'), rows: worst, open: true },
    { key: 'stages', title: t('stagesTitle'), rows: stages },
    { key: 'tags', title: t('tagsTitle'), rows: tags },
  ]
  return (
    <section className="band" aria-labelledby="band-title">
      <div className="band-inner">
        <header className="band-head"><h2 id="band-title">{t('bandTitle')}</h2><span className="band-meta muted">{t('bandSub')}</span></header>
        <div className="band-grid">
          {cards.map((c) => (
            <article key={c.key} className="band-card">
              <h3>{c.title}</h3>
              <RankList rows={c.rows} onOpen={c.open ? onOpen : null} />
            </article>
          ))}
        </div>
      </div>
    </section>
  )
}

function ResultGrid({ archive, lang, t, onBrowse }) {
  return (
    <Section id="grid" title={t('gridTitle')} className="grid-card"
      action={<button type="button" className="more-link" onClick={onBrowse}>{t('allMatches')}<Icon name="right" size={16} /></button>}>
      <ul className="legend" aria-hidden="true">
        <li><span className="cell cell-exact" />{t('legendExact')}</li>
        <li><span className="cell cell-hit" />{t('legendHit')}</li>
        <li><span className="cell cell-miss" />{t('legendMiss')}</li>
      </ul>
      <div className="grid-stages">
        {STAGES.map((stage) => {
          const rows = archive.rows.filter((r) => r.stage === stage)
          if (!rows.length) return null
          const hits = rows.filter((r) => r.hit).length
          const exact = rows.filter((r) => r.exact).length
          return (
            <div className="grid-stage" key={stage}>
              <div className="grid-stage-head"><span>{t(`stages.${stage}`)}</span><span className="num muted">{hits}/{rows.length}</span></div>
              <div className="cells" role="img" aria-label={`${t(`stages.${stage}`)}：${hits}/${rows.length} ${t('hit')}，${exact} ${t('exactHit')}`}>
                {rows.map((r) => <span key={r.id} className={`cell ${r.exact ? 'cell-exact' : r.hit ? 'cell-hit' : 'cell-miss'}`} title={`${teamName(r.match.team1, lang)} ${r.match.score[0]}–${r.match.score[1]} ${teamName(r.match.team2, lang)} · ${t('predicted')} ${pickText(r, lang)}`} />)}
              </div>
            </div>
          )
        })}
      </div>
    </Section>
  )
}

export default function Overview({ data, archive, lang, t, onOpen, onNavigate }) {
  const l = archive.ledger
  return (
    <>
      <div className="three-col">
        <FocalCard archive={archive} t={t} onNavigate={onNavigate} />
        <PredictionsCard archive={archive} t={t} onNavigate={onNavigate} />
        <TabbedCard data={data} archive={archive} lang={lang} t={t} onOpen={onOpen} onNavigate={onNavigate} />
      </div>
      <DarkBand archive={archive} lang={lang} t={t} onOpen={onOpen} />
      <ResultGrid archive={archive} lang={lang} t={t} onBrowse={() => onNavigate('matches')} />
      <div className="two-col">
        <Section id="bankroll" title={t('ledgerTitle')} sub={t('ledgerShort')}>
          <dl className="kpi-strip">
            <Stat label={t('ledgerFinal')} value={money(l.bankroll)} sub={signedPct(l.roi)} tone={l.pnl >= 0 ? 'hit' : 'miss'} />
            <Stat label={t('ledgerWinRate')} value={pct(l.bets.length ? l.wins / l.bets.length : 0)} sub={t('ledgerRecord', { w: l.wins, l: l.losses, n: l.bets.length })} />
          </dl>
          <BankrollChart ledger={l} lang={lang} t={t} />
        </Section>
        <Section id="calib" title={t('calibTitle')} sub={t('calibSub')}>
          <Calibration archive={archive} t={t} />
        </Section>
      </div>
    </>
  )
}
