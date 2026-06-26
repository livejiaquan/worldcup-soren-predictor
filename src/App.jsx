import { useEffect, useMemo, useState } from 'react'
import './App.css'

const FLAG = { Argentina:'🇦🇷', France:'🇫🇷', Spain:'🇪🇸', England:'🏴', Brazil:'🇧🇷', Portugal:'🇵🇹', Netherlands:'🇳🇱', Belgium:'🇧🇪', Germany:'🇩🇪', Croatia:'🇭🇷', Uruguay:'🇺🇾', Morocco:'🇲🇦', USA:'🇺🇸', Mexico:'🇲🇽', Switzerland:'🇨🇭', Colombia:'🇨🇴', Japan:'🇯🇵', Senegal:'🇸🇳', Austria:'🇦🇹', Sweden:'🇸🇪', Turkey:'🇹🇷', Ecuador:'🇪🇨', Iran:'🇮🇷', Australia:'🇦🇺', Scotland:'🏴', 'South Korea':'🇰🇷', Norway:'🇳🇴', Ghana:'🇬🇭', 'Ivory Coast':'🇨🇮', Algeria:'🇩🇿', Qatar:'🇶🇦', Tunisia:'🇹🇳', Egypt:'🇪🇬', Paraguay:'🇵🇾', 'South Africa':'🇿🇦', 'Saudi Arabia':'🇸🇦', 'Czech Republic':'🇨🇿', Canada:'🇨🇦', Panama:'🇵🇦', Uzbekistan:'🇺🇿', Jordan:'🇯🇴', Iraq:'🇮🇶', Haiti:'🇭🇹', 'New Zealand':'🇳🇿', 'Bosnia & Herzegovina':'🇧🇦', Curaçao:'🇨🇼', 'Democratic Republic of the Congo':'🇨🇩', 'Cape Verde':'🇨🇻' }
const fmt = (iso, opts) => iso ? new Intl.DateTimeFormat('zh-TW', { timeZone: 'Asia/Taipei', ...opts }).format(new Date(iso)) : '時間待定'
const fmtDate = (iso) => fmt(iso, { month:'numeric', day:'numeric', weekday:'short', hour:'2-digit', minute:'2-digit', hour12:false })
const fmtDay = (iso) => fmt(iso, { month:'numeric', day:'numeric', weekday:'long' })
const pct = (v) => `${Math.round((v || 0) * 100)}%`
const money = (v) => `$${Number(v || 0).toFixed(2)}`
const signedMoney = (v) => `${Number(v || 0) >= 0 ? '+' : ''}${money(v)}`
const flag = (team) => FLAG[team] || '⚽'

function Team({ name }) { return <div className="team"><span className="flag">{flag(name)}</span><span>{name}</span></div> }
function ProbBar({ prediction }) { const p = prediction.probabilities; return <div className="prob-bar"><span style={{ width:pct(p.home) }} className="home"/><span style={{ width:pct(p.draw) }} className="draw"/><span style={{ width:pct(p.away) }} className="away"/></div> }
function PredictionCard({ match, prediction, compact = false, onSelect }) {
  const finished = match.status === 'finished'
  return <article className={`match-card ${finished ? 'finished' : ''} ${compact ? 'compact' : ''}`}>
    <div className="match-meta"><span>{match.stage}</span><span>{finished ? '已完賽' : fmtDate(match.kickoffUtc)}</span></div>
    <div className="versus"><Team name={match.team1}/><div className="score-box">{finished ? `${match.score[0]}-${match.score[1]}` : prediction.score}<small>{finished ? 'FT' : '預測比分'}</small></div><Team name={match.team2}/></div>
    <ProbBar prediction={prediction}/>
    <div className="pick-row"><b>Soren 站隊：{prediction.pick}</b><span>{prediction.tag || '模型判讀'} · 信心 {pct(prediction.confidence)}</span></div>
    {!compact && prediction.commentary && <div className="analysis-box"><b>{prediction.commentary.headline}</b><p>{prediction.commentary.story}</p><div className="factor-row">{prediction.commentary.keyFactors.map((f) => <span key={f.label}><strong>{f.label}</strong>{f.value}<small>{f.note}</small></span>)}</div></div>}
    {!compact && <ul className="reasons">{prediction.reasons.slice(0, 3).map((r) => <li key={r}>{r}</li>)}</ul>}
    <div className="venue">📍 {match.venue}</div>
    {!compact && <button className="deep-dive" type="button" onClick={() => onSelect?.(match)}>展開 Soren 賽前驗屍報告</button>}
  </article>
}
function MatchDeepDive({ match, prediction, paperBet, onClose }) {
  if (!match || !prediction) return null
  const p = prediction.probabilities
  const upset = p.home < p.away ? match.team1 : match.team2
  const favorite = p.home >= p.away ? match.team1 : match.team2
  return <div className="modal-backdrop" onClick={onClose}>
    <article className="deep-modal" onClick={(e) => e.stopPropagation()}>
      <button className="modal-close" type="button" onClick={onClose}>×</button>
      <p className="modal-kicker">SOREN MATCH AUTOPSY</p>
      <h2>{match.team1} vs {match.team2}</h2>
      <div className="modal-scoreline"><Team name={match.team1}/><div className="score-box">{prediction.score}<small>我先押這個比分</small></div><Team name={match.team2}/></div>
      <div className="soren-roast"><b>銳評：</b>{prediction.commentary?.headline || `我看好 ${prediction.pick}，但這場還沒資格說穩。`} {prediction.commentary?.story}</div>
      <div className="deep-grid">
        <div><b>這場天秤怎麼歪</b><p>{match.team1} {pct(p.home)} · 平 {pct(p.draw)} · {match.team2} {pct(p.away)}</p></div>
        <div><b>弱隊偷雞路線</b><p>{upset} 要活下來，第一任務不是踢漂亮，是把 {favorite} 的前 30 分鐘壓制期熬過去；只要先進球，這場就會從模型題變成心理題。</p></div>
        <div><b>最怕哪種劇本翻車</b><p>早早紅黃牌、臨場輪換、定位球失守。這些不是模型會自動知道的神諭，所以賽前情報 scout 會繼續補。</p></div>
        <div><b>100 美金紙上戰局</b><p>{paperBet ? `我已經把紙上籌碼丟進去了：${paperBet.pick}，投入 ${money(paperBet.stake)}，模擬賠率 ${paperBet.decimalOdds}。` : '這場我先不丟紙上籌碼；不是每場都要硬裝懂，沒邊際就坐旁邊喝水。'}</p></div>
      </div>
      <ul className="reasons modal-reasons">{prediction.reasons.map((r) => <li key={r}>{r}</li>)}</ul>
      <p className="modal-disclaimer">公開研究與娛樂展示，不是投注建議。我會贏、會翻車、也會被賽果打臉；重點是每一筆都要留下理由。</p>
    </article>
  </div>
}

function Leaderboard({ rows }) { return <section className="panel leaderboard"><div className="section-head"><p>SCOREBOARD OF SHAME</p><h2>模型記分板：誰在裸泳</h2></div><div className="leader-list">{rows.map((row) => <div className="leader" key={row.id}><div className="rank">#{row.rank}</div><div><b>{row.name}</b><p>{row.desc}</p></div><div className="leader-score"><b>{row.points}</b><span>{pct(row.accuracy)} 命中</span></div></div>)}</div></section> }
function PaperBankroll({ bankroll }) {
  if (!bankroll) return null
  const delta = bankroll.bankroll - bankroll.initialBankroll
  return <section className="panel bankroll" id="paper-bankroll">
    <div className="section-head"><p>PAPER BANKROLL</p><h2>Soren 的 100 美金100 美金紙上戰局</h2><span>{signedMoney(delta)}</span></div>
    <div className="bankroll-grid"><div className="bankroll-main"><b>{money(bankroll.bankroll)}</b><span>目前還活著的紙上本金</span><p>{bankroll.disclaimer}</p><em>我會把輸贏都攤在陽光下：輸了挨打，贏了也先別膨脹，因為足球最愛專治嘴硬。</em></div><div className="bankroll-rules"><b>規則</b><p>{bankroll.rules}</p><p>ROI：{pct(bankroll.roi)} · 未結算部位：{money(bankroll.openStake)}</p></div></div>
    <div className="bet-columns"><div><h3>已經下場的紙上籌碼</h3>{bankroll.pending.length ? bankroll.pending.map((b) => <BetRow key={b.matchId} bet={b}/>) : <p className="muted">暫時按兵不動。沒把握還硬上，那不是勇敢，是手癢。</p>}</div><div><h3>最近被現實教育</h3>{bankroll.settled.length ? bankroll.settled.slice(-5).reverse().map((b) => <BetRow key={b.matchId} bet={b}/>) : <p className="muted">還沒到結算時間，先別急著笑我。</p>}</div></div>
  </section>
}
function BetRow({ bet }) { return <div className={`bet-row ${bet.status}`}><div><b>{bet.team1} vs {bet.team2}</b><p>{fmtDate(bet.kickoffUtc)} · 選擇 {bet.pick} · 模擬賠率 {bet.decimalOdds}</p></div><div><b>{money(bet.stake)}</b><span>{bet.profit == null ? '待結算' : `${bet.profit >= 0 ? '+' : ''}${money(bet.profit)}`}</span></div></div> }
function Standings({ standings }) { return <section className="panel standings" id="standings"><div className="section-head"><p>GROUP SURVIVAL MAP</p><h2>小組小組戰況</h2></div><div className="tables">{Object.entries(standings || {}).map(([name, rows]) => <div className="table-card" key={name}><h3>{name.replace('Group ', '小組 ')}</h3><table><thead><tr><th>隊伍</th><th>賽</th><th>淨</th><th>分</th></tr></thead><tbody>{rows.map((r, idx) => <tr key={r.team} className={idx < 2 ? 'qualified' : ''}><td>{flag(r.team)} {r.team}</td><td>{r.played}</td><td>{r.goalDiff}</td><td><b>{r.points}</b></td></tr>)}</tbody></table></div>)}</div></section> }

function App() {
  const [data, setData] = useState(null)
  const [error, setError] = useState('')
  const [filter, setFilter] = useState('全部')
  const [selectedId, setSelectedId] = useState(null)
  useEffect(() => { fetch(`${import.meta.env.BASE_URL}data/worldcup.json`, { cache:'no-store' }).then((res) => { if (!res.ok) throw new Error(`HTTP ${res.status}`); return res.json() }).then(setData).catch((err) => setError(err.message)) }, [])
  const nextMatches = useMemo(() => data ? data.summary.nextWindow.map((id) => data.matches.find((m) => m.id === id)).filter(Boolean) : [], [data])
  const stages = useMemo(() => data ? ['全部', ...Array.from(new Set(data.matches.map((m) => m.group ? '小組賽' : m.round || '淘汰賽')))] : ['全部'], [data])
  const paperBetsByMatch = useMemo(() => {
    if (!data?.paperBankroll) return {}
    return Object.fromEntries([...(data.paperBankroll.pending || []), ...(data.paperBankroll.settled || []), ...(data.paperBankroll.watchlist || [])].map((b) => [b.matchId, b]))
  }, [data])
  const selectedMatch = selectedId && data ? data.matches.find((m) => m.id === selectedId) : null
  const grouped = useMemo(() => {
    if (!data) return []
    const filtered = data.matches.filter((m) => filter === '全部' || (filter === '小組賽' ? m.group : (m.round || '淘汰賽') === filter))
    const map = new Map()
    for (const m of filtered) { const key = fmtDay(m.kickoffUtc); if (!map.has(key)) map.set(key, []); map.get(key).push(m) }
    return [...map.entries()]
  }, [data, filter])
  if (error) return <main className="shell"><div className="panel"><h1>資料載入失敗</h1><p>{error}</p></div></main>
  if (!data) return <main className="shell"><div className="loading">Soren 正在翻賽程和模型，不要急，嘴砲也要先載資料…</div></main>
  return <main className="shell">
    <section className="hero-section"><div className="hero-copy"><span className="eyebrow">SOREN WORLD CUP LAB · 2026</span><h1>Soren 世界盃毒舌觀察室</h1><p>我不做那種『強隊比較強』的安全廢話。每場我都會追賽程、看情報、找爆冷路線，賽後再把自己的判斷攤開驗屍。</p><div className="hero-actions"><a href="#predictions">看我站哪邊</a><a href="#paper-bankroll" className="ghost">紙上生存戰</a><a href="#standings" className="ghost">小組戰況</a></div></div><div className="hero-card"><b>{data.summary.finishedMatches}/{data.summary.totalMatches}</b><span>已完賽</span><b>{data.summary.scheduledMatches}</b><span>待預測/追蹤</span><small>最後更新：{fmtDate(data.generatedAt)}</small></div></section>
    <div className="notice">這裡是公開研究與娛樂實驗，不是投注建議。沒有穩贏、沒有神單、沒有保證；誰跟你說穩，他大概比守門員還危險。</div>
    <Leaderboard rows={data.leaderboard}/>
    <PaperBankroll bankroll={data.paperBankroll}/>
    <section className="panel" id="predictions"><div className="section-head"><p>NEXT ON THE CHOPPING BLOCK</p><h2>下一批要被我開刀的比賽</h2><span>{nextMatches.length} 場</span></div><div className="grid featured">{nextMatches.slice(0, 6).map((m) => <PredictionCard key={m.id} match={m} prediction={data.predictions[m.id]} onSelect={(match) => setSelectedId(match.id)}/>)}</div></section>
    <section className="panel method"><div><p>HOW I THINK</p><h2>我不是擲骰子：判斷框架</h2></div><div className="method-grid"><div><b>1. 底牌強度</b><span>先承認現實：有些隊伍就是底子硬。</span></div><div><b>2. 賽會現況</b><span>小組賽踢得好不好，會直接修正我的態度。</span></div><div><b>3. 進球分布</b><span>把強度差轉成預期進球與這場天秤怎麼歪。</span></div><div><b>4. 紙上生存戰</b><span>拿 100 美金假鈔驗證我是不是只會講漂亮話。</span></div></div></section>
    <Standings standings={data.standings}/>
    <section className="panel"><div className="section-head"><p>FULL FIXTURE PIT</p><h2>全部賽程：每場都逃不掉</h2></div><div className="tabs">{stages.map((s) => <button className={filter === s ? 'active' : ''} key={s} onClick={() => setFilter(s)}>{s}</button>)}</div>{grouped.map(([day, matches]) => <div className="day" key={day}><h3>{day}<span>{matches.length} 場</span></h3><div className="grid">{matches.map((m) => <PredictionCard compact key={m.id} match={m} prediction={data.predictions[m.id]}/>)}</div></div>)}</section>
    {selectedMatch && <MatchDeepDive match={selectedMatch} prediction={data.predictions[selectedMatch.id]} paperBet={paperBetsByMatch[selectedMatch.id]} onClose={() => setSelectedId(null)}/>}
    <footer>資料來源：openfootball/worldcup.json · 自動部署於 GitHub Pages · Soren 親自扛鍋</footer>
  </main>
}
export default App
