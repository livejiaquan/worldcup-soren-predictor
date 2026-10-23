import { flagUrl, teamName } from '../lib/teams.js'
import { pct } from '../lib/format.js'

const ICONS = {
  check: <path d="M4 10.5l3.5 3.5L16 5.5" />,
  x: <path d="M5.5 5.5l9 9m0-9l-9 9" />,
  star: <path d="M10 2.8l2.2 4.6 5 .7-3.6 3.5.9 5-4.5-2.4-4.5 2.4.9-5L2.8 8.1l5-.7z" />,
  sun: <><circle cx="10" cy="10" r="3.4" /><path d="M10 2.5v1.8M10 15.7v1.8M2.5 10h1.8M15.7 10h1.8M4.7 4.7l1.3 1.3M14 14l1.3 1.3M4.7 15.3L6 14M14 6l1.3-1.3" /></>,
  moon: <path d="M16.2 12.4A6.6 6.6 0 0 1 7.6 3.8a6.6 6.6 0 1 0 8.6 8.6z" />,
  monitor: <><rect x="2.8" y="3.5" width="14.4" height="10" rx="1.6" /><path d="M7 17h6M10 13.5V17" /></>,
  search: <><circle cx="8.8" cy="8.8" r="5.3" /><path d="M12.8 12.8l4 4" /></>,
  close: <path d="M5 5l10 10M15 5L5 15" />,
  left: <path d="M12.5 4.5L7 10l5.5 5.5" />,
  right: <path d="M7.5 4.5L13 10l-5.5 5.5" />,
  external: <path d="M8 4.5H4.5v11h11V12M11 3.5h5.5V9M16.5 3.5L9 11" />,
  trophy: <path d="M6 3.5h8v4a4 4 0 0 1-8 0zM6 5H3.5v1a3 3 0 0 0 3 3M14 5h2.5v1a3 3 0 0 1-3 3M10 11.5v3M7 16.5h6M8 14.5h4" />,
  info: <><circle cx="10" cy="10" r="7.2" /><path d="M10 9v4.5M10 6.4v.1" /></>,
}

export function Icon({ name, size = 18, className = '', title }) {
  return (
    <svg className={`icon ${className}`.trim()} width={size} height={size} viewBox="0 0 20 20" fill="none" stroke="currentColor"
      strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden={title ? undefined : 'true'} role={title ? 'img' : undefined}>
      {title && <title>{title}</title>}
      {ICONS[name]}
    </svg>
  )
}

export function Flag({ team, size = 'md' }) {
  const src = flagUrl(team, 40)
  const dims = size === 'lg' ? [36, 24] : size === 'sm' ? [18, 12] : [24, 16]
  if (!src) return <span className={`flag flag-${size} flag-empty`} style={{ width: dims[0], height: dims[1] }} aria-hidden="true" />
  return (
    <img className={`flag flag-${size}`} src={src} srcSet={`${flagUrl(team, 80)} 2x`} width={dims[0]} height={dims[1]}
      alt="" loading="lazy" decoding="async" />
  )
}

export function Team({ team, lang, size = 'md', align = 'start', winner = false, className = '' }) {
  return (
    <span className={`team team-${align} ${winner ? 'is-winner' : ''} ${className}`.trim()}>
      <Flag team={team} size={size} />
      <span className="team-name">{teamName(team, lang)}</span>
    </span>
  )
}

/** Verdict chip: never relies on colour alone — always an icon plus a word. */
export function Verdict({ row, t, compact = false }) {
  const kind = row.exact ? 'exact' : row.hit ? 'hit' : 'miss'
  const label = row.exact ? t('exactHit') : row.hit ? t('hit') : t('miss')
  return (
    <span className={`verdict verdict-${kind} ${compact ? 'verdict-compact' : ''}`.trim()} title={compact ? label : undefined}>
      <Icon name={kind === 'exact' ? 'star' : kind === 'hit' ? 'check' : 'x'} size={compact ? 14 : 15} />
      <span className={compact ? 'sr-only' : ''}>{label}</span>
    </span>
  )
}

/**
 * 3-way probability bar (home / draw / away). The segment that actually happened gets an outline
 * and a marker, so "what the model said" and "what happened" read in one glance.
 */
export function ProbBar({ probs, outcome, labels, size = 'sm', showValues = false }) {
  const parts = [
    { key: 'home', value: probs.home },
    { key: 'draw', value: probs.draw },
    { key: 'away', value: probs.away },
  ]
  const summary = parts.map((p, i) => `${labels?.[i] ?? p.key} ${pct(p.value)}`).join(' · ')
  return (
    <div className={`probbar probbar-${size}`} role="img" aria-label={summary}>
      {parts.map((p) => (
        <span key={p.key} className={`seg seg-${p.key} ${outcome === p.key ? 'is-actual' : outcome ? 'is-other' : ''}`.trim()}
          style={{ flexGrow: Math.max(p.value, 0.001) }}>
          {showValues && <span className="seg-value">{pct(p.value)}</span>}
        </span>
      ))}
    </div>
  )
}

export function Section({ id, title, sub, action, children, className = '', tone = '' }) {
  const headingId = id ? `${id}-title` : undefined
  return (
    <section className={`ocard ${tone ? `ocard-${tone}` : ''} ${className}`.trim()} aria-labelledby={headingId}>
      <header className="ocard-head">
        <h2 id={headingId}>{title}</h2>
        {action}
      </header>
      <div className="ocard-body">
        {sub && <p className="section-sub">{sub}</p>}
        {children}
      </div>
    </section>
  )
}

export function Stat({ label, value, sub, tone }) {
  return (
    <div className={`stat ${tone ? `stat-${tone}` : ''}`.trim()}>
      <dt>{label}</dt>
      <dd>
        <span className="stat-value">{value}</span>
        {sub && <span className="stat-sub">{sub}</span>}
      </dd>
    </div>
  )
}

export function Meter({ value, tone = 'accent', label }) {
  return (
    <span className={`meter meter-${tone}`} role="img" aria-label={label}>
      <span style={{ width: `${Math.max(0, Math.min(1, value)) * 100}%` }} />
    </span>
  )
}
