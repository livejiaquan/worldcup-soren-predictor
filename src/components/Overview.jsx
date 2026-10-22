import { Icon, Meter, ProbBar, Section, Stat, Team, Verdict } from './ui.jsx'
import { MatchRow, ScoreBox } from './MatchRow.jsx'
import { pickText } from '../lib/view.js'
import { teamName } from '../lib/teams.js'
import { STAGES } from '../lib/archive.js'
import { fmtDateTime, fmtDay, money, pct, signedPct } from '../lib/format.js'

function ChampionCard({ archive, lang, t, onOpen }) {
  const { final, champion, runnerUp } = archive
  if (!final || !champion) return null
  const row = archive.rowById[final.id]
  const labels = [teamName(final.team1, lang), t('draw'), teamName(final.team2, lang)]
  return (
    <article className="card champion" aria-labelledby="champion-title">
      <div className="champion-top">
        <span className="champion-badge"><Icon name="trophy" size={16} />{t('champion')}</span>
        <span className="champion-date">{t('finalLabel')} · {fmtDay(final.kickoffUtc, lang)}</span>
      </div>
      <h2 id="champion-title" className="champion-name"><Team team={champion} lang={lang} size="lg" /></h2>
      <div className="champion-final">
        <Team team={final.team1} lang={lang} size="sm" winner={champion === final.team1} />
        <ScoreBox match={final} t={t} size="sm" />
        <Team team={final.team2} lang={lang} size="sm" align="end" winner={champion === final.team2} />
      </div>
      {row && (
        <div className="champion-call">
          <div className="champion-call-head">
            <span>{t('sorenCall')}：<b>{pickText(row, lang)}</b> <span className="num">{pct(row.pickProb)}</span></span>
            <Verdict row={row} t={t} />
          </div>
          <ProbBar probs={row.pred.probabilities} outcome={row.outcome} labels={labels} size="md" />
          <div className="probbar-legend" aria-hidden="true">
            <span>{labels[0]} {pct(row.pred.probabilities.home)}</span>
            <span>{labels[1]} {pct(row.pred.probabilities.draw)}</span>
            <span>{labels[2]} {pct(row.pred.probabilities.away)}</span>
          </div>
        </div>
      )}
      <div className="champion-foot">
        <span className="muted">{t('runnerUp')}：{teamName(runnerUp, lang)}</span>
        <button type="button" className="btn btn-secondary" onClick={() => onOpen(final.id)}>{t('viewMatch')}<Icon name="right" size={16} /></button>
      </div>
    </article>
  )
}

function Kpis({ archive, t }) {
  const s = archive.summary
  const soren = archive.leaderboard.find((r) => r.id === 'soren')
  const l = archive.ledger
  return (
    <dl className="card kpis">
      <Stat label={t('kpiAccuracy')} value={pct(s.accuracy, 1)} sub={t('kpiAccuracySub', { hits: s.hits, n: s.n })} tone="accent" />
      <Stat label={t('kpiExact')} value={s.exact} sub={t('kpiExactSub', { p: pct(s.exactRate, 1) })} />
      <Stat label={t('kpiPoints')} value={s.points} sub={t('kpiPointsSub', { rank: soren?.rank ?? '–' })} />
      <Stat label={t('kpiBankroll')} value={money(l.bankroll)} sub={t('kpiBankrollSub', { roi: signedPct(l.roi) })} tone={l.pnl >= 0 ? 'hit' : 'miss'} />
    </dl>
  )
}

function ResultGrid({ archive, lang, t, onBrowse }) {
  return (
    <Section id="grid" title={t('gridTitle')} sub={t('gridSub')}
      action={<button type="button" className="btn btn-secondary" onClick={onBrowse}>{t('tabs.matches')}<Icon name="right" size={16} /></button>}>
      <div className="card grid-card">
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
            const label = `${t(`stages.${stage}`)}：${hits}/${rows.length} ${t('hit')}，${exact} ${t('exactHit')}`
            return (
              <div className="grid-stage" key={stage}>
                <div className="grid-stage-head"><span>{t(`stages.${stage}`)}</span><span className="num muted">{hits}/{rows.length}</span></div>
                <div className="cells" role="img" aria-label={label}>
                  {rows.map((r) => (
                    <span key={r.id} className={`cell ${r.exact ? 'cell-exact' : r.hit ? 'cell-hit' : 'cell-miss'}`}
                      title={`${teamName(r.match.team1, lang)} ${r.match.score[0]}–${r.match.score[1]} ${teamName(r.match.team2, lang)} · ${t('predicted')} ${pickText(r, lang)}`} />
                  ))}
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </Section>
  )
}

function StageAccuracy({ archive, t }) {
  return (
    <Section id="stages" title={t('stagesTitle')} sub={t('stagesSub')}>
      <ul className="card bars">
        {archive.stages.map((s) => (
          <li key={s.stage} className="bar-row">
            <span className="bar-label">{t(`stages.${s.stage}`)}</span>
            <Meter value={s.accuracy} label={`${pct(s.accuracy)}`} />
            <span className="bar-value num"><b>{pct(s.accuracy)}</b> <span className="muted">{s.hits}/{s.n}</span></span>
          </li>
        ))}
      </ul>
    </Section>
  )
}

export function Leaderboard({ archive, t }) {
  const max = Math.max(...archive.leaderboard.map((r) => r.points), 1)
  return (
    <ol className="card leaderboard">
      {archive.leaderboard.map((r) => (
        <li key={r.id} className={`lb-row ${r.id === 'soren' ? 'is-soren' : ''}`}>
          <span className="lb-rank num">{r.rank}</span>
          <span className="lb-name"><b>{t(`modelNames.${r.id}`)}</b><span className="muted">{t(`modelDesc.${r.id}`)}</span></span>
          <Meter value={r.points / max} tone={r.id === 'soren' ? 'accent' : 'neutral'} label={`${r.points} ${t('pts')}`} />
          <span className="lb-points num"><b>{r.points}</b> <span className="muted">{t('pts')}</span></span>
          <span className="lb-acc num muted">{pct(r.accuracy)} · {r.exact}★</span>
        </li>
      ))}
    </ol>
  )
}

function Notables({ archive, lang, t, onOpen }) {
  const sorted = [...archive.rows].sort((a, b) => b.pickProb - a.pickProb || new Date(b.match.kickoffUtc) - new Date(a.match.kickoffUtc))
  const best = sorted.filter((r) => r.hit).slice(0, 4)
  const worst = sorted.filter((r) => !r.hit).slice(0, 4)
  return (
    <div className="two-col">
      <Section id="best" title={t('bestTitle')}>
        <ul className="card match-list">{best.map((r) => <MatchRow key={r.id} row={r} lang={lang} t={t} onOpen={onOpen} showDate />)}</ul>
      </Section>
      <Section id="worst" title={t('worstTitle')}>
        <ul className="card match-list">{worst.map((r) => <MatchRow key={r.id} row={r} lang={lang} t={t} onOpen={onOpen} showDate />)}</ul>
      </Section>
    </div>
  )
}

export function Hero({ data, archive, lang, t }) {
  const ok = data.dataQuality?.status === 'pass'
  return (
    <header className="hero">
      <p className="eyebrow">{t('eyebrow')}</p>
      <h1>{t('heroTitle', { n: archive.summary.n, hits: archive.summary.hits })}</h1>
      <p className="lede">{t('heroLede')}</p>
      <ul className="status-line">
        <li className={ok ? 'status-ok' : 'status-warn'}><Icon name={ok ? 'check' : 'info'} size={15} />{ok ? t('verified') : t('needsReview')}</li>
        <li>{t('finishedCount', { f: data.summary.finishedMatches, t: data.summary.totalMatches })}</li>
        <li><time dateTime={data.generatedAt}>{t('snapshot', { time: fmtDateTime(data.generatedAt, lang) })}</time></li>
        <li className="muted">{t('tzNote')}</li>
      </ul>
    </header>
  )
}

export default function Overview({ data, archive, lang, t, onOpen, onNavigate }) {
  return (
    <>
      <Hero data={data} archive={archive} lang={lang} t={t} />
      <div className="overview-top">
        <ChampionCard archive={archive} lang={lang} t={t} onOpen={onOpen} />
        <Kpis archive={archive} t={t} />
      </div>
      <ResultGrid archive={archive} lang={lang} t={t} onBrowse={() => onNavigate('matches')} />
      <div className="two-col">
        <StageAccuracy archive={archive} t={t} />
        <Section id="models" title={t('modelsTitle')} sub={t('modelsSub')}>
          <Leaderboard archive={archive} t={t} />
        </Section>
      </div>
      <Notables archive={archive} lang={lang} t={t} onOpen={onOpen} />
    </>
  )
}
