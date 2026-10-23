import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import './styles.css'
import { translator } from './i18n.js'
import { buildArchive } from './lib/archive.js'
import { Icon } from './components/ui.jsx'
import { fmtDateTime } from './lib/format.js'
import Overview from './components/Overview.jsx'
import Matches from './components/Matches.jsx'
import { filterRows } from './lib/view.js'
import Bracket from './components/Bracket.jsx'
import Groups from './components/Groups.jsx'
import Record from './components/Record.jsx'
import MatchSheet from './components/MatchSheet.jsx'

const TABS = ['overview', 'matches', 'bracket', 'groups', 'record']
const THEMES = ['system', 'light', 'dark']
const DATA_URL = `${import.meta.env.BASE_URL}data/worldcup.json`
const INTEL_URL = `${import.meta.env.BASE_URL}data/soren-intel.json`

const store = {
  get(key) { try { return window.localStorage.getItem(key) } catch { return null } },
  set(key, value) { try { window.localStorage.setItem(key, value) } catch { /* private mode: ignore */ } },
}

/** '#/matches/m104' → { tab: 'matches', matchId: 'm104' }. Unknown/legacy anchors fall back to overview. */
function parseHash(hash) {
  const [tab, matchId] = String(hash || '').replace(/^#\/?/, '').split('/')
  return { tab: TABS.includes(tab) ? tab : 'overview', matchId: /^m\d{3}$/.test(matchId || '') ? matchId : null }
}

function applyTheme(mode) {
  const root = document.documentElement
  if (mode === 'system') delete root.dataset.theme
  else root.dataset.theme = mode
}

function Skeleton({ t }) {
  return (
    <div className="skeleton" aria-busy="true" aria-live="polite">
      <span className="sr-only">{t('loading')}</span>
      <div className="sk sk-eyebrow" />
      <div className="sk sk-title" />
      <div className="sk sk-line" />
      <div className="three-col">
        <div className="sk sk-card" />
        <div className="sk sk-card" />
        <div className="sk sk-card" />
      </div>
      <div className="sk sk-wide" />
    </div>
  )
}

function ErrorState({ t, message, onRetry }) {
  return (
    <div className="boxed empty error" role="alert">
      <Icon name="info" size={28} />
      <h1>{t('loadFail')}</h1>
      <p className="muted">{t('loadFailBody')}</p>
      <p className="muted small"><code>{message}</code></p>
      <button type="button" className="btn btn-primary" onClick={onRetry}>{t('retry')}</button>
    </div>
  )
}

export default function App() {
  const [lang, setLang] = useState(() => (store.get('soren-lang') === 'en' ? 'en' : 'zh'))
  const [theme, setTheme] = useState(() => (THEMES.includes(store.get('soren-theme')) ? store.get('soren-theme') : 'system'))
  const [route, setRoute] = useState(() => parseHash(window.location.hash))
  const [state, setState] = useState({ status: 'loading', data: null, error: '' })
  const [intel, setIntel] = useState({ status: 'idle', items: null, byMatch: null })
  const [filters, setFilters] = useState({ query: '', stage: 'all', result: 'all' })
  const mainRef = useRef(null)
  const firstRender = useRef(true)
  const t = useMemo(() => translator(lang), [lang])

  const load = useCallback(() => {
    setState({ status: 'loading', data: null, error: '' })
    fetch(DATA_URL, { cache: 'no-cache' })
      .then((res) => { if (!res.ok) throw new Error(`HTTP ${res.status}`); return res.json() })
      .then((data) => setState({ status: 'ready', data, error: '' }))
      .catch((err) => setState({ status: 'error', data: null, error: err.message }))
  }, [])
  useEffect(load, [load])

  // The intel file is ~0.7 MB and only needed in match details / record, so fetch it on demand.
  const intelRequested = useRef(false)
  const ensureIntel = useCallback(() => {
    if (intelRequested.current) return
    intelRequested.current = true
    setIntel({ status: 'loading', items: null, byMatch: null })
    fetch(INTEL_URL, { cache: 'no-cache' })
      .then((res) => { if (!res.ok) throw new Error(`HTTP ${res.status}`); return res.json() })
      .then((json) => setIntel({ status: 'ready', items: json.items || [], byMatch: Object.fromEntries((json.items || []).map((i) => [i.matchId, i])) }))
      .catch(() => { intelRequested.current = false; setIntel({ status: 'error', items: null, byMatch: null }) })
  }, [])

  useEffect(() => {
    const onHash = () => setRoute(parseHash(window.location.hash))
    window.addEventListener('hashchange', onHash)
    return () => window.removeEventListener('hashchange', onHash)
  }, [])

  useEffect(() => { document.documentElement.lang = lang === 'en' ? 'en' : 'zh-Hant-TW'; store.set('soren-lang', lang) }, [lang])
  useEffect(() => { applyTheme(theme); store.set('soren-theme', theme) }, [theme])
  useEffect(() => { document.title = `${t('brand')} · ${t(`tabs.${route.tab}`)}` }, [t, route.tab])
  useEffect(() => { if (route.matchId || route.tab === 'record') ensureIntel() }, [route.matchId, route.tab, ensureIntel])

  // Move focus + scroll to the top of the new view when switching tabs (not on first paint).
  useEffect(() => {
    if (firstRender.current) { firstRender.current = false; return }
    window.scrollTo({ top: 0 })
    mainRef.current?.focus({ preventScroll: true })
  }, [route.tab])

  const archive = useMemo(() => (state.data ? buildArchive(state.data) : null), [state.data])

  const go = useCallback((tab, matchId = null) => {
    const hash = `#/${tab}${matchId ? `/${matchId}` : ''}`
    if (window.location.hash !== hash) window.location.hash = hash
  }, [])
  const openMatch = useCallback((id) => go(route.tab, id), [go, route.tab])
  const stepMatch = useCallback((id) => {
    if (!id) return
    window.history.replaceState(null, '', `#/${route.tab}/${id}`)
    setRoute({ tab: route.tab, matchId: id })
  }, [route.tab])
  const closeMatch = useCallback(() => {
    window.history.replaceState(null, '', `#/${route.tab}`)
    setRoute({ tab: route.tab, matchId: null })
  }, [route.tab])

  const order = useMemo(() => {
    if (!archive) return []
    const rows = route.tab === 'matches' ? filterRows(archive.rows, filters) : archive.rows
    const ids = rows.map((r) => r.id)
    return route.matchId && !ids.includes(route.matchId) ? archive.rows.map((r) => r.id) : ids
  }, [archive, route.tab, route.matchId, filters])

  const cycleTheme = () => setTheme((m) => THEMES[(THEMES.indexOf(m) + 1) % THEMES.length])
  const themeIcon = theme === 'light' ? 'sun' : theme === 'dark' ? 'moon' : 'monitor'
  const view = { lang, t, onOpen: openMatch }

  return (
    <>
      <a className="skip-link" href="#main">{t('skip')}</a>
      <header className="site-head">
        <div className="navbar">
          <a className="brand" href="#/overview">
            <svg className="brand-mark" viewBox="0 0 32 32" aria-hidden="true"><rect width="32" height="32" rx="6" /><circle cx="16" cy="16" r="8.5" /><path d="M16 11.2l4.3 3.1-1.6 5h-5.4l-1.6-5z" /></svg>
            <span className="brand-text"><b>{t('brand')}</b><span>{t('brandSub')}</span></span>
          </a>
          <ul className="navbar-links">
            <li><a href="#/record">{t('navMethod')}</a></li>
            <li><a href="https://github.com/livejiaquan/worldcup-soren-predictor" target="_blank" rel="noreferrer">GitHub</a></li>
          </ul>
          <div className="navbar-actions">
            <button type="button" className="icon-btn" onClick={() => setLang(lang === 'zh' ? 'en' : 'zh')} aria-label={`${t('langToggle')} · ${t('langLabel')}`}><span className="lang-label">{t('langToggle')}</span></button>
            <button type="button" className="icon-btn" onClick={cycleTheme} aria-label={t('theme.label', { mode: t(`theme.${theme}`) })} title={t(`theme.${theme}`)}><Icon name={themeIcon} size={20} /></button>
          </div>
        </div>
        <ul className="strip" aria-live="polite">
          {state.status === 'ready' && state.data ? (
            <>
              <li className={state.data.dataQuality?.status === 'pass' ? 'strip-ok' : 'strip-warn'}><span className="pill">{state.data.dataQuality?.status === 'pass' ? t('verified') : t('needsReview')}</span></li>
              <li>{t('finishedCount', { f: state.data.summary.finishedMatches, t: state.data.summary.totalMatches })}</li>
              <li><time dateTime={state.data.generatedAt}>{t('snapshot', { time: fmtDateTime(state.data.generatedAt, lang) })}</time></li>
            </>
          ) : (
            <li><span className="pill pill-muted">{state.status === 'error' ? t('loadFail') : t('loading')}</span></li>
          )}
        </ul>
        <div className="hub">
          <div className="hub-title">
            <span className="hub-badge" aria-hidden="true">2026</span>
            <div><p className="hub-h1" role="heading" aria-level="1">{t('hubTitle')}</p><p className="hub-sub muted">{t('hubSub')}</p></div>
          </div>
          <nav className="tabs" aria-label={t('brand')}>
            <ul className="tabs-inner">
              {TABS.map((tab) => (
                <li key={tab}><a href={`#/${tab}`} className={route.tab === tab ? 'is-active' : ''} aria-current={route.tab === tab ? 'page' : undefined}>{t(`tabs.${tab}`)}</a></li>
              ))}
            </ul>
          </nav>
        </div>
      </header>

      <main id="main" ref={mainRef} tabIndex={-1} className="page">
        {state.status === 'loading' && <Skeleton t={t} />}
        {state.status === 'error' && <ErrorState t={t} message={state.error} onRetry={load} />}
        {state.status === 'ready' && archive && (
          <>
            {route.tab === 'overview' && <Overview data={state.data} archive={archive} {...view} onNavigate={(tab) => go(tab)} />}
            {route.tab === 'matches' && <Matches archive={archive} {...view} filters={filters} setFilters={setFilters} />}
            {route.tab === 'bracket' && <Bracket archive={archive} {...view} />}
            {route.tab === 'groups' && <Groups data={state.data} archive={archive} {...view} />}
            {route.tab === 'record' && <Record data={state.data} archive={archive} intel={intel} {...view} />}
          </>
        )}
      </main>

      <footer className="site-footer">
        <div className="site-footer-inner">
          <p>{t('disclaimer')}</p>
          <p className="muted">{t('footer')} · <a href="https://github.com/livejiaquan/worldcup-soren-predictor" target="_blank" rel="noreferrer">GitHub</a></p>
        </div>
      </footer>

      {archive && (
        <MatchSheet matchId={route.matchId} archive={archive} intel={intel} lang={lang} t={t}
          onClose={closeMatch} onStep={stepMatch} order={order} />
      )}
    </>
  )
}
