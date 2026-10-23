import { useEffect, useRef } from 'react'
import { Flag, Icon, ProbBar, Verdict } from './ui.jsx'
import { ScoreBox } from './MatchRow.jsx'
import { pickText } from '../lib/view.js'
import { teamName } from '../lib/teams.js'
import { winnerOf } from '../lib/archive.js'
import { fmtDateTime, money, num, pct, predScoreText, signedMoney } from '../lib/format.js'

const hostOf = (url) => { try { return new URL(url).hostname.replace(/^www\./, '') } catch { return '' } }

/** The engine writes English team names into its Chinese commentary; show the local names instead. */
const localise = (text, match, lang) => [match.team1, match.team2].reduce((s, team) => String(s || '').split(team).join(teamName(team, lang)), text)

function outcomeText(outcome, match, lang, t) {
  if (outcome === 'draw') return t('draw')
  return t('outcomeWin', { team: teamName(outcome === 'home' ? match.team1 : match.team2, lang) })
}

function englishNote(row, match) {
  const p = row.pred.probabilities
  const pick = row.pred.pick === '平手' ? 'a draw' : row.pred.pick
  return `Soren leaned towards ${pick} at ${pct(row.pickProb)}, with the draw at ${pct(p.draw)}. Expected goals ${row.pred.expectedGoals?.join(' : ')} pointed to ${predScoreText(row.pred.score)}; the match finished ${match.score[0]}–${match.score[1]}.`
}

function Intel({ intel, matchId, t }) {
  if (intel.status === 'loading' || intel.status === 'idle') return <p className="muted" aria-live="polite">{t('sheet.intelLoading')}</p>
  if (intel.status === 'error') return <p className="muted">{t('sheet.intelError')}</p>
  const item = intel.byMatch?.[matchId]
  if (!item) return <p className="muted">{t('sheet.intelNone')}</p>
  return (
    <div className="intel">
      <p className="intel-title">{item.title}</p>
      {item.sorenTake && <p className="muted">{item.sorenTake}</p>}
      {item.signals?.length > 0 && (
        <details className="disclosure">
          <summary>{t('sheet.signals')} <span className="muted num">{item.signals.length}</span></summary>
          <ul>{item.signals.map((s) => <li key={s}>{s}</li>)}</ul>
        </details>
      )}
      {item.sources?.length > 0 && (
        <details className="disclosure">
          <summary>{t('sheet.sources')} <span className="muted num">{item.sources.length}</span></summary>
          <ul className="sources">
            {item.sources.map((src) => (
              <li key={src.url}>
                <a href={src.url} target="_blank" rel="noreferrer">{src.label}<Icon name="external" size={16} /></a>
                <span className="muted">{src.sourceName || hostOf(src.url)}{src.confidence ? ` · ${src.confidence}` : ''}</span>
              </li>
            ))}
          </ul>
        </details>
      )}
    </div>
  )
}

export default function MatchSheet({ matchId, archive, intel, lang, t, onClose, onStep, order }) {
  const ref = useRef(null)
  const row = matchId ? archive.rowById[matchId] : null

  useEffect(() => {
    const dialog = ref.current
    if (!dialog) return
    if (row && !dialog.open) {
      dialog.showModal()
      dialog.querySelector('.sheet-body')?.focus({ preventScroll: true }) // land on content, not on the close button
    }
    if (!row && dialog.open) dialog.close()
  }, [row])

  useEffect(() => {
    const dialog = ref.current
    if (!dialog) return
    const onCancel = (e) => { e.preventDefault(); onClose() }
    const onClick = (e) => { if (e.target === dialog) onClose() } // backdrop click
    dialog.addEventListener('cancel', onCancel)
    dialog.addEventListener('click', onClick)
    return () => { dialog.removeEventListener('cancel', onCancel); dialog.removeEventListener('click', onClick) }
  }, [onClose])

  useEffect(() => { ref.current?.querySelector('.sheet-body')?.scrollTo?.(0, 0) }, [matchId])

  const idx = row ? order.indexOf(row.id) : -1
  const prevId = idx > 0 ? order[idx - 1] : null
  const nextId = idx >= 0 && idx < order.length - 1 ? order[idx + 1] : null

  return (
    <dialog ref={ref} className="sheet" aria-labelledby="sheet-title">
      {row && (() => {
        const { match, pred } = row
        const w = winnerOf(match)
        const labels = [teamName(match.team1, lang), t('draw'), teamName(match.team2, lang)]
        const bet = archive.ledger.bets.find((b) => b.id === match.id)
        const p = pred.probabilities
        return (
          <div className="sheet-inner">
            <header className="sheet-head">
              <div className="sheet-meta">
                <span>{t(`stages.${row.stage}`)}{match.group ? ` · ${match.group.replace('Group ', '')}` : ''}</span>
                <span className="muted"><time dateTime={match.kickoffUtc}>{fmtDateTime(match.kickoffUtc, lang)}</time></span>
              </div>
              <button type="button" className="icon-btn" onClick={onClose} aria-label={t('sheet.close')}><Icon name="close" size={20} /></button>
            </header>
            <div className="sheet-body" tabIndex={-1}>
              <h2 id="sheet-title" className="sr-only">{labels[0]} {match.score[0]}–{match.score[1]} {labels[2]}</h2>
              <div className="scoreboard">
                <span className={`sb-team ${w === match.team1 ? 'is-winner' : ''}`}><Flag team={match.team1} size="lg" /><span>{labels[0]}</span></span>
                <ScoreBox match={match} t={t} size="lg" />
                <span className={`sb-team ${w === match.team2 ? 'is-winner' : ''}`}><Flag team={match.team2} size="lg" /><span>{labels[2]}</span></span>
              </div>
              <div className="sheet-verdict"><Verdict row={row} t={t} /></div>

              <section className="sheet-section" aria-labelledby="vs-title">
                <h3 id="vs-title">{t('sheet.vsTitle')}</h3>
                <table className="table compare">
                  <thead><tr><th scope="col"><span className="sr-only">—</span></th><th scope="col">{t('predicted')}</th><th scope="col">{t('actual')}</th></tr></thead>
                  <tbody>
                    <tr className={row.hit ? 'is-hit' : 'is-miss'}>
                      <th scope="row">{t('sheet.outcome')}</th>
                      <td>{outcomeText(row.picked, match, lang, t)}</td>
                      <td>{outcomeText(row.outcome, match, lang, t)}{match.winner && row.outcome === 'draw' ? ` · ${t('advancedOnPens', { team: teamName(match.winner, lang) })}` : ''}</td>
                    </tr>
                    <tr className={row.exact ? 'is-hit' : 'is-miss'}>
                      <th scope="row">{t('sheet.score')}</th>
                      <td className="num">{predScoreText(pred.score)}</td>
                      <td className="num">{match.score[0]}–{match.score[1]}</td>
                    </tr>
                    <tr>
                      <th scope="row">{t('sheet.xg')}</th>
                      <td className="num">{pred.expectedGoals?.map((g) => num(g, 2)).join(' : ')}</td>
                      <td className="num">{match.score[0]} : {match.score[1]}</td>
                    </tr>
                    <tr>
                      <th scope="row">{t('sheet.pickProb')}</th>
                      <td className="num">{pct(row.pickProb)}</td>
                      <td>{row.hit ? t('hit') : t('miss')}</td>
                    </tr>
                  </tbody>
                </table>
              </section>

              <section className="sheet-section" aria-labelledby="prob-title">
                <h3 id="prob-title">{t('sheet.probTitle')}</h3>
                <ProbBar probs={p} outcome={row.outcome} labels={labels} size="lg" showValues />
                <div className="probbar-legend">
                  {['home', 'draw', 'away'].map((k, i) => (
                    <span key={k} className={row.outcome === k ? 'is-actual' : ''}>
                      <i className={`swatch seg-${k}`} aria-hidden="true" />{labels[i]} <b className="num">{pct(p[k])}</b>
                      {row.outcome === k && <em> · {t('sheet.actualMark')}</em>}
                    </span>
                  ))}
                </div>
              </section>

              <section className="sheet-section" aria-labelledby="note-title">
                <h3 id="note-title">{t('sheet.commentary')}</h3>
                {lang === 'en'
                  ? <p>{englishNote(row, match)}</p>
                  : <><p>{localise(pred.commentary?.headline, match, lang)}</p><p className="muted">{localise(pred.commentary?.story, match, lang)}</p></>}
                <p className="muted small">{pickText(row, lang)} · {t(`tagNames.${pred.tag}`)} · {t('sheet.confidence')} {pct(pred.confidence)}</p>
              </section>

              <section className="sheet-section" aria-labelledby="paper-title">
                <h3 id="paper-title">{t('sheet.paper')}</h3>
                {bet ? (
                  <p className={`paper ${bet.won ? 'pos' : 'neg'}`}>
                    <span>{t('sheet.paperBet', { pick: teamName(bet.pick, lang), odds: num(bet.odds), stake: money(bet.stake) })}</span>
                    <b className="num"><Icon name={bet.won ? 'check' : 'x'} size={16} /> {bet.won ? t('sheet.paperWon', { p: signedMoney(bet.profit) }) : t('sheet.paperLost', { p: signedMoney(bet.profit) })}</b>
                  </p>
                ) : <p className="muted">{t('sheet.paperNone')}</p>}
              </section>

              <section className="sheet-section" aria-labelledby="intel-title">
                <h3 id="intel-title">{t('sheet.intel')}</h3>
                <Intel intel={intel} matchId={match.id} t={t} />
              </section>

              <dl className="sheet-facts">
                <div><dt>{t('sheet.venue')}</dt><dd>{match.venue || '—'}</dd></div>
                <div><dt>{t('sheet.settlement')}</dt><dd>{match.source}</dd></div>
              </dl>
            </div>
            <footer className="sheet-foot">
              <button type="button" className="btn btn-secondary" disabled={!prevId} onClick={() => onStep(prevId)}><Icon name="left" size={16} />{t('sheet.prev')}</button>
              <button type="button" className="btn btn-secondary" disabled={!nextId} onClick={() => onStep(nextId)}>{t('sheet.next')}<Icon name="right" size={16} /></button>
            </footer>
          </div>
        )
      })()}
    </dialog>
  )
}
