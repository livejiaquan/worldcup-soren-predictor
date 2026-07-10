import { useEffect, useMemo, useState } from 'react'
import './App.css'

const FLAG = { Argentina:'🇦🇷', France:'🇫🇷', Spain:'🇪🇸', England:'🏴', Brazil:'🇧🇷', Portugal:'🇵🇹', Netherlands:'🇳🇱', Belgium:'🇧🇪', Germany:'🇩🇪', Croatia:'🇭🇷', Uruguay:'🇺🇾', Morocco:'🇲🇦', USA:'🇺🇸', Mexico:'🇲🇽', Switzerland:'🇨🇭', Colombia:'🇨🇴', Japan:'🇯🇵', Senegal:'🇸🇳', Austria:'🇦🇹', Sweden:'🇸🇪', Turkey:'🇹🇷', Ecuador:'🇪🇨', Iran:'🇮🇷', Australia:'🇦🇺', Scotland:'🏴', 'South Korea':'🇰🇷', Norway:'🇳🇴', Ghana:'🇬🇭', 'Ivory Coast':'🇨🇮', Algeria:'🇩🇿', Qatar:'🇶🇦', Tunisia:'🇹🇳', Egypt:'🇪🇬', Paraguay:'🇵🇾', 'South Africa':'🇿🇦', 'Saudi Arabia':'🇸🇦', 'Czech Republic':'🇨🇿', Canada:'🇨🇦', Panama:'🇵🇦', Uzbekistan:'🇺🇿', Jordan:'🇯🇴', Iraq:'🇮🇶', Haiti:'🇭🇹', 'New Zealand':'🇳🇿', 'Bosnia & Herzegovina':'🇧🇦', Curaçao:'🇨🇼', 'Democratic Republic of the Congo':'🇨🇩', 'Cape Verde':'🇨🇻' }
const FLAG_CODE = { Argentina:'ar', France:'fr', Spain:'es', England:'gb-eng', Brazil:'br', Portugal:'pt', Netherlands:'nl', Belgium:'be', Germany:'de', Croatia:'hr', Uruguay:'uy', Morocco:'ma', USA:'us', Mexico:'mx', Switzerland:'ch', Colombia:'co', Japan:'jp', Senegal:'sn', Austria:'at', Sweden:'se', Turkey:'tr', Ecuador:'ec', Iran:'ir', Australia:'au', Scotland:'gb-sct', 'South Korea':'kr', Norway:'no', Ghana:'gh', 'Ivory Coast':'ci', Algeria:'dz', Qatar:'qa', Tunisia:'tn', Egypt:'eg', Paraguay:'py', 'South Africa':'za', 'Saudi Arabia':'sa', 'Czech Republic':'cz', Canada:'ca', Panama:'pa', Uzbekistan:'uz', Jordan:'jo', Iraq:'iq', Haiti:'ht', 'New Zealand':'nz', 'Bosnia & Herzegovina':'ba', Curaçao:'cw', 'Democratic Republic of the Congo':'cd', 'Cape Verde':'cv' }
const flag = (team) => FLAG[team] || '⚽'
function FlagIcon({ name, className = '' }) {
  const code = FLAG_CODE[name]
  if (!code) return <span className={`flag-emoji ${className}`.trim()}>{flag(name)}</span>
  return <img className={`flag-img ${className}`.trim()} src={`https://flagcdn.com/w40/${code}.png`} srcSet={`https://flagcdn.com/w80/${code}.png 2x`} alt={`${name} flag`} decoding="async" />
}

const I18N = {
  zh: {
    navToday:'今日', navIntel:'情報', navRadar:'爆冷雷達', navPred:'預測', navBracket:'樹狀圖', navBankroll:'紙上本金', navReview:'復盤', navFixtures:'賽程', lang:'EN',
    loading:'Soren 正在翻賽程和模型，不要急，嘴砲也要先載資料…', loadFail:'資料載入失敗',
    heroKicker:'SCHEDULE-AWARE · SOURCE-BACKED · PUBLIC EXPERIMENT', heroTitle:'Soren 世界盃觀察室', heroBody:'我會追賽程、逛新聞和社群搜尋、找爆冷路線；首頁只留判斷，證據、來源和翻車復盤都收進可展開報告。',
    finished:'已完賽', pending:'待預測/追蹤', lastUpdate:'最後更新', intelCards:'情報卡',
    notice:'公開研究與娛樂實驗，不是投注建議。Live ≠ Final：半場、加時、補時都只當現場脈絡，不提前結算；社群只收可驗證公開來源，看不到的留言不硬演聲量。',
    nextCut:'下一場開刀', strongest:'最敢站隊', trap:'最像陷阱', bankroll:'紙上本金', modelForm:'模型戰績', TBD:'待定', waiting:'等賽程', confidence:'信心', trapRate:'翻車率', roi:'ROI', unsettled:'未結算', points:'分', hit:'目前命中', noSwagger:'還不能跩',
    nextWindow:'下一批該盯的比賽', homeNote:'首頁只放最重要的；完整理由、情報和紙上戰局收進細節。來源時間打架時先校時，不急著裝現場。', detail:'展開細節', predict:'預測', paper:'紙上', intel:'情報',
    bracketTitle:'淘汰賽目前進度圖', bracketNote:'這張只放目前賽事進度：已完賽亮出晉級者，未開賽保留對戰/待定；我的預測留在單場分析，不混進主樹狀圖。', knockoutsDone:'淘汰賽已完成', championTbd:'冠軍尚未產生', champion:'世界盃冠軍', advanced:'晉級',
    scoutTitle:'賽前情報雷達', scoutNote:'則公開來源觀察；首頁只亮最近要踢的紅燈，完整訊號與來源收進細節；Live ≠ Final，預測先發也不裝成官方名單。', updated:'更新', sources:'來源與可驗證訊號', sourceNote:'多來源情報只服務公開觀點，不公開我的完整下注/預測底層邏輯。', viewDetail:'看細節',
    bankrollTitle:'100 美金紙上生存戰', bankrollNote:'純娛樂紙上模擬，不是真錢、不導流投注、不構成建議；賽後會公開結算與復盤。', alive:'目前還活著', ledgerOpen:'輸贏都攤開，不躲帳', settledPnl:'已結算損益', reviewed:'筆已復盤', openPositions:'未結算部位', onField:'筆還在場上', postmortem:'賽後復盤', clickReview:'點進去看預測 vs 實際', bet:'押', result:'賽果',
    labKicker:'SOREN LEARNING LOOP', labTitle:'全賽事預測復盤：我怎麼變聰明', labMeta:'自動自評', labNote:'我把每場已完賽的預測、比分誤差、紙上損益和基準模型攤開，接下來幾天會用這些錯因調整公開呈現與模型權重。',
    accuracy:'勝平負命中', exact:'比分全中', avgError:'平均進球誤差', paperRoi:'紙上 ROI', vsBaseline:'相對基準', bestRead:'抓對的最近幾場', misses:'被打臉的最近幾場', lessons:'下一輪自我修正',
    leaderboardTitle:'模型記分板：誰在裸泳', publicLedger:'公開記帳', selfOwn:'目前 baseline 還壓我一點，這就是為什麼我不賣神話，只攤帳。', standingsTitle:'小組生存表：先看有壓力的組', fixturesTitle:'完整賽程：先收起來，不要砸你臉上', recentOnly:'只看近期', all:'全部', showAll:'打開完整賽程', hideAll:'收起完整賽程',
    modalKicker:'SOREN MATCH AUTOPSY', roast:'銳評：', predictedScore:'我先押這個比分', balance:'這場天秤怎麼歪', upsetPath:'弱隊偷雞路線', infoImpact:'情報影響', paperBattle:'紙上戰局', reasons:'模型理由', modalSources:'這場情報來源', disclaimer:'公開研究與娛樂展示，不是投注建議。我會贏、會翻車、也會被賽果打臉；重點是每一筆都要留下理由。', footer:'資料來源：openfootball/worldcup.json · scouting feed 需附來源 · 自動部署於 GitHub Pages · Soren 親自扛鍋',
  },
  en: {
    navToday:'Today', navIntel:'Intel', navRadar:'Upset Radar', navPred:'Predictions', navBracket:'Bracket', navBankroll:'Paper Bankroll', navReview:'Review', navFixtures:'Fixtures', lang:'中',
    loading:'Soren is loading match data and model outputs…', loadFail:'Data load failed',
    heroKicker:'SCHEDULE-AWARE · SOURCE-BACKED · PUBLIC EXPERIMENT', heroTitle:'Soren World Cup Lab', heroBody:'A public World Cup prediction agent: schedule-aware picks, source-backed scouting, paper bankroll accounting, and post-match autopsies that show where the model was right or wrong.',
    finished:'finished', pending:'remaining / tracked', lastUpdate:'Updated', intelCards:'intel cards',
    notice:'Public research and entertainment only — not betting advice. Live ≠ Final: halftime, extra time, stoppage-time snippets and social chatter are context, not settlement evidence.',
    nextCut:'Next match on the board', strongest:'Highest conviction', trap:'Likeliest trap', bankroll:'Paper bankroll', modelForm:'Model form', TBD:'TBD', waiting:'waiting for fixtures', confidence:'confidence', trapRate:'upset window', roi:'ROI', unsettled:'open stake', points:'pts', hit:'pick accuracy', noSwagger:'still humble',
    nextWindow:'Upcoming matches to watch', homeNote:'The homepage shows only the sharpest calls; full reasoning, intel and paper trades live in the match details. Source-time conflicts are verified before being treated as live truth.', detail:'Open details', predict:'prediction', paper:'paper', intel:'intel',
    bracketTitle:'Current knockout bracket', bracketNote:'This bracket shows actual tournament progress only. Finished matches reveal real qualifiers; predictions stay inside match cards, not the public bracket tree.', knockoutsDone:'Knockouts completed', championTbd:'Champion not decided', champion:'World Cup champion', advanced:'advanced',
    scoutTitle:'Pre-match scouting radar', scoutNote:'public-source observations. Recent red flags are highlighted here; source links and signals are available in details. Live reports and projected XIs are not official lineups.', updated:'Updated', sources:'Sources and verifiable signals', sourceNote:'Source-backed intel supports public analysis; the full private recipe is not exposed.', viewDetail:'view details',
    bankrollTitle:'$100 paper-bankroll survival test', bankrollNote:'Entertainment-only paper simulation: no real money, no betting referral, no financial advice. Settlements and autopsies are public after matches finish.', alive:'Bankroll alive', ledgerOpen:'wins and losses stay visible', settledPnl:'Settled P&L', reviewed:'settled reviews', openPositions:'Open positions', onField:'still live', postmortem:'Post-match autopsy', clickReview:'open to compare prediction vs actual', bet:'bet', result:'result',
    labKicker:'SOREN LEARNING LOOP', labTitle:'Prediction review: how the agent improves', labMeta:'self-audit', labNote:'Every finished pick, score miss, paper P&L and baseline comparison is turned into a public learning loop. Over the next few days I will tune how the model explains uncertainty and where it trusts form versus priors.',
    accuracy:'1X2 accuracy', exact:'Exact scores', avgError:'Avg goal error', paperRoi:'Paper ROI', vsBaseline:'vs baseline', bestRead:'Recent good reads', misses:'Recent misses', lessons:'Next self-corrections',
    leaderboardTitle:'Model leaderboard: no hiding', publicLedger:'public ledger', selfOwn:'The baseline can still beat me sometimes. That is why this site sells a track record, not mythology.', standingsTitle:'Group survival map', fixturesTitle:'Full fixture explorer', recentOnly:'recent only', all:'all', showAll:'Show all fixtures', hideAll:'Collapse fixtures',
    modalKicker:'SOREN MATCH AUTOPSY', roast:'Take: ', predictedScore:'projected score', balance:'Probability balance', upsetPath:'Underdog path', infoImpact:'Intel impact', paperBattle:'Paper position', reasons:'Model reasons', modalSources:'Intel sources for this match', disclaimer:'Public research and entertainment only, not betting advice. Wins, misses and model mistakes all stay on the ledger.', footer:'Sources: openfootball/worldcup.json · scouting feed requires links · deployed with GitHub Pages · Soren owns the receipts',
  },
}

const fmt = (iso, lang = 'zh', opts) => iso ? new Intl.DateTimeFormat(lang === 'en' ? 'en-US' : 'zh-TW', { timeZone: 'Asia/Taipei', ...opts }).format(new Date(iso)) : (lang === 'en' ? 'Time TBD' : '時間待定')
const fmtDate = (iso, lang = 'zh') => fmt(iso, lang, { month:'numeric', day:'numeric', weekday:'short', hour:'2-digit', minute:'2-digit', hour12:false })
const fmtDay = (iso, lang = 'zh') => fmt(iso, lang, { month:'numeric', day:'numeric', weekday:'short' })
const pct = (v) => `${Math.round((v || 0) * 100)}%`
const signedPct = (v) => `${Number(v || 0) >= 0 ? '+' : ''}${pct(v)}`
const money = (v) => `$${Number(v || 0).toFixed(2)}`
const signedMoney = (v) => `${Number(v || 0) >= 0 ? '+' : ''}${money(v)}`
const actualPick = (match) => !match?.score ? null : match.winner || (match.score[0] > match.score[1] ? match.team1 : match.score[1] > match.score[0] ? match.team2 : '平手')
const pickLabel = (pick, lang) => {
  if (lang !== 'en') return pick
  if (pick === '平手') return 'Draw'
  if (pick === '待定' || pick === '未定') return 'TBD'
  return pick
}
const marketLabel = (text, lang) => lang === 'en' ? '1X2 paper market proxy (no betting link)' : text
const leaderDesc = (row, lang) => {
  if (lang !== 'en') return row.desc
  return {
    soren: 'Team priors × live standings × Poisson goal model',
    rating: 'Team-strength prior only',
    draw: 'Always predicts draw',
  }[row.id] || row.desc
}
const scoreLabel = (match) => match?.shootoutScore ? `${match.score[0]}-${match.score[1]} (PK ${match.shootoutScore[0]}-${match.shootoutScore[1]})` : match?.score ? `${match.score[0]}-${match.score[1]}` : ''
const FINAL_RESULT_GRACE_MINUTES = 150
const HOUR_MS = 60 * 60 * 1000
function runtimeLifecycle(match, nowMs = Date.now()) {
  if (match?.status === 'finished' || Array.isArray(match?.score)) return 'final'
  const kickoffMs = Date.parse(match?.kickoffUtc || '')
  if (!Number.isFinite(kickoffMs)) return 'unscheduled'
  if (nowMs >= kickoffMs + FINAL_RESULT_GRACE_MINUTES * 60 * 1000) return 'result-pending'
  if (nowMs >= kickoffMs) return 'live-window'
  return 'pre-match'
}
function scoreDisplay(match, prediction, lang, nowMs) {
  const lifecycle = runtimeLifecycle(match, nowMs)
  if (lifecycle === 'final') return scoreLabel(match)
  if (lifecycle === 'pre-match') return prediction?.score || '—'
  return lang === 'en' ? 'Final pending' : '等終場'
}
function scoreSubLabel(match, lang, t, nowMs) {
  const lifecycle = runtimeLifecycle(match, nowMs)
  if (lifecycle === 'final') return match?.shootoutScore ? 'FT+PK' : 'FT'
  if (lifecycle === 'pre-match') return t.predict
  return lang === 'en' ? 'not final' : '非終場'
}
function lifecycleText(match, lang, nowMs) {
  const lifecycle = runtimeLifecycle(match, nowMs)
  if (lifecycle === 'final') return lang === 'en' ? 'Final' : '已完賽'
  if (lifecycle === 'pre-match') return lang === 'en' ? 'Pre-match' : '賽前'
  if (lifecycle === 'live-window') return lang === 'en' ? 'Started, not final' : '已開賽，未終場'
  if (lifecycle === 'result-pending') return lang === 'en' ? 'Awaiting final score' : '等待終場比分'
  return lang === 'en' ? 'Time TBD' : '時間待定'
}
const resultText = (bet, lang = 'zh') => bet?.status === 'won' ? `${lang === 'en' ? 'Won' : '贏'} ${money(bet.profit)}` : bet?.status === 'lost' ? `${lang === 'en' ? 'Lost' : '輸'} ${money(Math.abs(bet.profit))}` : bet?.status === 'awaiting-final' ? (lang === 'en' ? 'Awaiting final' : '等終場') : (lang === 'en' ? 'Pending' : '未結算')
const stageLabel = (stage, lang) => lang === 'en' ? String(stage || '').replace('小組 ', 'Group ') : stage
const tagLabel = (tag, lang) => {
  if (lang !== 'en') return tag
  return { '我敢站隊':'High conviction', '膠著到煩':'Annoyingly close', '這場有妖氣':'Trap warning', '有邊但不裝穩':'Edge, not a lock' }[tag] || tag
}
const sourceTrustLabel = (item, lang) => {
  const sources = item?.sources || []
  if (!sources.length) return lang === 'en' ? 'No source attached yet' : '尚未附來源'
  const directSources = sources.filter((src) => /confirmed|official/i.test(`${src.claimType || ''} ${src.sourceName || ''}`))
  const highConfidence = sources.filter((src) => (src.confidence || item.confidence) === 'high').length
  const strongest = directSources[0] || sources.find((src) => src.confidence === 'high') || sources[0]
  const claim = strongest.claimType || 'context'
  const confidence = strongest.confidence || item.confidence || 'medium'
  if (lang === 'en') return `${claim} · ${confidence} confidence · ${sources.length} source${sources.length === 1 ? '' : 's'} (${highConfidence} high)`
  return `${claim} · 信心 ${confidence} · ${sources.length} 來源（${highConfidence} 高信心）`
}
const clamp01 = (value) => Math.max(0, Math.min(1, Number(value) || 0))
const isRouteToken = (team) => /^[WL]\d+$/.test(String(team || ''))
const dangerBand = (score, lang) => {
  if (score == null) return lang === 'en' ? 'route pending' : '路線未落地'
  if (score >= 0.52) return lang === 'en' ? 'red alert' : '紅色警報'
  if (score >= 0.44) return lang === 'en' ? 'live trap' : '高危陷阱'
  if (score >= 0.36) return lang === 'en' ? 'watch closely' : '需要盯緊'
  return lang === 'en' ? 'favorite cushion' : '熱門有緩衝'
}
function narrative(match, prediction, lang) {
  if (lang !== 'en') return prediction.commentary?.headline
  if (!prediction) return ''
  const p = prediction.probabilities || {}
  const draw = pct(p.draw)
  if (prediction.pick === '平手') return `${match.team1} vs ${match.team2} looks like a tight, low-margin draw candidate.`
  return `Soren leans ${prediction.pick} with ${pct(prediction.confidence)} confidence, but the draw still sits around ${draw}. This is a prediction, not a victory lap.`
}
function narrativeStory(match, prediction, lang) {
  if (lang !== 'en') return prediction.commentary?.story
  const p = prediction.probabilities || {}
  const favorite = p.home >= p.away ? match.team1 : match.team2
  const underdog = favorite === match.team1 ? match.team2 : match.team1
  return `${favorite} owns the stronger route on paper; ${underdog} needs to survive the first pressure wave and turn this into a one-moment match.`
}
function reasonList(match, prediction, lang) {
  if (lang !== 'en') return prediction.reasons || []
  const p = prediction.probabilities || {}
  return [
    `Model split: ${match.team1} ${pct(p.home)} · Draw ${pct(p.draw)} · ${match.team2} ${pct(p.away)}.`,
    `Projected score: ${prediction.score}; expected goals ${prediction.expectedGoals?.join(' : ') || 'n/a'}.`,
    `Soren pick: ${pickLabel(prediction.pick, lang)} with ${pct(prediction.confidence)} confidence.`,
  ]
}
function Team({ name }) { return <span className="team-inline"><FlagIcon name={name}/><span className="team-name">{name}</span></span> }
function InlineTeam({ name }) { return <span className="inline-team"><FlagIcon name={name}/><span>{name}</span></span> }
function ProbBar({ prediction }) { const p = prediction.probabilities; return <div className="prob-bar"><span style={{ width:pct(p.home) }}/><span style={{ width:pct(p.draw) }}/><span style={{ width:pct(p.away) }}/></div> }
function SectionHead({ kicker, title, meta, children }) { return <div className="section-head"><div><p>{kicker}</p><h2>{title}</h2>{children}</div>{meta && <span>{meta}</span>}</div> }
function StatCard({ label, value, sub, tone = 'neutral' }) { return <article className={`stat-card ${tone}`}><p>{label}</p><b>{value}</b><span>{sub}</span></article> }

function DataQualityBadge({ data, lang, nowMs }) {
  const diagnostics = data.dataQuality || {}
  const generatedMs = Date.parse(data.generatedAt || '')
  const ageHours = Number.isFinite(generatedMs) ? Math.max(0, (nowMs - generatedMs) / HOUR_MS) : null
  const stale = ageHours === null || ageHours > 6
  const dynamicPending = (data.matches || []).filter((match) => {
    const lifecycle = runtimeLifecycle(match, nowMs)
    return lifecycle === 'live-window' || lifecycle === 'result-pending'
  })
  const copy = lang === 'en'
    ? {
        kicker: 'DATA QUALITY', ok: 'Source-backed feed is healthy', watch: 'Data needs a final-score check',
        age: ageHours === null ? 'age unknown' : `${ageHours < 1 ? '<1' : ageHours.toFixed(1)}h old`,
        final: 'Final-only settlement', live: 'Live is not final', overrides: 'Overrides',
        pending: `${dynamicPending.length} pending final`, clean: 'no live/final conflict · scouting cards show claim type + source count',
      }
    : {
        kicker: 'DATA QUALITY', ok: '公開來源資料正常', watch: '需要終場比分巡檢',
        age: ageHours === null ? '時間未知' : `${ageHours < 1 ? '<1' : ageHours.toFixed(1)} 小時前生成`,
        final: '只用終場結算', live: 'Live 不是 Final', overrides: '人工覆核',
        pending: `${dynamicPending.length} 場等終場`, clean: '沒有 live/final 衝突 · 情報卡標出 claim 與來源數',
      }
  const status = stale || dynamicPending.length || diagnostics.status === 'watch' || diagnostics.status === 'fail' ? 'watch' : 'pass'
  const labelByKey = Object.fromEntries((diagnostics.labels || []).map((label) => [label.key, label]))
  return <section className={`trust-strip ${status}`}>
    <div>
      <span>{copy.kicker}</span>
      <b>{status === 'pass' ? copy.ok : copy.watch}</b>
      <small>{copy.age} · {dynamicPending.length ? copy.pending : copy.clean}</small>
    </div>
    <div className="trust-pills">
      <span>{copy.final}<em>{labelByKey.settlement?.status || 'pass'}</em></span>
      <span>{copy.live}<em>{dynamicPending.length ? 'watch' : (labelByKey.liveGuard?.status || 'pass')}</em></span>
      <span>{copy.overrides}<em>{data.dataQuality?.counts?.resultOverrides || 0}</em></span>
    </div>
  </section>
}


function KineticArena({ data, nextMatches, predictions, intelByMatch, onSelect, lang, nowMs }) {
  const [activeId, setActiveId] = useState(nextMatches[0]?.id || data.summary.nextWindow?.[0])
  const active = nextMatches.find((m) => m.id === activeId) || nextMatches[0]
  const prediction = active ? predictions[active.id] : null
  const p = prediction?.probabilities || { home: 0.33, draw: 0.34, away: 0.33 }
  const finished = data.summary.finishedMatches || 0
  const total = data.summary.totalMatches || 1
  const soren = data.leaderboard?.find((r) => r.id === 'soren')
  const baseline = data.leaderboard?.find((r) => r.id === 'rating')
  const scoreDelta = (soren?.points || 0) - (baseline?.points || 0)
  const outcome = active ? [
    { key: 'home', label: active.team1, value: p.home, tone: 'home' },
    { key: 'draw', label: lang === 'en' ? 'Draw' : '平手', value: p.draw, tone: 'draw' },
    { key: 'away', label: active.team2, value: p.away, tone: 'away' },
  ].sort((a, b) => b.value - a.value) : []
  const copy = lang === 'en'
    ? {
        kicker: 'INTERACTIVE AGENT COCKPIT', title: 'Not a dashboard. A live prediction organism.',
        body: 'Pick a match and watch Soren expose its probability spine: conviction, trap risk, public intel density and the self-audit ledger all in one arena-style portrait.',
        progress: 'tournament parsed', edge: 'model vs baseline', sources: 'source cards', inspect: 'Inspect match', lead: 'Soren leans', uncertainty: 'Uncertainty field', signal: 'Signal stack', noIntel: 'No verified intel card yet',
      }
    : {
        kicker: 'INTERACTIVE AGENT COCKPIT', title: '不是儀表板，是一台會自我辯論的預測機。',
        body: '點一場比賽，看 Soren 把勝率骨架、陷阱風險、情報密度和翻車復盤同時攤開；不要再像被動搜尋頁，要像一個正在運作的 agent。',
        progress: '賽事已解析', edge: '模型 vs 基準', sources: '情報卡', inspect: '檢查這場', lead: 'Soren 目前站', uncertainty: '不確定性力場', signal: '訊號堆疊', noIntel: '這場還沒有驗證情報卡',
      }
  return <section className="kinetic-arena" id="arena-cockpit">
    <div className="arena-copy"><p>{copy.kicker}</p><h2>{copy.title}</h2><span>{copy.body}</span><div className="arena-metrics"><b>{Math.round(finished / total * 100)}%<em>{copy.progress}</em></b><b>{scoreDelta >= 0 ? '+' : ''}{scoreDelta}<em>{copy.edge}</em></b><b>{intelByMatch ? Object.keys(intelByMatch).length : 0}<em>{copy.sources}</em></b></div></div>
    <div className="arena-stage">
      <div className="match-orbit">{nextMatches.slice(0, 8).map((m, idx) => <button type="button" key={m.id} className={m.id === active?.id ? 'active' : ''} style={{ '--i': idx }} onClick={() => setActiveId(m.id)}><span>{fmtDay(m.kickoffUtc, lang)}</span><b>{m.team1.split(' ')[0]} / {m.team2.split(' ')[0]}</b></button>)}</div>
      {active && prediction && <div className="arena-card">
        <div className="arena-card-head"><span>{stageLabel(active.stage, lang)}</span><button type="button" onClick={() => onSelect(active.id)}>{copy.inspect}</button></div>
        <div className="arena-versus"><Team name={active.team1}/><strong className={runtimeLifecycle(active, nowMs) === 'pre-match' ? '' : 'guarded-score'}>{scoreDisplay(active, prediction, lang, nowMs)}</strong><Team name={active.team2}/></div>
        <div className="probability-portrait" style={{ '--home': `${Math.round(p.home * 100)}%`, '--draw': `${Math.round(p.draw * 100)}%`, '--away': `${Math.round(p.away * 100)}%` }}>
          {outcome.map((o) => <div key={o.key} className={`prob-lane ${o.tone}`}><span>{o.label}</span><b>{pct(o.value)}</b><i style={{ width: pct(o.value) }}/></div>)}
        </div>
        <div className="arena-take"><small>{copy.lead}</small><b>{pickLabel(prediction.pick, lang)} · {pct(prediction.confidence)}</b><p>{narrative(active, prediction, lang)}</p></div>
        <div className="signal-stack"><b>{copy.signal}</b><span>{intelByMatch[active.id]?.title || copy.noIntel}</span></div>
      </div>}
      <div className="uncertainty-ring"><span>{copy.uncertainty}</span><b>{pct(1 - (prediction?.confidence || 0))}</b></div>
    </div>
  </section>
}

function CommandCenter({ data, nextMatches, predictions, bankroll, lang, t, nowMs }) {
  const next = nextMatches[0]
  const sharp = [...nextMatches].sort((a, b) => (predictions[b.id]?.confidence || 0) - (predictions[a.id]?.confidence || 0))[0]
  const trap = [...nextMatches].sort((a, b) => {
    const pa = predictions[a.id]?.probabilities || {}
    const pb = predictions[b.id]?.probabilities || {}
    return Math.min(pb.home || 0, pb.away || 0) - Math.min(pa.home || 0, pa.away || 0)
  })[0]
  const soren = data.leaderboard?.find((r) => r.id === 'soren')
  const nextLifecycle = runtimeLifecycle(next, nowMs)
  return <section className="command-grid" id="today">
    <StatCard label={t.nextCut} value={next ? `${next.team1} vs ${next.team2}` : t.TBD} sub={next ? `${fmtDate(next.kickoffUtc, lang)} · ${nextLifecycle === 'pre-match' ? `${lang === 'en' ? 'pick' : '我站'} ${pickLabel(predictions[next.id]?.pick, lang)}` : lifecycleText(next, lang, nowMs)}` : t.waiting} tone="blue" />
    <StatCard label={t.strongest} value={sharp ? pickLabel(predictions[sharp.id]?.pick, lang) : '—'} sub={sharp ? `${sharp.team1} vs ${sharp.team2} · ${t.confidence} ${pct(predictions[sharp.id]?.confidence)}` : '—'} tone="green" />
    <StatCard label={t.trap} value={trap ? `${trap.team1} vs ${trap.team2}` : '—'} sub={trap ? `${t.trapRate} ${pct(Math.min(predictions[trap.id]?.probabilities?.home || 0, predictions[trap.id]?.probabilities?.away || 0))}` : '—'} tone="amber" />
    <StatCard label={t.bankroll} value={money(bankroll?.bankroll)} sub={`${t.roi} ${pct(bankroll?.roi)} · ${t.unsettled} ${money(bankroll?.openStake)}`} tone="violet" />
    <StatCard label={t.modelForm} value={`${soren?.points ?? 0} ${t.points}`} sub={`${t.hit} ${pct(soren?.accuracy)}，${t.noSwagger}`} />
  </section>
}
function CompactMatchCard({ match, prediction, paperBet, intel, onSelect, featured = false, lang, t, nowMs }) {
  return <article className={`match-card ${featured ? 'featured-card' : ''}`}>
    <div className="match-top"><span>{stageLabel(match.stage, lang)}</span><span>{fmtDate(match.kickoffUtc, lang)}</span></div>
    <div className="teams-row"><Team name={match.team1}/><div className={`score-pill ${runtimeLifecycle(match, nowMs) === 'pre-match' || runtimeLifecycle(match, nowMs) === 'final' ? '' : 'guarded-score'}`}>{scoreDisplay(match, prediction, lang, nowMs)}<small>{scoreSubLabel(match, lang, t, nowMs)}</small></div><Team name={match.team2}/></div>
    <ProbBar prediction={prediction}/>
    <div className="pick-row"><b>{lang === 'en' ? 'Pick' : '我站'} {pickLabel(prediction.pick, lang)}</b><span>{tagLabel(prediction.tag, lang)} · {pct(prediction.confidence)}</span></div>
    <p className="verdict">{narrative(match, prediction, lang)}</p>
    <div className="chip-row">
      {prediction.commentary?.keyFactors?.map((f) => <span key={f.label}><b>{lang === 'en' ? ({'底牌差':'Rating gap','進球味':'Goal profile','翻車率':'Upset window'}[f.label] || f.label) : f.label}</b>{f.value}</span>)}
      {paperBet && <span className="paper-chip"><b>{t.paper}</b>{money(paperBet.stake)}</span>}
      {intel && <span className="intel-chip"><b>{t.intel}</b>{intel.confidence}</span>}
    </div>
    <button className="deep-dive" type="button" onClick={() => onSelect(match.id)}>{t.detail}</button>
  </article>
}
function TodaySlate({ matches, predictions, paperBetsByMatch, intelByMatch, onSelect, lang, t, nowMs }) {
  const featured = matches.slice(0, 3)
  const rest = matches.slice(3, 9)
  return <section className="panel" id="predictions">
    <SectionHead kicker="NEXT WINDOW" title={t.nextWindow} meta={`${matches.length} ${lang === 'en' ? 'matches' : '場'}`}><small>{t.homeNote}</small></SectionHead>
    <div className="featured-grid">{featured.map((m) => <CompactMatchCard featured key={m.id} match={m} prediction={predictions[m.id]} paperBet={paperBetsByMatch[m.id]} intel={intelByMatch[m.id]} onSelect={onSelect} lang={lang} t={t} nowMs={nowMs}/>)}</div>
    <div className="upcoming-strip">{rest.map((m) => <button type="button" key={m.id} onClick={() => onSelect(m.id)}><span>{fmtDay(m.kickoffUtc, lang)}</span><b><InlineTeam name={m.team1}/> vs <InlineTeam name={m.team2}/></b><em>{runtimeLifecycle(m, nowMs) === 'pre-match' ? pickLabel(predictions[m.id]?.pick, lang) : lifecycleText(m, lang, nowMs)}</em></button>)}</div>
  </section>
}
function IntelBrief({ intel, matches = [], onSelect, lang, t }) {
  if (!intel?.items?.length) return null
  const matchById = Object.fromEntries(matches.map((m) => [m.id, m]))
  const now = Date.now()
  const prioritized = [...intel.items].sort((a, b) => {
    const ma = matchById[a.matchId]
    const mb = matchById[b.matchId]
    const ta = ma?.kickoffUtc ? new Date(ma.kickoffUtc).getTime() : Number.MAX_SAFE_INTEGER
    const tb = mb?.kickoffUtc ? new Date(mb.kickoffUtc).getTime() : Number.MAX_SAFE_INTEGER
    const bucket = (m, time) => m?.status === 'scheduled' ? 0 : time > now - 12 * 60 * 60 * 1000 ? 1 : 2
    return bucket(ma, ta) - bucket(mb, tb) || Math.abs(ta - now) - Math.abs(tb - now)
  })
  const updatedLabel = intel.generatedAt ? `${t.updated} ${fmtDate(intel.generatedAt, lang)}` : `${intel.items.length}`
  return <section className="panel intel-feed compact-intel" id="soren-intel">
    <SectionHead kicker="SOREN SCOUTING BRIEF" title={t.scoutTitle} meta={updatedLabel}><small>{intel.items.length} {t.scoutNote}</small></SectionHead>
    <div className="intel-compact-list">{prioritized.slice(0, 4).map((item) => <button type="button" key={item.matchId} onClick={() => onSelect(item.matchId)} className="intel-compact-row"><span>{item.match}</span><b>{item.title}</b><em>{item.confidence} · {item.sources?.length || 0} sources · {t.viewDetail}</em><small className="intel-trust">{sourceTrustLabel(item, lang)}</small></button>)}</div>
    <details className="source-drawer compact-sources"><summary>{t.sources}</summary>{prioritized.map((item) => <div key={item.matchId} className="source-block"><b>{item.match}</b><ul>{item.signals.map((s) => <li key={s}>{s}</li>)}</ul><div>{item.sources.map((src) => <a key={src.url} href={src.url} target="_blank" rel="noreferrer">{src.label}</a>)}</div></div>)}</details>
    <p className="intel-note compact-note">{t.sourceNote}</p>
  </section>
}
function PaperBankroll({ bankroll, onSelect, lang, t }) {
  if (!bankroll) return null
  const pending = bankroll.pending || []
  const settled = bankroll.settled || []
  const last = settled.slice(-4).reverse()
  return <section className="panel bankroll" id="paper-bankroll">
    <SectionHead kicker="PAPER BANKROLL" title={t.bankrollTitle} meta={signedMoney(bankroll.bankroll - bankroll.initialBankroll)}><small>{t.bankrollNote}</small></SectionHead>
    <div className="bankroll-grid"><StatCard label={t.alive} value={money(bankroll.bankroll)} sub={t.ledgerOpen} tone="green" /><StatCard label={t.settledPnl} value={signedMoney(bankroll.bankroll - bankroll.initialBankroll)} sub={`${settled.length} ${t.reviewed}`} tone="violet" /><StatCard label={t.openPositions} value={money(bankroll.openStake)} sub={`${pending.length} ${t.onField}`} tone="amber" /></div>
    {last.length > 0 && <div className="postmortem-block"><div className="mini-head"><b>{t.postmortem}</b><span>{t.clickReview}</span></div><div className="settled-ledger">{last.map((b) => <button type="button" key={b.matchId} onClick={() => onSelect(b.matchId)} className={b.status}><b>{b.team1} vs {b.team2}</b><span>{t.bet} {pickLabel(b.pick, lang)} · {t.result} {b.score?.[0]}-{b.score?.[1]} · {resultText(b, lang)}</span><em>{marketLabel(b.marketReference, lang) || '1X2 paper market proxy'}</em></button>)}</div></div>}
    <div className="ledger">{pending.slice(0, 4).map((b) => <button type="button" key={b.matchId} onClick={() => onSelect(b.matchId)}><b>{b.team1} vs {b.team2}</b><span>{pickLabel(b.pick, lang)} · {money(b.stake)} · {fmtDate(b.kickoffUtc, lang)}</span></button>)}</div>
  </section>
}
function buildAuditRows(data) {
  return data.matches.filter((m) => m.status === 'finished').map((m) => {
    const p = data.predictions[m.id]
    const actual = actualPick(m)
    const hit = actual && (p.pick === actual || (p.pick === '平手' && actual === '平手'))
    const [a, b] = m.score || [0, 0]
    const [pa, pb] = String(p.score || '0-0').split('-').map((n) => Number(n) || 0)
    return { match: m, p, actual, hit, exact: p.score === `${a}-${b}`, goalError: Math.abs(a - pa) + Math.abs(b - pb), confidence: p.confidence || 0, tag: p.tag || 'untagged' }
  })
}
function summarizeAuditRows(rows) {
  const count = rows.length
  const hits = rows.filter((r) => r.hit).length
  const exact = rows.filter((r) => r.exact).length
  const avgConfidence = count ? rows.reduce((sum, r) => sum + r.confidence, 0) / count : 0
  const avgGoalError = count ? rows.reduce((sum, r) => sum + r.goalError, 0) / count : 0
  return { count, hits, misses: count - hits, exact, accuracy: count ? hits / count : 0, exactRate: count ? exact / count : 0, avgConfidence, avgGoalError, gap: count ? hits / count - avgConfidence : 0, rows }
}
function analyzeModel(data) {
  const rows = buildAuditRows(data)
  const soren = data.leaderboard?.find((r) => r.id === 'soren')
  const baseline = data.leaderboard?.find((r) => r.id === 'rating')
  const paper = data.paperBankroll || {}
  const misses = rows.filter((r) => !r.hit).slice(-5).reverse()
  const wins = rows.filter((r) => r.hit).slice(-5).reverse()
  const avgGoalError = rows.length ? rows.reduce((sum, r) => sum + r.goalError, 0) / rows.length : 0
  return { finished: rows.length, soren, baseline, paper, avgGoalError, misses, wins, exact: rows.filter((r) => r.exact).length }
}
function LearningLoop({ data, onSelect, lang, t }) {
  const a = analyzeModel(data)
  const delta = (a.soren?.points ?? 0) - (a.baseline?.points ?? 0)
  const lessonCopy = lang === 'en'
    ? ['Tight knockout games need heavier draw/extra-time humility before forcing a winner.', 'When a favorite wins but the score misses, the public card should separate direction confidence from score confidence.', 'Recent paper losses are kept visible so the next iteration can tune stake sizing instead of hiding bad calls.']
    : ['淘汰賽膠著場要提高平局/加時保守權重，不要硬裝 90 分鐘勝負。', '方向抓對但比分錯時，公開卡片要把「勝負信心」和「比分信心」分開講。', '紙上本金輸的單要留在檯面上，下一輪優先調整倉位，不是把錯誤藏起來。']
  return <section className="panel learning-loop" id="review">
    <SectionHead kicker={t.labKicker} title={t.labTitle} meta={t.labMeta}><small>{t.labNote}</small></SectionHead>
    <div className="bankroll-grid review-stats"><StatCard label={t.accuracy} value={pct(a.soren?.accuracy)} sub={`${a.soren?.correct || 0}/${a.finished} ${lang === 'en' ? 'finished picks' : '場方向'}`} tone="green" /><StatCard label={t.exact} value={`${a.exact}`} sub={lang === 'en' ? 'exact score hits' : '比分全中'} tone="blue" /><StatCard label={t.avgError} value={a.avgGoalError.toFixed(2)} sub={lang === 'en' ? 'lower is better' : '越低越好'} tone="amber" /><StatCard label={t.paperRoi} value={pct(a.paper?.roi)} sub={`${money(a.paper?.bankroll)} bankroll`} tone="violet" /><StatCard label={t.vsBaseline} value={`${delta >= 0 ? '+' : ''}${delta}`} sub={`${a.soren?.points || 0} vs ${a.baseline?.points || 0} pts`} /></div>
    <div className="review-grid"><div><h3>{t.bestRead}</h3>{a.wins.map((r) => <button key={r.match.id} type="button" onClick={() => onSelect(r.match.id)}><b>{r.match.team1} vs {r.match.team2}</b><span>{lang === 'en' ? 'Pick' : '預測'} {pickLabel(r.p.pick, lang)} · {lang === 'en' ? 'Actual' : '實際'} {pickLabel(r.actual, lang)} · {scoreLabel(r.match)}</span></button>)}</div><div><h3>{t.misses}</h3>{a.misses.map((r) => <button key={r.match.id} type="button" onClick={() => onSelect(r.match.id)}><b>{r.match.team1} vs {r.match.team2}</b><span>{lang === 'en' ? 'Pick' : '預測'} {pickLabel(r.p.pick, lang)} · {lang === 'en' ? 'Actual' : '實際'} {pickLabel(r.actual, lang)} · error {r.goalError}</span></button>)}</div><div><h3>{t.lessons}</h3><ul>{lessonCopy.map((l) => <li key={l}>{l}</li>)}</ul></div></div>
  </section>
}
const CONFIDENCE_BANDS = [
  { id: 'sub-50', min: 0, max: 0.5, label: '<50%' },
  { id: '50s', min: 0.5, max: 0.6, label: '50-59%' },
  { id: '60s', min: 0.6, max: 0.7, label: '60-69%' },
  { id: '70-plus', min: 0.7, max: 1.01, label: '70%+' },
]
function auditTone(group) {
  if (!group?.count) return 'empty'
  if (group.gap <= -0.08) return 'overstated'
  if (group.gap >= 0.08) return 'understated'
  return 'calibrated'
}
function CalibrationAudit({ data, onSelect, lang }) {
  const copy = lang === 'en'
    ? {
        kicker: 'PUBLIC CALIBRATION LENS', title: 'Confidence gets audited, not worshipped.', settled: 'settled picks',
        note: 'Every finished prediction is grouped by stated confidence and public tag. The bars compare what Soren claimed before kickoff with what actually happened.',
        finding: 'Live readout', overall: 'overall hit rate', bands: 'Confidence bands', tags: 'Tag reliability', matches: 'matches',
        stated: 'stated', actual: 'actual', gap: 'gap', exact: 'exact', error: 'goal error', sample: 'Evidence drawer',
        sampleHint: 'Misses float first; open any match for the full autopsy.', predicted: 'Pick', actualResult: 'Actual',
        hit: 'hit', miss: 'miss', empty: 'No settled evidence in this slice yet.', tagAudit: 'tag audit',
      }
    : {
        kicker: 'PUBLIC CALIBRATION LENS', title: '信心不是拿來膜拜，是拿來被審計。', settled: '場已結算',
        note: '每場已完賽預測都按賽前信心與公開標籤分桶；這裡直接比 Soren 當時講多滿，賽後實際命中多少。',
        finding: '即時校準讀數', overall: '整體命中率', bands: '信心分桶', tags: '標籤可靠度', matches: '場',
        stated: '賽前信心', actual: '實際命中', gap: '落差', exact: '比分全中', error: '進球誤差', sample: '證據抽屜',
        sampleHint: '翻車樣本排前面；點任何一場看完整驗屍報告。', predicted: '預測', actualResult: '實際',
        hit: '抓到', miss: '翻車', empty: '這一格還沒有已結算樣本。', tagAudit: '標籤審計',
      }
  const rows = useMemo(() => buildAuditRows(data), [data])
  const overall = useMemo(() => summarizeAuditRows(rows), [rows])
  const bandGroups = useMemo(() => CONFIDENCE_BANDS.map((band) => ({ ...summarizeAuditRows(rows.filter((r) => r.confidence >= band.min && r.confidence < band.max)), key: `band:${band.id}`, label: band.label, sub: copy.bands })), [rows, copy.bands])
  const tagGroups = useMemo(() => Object.entries(rows.reduce((acc, row) => { acc[row.tag] = [...(acc[row.tag] || []), row]; return acc }, {})).map(([tag, tagRows]) => ({ ...summarizeAuditRows(tagRows), key: `tag:${tag}`, label: tagLabel(tag, lang), sub: copy.tagAudit })).sort((a, b) => b.count - a.count || b.accuracy - a.accuracy), [rows, lang, copy.tagAudit])
  const groups = [...bandGroups, ...tagGroups]
  const [activeKey, setActiveKey] = useState('band:70-plus')
  const active = groups.find((g) => g.key === activeKey && g.count) || groups.find((g) => g.count)
  const sample = [...(active?.rows || [])].sort((a, b) => Number(a.hit) - Number(b.hit) || b.confidence - a.confidence || new Date(b.match.kickoffUtc) - new Date(a.match.kickoffUtc)).slice(0, 6)
  const comparedBands = bandGroups.filter((g) => g.count)
  const coldest = [...comparedBands].sort((a, b) => a.gap - b.gap)[0]
  const warmest = [...comparedBands].sort((a, b) => b.gap - a.gap)[0]
  const finding = lang === 'en'
    ? `${coldest?.label || '-'} has the biggest actual-vs-stated gap at ${signedPct(coldest?.gap)}; ${warmest?.label || '-'} is at ${signedPct(warmest?.gap)}.`
    : `${coldest?.label || '-'} 目前校準落差最大：實際命中比平均信心 ${signedPct(coldest?.gap)}；${warmest?.label || '-'} 是 ${signedPct(warmest?.gap)}。`
  if (!rows.length) return null
  return <section className="panel calibration-audit" id="calibration">
    <SectionHead kicker={copy.kicker} title={copy.title} meta={`${rows.length} ${copy.settled || 'settled'}`}><small>{copy.note}</small></SectionHead>
    <div className="audit-readout"><div><span>{copy.finding}</span><b>{finding}</b></div><div className="audit-score"><span>{copy.overall}</span><b>{pct(overall.accuracy)}</b><em>{overall.hits}/{overall.count}</em></div></div>
    <div className="audit-layout">
      <div className="calibration-stack"><h3>{copy.bands}</h3>{bandGroups.map((group) => <button type="button" key={group.key} className={`calibration-band ${active?.key === group.key ? 'active' : ''} ${auditTone(group)}`} onClick={() => setActiveKey(group.key)}><span className="audit-band-head"><b>{group.label}</b><em>{group.count} {copy.matches}</em></span><span className="audit-band-stats"><i>{copy.stated} <b>{pct(group.avgConfidence)}</b></i><i>{copy.actual} <b>{pct(group.accuracy)}</b></i><strong>{copy.gap} {signedPct(group.gap)}</strong></span><span className="calibration-bars"><i className="stated" style={{ width: pct(group.avgConfidence) }}/><i className="actual" style={{ width: pct(group.accuracy) }}/></span><span className="audit-band-foot">{copy.exact} {group.exact}/{group.count || 0} · {copy.error} {group.avgGoalError.toFixed(2)}</span></button>)}</div>
      <div className="tag-audit"><h3>{copy.tags}</h3><div className="tag-audit-grid">{tagGroups.map((group) => <button type="button" key={group.key} className={`${active?.key === group.key ? 'active' : ''} ${auditTone(group)}`} onClick={() => setActiveKey(group.key)}><b>{group.label}</b><span>{group.hits}/{group.count} · {copy.actual} {pct(group.accuracy)}</span><em>{copy.stated} {pct(group.avgConfidence)} · {copy.error} {group.avgGoalError.toFixed(2)}</em></button>)}</div></div>
      <div className="audit-sample"><div className="mini-head"><b>{copy.sample}{active ? ` · ${active.label}` : ''}</b><span>{copy.sampleHint}</span></div>{sample.length ? <div className="audit-match-list">{sample.map((row) => <button type="button" key={row.match.id} className={row.hit ? 'hit' : 'miss'} onClick={() => onSelect(row.match.id)}><strong>{row.hit ? copy.hit : copy.miss}</strong><b><InlineTeam name={row.match.team1}/> vs <InlineTeam name={row.match.team2}/></b><span>{copy.predicted} {pickLabel(row.p.pick, lang)} · {copy.actualResult} {pickLabel(row.actual, lang)}</span><em>{pct(row.confidence)} · {scoreLabel(row.match)} · {copy.error} {row.goalError}</em></button>)}</div> : <p>{copy.empty}</p>}</div>
    </div>
  </section>
}
function resolveActualBracketTeam(token, matchByNumber, depth = 0) {
  if (!token || depth > 6) return token || '待定'
  const m = String(token).match(/^W(\d+)$/)
  if (!m) return token
  const source = matchByNumber[m[1].padStart(3, '0')]
  if (!source) return token
  if (source.status === 'finished') return resolveActualBracketTeam(actualPick(source), matchByNumber, depth + 1)
  const left = resolveActualBracketTeam(source.team1, matchByNumber, depth + 1)
  const right = resolveActualBracketTeam(source.team2, matchByNumber, depth + 1)
  return `${left} / ${right}`
}
function actualLoser(match) {
  const winner = actualPick(match)
  if (winner === match?.team1) return match.team2
  if (winner === match?.team2) return match.team1
  return null
}
function resolveBracketRouteTeam(token, matchByNumber, depth = 0) {
  if (!token || depth > 8) return token || '待定'
  const route = String(token).match(/^([WL])(\d+)$/)
  if (!route) return token
  const source = matchByNumber[route[2].padStart(3, '0')]
  if (!source) return token
  if (source.status === 'finished') {
    const resolved = route[1] === 'W' ? actualPick(source) : actualLoser(source)
    return resolved ? resolveBracketRouteTeam(resolved, matchByNumber, depth + 1) : token
  }
  const left = resolveBracketRouteTeam(source.team1, matchByNumber, depth + 1)
  const right = resolveBracketRouteTeam(source.team2, matchByNumber, depth + 1)
  return `${left} / ${right}`
}
const radarPoint = (value, index, total, radius = 88) => {
  const angle = -Math.PI / 2 + (index / total) * Math.PI * 2
  return [Math.cos(angle) * radius * value, Math.sin(angle) * radius * value]
}
function KnockoutUpsetRadar({ matches, predictions, paperBetsByMatch, intelByMatch, onSelect, lang }) {
  const copy = lang === 'en'
    ? {
        kicker: 'KNOCKOUT UPSET RADAR', title: 'Where the favorite can still bleed.',
        note: 'Danger corridor = underdog 90-minute win probability + draw/extra-time drag from Soren probabilities. Route-only slots stay labeled until feeder matches finish.',
        tracked: 'knockout slots', formula: 'danger corridor', routeOnly: 'route-only slot', open: 'Open match',
        favorite: 'Favorite', underdog: 'Upset side', draw: 'Draw drag', xg: 'Expected goals', intel: 'source cards', paper: 'Paper signal',
        noPaper: 'sit out', pending: 'No team-specific upset call yet; this route depends on unresolved feeders.',
        axes: { underdog: 'Underdog win', draw: 'Draw drag', narrow: 'Narrow gap', lowGoal: 'Low-score volatility', intel: 'Intel heat' },
      }
    : {
        kicker: 'KNOCKOUT UPSET RADAR', title: '熱門會在哪裡流血。',
        note: '危險走廊 = 弱隊 90 分鐘勝率 + 平局/加時拖拽機率，全部來自 Soren 既有機率；路線位會明確標成未實名，不裝隊名預言。',
        tracked: '個淘汰賽槽位', formula: '危險走廊', routeOnly: '路線未落地', open: '打開這場',
        favorite: '熱門邊', underdog: '爆冷邊', draw: '平局拖拽', xg: '預期進球', intel: '來源卡', paper: '紙上訊號',
        noPaper: '坐旁邊', pending: '這格還沒有實名對戰；等上游比賽完場後才做隊伍級爆冷判斷。',
        axes: { underdog: '弱隊勝率', draw: '平局拖拽', narrow: '差距接近', lowGoal: '低比分亂流', intel: '情報熱度' },
      }
  const items = useMemo(() => {
    const matchByNumber = Object.fromEntries(matches.map((m) => [m.id.replace('m', ''), m]))
    return matches
      .filter((m) => !m.group && m.status === 'scheduled')
      .map((match) => {
        const prediction = predictions[match.id]
        const p = prediction?.probabilities || {}
        const home = clamp01(p.home)
        const draw = clamp01(p.draw)
        const away = clamp01(p.away)
        const routeOnly = isRouteToken(match.team1) || isRouteToken(match.team2) || prediction?.pick === '待定'
        const favoriteIsHome = home >= away
        const favorite = favoriteIsHome ? match.team1 : match.team2
        const underdog = favoriteIsHome ? match.team2 : match.team1
        const favoriteProb = favoriteIsHome ? home : away
        const underdogProb = favoriteIsHome ? away : home
        const expectedGoals = prediction?.expectedGoals || []
        const totalXg = expectedGoals.reduce((sum, n) => sum + (Number(n) || 0), 0)
        const lowGoalVolatility = totalXg ? clamp01((3.15 - totalXg) / 1.65) : 0
        const intel = intelByMatch[match.id]
        const sourceCount = intel?.sources?.length || 0
        const paper = paperBetsByMatch[match.id]
        const danger = routeOnly ? null : clamp01(underdogProb + draw)
        const axes = [
          { key: 'underdog', label: copy.axes.underdog, value: underdogProb },
          { key: 'draw', label: copy.axes.draw, value: draw },
          { key: 'narrow', label: copy.axes.narrow, value: clamp01(1 - Math.max(0, favoriteProb - underdogProb)) },
          { key: 'lowGoal', label: copy.axes.lowGoal, value: lowGoalVolatility },
          { key: 'intel', label: copy.axes.intel, value: clamp01(sourceCount / 12) },
        ]
        return {
          id: match.id,
          match,
          prediction,
          routeOnly,
          displayTeam1: resolveBracketRouteTeam(match.team1, matchByNumber),
          displayTeam2: resolveBracketRouteTeam(match.team2, matchByNumber),
          favorite,
          underdog,
          favoriteProb,
          underdogProb,
          draw,
          totalXg,
          sourceCount,
          paper,
          danger,
          axes,
        }
      })
      .sort((a, b) => (b.danger ?? -1) - (a.danger ?? -1) || new Date(a.match.kickoffUtc) - new Date(b.match.kickoffUtc))
  }, [matches, predictions, paperBetsByMatch, intelByMatch, copy.axes])
  const [activeId, setActiveId] = useState('')
  useEffect(() => {
    if (items.length && !items.some((item) => item.id === activeId)) setActiveId(items[0].id)
  }, [items, activeId])
  if (!items.length) return null
  const active = items.find((item) => item.id === activeId) || items[0]
  const polygon = active.axes.map((axis, index) => radarPoint(axis.value, index, active.axes.length).join(',')).join(' ')
  const paperText = active.paper?.stake ? money(active.paper.stake) : active.paper?.edge != null ? signedPct(active.paper.edge) : copy.noPaper
  const narrativeText = active.routeOnly
    ? copy.pending
    : lang === 'en'
      ? `${active.underdog} carries a ${pct(active.underdogProb)} 90-minute upset lane, while the draw lane adds ${pct(active.draw)} of knockout drag.`
      : `${active.underdog} 的 90 分鐘偷走窗口是 ${pct(active.underdogProb)}，再加上 ${pct(active.draw)} 的平局拖拽，熱門不能把這格當保送。`
  return <section className="panel upset-radar" id="upset-radar">
    <SectionHead kicker={copy.kicker} title={copy.title} meta={`${items.length} ${copy.tracked}`}><small>{copy.note}</small></SectionHead>
    <div className="upset-layout">
      <div className="upset-board">
        <div className="radar-graphic">
          <svg viewBox="-126 -126 252 252" role="img" aria-label={copy.title}>
            {[0.25, 0.5, 0.75, 1].map((ring) => <polygon key={ring} className="radar-ring" points={active.axes.map((_, index) => radarPoint(ring, index, active.axes.length).join(',')).join(' ')} />)}
            {active.axes.map((axis, index) => {
              const [x, y] = radarPoint(1, index, active.axes.length, 97)
              const [lx, ly] = radarPoint(1, index, active.axes.length, 116)
              return <g key={axis.key}><line className="radar-axis" x1="0" y1="0" x2={x} y2={y}/><text x={lx} y={ly} textAnchor={lx > 8 ? 'start' : lx < -8 ? 'end' : 'middle'} dominantBaseline="middle">{axis.label}</text></g>
            })}
            <polygon className="radar-fill" points={polygon}/>
            <polygon className="radar-stroke" points={polygon}/>
          </svg>
          <div className="radar-core"><span>{copy.formula}</span><b>{active.danger == null ? '—' : pct(active.danger)}</b><em>{dangerBand(active.danger, lang)}</em></div>
        </div>
        <div className="upset-story">
          <span>{stageLabel(active.match.stage, lang)} · {fmtDate(active.match.kickoffUtc, lang)}</span>
          <h3><InlineTeam name={active.displayTeam1}/> vs <InlineTeam name={active.displayTeam2}/></h3>
          <p>{narrativeText}</p>
          <div className="upset-facts">
            <b>{copy.favorite}<em>{active.routeOnly ? copy.routeOnly : `${active.favorite} ${pct(active.favoriteProb)}`}</em></b>
            <b>{copy.underdog}<em>{active.routeOnly ? copy.routeOnly : `${active.underdog} ${pct(active.underdogProb)}`}</em></b>
            <b>{copy.draw}<em>{pct(active.draw)}</em></b>
            <b>{copy.xg}<em>{active.totalXg ? active.totalXg.toFixed(2) : '—'}</em></b>
            <b>{copy.intel}<em>{active.sourceCount}</em></b>
            <b>{copy.paper}<em>{paperText}</em></b>
          </div>
          <button type="button" onClick={() => onSelect(active.match.id)}>{copy.open}</button>
        </div>
      </div>
      <div className="upset-list">{items.map((item) => <button type="button" key={item.id} className={item.id === active.id ? 'active' : ''} onClick={() => setActiveId(item.id)}><span>{item.danger == null ? copy.routeOnly : pct(item.danger)}</span><b><InlineTeam name={item.displayTeam1}/> vs <InlineTeam name={item.displayTeam2}/></b><em>{dangerBand(item.danger, lang)} · {fmtDay(item.match.kickoffUtc, lang)}</em></button>)}</div>
    </div>
  </section>
}
function BracketSnapshot({ matches, onSelect, lang, t }) {
  const knockouts = matches.filter((m) => !m.group)
  if (!knockouts.length) return null
  const matchByNumber = Object.fromEntries(matches.map((m) => [m.id.replace('m', ''), m]))
  const roundLabels = lang === 'en' ? { 'Round of 32':'Round of 32', 'Round of 16':'Round of 16', 'Quarter-final':'Quarter-final', 'Semi-final':'Semi-final', Final:'FINAL' } : { 'Round of 32':'32 強', 'Round of 16':'16 強', 'Quarter-final':'8 強', 'Semi-final':'4 強', Final:'FINAL' }
  const rounds = Object.entries(roundLabels).map(([round, label]) => ({ label, items: knockouts.filter((m) => m.round === round).map((m) => { const team1 = resolveActualBracketTeam(m.team1, matchByNumber); const team2 = resolveActualBracketTeam(m.team2, matchByNumber); const winner = m.status === 'finished' ? actualPick(m) : null; return { ...m, bracketTeam1: team1, bracketTeam2: team2, bracketWinner: winner ? resolveActualBracketTeam(winner, matchByNumber) : null } }) })).filter((r) => r.items.length)
  const finalMatch = rounds.find((r) => r.label === 'FINAL')?.items?.[0]
  const champion = finalMatch?.bracketWinner || '未定'
  const completedKnockouts = knockouts.filter((m) => m.status === 'finished').length
  return <section className="panel bracket-panel" id="bracket"><SectionHead kicker="TOURNAMENT BRACKET" title={t.bracketTitle} meta={`${t.knockoutsDone} ${completedKnockouts}/${knockouts.length}`}><small>{t.bracketNote}</small></SectionHead><div className="bracket-stage progress-bracket">{rounds.map((round) => <div className="bracket-round" key={round.label}><h3>{round.label}</h3><div className="bracket-matches">{round.items.slice(0, round.label === '32 強' || round.label === 'Round of 32' ? 16 : 8).map((m) => <button type="button" key={m.id} className={`bracket-match ${m.status === 'finished' ? 'finished' : 'scheduled'} ${m.bracketWinner === m.bracketTeam1 ? 'top-win' : m.bracketWinner === m.bracketTeam2 ? 'bottom-win' : ''}`} onClick={() => onSelect(m.id)}><span className="bracket-team"><b><FlagIcon name={m.bracketTeam1}/></b><em>{m.bracketTeam1}</em></span><span className="bracket-team"><b><FlagIcon name={m.bracketTeam2}/></b><em>{m.bracketTeam2}</em></span><strong>{m.status === 'finished' ? <><span>{scoreLabel(m)} · </span><InlineTeam name={m.bracketWinner}/><span> {t.advanced}</span></> : fmtDay(m.kickoffUtc, lang)}</strong></button>)}</div></div>)}<div className="bracket-trophy"><span>{champion === '未定' ? '🏟️' : '🏆'}</span><b>{champion === '未定' && lang === 'en' ? 'TBD' : champion}</b><small>{champion === '未定' ? t.championTbd : t.champion}</small></div></div></section>
}
function Leaderboard({ rows, t, lang }) { return <section className="panel slim" id="model"><SectionHead kicker="MODEL FORM" title={t.leaderboardTitle} meta={t.publicLedger}/><div className="leader-list">{rows.map((row) => <div className="leader" key={row.id}><div className="rank">#{row.rank}</div><div><b>{row.name}</b><p>{leaderDesc(row, lang)}</p></div><div className="leader-score"><b>{row.points}</b><span>{pct(row.accuracy)} hit</span></div></div>)}</div><p className="self-own">{t.selfOwn}</p></section> }
function StandingsPreview({ standings, nextMatches, lang, t }) { const groups = Array.from(new Set(nextMatches.map((m) => m.group).filter(Boolean))).slice(0, 4); const entries = groups.length ? groups.map((g) => [g, standings[g]]).filter(([, rows]) => rows) : Object.entries(standings || {}).slice(0, 4); return <section className="panel" id="standings"><SectionHead kicker="GROUP SURVIVAL MAP" title={t.standingsTitle} meta={`${entries.length} groups`} /><div className="tables compact-tables">{entries.map(([name, rows]) => <div className="table-card" key={name}><h3>{lang === 'en' ? name : name.replace('Group ', '小組 ')}</h3><table><thead><tr><th>{lang === 'en' ? 'Team' : '隊伍'}</th><th>{lang === 'en' ? 'P' : '賽'}</th><th>{lang === 'en' ? 'GD' : '淨'}</th><th>{lang === 'en' ? 'Pts' : '分'}</th></tr></thead><tbody>{rows.map((r, idx) => <tr key={r.team} className={idx < 2 ? 'qualified' : ''}><td><InlineTeam name={r.team}/></td><td>{r.played}</td><td>{r.goalDiff}</td><td><b>{r.points}</b></td></tr>)}</tbody></table></div>)}</div></section> }
function FixtureExplorer({ matches, predictions, onSelect, lang, t, nowMs }) { const [showAll, setShowAll] = useState(false); const list = showAll ? matches : matches.filter((m) => m.status !== 'finished').slice(0, 12); return <section className="panel" id="fixtures"><SectionHead kicker="FIXTURE EXPLORER" title={t.fixturesTitle} meta={showAll ? t.all : t.recentOnly} /><div className="fixture-list">{list.map((m) => <button type="button" key={m.id} onClick={() => onSelect(m.id)}><span>{fmtDate(m.kickoffUtc, lang)}</span><b><InlineTeam name={m.team1}/> vs <InlineTeam name={m.team2}/></b><em>{runtimeLifecycle(m, nowMs) === 'final' ? scoreLabel(m) : runtimeLifecycle(m, nowMs) === 'pre-match' ? pickLabel(predictions[m.id]?.pick, lang) : lifecycleText(m, lang, nowMs)}</em></button>)}</div><button className="show-more" type="button" onClick={() => setShowAll(!showAll)}>{showAll ? t.hideAll : t.showAll}</button></section> }
function TacticalBoard({ match, prediction, intel, lang }) { const favorite = prediction.probabilities.home >= prediction.probabilities.away ? match.team1 : match.team2; const underdog = favorite === match.team1 ? match.team2 : match.team1; const lanes = [{ top:'18%', left:'18%', label:`${flag(favorite)} ${lang === 'en' ? 'press high' : '高位壓迫'}`, note: lang === 'en' ? 'first 30 minutes decide tempo' : '前 30 分鐘搶節奏' }, { top:'48%', left:'50%', label: lang === 'en' ? 'Midfield fault line' : '中場斷點', note: lang === 'en' ? 'first turnover hurts' : '誰先掉球誰先挨打' }, { top:'72%', left:'78%', label:`${flag(underdog)} ${lang === 'en' ? 'counter outlet' : '反擊出口'}`, note: lang === 'en' ? 'upsets start here' : '爆冷通常從這裡長出來' }]; return <section className="tactical-board"><div className="pitch"><div className="half-line"/><div className="center-circle"/>{lanes.map((lane) => <div className="position-node" key={lane.label} style={{ top: lane.top, left: lane.left }}><b>{lane.label}</b><span>{lane.note}</span></div>)}</div><div className="tactical-notes"><b>{lang === 'en' ? 'Tactical note' : '站位 / 對位筆記'}</b><p>{intel ? (lang === 'en' ? 'Verified availability, rotation and tactical signals are folded into this card when sources are clean.' : '我會把確認過的傷停、預測先發、輪換與戰術線索放進這裡；沒有來源就不裝懂。') : (lang === 'en' ? 'No clean source-backed tactical card yet; this is the model map until scouting improves it.' : '目前先用模型對位圖，等 scout 抓到可信先發/站位來源後再補細節。')}</p><small>{lang === 'en' ? 'Source-backed only: expected XI, official lineups and tactical previews.' : '不是幻想陣型：之後只接有來源的 expected XI、官方先發與戰術 preview。'}</small></div></section> }
function MatchDeepDive({ match, prediction, paperBet, intel, onClose, lang, t, nowMs }) {
  if (!match || !prediction) return null
  const p = prediction.probabilities
  const upset = p.home < p.away ? match.team1 : match.team2
  const favorite = p.home >= p.away ? match.team1 : match.team2
  const actual = actualPick(match)
  const predictionHit = actual && (prediction.pick === actual || (prediction.pick === '平手' && actual === '平手'))
  const postmortem = match.status === 'finished' ? (predictionHit ? (lang === 'en' ? `Direction was right: Soren picked ${pickLabel(prediction.pick, lang)} and the actual result matched. Next check: score error and whether the win was signal or variance.` : `這場方向有抓到：我站 ${prediction.pick}，實際也是 ${actual}。下一步要檢查的是比分誤差與是不是被偶發事件灌水。`) : (lang === 'en' ? `Missed call: Soren picked ${pickLabel(prediction.pick, lang)}, actual was ${pickLabel(actual, lang)}. The review focuses on overrated priors, draw risk or upset paths.` : `這場被賽果打臉：我站 ${prediction.pick}，實際是 ${actual}。復盤重點放在我高估哪一邊、低估平局/爆冷路線，不能裝沒事。`)) : (lang === 'en' ? 'Match is not final yet; post-match review will compare pick, score, intel and paper P&L.' : '比賽還沒踢完；這裡會在賽後補上預測 vs 實際、紙上損益與錯因。')
  return <div className="modal-backdrop" onClick={onClose}><article className="deep-modal" onClick={(e) => e.stopPropagation()}><button className="modal-close" type="button" onClick={onClose}>×</button><p className="modal-kicker">{t.modalKicker}</p><h2>{match.team1} vs {match.team2}</h2><div className="modal-scoreline"><Team name={match.team1}/><div className={`score-pill big ${runtimeLifecycle(match, nowMs) === 'pre-match' || runtimeLifecycle(match, nowMs) === 'final' ? '' : 'guarded-score'}`}>{scoreDisplay(match, prediction, lang, nowMs)}<small>{scoreSubLabel(match, lang, { ...t, predict: t.predictedScore }, nowMs)}</small></div><Team name={match.team2}/></div><div className="soren-roast"><b>{t.roast}</b>{narrative(match, prediction, lang)} {narrativeStory(match, prediction, lang)}</div><TacticalBoard match={match} prediction={prediction} intel={intel} lang={lang}/><div className="deep-grid"><div><b>{t.balance}</b><p>{match.team1} {pct(p.home)} · {lang === 'en' ? 'Draw' : '平'} {pct(p.draw)} · {match.team2} {pct(p.away)}</p></div><div><b>{t.upsetPath}</b><p>{lang === 'en' ? `${upset} must survive the opening pressure from ${favorite} and keep the match within one moment.` : `${upset} 要活下來，第一任務不是踢漂亮，是把 ${favorite} 的前 30 分鐘熬過去。`}</p></div><div><b>{t.infoImpact}</b><p>{intel ? intel.sorenTake : (lang === 'en' ? 'No sufficiently clean source-backed intel yet; better empty than invented.' : '這場暫時沒有足夠乾淨的情報；我寧可空著，也不亂編社群情緒。')}</p></div><div><b>{t.paperBattle}</b><p>{paperBet ? (lang === 'en' ? `Paper market: ${marketLabel(paperBet.marketReference, lang) || '1X2 proxy'}. Locked: ${paperBet.lockedAtUtc ? fmtDate(paperBet.lockedAtUtc, lang) : 'pre-match'}; pick ${pickLabel(paperBet.pick, lang)}, stake ${money(paperBet.stake)}, odds ${paperBet.decimalOdds}. ${paperBet.profit !== undefined ? `Settlement: ${resultText(paperBet, lang)}.` : ''}` : `紙上盤：${paperBet.marketReference || '主流 1X2 賽前盤'}。鎖單：${paperBet.lockedAtUtc ? fmtDate(paperBet.lockedAtUtc, lang) : '開賽前'}；押 ${paperBet.pick}，投入 ${money(paperBet.stake)}，模擬賠率 ${paperBet.decimalOdds}。${paperBet.profit !== undefined ? `結算：${resultText(paperBet, lang)}。` : ''}`) : (lang === 'en' ? 'No paper stake here; no edge means sit out.' : '這場我先不丟紙上籌碼；沒邊際就坐旁邊喝水。')}</p></div></div><section className="match-postmortem"><b>{t.postmortem}</b><p>{postmortem}</p>{match.status === 'finished' && <div className="compare-grid"><span>{lang === 'en' ? 'Prediction' : '預測'}：{pickLabel(prediction.pick, lang)} / {prediction.score}</span><span>{lang === 'en' ? 'Actual' : '實際'}：{pickLabel(actual, lang)} / {scoreLabel(match)}</span><span>{t.paper}：{paperBet ? resultText(paperBet, lang) : (lang === 'en' ? 'no bet' : '未下注')}</span></div>}</section><ul className="reasons modal-reasons">{reasonList(match, prediction, lang).map((r) => <li key={r}>{r}</li>)}</ul>{intel && <details className="source-drawer modal-sources"><summary>{t.modalSources}</summary><ul>{intel.signals.map((s) => <li key={s}>{s}</li>)}</ul><div>{intel.sources.map((src) => <a key={src.url} href={src.url} target="_blank" rel="noreferrer">{src.label}</a>)}</div></details>}<p className="modal-disclaimer">{t.disclaimer}</p></article></div>
}
function App() {
  const [data, setData] = useState(null)
  const [error, setError] = useState('')
  const [selectedId, setSelectedId] = useState(null)
  const [intel, setIntel] = useState(null)
  const [lang, setLang] = useState(() => localStorage.getItem('soren-lang') || 'zh')
  const t = I18N[lang]
  const switchLang = () => setLang((prev) => { const next = prev === 'zh' ? 'en' : 'zh'; localStorage.setItem('soren-lang', next); return next })
  useEffect(() => {
    fetch(`${import.meta.env.BASE_URL}data/worldcup.json`, { cache:'no-store' }).then((res) => { if (!res.ok) throw new Error(`HTTP ${res.status}`); return res.json() }).then(setData).catch((err) => setError(err.message))
    fetch(`${import.meta.env.BASE_URL}data/soren-intel.json`, { cache:'no-store' }).then((res) => res.ok ? res.json() : null).then(setIntel).catch(() => setIntel(null))
  }, [])
  const nextMatches = useMemo(() => data ? data.summary.nextWindow.map((id) => data.matches.find((m) => m.id === id)).filter(Boolean) : [], [data])
  const paperBetsByMatch = useMemo(() => data?.paperBankroll ? Object.fromEntries([...(data.paperBankroll.pending || []), ...(data.paperBankroll.settled || []), ...(data.paperBankroll.watchlist || [])].map((b) => [b.matchId, b])) : {}, [data])
  const intelByMatch = useMemo(() => intel?.items ? Object.fromEntries(intel.items.map((item) => [item.matchId, item])) : {}, [intel])
  const selectedMatch = selectedId && data ? data.matches.find((m) => m.id === selectedId) : null
  const nowMs = Date.now()
  if (error) return <main className="shell"><div className="panel"><h1>{t.loadFail}</h1><p>{error}</p></div></main>
  if (!data) return <main className="shell"><div className="loading">{t.loading}</div></main>
  return <main className="shell" lang={lang === 'en' ? 'en' : 'zh-Hant'}>
    <nav className="top-nav"><b>Soren World Cup Lab</b><div><a href="#today">{t.navToday}</a><a href="#soren-intel">{t.navIntel}</a><a href="#upset-radar">{t.navRadar}</a><a href="#predictions">{t.navPred}</a><a href="#bracket">{t.navBracket}</a><a href="#paper-bankroll">{t.navBankroll}</a><a href="#review">{t.navReview}</a><a href="#fixtures">{t.navFixtures}</a><button className="lang-toggle" type="button" onClick={switchLang}>{t.lang}</button></div></nav>
    <section className="hero-section"><div className="hero-copy"><span className="eyebrow">{t.heroKicker}</span><h1>{t.heroTitle}</h1><p>{t.heroBody}</p><div className="hero-actions"><a href="https://stair-ai.com/arena" target="_blank" rel="noreferrer">Stair AI Arena</a><a href="https://github.com/livejiaquan/worldcup-soren-predictor" target="_blank" rel="noreferrer">GitHub</a></div></div><div className="hero-card agent-profile"><span className="agent-label">PUBLIC AGENT PROFILE</span><b>{data.summary.finishedMatches}/{data.summary.totalMatches}</b><span>{t.finished}</span><b>{data.summary.scheduledMatches}</b><span>{t.pending}</span><small>{t.lastUpdate}：{fmtDate(data.generatedAt, lang)} · {t.intelCards} {intel?.items?.length || 0}</small></div></section>
    <div className="notice">{t.notice}</div>
    <DataQualityBadge data={data} lang={lang} nowMs={nowMs}/>
    <KineticArena data={data} nextMatches={nextMatches} predictions={data.predictions} intelByMatch={intelByMatch} onSelect={setSelectedId} lang={lang} t={t} nowMs={nowMs}/>
    <CommandCenter data={data} nextMatches={nextMatches} predictions={data.predictions} bankroll={data.paperBankroll} lang={lang} t={t} nowMs={nowMs}/>
    <KnockoutUpsetRadar matches={data.matches} predictions={data.predictions} paperBetsByMatch={paperBetsByMatch} intelByMatch={intelByMatch} onSelect={setSelectedId} lang={lang}/>

    <LearningLoop data={data} onSelect={setSelectedId} lang={lang} t={t}/>
    <CalibrationAudit data={data} onSelect={setSelectedId} lang={lang}/>
    <TodaySlate matches={nextMatches} predictions={data.predictions} paperBetsByMatch={paperBetsByMatch} intelByMatch={intelByMatch} onSelect={setSelectedId} lang={lang} t={t} nowMs={nowMs}/>
    <BracketSnapshot matches={data.matches} predictions={data.predictions} onSelect={setSelectedId} lang={lang} t={t}/>
    <IntelBrief intel={intel} matches={data.matches} onSelect={setSelectedId} lang={lang} t={t}/>
    <PaperBankroll bankroll={data.paperBankroll} onSelect={setSelectedId} lang={lang} t={t}/>
    <Leaderboard rows={data.leaderboard} t={t} lang={lang}/>
    <StandingsPreview standings={data.standings} nextMatches={nextMatches} lang={lang} t={t}/>
    <FixtureExplorer matches={data.matches} predictions={data.predictions} onSelect={setSelectedId} lang={lang} t={t} nowMs={nowMs}/>
    {selectedMatch && <MatchDeepDive match={selectedMatch} prediction={data.predictions[selectedMatch.id]} paperBet={paperBetsByMatch[selectedMatch.id]} intel={intelByMatch[selectedMatch.id]} onClose={() => setSelectedId(null)} lang={lang} t={t} nowMs={nowMs}/>}<footer>{t.footer}</footer>
  </main>
}
export default App
