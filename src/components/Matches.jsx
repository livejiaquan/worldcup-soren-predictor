import { useMemo, useState } from 'react'
import { Icon } from './ui.jsx'
import { MatchRow } from './MatchRow.jsx'
import { STAGES } from '../lib/archive.js'
import { filterRows } from '../lib/view.js'
import { dayKey, fmtDay } from '../lib/format.js'

const RESULT_FILTERS = ['all', 'hit', 'miss', 'exact']

export default function Matches({ archive, lang, t, onOpen, filters, setFilters }) {
  const [draft, setDraft] = useState(filters.query)
  const rows = useMemo(() => filterRows(archive.rows, filters), [archive.rows, filters])
  const days = useMemo(() => {
    const out = []
    for (const r of rows) {
      const key = dayKey(r.match.kickoffUtc)
      if (out.at(-1)?.key !== key) out.push({ key, iso: r.match.kickoffUtc, rows: [] })
      out.at(-1).rows.push(r)
    }
    return out
  }, [rows])
  const update = (patch) => setFilters({ ...filters, ...patch })
  const dirty = filters.query || filters.stage !== 'all' || filters.result !== 'all'
  const clear = () => { setDraft(''); setFilters({ query: '', stage: 'all', result: 'all' }) }

  return (
    <>
      <header className="page-head">
        <h1>{t('tabs.matches')}</h1>
        <p className="lede">{t('matchesSub')}</p>
      </header>
      <div className="toolbar" role="search">
        <label className="field field-search">
          <span className="sr-only">{t('searchLabel')}</span>
          <Icon name="search" size={18} />
          <input type="search" value={draft} placeholder={t('searchPlaceholder')} autoComplete="off" enterKeyHint="search"
            onChange={(e) => { setDraft(e.target.value); update({ query: e.target.value }) }} />
        </label>
        <label className="field field-select">
          <span className="sr-only">{t('stageFilter')}</span>
          <select value={filters.stage} onChange={(e) => update({ stage: e.target.value })}>
            <option value="all">{t('stageAll')}</option>
            {STAGES.map((s) => <option key={s} value={s}>{t(`stages.${s}`)}</option>)}
          </select>
        </label>
        <div className="segmented" role="group" aria-label={t('resultFilter')}>
          {RESULT_FILTERS.map((f) => (
            <button key={f} type="button" aria-pressed={filters.result === f} className={filters.result === f ? 'is-active' : ''}
              onClick={() => update({ result: f })}>{t(`filters.${f}`)}</button>
          ))}
        </div>
      </div>
      <p className="result-count" aria-live="polite">{t('showing', { n: rows.length })}</p>

      {rows.length === 0 ? (
        <div className="card empty">
          <Icon name="search" size={28} />
          <h2>{t('noResults')}</h2>
          <p className="muted">{t('noResultsBody')}</p>
          {dirty && <button type="button" className="btn btn-primary" onClick={clear}>{t('clearFilters')}</button>}
        </div>
      ) : (
        <div className="days">
          {days.map((day) => (
            <section key={day.key} className="day" aria-label={fmtDay(day.iso, lang)}>
              <h2 className="day-head"><span>{fmtDay(day.iso, lang)}</span><span className="muted num">{t('matchesOnDay', { n: day.rows.length })}</span></h2>
              <ul className="card match-list">
                {day.rows.map((r) => <MatchRow key={r.id} row={r} lang={lang} t={t} onOpen={onOpen} />)}
              </ul>
            </section>
          ))}
        </div>
      )}
    </>
  )
}
