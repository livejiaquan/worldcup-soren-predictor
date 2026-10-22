export const TZ = 'Asia/Taipei'
const locale = (lang) => (lang === 'en' ? 'en-GB' : 'zh-TW')

function format(iso, lang, opts) {
  if (!iso) return ''
  const date = new Date(iso)
  if (Number.isNaN(date.getTime())) return ''
  return new Intl.DateTimeFormat(locale(lang), { timeZone: TZ, ...opts }).format(date)
}

export const fmtTime = (iso, lang) => format(iso, lang, { hour: '2-digit', minute: '2-digit', hourCycle: 'h23' })
export const fmtDay = (iso, lang) => format(iso, lang, { month: 'short', day: 'numeric', weekday: 'short' })
export const fmtDateTime = (iso, lang) => format(iso, lang, { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit', hourCycle: 'h23' })
export const fmtShortDate = (iso, lang) => format(iso, lang, { month: 'numeric', day: 'numeric' })
/** Stable YYYY-MM-DD key in Taipei time, for grouping. */
export const dayKey = (iso) => format(iso, 'en', { year: 'numeric', month: '2-digit', day: '2-digit' }).split('/').reverse().join('-')

export const pct = (v, digits = 0) => `${(Number(v || 0) * 100).toFixed(digits)}%`
export const signedPct = (v, digits = 0) => `${Number(v) >= 0 ? '+' : '−'}${Math.abs(Number(v || 0) * 100).toFixed(digits)}%`
export const money = (v) => `$${Number(v || 0).toFixed(2)}`
export const signedMoney = (v) => `${Number(v) >= 0 ? '+' : '−'}$${Math.abs(Number(v || 0)).toFixed(2)}`
export const num = (v, digits = 2) => Number(v || 0).toFixed(digits)
export const scoreText = (score) => (Array.isArray(score) ? `${score[0]}–${score[1]}` : '–')
export const predScoreText = (s) => String(s || '').replace('-', '–')
