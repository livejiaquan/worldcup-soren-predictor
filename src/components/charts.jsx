// Small data views shared by the overview and the record page.
import { Meter } from './ui.jsx'
import { fmtShortDate, money, pct } from '../lib/format.js'

/** Model leaderboard as a compact data table (Soren row highlighted). */
export function LeaderboardTable({ archive, t, caption }) {
  return (
    <table className="dtable">
      {caption && <caption className="sr-only">{caption}</caption>}
      <thead>
        <tr><th scope="col">#</th><th scope="col" className="col-left">{t('cols.model')}</th><th scope="col">{t('cols.pts')}</th><th scope="col">{t('cols.hit')}</th><th scope="col">{t('cols.exact')}</th></tr>
      </thead>
      <tbody>
        {archive.leaderboard.map((r) => (
          <tr key={r.id} className={r.id === 'soren' ? 'is-highlight' : ''}>
            <td>{r.rank}</td>
            <th scope="row" className="col-left"><b>{t(`modelNames.${r.id}`)}</b><span className="dtable-sub">{t(`modelDesc.${r.id}`)}</span></th>
            <td><b>{r.points}</b></td>
            <td>{pct(r.accuracy)}</td>
            <td>{r.exact}</td>
          </tr>
        ))}
      </tbody>
    </table>
  )
}

/** Accuracy by stage as a data table. */
export function StageTable({ archive, t }) {
  return (
    <table className="dtable">
      <thead>
        <tr><th scope="col" className="col-left">{t('cols.stage')}</th><th scope="col">{t('cols.hits')}</th><th scope="col">{t('cols.n')}</th><th scope="col">{t('cols.rate')}</th></tr>
      </thead>
      <tbody>
        {archive.stages.map((s) => (
          <tr key={s.stage}>
            <th scope="row" className="col-left">{t(`stages.${s.stage}`)}</th>
            <td>{s.hits}</td>
            <td>{s.n}</td>
            <td><b>{pct(s.accuracy)}</b></td>
          </tr>
        ))}
      </tbody>
    </table>
  )
}

/** Ranked list used inside the dark band cards: rank · label · value. */
export function RankList({ rows, onOpen }) {
  return (
    <ol className="ranklist">
      {rows.map((r, i) => (
        <li key={r.key}>
          {onOpen && r.id ? (
            <button type="button" className="ranklist-row" onClick={() => onOpen(r.id)}>
              <span className="ranklist-rank">{i + 1}</span><span className="ranklist-label">{r.label}</span><span className="ranklist-value">{r.value}</span>
            </button>
          ) : (
            <span className="ranklist-row">
              <span className="ranklist-rank">{i + 1}</span><span className="ranklist-label">{r.label}</span><span className="ranklist-value">{r.value}</span>
            </span>
          )}
        </li>
      ))}
    </ol>
  )
}

export function Bars({ rows }) {
  return (
    <ul className="bars">
      {rows.map((r) => (
        <li key={r.key} className="bar-row">
          <span className="bar-label">{r.label}</span>
          <Meter value={r.value} label={pct(r.value)} />
          <span className="bar-value num"><b>{pct(r.value)}</b> <span className="muted">{r.sub}</span></span>
        </li>
      ))}
    </ul>
  )
}

export function Calibration({ archive, t }) {
  return (
    <div className="calib">
      <div className="calib-scale" aria-hidden="true"><span>0%</span><span>50%</span><span>100%</span></div>
      <ul>
        {archive.calibration.filter((b) => b.n).map((b) => {
          const lo = Math.min(b.stated, b.actual)
          const hi = Math.max(b.stated, b.actual)
          return (
            <li key={b.id} className="calib-row">
              <span className="calib-label"><b>{b.label}</b><span className="muted">{t('calibN', { n: b.n })}</span></span>
              <span className="calib-track" role="img" aria-label={`${b.label}: ${t('calibStated')} ${pct(b.stated)}, ${t('calibActual')} ${pct(b.actual)}`}>
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

export function BankrollChart({ ledger, lang, t }) {
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
      <svg viewBox={`0 0 ${w} ${h}`} preserveAspectRatio="none" role="img" aria-label={t('ledgerChart', { a: ledger.initial, b: ledger.bankroll.toFixed(2) })}>
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
