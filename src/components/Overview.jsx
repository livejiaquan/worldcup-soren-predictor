import { Icon, Meter, ProbBar, Section, Stat, Team, Verdict } from './ui.jsx'
import { MatchRow } from './MatchRow.jsx'
import { pickText, wentToExtraTime } from '../lib/view.js'
import { teamName } from '../lib/teams.js'
import { STAGES } from '../lib/archive.js'
import { fmtDateTime, fmtDay, money, pct, signedPct } from '../lib/format.js'

/** Supporting column of the hero: who won, and what Soren said before the final. */
function Champion({ archive, lang, t, onOpen }) {
  const { final, champion } = archive
  if (!final || !champion) return null
  const row = archive.rowById[final.id]
  const labels = [teamName(final.team1, lang), t('draw'), teamName(final.team2, lang)]
  const loser = champion === final.team1 ? final.team2 : final.team1
  const note = wentToExtraTime(final) ? ` · ${t('aet')}` : ''
  const score = champion === final.team1 ? `${final.score[0]}–${final.score[1]}` : `${final.score[1]}–${final.score[0]}`
  return (
    <aside className="hero-side" aria-labelledby="champion-title">
      <p className="champion-label"><Icon name="trophy" size={18} />{t('champion')}<span className="muted"> · {t('finalLabel')} {fmtDay(final.kickoffUtc, lang)}</span></p>
      <h2 id="champion-title" className="champion-name"><Team team={champion} lang={lang} size="lg" /></h2>
      <p className="champion-final">{t('championLine', { score, loser: teamName(loser, lang) })}{note}</p>
      {row && (
        <div className="champion-call">
          <p className="champion-call-head">
            <span>{t('sorenCall')}：<b>{pickText(row, lang)}</b> <span className="num">{pct(row.pickProb)}</span></span>
            <Verdict row={row} t={t} />
          </p>
          <ProbBar probs={row.pred.probabilities} outcome={row.outcome} labels={labels} size="md" />
          <p className="probbar-legend" aria-hidden="true">
            <span>{labels[0]} {pct(row.pred.probabilities.home)}</span>
            <span>{labels[1]} {pct(row.pred.probabilities.draw)}</span>
            <span>{labels[2]} {pct(row.pred.probabilities.away)}</span>
          </p>
        </div>
      )}
      <button type="button" className="btn btn-secondary" onClick={() => onOpen(final.id)}>{t('viewFinal')}<Icon name="right" size={16} /></button>
    </aside>
  )
}

function Kpis({ archive, t }) {
  const s = archive.summary
  const soren = archive.leaderboard.find((r) => r.id === 'soren')
  const l = archive.ledger
  return (
    <dl className="kpi-strip">
      <Stat label={t('kpiExact')} value={s.exact} sub={t('kpiExactSub', { p: pct(s.exactRate, 1) })} />
      <Stat label={t('kpiPoints')} value={s.points} sub={t('kpiPointsSub', { rank: soren?.rank ?? '–' })} />
      <Stat label={t('kpiBankroll')} value={money(l.bankroll)} sub={t('kpiBankrollSub', { roi: signedPct(l.roi) })} />
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

/** First screen: one focal answer (the hit rate), the conclusion as h1, then supporting facts. */
export function Hero({ data, archive, lang, t, onOpen }) {
  const ok = data.dataQuality?.status === 'pass'
  const s = archive.summary
  return (
    <header className="hero">
      <div className="hero-main">
        <p className="eyebrow">{t('eyebrow')}</p>
        <p className="focal">
          <span className="focal-value num">{pct(s.accuracy, 1)}</span>
          <span className="focal-label">{t('kpiAccuracy')}<span className="muted num">{t('kpiAccuracySub', { hits: s.hits, n: s.n })}</span></span>
        </p>
        <h1>{t('heroTitle', { n: s.n, hits: s.hits })}</h1>
        <p className="lede">{t('heroLede')}</p>
        <ul className="status-line">
          <li className={ok ? 'status-ok' : 'status-warn'}><Icon name={ok ? 'check' : 'info'} size={16} />{ok ? t('verified') : t('needsReview')}</li>
          <li><time dateTime={data.generatedAt}>{t('snapshot', { time: fmtDateTime(data.generatedAt, lang) })}</time></li>
        </ul>
      </div>
      <Champion archive={archive} lang={lang} t={t} onOpen={onOpen} />
    </header>
  )
}

export default function Overview({ data, archive, lang, t, onOpen, onNavigate }) {
  return (
    <>
      <Hero data={data} archive={archive} lang={lang} t={t} onOpen={onOpen} />
      <Kpis archive={archive} t={t} />
      <div className="two-col">
        <StageAccuracy archive={archive} t={t} />
        <Section id="models" title={t('modelsTitle')} sub={t('modelsSub')}>
          <Leaderboard archive={archive} t={t} />
        </Section>
      </div>
      <ResultGrid archive={archive} lang={lang} t={t} onBrowse={() => onNavigate('matches')} />
      <Notables archive={archive} lang={lang} t={t} onOpen={onOpen} />
    </>
  )
}
