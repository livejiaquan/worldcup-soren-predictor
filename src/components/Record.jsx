import { useState } from 'react'
import { Icon, Meter, Section, Stat } from './ui.jsx'
import { Leaderboard } from './Overview.jsx'
import { teamName } from '../lib/teams.js'
import { fmtShortDate, money, num, pct, signedMoney, signedPct } from '../lib/format.js'

function Calibration({ archive, t }) {
  return (
    <div className="card calib">
      <div className="calib-scale" aria-hidden="true"><span>0%</span><span>50%</span><span>100%</span></div>
      <ul>
        {archive.calibration.filter((b) => b.n).map((b) => {
          const lo = Math.min(b.stated, b.actual)
          const hi = Math.max(b.stated, b.actual)
          return (
            <li key={b.id} className="calib-row">
              <span className="calib-label"><b>{b.label}</b><span className="muted">{t('calibN', { n: b.n })}</span></span>
              <span className="calib-track" role="img"
                aria-label={`${b.label}: ${t('calibStated')} ${pct(b.stated)}, ${t('calibActual')} ${pct(b.actual)}`}>
                <span className={`calib-gap ${b.gap >= 0 ? 'is-under' : 'is-over'}`} style={{ left: `${lo * 100}%`, width: `${(hi - lo) * 100}%` }} />
                <span className="calib-dot calib-stated" style={{ left: `${b.stated * 100}%` }} />
                <span className="calib-dot calib-actual" style={{ left: `${b.actual * 100}%` }} />
              </span>
              <span className="calib-values num"><span className="muted">{pct(b.stated)}</span> → <b>{pct(b.actual)}</b></span>
            </li>
          )
        })}
      </ul>
      <ul className="legend" aria-hidden="true">
        <li><span className="calib-dot calib-stated static" />{t('calibStated')}</li>
        <li><span className="calib-dot calib-actual static" />{t('calibActual')}</li>
      </ul>
    </div>
  )
}

function BankrollChart({ ledger, lang, t }) {
  const points = [ledger.initial, ...ledger.bets.map((b) => b.bankroll)]
  const max = Math.max(...points) * 1.05
  const min = Math.min(0, ...points)
  const w = 600
  const h = 160
  const x = (i) => (i / (points.length - 1)) * w
  const y = (v) => h - ((v - min) / (max - min)) * h
  const d = points.map((v, i) => `${i ? 'L' : 'M'}${x(i).toFixed(1)},${y(v).toFixed(1)}`).join(' ')
  const area = `${d} L${w},${h} L0,${h} Z`
  return (
    <figure className="chart">
      <svg viewBox={`0 0 ${w} ${h}`} preserveAspectRatio="none" role="img"
        aria-label={t('ledgerChart', { a: ledger.initial, b: ledger.bankroll.toFixed(2) })}>
        <path className="chart-area" d={area} />
        <line className="chart-base" x1="0" x2={w} y1={y(ledger.initial)} y2={y(ledger.initial)} vectorEffect="non-scaling-stroke" />
        <path className="chart-line" d={d} vectorEffect="non-scaling-stroke" />
      </svg>
      <figcaption className="chart-axis num muted">
        <span>{fmtShortDate(ledger.bets[0]?.match.kickoffUtc, lang)} · {money(ledger.initial)}</span>
        <span>{fmtShortDate(ledger.bets.at(-1)?.match.kickoffUtc, lang)} · {money(ledger.bankroll)}</span>
      </figcaption>
    </figure>
  )
}

function Ledger({ data, archive, lang, t, onOpen }) {
  const [all, setAll] = useState(false)
  const l = archive.ledger
  const bets = [...l.bets].reverse()
  const shown = all ? bets : bets.slice(0, 8)
  const fileBankroll = data.paperBankroll?.bankroll
  return (
    <Section id="ledger" title={t('ledgerTitle')} sub={t('ledgerSub')}>
      <div className="card ledger">
        <dl className="ledger-stats">
          <Stat label={t('ledgerFinal')} value={money(l.bankroll)} sub={`${signedMoney(l.pnl)} · ${signedPct(l.roi)}`} tone={l.pnl >= 0 ? 'hit' : 'miss'} />
          <Stat label={t('ledgerWinRate')} value={pct(l.bets.length ? l.wins / l.bets.length : 0)}
            sub={`${t('ledgerRecord', { w: l.wins, l: l.losses, n: l.bets.length })} · ${t('ledgerStaked', { s: money(l.staked), y: signedPct(l.yield, 1) })}`} />
        </dl>
        <BankrollChart ledger={l} lang={lang} t={t} />
        <div className="table-wrap">
          <table className="table ledger-table">
            <thead>
              <tr>
                <th scope="col">{t('ledgerCols.match')}</th>
                <th scope="col">{t('ledgerCols.pick')}</th>
                <th scope="col" className="hide-sm">{t('ledgerCols.odds')}</th>
                <th scope="col" className="hide-sm">{t('ledgerCols.stake')}</th>
                <th scope="col">{t('ledgerCols.result')}</th>
                <th scope="col" className="hide-sm">{t('ledgerCols.bankroll')}</th>
              </tr>
            </thead>
            <tbody>
              {shown.map((b) => (
                <tr key={b.id}>
                  <th scope="row">
                    <button type="button" className="link-btn" onClick={() => onOpen(b.id)}>
                      {teamName(b.match.team1, lang)} {b.match.score[0]}–{b.match.score[1]} {teamName(b.match.team2, lang)}
                    </button>
                  </th>
                  <td>{teamName(b.pick, lang)}</td>
                  <td className="num hide-sm">{num(b.odds)}</td>
                  <td className="num hide-sm">{money(b.stake)}</td>
                  <td className={`num ${b.won ? 'pos' : 'neg'}`}>
                    <Icon name={b.won ? 'check' : 'x'} size={14} /> {signedMoney(b.profit)}
                  </td>
                  <td className="num hide-sm">{money(b.bankroll)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {bets.length > 8 && (
          <button type="button" className="btn btn-secondary btn-block" aria-expanded={all} onClick={() => setAll(!all)}>
            {all ? t('ledgerShowLess') : t('ledgerShowAll', { n: bets.length })}
          </button>
        )}
        {fileBankroll != null && Math.abs(fileBankroll - l.bankroll) > 0.005 && (
          <p className="note"><Icon name="info" size={16} />{t('ledgerNote', { file: money(fileBankroll) })}</p>
        )}
      </div>
    </Section>
  )
}

export default function Record({ data, archive, intel, lang, t, onOpen }) {
  const s = archive.summary
  const overrides = data.dataQuality?.counts?.resultOverrides ?? 0
  return (
    <>
      <header className="page-head">
        <h1>{t('recordTitle')}</h1>
        <p className="lede">{t('modelsSub')}</p>
      </header>
      <Section id="lb" title={t('modelsTitle')}>
        <Leaderboard archive={archive} t={t} />
      </Section>
      <Section id="prob" title={t('probTitle')} sub={t('probSub')}>
        <dl className="card kpis kpis-3">
          <Stat label={t('rps')} value={num(s.rps, 3)} sub={t('rpsSub', { u: num(s.uniformRps, 3) })} tone="accent" />
          <Stat label={t('brier')} value={num(s.brier, 3)} sub={t('brierSub')} />
          <Stat label={t('goalError')} value={num(s.avgGoalError, 2)} sub={t('goalErrorSub')} />
        </dl>
      </Section>
      <div className="two-col">
        <Section id="calib" title={t('calibTitle')} sub={t('calibSub')}>
          <Calibration archive={archive} t={t} />
        </Section>
        <Section id="tags" title={t('tagsTitle')} sub={t('tagsSub')}>
          <ul className="card bars">
            {archive.tags.map((g) => (
              <li key={g.tag} className="bar-row">
                <span className="bar-label">{t(`tagNames.${g.tag}`)}</span>
                <Meter value={g.accuracy} label={pct(g.accuracy)} />
                <span className="bar-value num"><b>{pct(g.accuracy)}</b> <span className="muted">{g.hits}/{g.n}</span></span>
              </li>
            ))}
          </ul>
        </Section>
      </div>
      <Ledger data={data} archive={archive} lang={lang} t={t} onOpen={onOpen} />
      <Section id="method" title={t('methodTitle')}>
        <div className="card prose">
          <ol className="method">{t('method').map((m) => <li key={m}>{m}</li>)}</ol>
          <h3>{t('sourcesTitle')}</h3>
          <ul>
            <li><a href="https://github.com/openfootball/worldcup.json" target="_blank" rel="noreferrer">{t('sourceFixtures')}<Icon name="external" size={14} /></a></li>
            <li>{t('sourceOverrides', { n: overrides })}</li>
            <li>{t('sourceIntel', { n: intel?.items?.length ?? '—' })}</li>
            <li><a href="https://github.com/livejiaquan/worldcup-soren-predictor" target="_blank" rel="noreferrer">{t('repo')}<Icon name="external" size={14} /></a></li>
          </ul>
          <p className="note"><Icon name="info" size={16} />{t('disclaimer')}</p>
        </div>
      </Section>
    </>
  )
}
