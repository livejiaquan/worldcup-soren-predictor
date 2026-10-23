import { Check, ChevronLeft, ChevronRight, ExternalLink, Info, Monitor, Moon, Search, Star, Sun, Trophy, X } from 'lucide-react'
import { flagUrl, teamName } from '../lib/teams.js'
import { pct } from '../lib/format.js'

// Single icon set: Lucide (MIT). Sizes are 16 / 20 / 24 only; stroke 1.75, round caps and joins.
const ICONS = { check: Check, x: X, close: X, star: Star, sun: Sun, moon: Moon, monitor: Monitor, search: Search, left: ChevronLeft, right: ChevronRight, external: ExternalLink, trophy: Trophy, info: Info }
const SIZES = { 16: 16, 20: 20, 24: 24 }

export function Icon({ name, size = 16, className = '', title }) {
  const Cmp = ICONS[name]
  if (!Cmp) return null
  const px = SIZES[size] || (size >= 24 ? 24 : size >= 20 ? 20 : 16)
  return <Cmp className={`icon ${className}`.trim()} size={px} strokeWidth={1.75} absoluteStrokeWidth aria-hidden={title ? undefined : 'true'} role={title ? 'img' : undefined}>{title && <title>{title}</title>}</Cmp>
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
      <Icon name={kind === 'exact' ? 'star' : kind === 'hit' ? 'check' : 'x'} size={16} />
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
