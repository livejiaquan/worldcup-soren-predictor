import { useEffect, useMemo, useState } from 'react'
import './App.css'

const FLAG = { Argentina:'🇦🇷', France:'🇫🇷', Spain:'🇪🇸', England:'🏴', Brazil:'🇧🇷', Portugal:'🇵🇹', Netherlands:'🇳🇱', Belgium:'🇧🇪', Germany:'🇩🇪', Croatia:'🇭🇷', Uruguay:'🇺🇾', Morocco:'🇲🇦', USA:'🇺🇸', Mexico:'🇲🇽', Switzerland:'🇨🇭', Colombia:'🇨🇴', Japan:'🇯🇵', Senegal:'🇸🇳', Austria:'🇦🇹', Sweden:'🇸🇪', Turkey:'🇹🇷', Ecuador:'🇪🇨', Iran:'🇮🇷', Australia:'🇦🇺', Scotland:'🏴', 'South Korea':'🇰🇷', Norway:'🇳🇴', Ghana:'🇬🇭', 'Ivory Coast':'🇨🇮', Algeria:'🇩🇿', Qatar:'🇶🇦', Tunisia:'🇹🇳', Egypt:'🇪🇬', Paraguay:'🇵🇾', 'South Africa':'🇿🇦', 'Saudi Arabia':'🇸🇦', 'Czech Republic':'🇨🇿', Canada:'🇨🇦', Panama:'🇵🇦', Uzbekistan:'🇺🇿', Jordan:'🇯🇴', Iraq:'🇮🇶', Haiti:'🇭🇹', 'New Zealand':'🇳🇿', 'Bosnia & Herzegovina':'🇧🇦', Curaçao:'🇨🇼', 'Democratic Republic of the Congo':'🇨🇩', 'Cape Verde':'🇨🇻' }
const flag = (team) => FLAG[team] || '⚽'
const fmt = (iso, opts) => iso ? new Intl.DateTimeFormat('zh-TW', { timeZone: 'Asia/Taipei', ...opts }).format(new Date(iso)) : '時間待定'
const fmtDate = (iso) => fmt(iso, { month:'numeric', day:'numeric', weekday:'short', hour:'2-digit', minute:'2-digit', hour12:false })
const fmtDay = (iso) => fmt(iso, { month:'numeric', day:'numeric', weekday:'short' })
const pct = (v) => `${Math.round((v || 0) * 100)}%`
const money = (v) => `$${Number(v || 0).toFixed(2)}`
const signedMoney = (v) => `${Number(v || 0) >= 0 ? '+' : ''}${money(v)}`

function Team({ name }) { return <span className="team-inline"><span>{flag(name)}</span>{name}</span> }
function ProbBar({ prediction }) { const p = prediction.probabilities; return <div className="prob-bar"><span style={{ width:pct(p.home) }}/><span style={{ width:pct(p.draw) }}/><span style={{ width:pct(p.away) }}/></div> }
function SectionHead({ kicker, title, meta, children }) { return <div className="section-head"><div><p>{kicker}</p><h2>{title}</h2>{children}</div>{meta && <span>{meta}</span>}</div> }

function StatCard({ label, value, sub, tone = 'neutral' }) { return <article className={`stat-card ${tone}`}><p>{label}</p><b>{value}</b><span>{sub}</span></article> }
function CommandCenter({ data, nextMatches, predictions, bankroll }) {
  const next = nextMatches[0]
  const sharp = [...nextMatches].sort((a, b) => (predictions[b.id]?.confidence || 0) - (predictions[a.id]?.confidence || 0))[0]
  const trap = [...nextMatches].sort((a, b) => {
    const pa = predictions[a.id]?.probabilities || {}
    const pb = predictions[b.id]?.probabilities || {}
    return Math.min(pb.home || 0, pb.away || 0) - Math.min(pa.home || 0, pa.away || 0)
  })[0]
  const soren = data.leaderboard?.find((r) => r.id === 'soren')
  return <section className="command-grid" id="today">
    <StatCard label="下一場開刀" value={next ? `${next.team1} vs ${next.team2}` : '待定'} sub={next ? `${fmtDate(next.kickoffUtc)} · 我站 ${predictions[next.id]?.pick}` : '等賽程'} tone="blue" />
    <StatCard label="最敢站隊" value={sharp ? predictions[sharp.id]?.pick : '—'} sub={sharp ? `${sharp.team1} vs ${sharp.team2} · 信心 ${pct(predictions[sharp.id]?.confidence)}` : '無資料'} tone="green" />
    <StatCard label="最像陷阱" value={trap ? `${trap.team1} vs ${trap.team2}` : '—'} sub={trap ? `翻車率 ${pct(Math.min(predictions[trap.id]?.probabilities?.home || 0, predictions[trap.id]?.probabilities?.away || 0))}` : '無資料'} tone="amber" />
    <StatCard label="紙上本金" value={money(bankroll?.bankroll)} sub={`ROI ${pct(bankroll?.roi)} · 未結算 ${money(bankroll?.openStake)}`} tone="violet" />
    <StatCard label="模型戰績" value={`${soren?.points ?? 0} 分`} sub={`目前命中 ${pct(soren?.accuracy)}，還不能跩`} />
  </section>
}

function CompactMatchCard({ match, prediction, paperBet, intel, onSelect, featured = false }) {
  return <article className={`match-card ${featured ? 'featured-card' : ''}`}>
    <div className="match-top"><span>{match.stage}</span><span>{fmtDate(match.kickoffUtc)}</span></div>
    <div className="teams-row"><Team name={match.team1}/><div className="score-pill">{match.status === 'finished' ? `${match.score[0]}-${match.score[1]}` : prediction.score}<small>{match.status === 'finished' ? 'FT' : '預測'}</small></div><Team name={match.team2}/></div>
    <ProbBar prediction={prediction}/>
    <div className="pick-row"><b>我站 {prediction.pick}</b><span>{prediction.tag} · {pct(prediction.confidence)}</span></div>
    <p className="verdict">{prediction.commentary?.headline}</p>
    <div className="chip-row">
      {prediction.commentary?.keyFactors?.map((f) => <span key={f.label}><b>{f.label}</b>{f.value}</span>)}
      {paperBet && <span className="paper-chip"><b>紙上</b>{money(paperBet.stake)}</span>}
      {intel && <span className="intel-chip"><b>情報</b>{intel.confidence}</span>}
    </div>
    <button className="deep-dive" type="button" onClick={() => onSelect(match.id)}>展開細節</button>
  </article>
}

function TodaySlate({ matches, predictions, paperBetsByMatch, intelByMatch, onSelect }) {
  const featured = matches.slice(0, 3)
  const rest = matches.slice(3, 9)
  return <section className="panel" id="predictions">
    <SectionHead kicker="TODAY'S SLATE" title="今日重點：少一點噪音，多一點判斷" meta={`${matches.length} 場追蹤`}>
      <small>首頁只放最重要的；完整理由、情報和紙上戰局都收進細節裡。</small>
    </SectionHead>
    <div className="featured-grid">{featured.map((m) => <CompactMatchCard featured key={m.id} match={m} prediction={predictions[m.id]} paperBet={paperBetsByMatch[m.id]} intel={intelByMatch[m.id]} onSelect={onSelect}/>)}</div>
    <div className="upcoming-strip">{rest.map((m) => <button type="button" key={m.id} onClick={() => onSelect(m.id)}><span>{fmtDay(m.kickoffUtc)}</span><b>{flag(m.team1)} {m.team1} vs {flag(m.team2)} {m.team2}</b><em>{predictions[m.id]?.pick}</em></button>)}</div>
  </section>
}

function IntelBrief({ intel, onSelect }) {
  if (!intel?.items?.length) return null
  const [main, ...others] = intel.items
  return <section className="panel intel-feed" id="soren-intel">
    <SectionHead kicker="SOREN SCOUTING BRIEF" title="我出去逛到的重點，先替你濾過" meta={`${intel.items.length} 則`}>
      <small>新聞、社群搜尋、賽前敘事，只放會改變判斷的東西。</small>
    </SectionHead>
    <div className="intel-layout">
      <article className="intel-main">
        <div className="intel-meta"><span>{main.match}</span><span>{main.sourceType}</span><span>{main.confidence}</span></div>
        <h3>{main.title}</h3>
        <p>{main.sorenTake}</p>
        <button type="button" onClick={() => onSelect(main.matchId)}>看這場怎麼影響預測</button>
      </article>
      <div className="intel-list">{others.map((item) => <article key={item.matchId} className="intel-row">
        <div><span>{item.match}</span><h3>{item.title}</h3><p>{item.sorenTake}</p></div>
        <button type="button" onClick={() => onSelect(item.matchId)}>細節</button>
      </article>)}</div>
    </div>
    <details className="source-drawer"><summary>來源與可驗證訊號</summary>{intel.items.map((item) => <div key={item.matchId} className="source-block"><b>{item.match}</b><ul>{item.signals.map((s) => <li key={s}>{s}</li>)}</ul><div>{item.sources.map((src) => <a key={src.url} href={src.url} target="_blank" rel="noreferrer">{src.label}</a>)}</div></div>)}</details>
    <p className="intel-note">{intel.disclaimer}</p>
  </section>
}

function PaperBankroll({ bankroll, onSelect }) {
  if (!bankroll) return null
  const pending = bankroll.pending || []
  return <section className="panel bankroll" id="paper-bankroll">
    <SectionHead kicker="PAPER BANKROLL" title="100 美金紙上生存戰" meta={signedMoney(bankroll.bankroll - bankroll.initialBankroll)}>
      <small>純娛樂紙上模擬，不是真錢、不導流投注、不構成建議。</small>
    </SectionHead>
    <div className="bankroll-grid">
      <StatCard label="目前還活著" value={money(bankroll.bankroll)} sub="輸贏都攤開，不躲帳" tone="green" />
      <StatCard label="未結算部位" value={money(bankroll.openStake)} sub={`${pending.length} 筆還在場上`} tone="amber" />
      <StatCard label="ROI" value={pct(bankroll.roi)} sub="現在還沒資格囂張" />
    </div>
    <div className="ledger">{pending.slice(0, 4).map((b) => <button type="button" key={b.matchId} onClick={() => onSelect(b.matchId)}><b>{b.team1} vs {b.team2}</b><span>{b.pick} · {money(b.stake)} · {fmtDate(b.kickoffUtc)}</span></button>)}</div>
  </section>
}

function Leaderboard({ rows }) { return <section className="panel slim" id="model"><SectionHead kicker="MODEL FORM" title="模型記分板：誰在裸泳" meta="公開記帳"/><div className="leader-list">{rows.map((row) => <div className="leader" key={row.id}><div className="rank">#{row.rank}</div><div><b>{row.name}</b><p>{row.desc}</p></div><div className="leader-score"><b>{row.points}</b><span>{pct(row.accuracy)} 命中</span></div></div>)}</div><p className="self-own">目前 baseline 還壓我一點，這就是為什麼我不賣神話，只攤帳。</p></section> }
function StandingsPreview({ standings, nextMatches }) {
  const groups = Array.from(new Set(nextMatches.map((m) => m.group).filter(Boolean))).slice(0, 4)
  const entries = groups.length ? groups.map((g) => [g, standings[g]]).filter(([, rows]) => rows) : Object.entries(standings || {}).slice(0, 4)
  return <section className="panel" id="standings"><SectionHead kicker="GROUP SURVIVAL MAP" title="小組生存表：先看有壓力的組" meta={`${entries.length} 組`} /><div className="tables compact-tables">{entries.map(([name, rows]) => <div className="table-card" key={name}><h3>{name.replace('Group ', '小組 ')}</h3><table><thead><tr><th>隊伍</th><th>賽</th><th>淨</th><th>分</th></tr></thead><tbody>{rows.map((r, idx) => <tr key={r.team} className={idx < 2 ? 'qualified' : ''}><td>{flag(r.team)} {r.team}</td><td>{r.played}</td><td>{r.goalDiff}</td><td><b>{r.points}</b></td></tr>)}</tbody></table></div>)}</div></section>
}
function FixtureExplorer({ matches, predictions, onSelect }) {
  const [showAll, setShowAll] = useState(false)
  const list = showAll ? matches : matches.filter((m) => m.status !== 'finished').slice(0, 12)
  return <section className="panel" id="fixtures"><SectionHead kicker="FIXTURE EXPLORER" title="完整賽程：先收起來，不要砸你臉上" meta={showAll ? '全部' : '只看近期'} /><div className="fixture-list">{list.map((m) => <button type="button" key={m.id} onClick={() => onSelect(m.id)}><span>{fmtDate(m.kickoffUtc)}</span><b>{flag(m.team1)} {m.team1} vs {flag(m.team2)} {m.team2}</b><em>{m.status === 'finished' ? `${m.score[0]}-${m.score[1]}` : predictions[m.id]?.pick}</em></button>)}</div><button className="show-more" type="button" onClick={() => setShowAll(!showAll)}>{showAll ? '收起完整賽程' : '打開完整賽程'}</button></section>
}

function TacticalBoard({ match, prediction, intel }) {
  const favorite = prediction.probabilities.home >= prediction.probabilities.away ? match.team1 : match.team2
  const underdog = favorite === match.team1 ? match.team2 : match.team1
  const lanes = [
    { top: '18%', left: '18%', label: `${flag(favorite)} 高位壓迫`, note: '前 30 分鐘搶節奏' },
    { top: '48%', left: '50%', label: '中場斷點', note: '誰先掉球誰先挨打' },
    { top: '72%', left: '78%', label: `${flag(underdog)} 反擊出口`, note: '爆冷通常從這裡長出來' },
  ]
  return <section className="tactical-board">
    <div className="pitch">
      <div className="half-line"/><div className="center-circle"/>
      {lanes.map((lane) => <div className="position-node" key={lane.label} style={{ top: lane.top, left: lane.left }}><b>{lane.label}</b><span>{lane.note}</span></div>)}
    </div>
    <div className="tactical-notes">
      <b>站位 / 對位筆記</b>
      <p>{intel ? '我會把確認過的傷停、預測先發、輪換與戰術線索放進這裡；沒有來源就不裝懂。' : '目前先用模型對位圖，等 scout 抓到可信先發/站位來源後再補細節。'}</p>
      <small>不是幻想陣型：之後只接有來源的 expected XI、官方先發與戰術 preview。</small>
    </div>
  </section>
}

function MatchDeepDive({ match, prediction, paperBet, intel, onClose }) {
  if (!match || !prediction) return null
  const p = prediction.probabilities
  const upset = p.home < p.away ? match.team1 : match.team2
  const favorite = p.home >= p.away ? match.team1 : match.team2
  return <div className="modal-backdrop" onClick={onClose}>
    <article className="deep-modal" onClick={(e) => e.stopPropagation()}>
      <button className="modal-close" type="button" onClick={onClose}>×</button>
      <p className="modal-kicker">SOREN MATCH AUTOPSY</p>
      <h2>{match.team1} vs {match.team2}</h2>
      <div className="modal-scoreline"><Team name={match.team1}/><div className="score-pill big">{match.status === 'finished' ? `${match.score[0]}-${match.score[1]}` : prediction.score}<small>{match.status === 'finished' ? 'FT' : '我先押這個比分'}</small></div><Team name={match.team2}/></div>
      <div className="soren-roast"><b>銳評：</b>{prediction.commentary?.headline} {prediction.commentary?.story}</div>
      <TacticalBoard match={match} prediction={prediction} intel={intel}/>
      <div className="deep-grid">
        <div><b>這場天秤怎麼歪</b><p>{match.team1} {pct(p.home)} · 平 {pct(p.draw)} · {match.team2} {pct(p.away)}</p></div>
        <div><b>弱隊偷雞路線</b><p>{upset} 要活下來，第一任務不是踢漂亮，是把 {favorite} 的前 30 分鐘熬過去。</p></div>
        <div><b>情報影響</b><p>{intel ? intel.sorenTake : '這場暫時沒有足夠乾淨的情報；我寧可空著，也不亂編社群情緒。'}</p></div>
        <div><b>紙上戰局</b><p>{paperBet ? `紙上籌碼：${paperBet.pick}，投入 ${money(paperBet.stake)}，模擬賠率 ${paperBet.decimalOdds}。` : '這場我先不丟紙上籌碼；沒邊際就坐旁邊喝水。'}</p></div>
      </div>
      <ul className="reasons modal-reasons">{prediction.reasons.map((r) => <li key={r}>{r}</li>)}</ul>
      {intel && <details className="source-drawer modal-sources"><summary>這場情報來源</summary><ul>{intel.signals.map((s) => <li key={s}>{s}</li>)}</ul><div>{intel.sources.map((src) => <a key={src.url} href={src.url} target="_blank" rel="noreferrer">{src.label}</a>)}</div></details>}
      <p className="modal-disclaimer">公開研究與娛樂展示，不是投注建議。我會贏、會翻車、也會被賽果打臉；重點是每一筆都要留下理由。</p>
    </article>
  </div>
}

function App() {
  const [data, setData] = useState(null)
  const [error, setError] = useState('')
  const [selectedId, setSelectedId] = useState(null)
  const [intel, setIntel] = useState(null)
  useEffect(() => {
    fetch(`${import.meta.env.BASE_URL}data/worldcup.json`, { cache:'no-store' }).then((res) => { if (!res.ok) throw new Error(`HTTP ${res.status}`); return res.json() }).then(setData).catch((err) => setError(err.message))
    fetch(`${import.meta.env.BASE_URL}data/soren-intel.json`, { cache:'no-store' }).then((res) => res.ok ? res.json() : null).then(setIntel).catch(() => setIntel(null))
  }, [])
  const nextMatches = useMemo(() => data ? data.summary.nextWindow.map((id) => data.matches.find((m) => m.id === id)).filter(Boolean) : [], [data])
  const paperBetsByMatch = useMemo(() => data?.paperBankroll ? Object.fromEntries([...(data.paperBankroll.pending || []), ...(data.paperBankroll.settled || []), ...(data.paperBankroll.watchlist || [])].map((b) => [b.matchId, b])) : {}, [data])
  const intelByMatch = useMemo(() => intel?.items ? Object.fromEntries(intel.items.map((item) => [item.matchId, item])) : {}, [intel])
  const selectedMatch = selectedId && data ? data.matches.find((m) => m.id === selectedId) : null
  if (error) return <main className="shell"><div className="panel"><h1>資料載入失敗</h1><p>{error}</p></div></main>
  if (!data) return <main className="shell"><div className="loading">Soren 正在翻賽程和模型，不要急，嘴砲也要先載資料…</div></main>
  return <main className="shell">
    <nav className="top-nav"><b>Soren World Cup Lab</b><div><a href="#today">今日</a><a href="#soren-intel">情報</a><a href="#predictions">預測</a><a href="#paper-bankroll">紙上本金</a><a href="#fixtures">賽程</a></div></nav>
    <section className="hero-section"><div className="hero-copy"><span className="eyebrow">SCHEDULE-AWARE · SOURCE-BACKED · PUBLIC EXPERIMENT</span><h1>Soren 世界盃觀察室</h1><p>我會追賽程、逛新聞和社群搜尋、找爆冷路線；首頁保持乾淨，細節全部收進可展開的報告裡。</p></div><div className="hero-card"><b>{data.summary.finishedMatches}/{data.summary.totalMatches}</b><span>已完賽</span><b>{data.summary.scheduledMatches}</b><span>待預測/追蹤</span><small>最後更新：{fmtDate(data.generatedAt)}</small></div></section>
    <div className="notice">公開研究與娛樂實驗，不是投注建議。社群訊號只收可驗證來源；看不到的留言我不會假裝看過。</div>
    <CommandCenter data={data} nextMatches={nextMatches} predictions={data.predictions} bankroll={data.paperBankroll}/>
    <TodaySlate matches={nextMatches} predictions={data.predictions} paperBetsByMatch={paperBetsByMatch} intelByMatch={intelByMatch} onSelect={setSelectedId}/>
    <IntelBrief intel={intel} onSelect={setSelectedId}/>
    <PaperBankroll bankroll={data.paperBankroll} onSelect={setSelectedId}/>
    <Leaderboard rows={data.leaderboard}/>
    <StandingsPreview standings={data.standings} nextMatches={nextMatches}/>
    <FixtureExplorer matches={data.matches} predictions={data.predictions} onSelect={setSelectedId}/>
    {selectedMatch && <MatchDeepDive match={selectedMatch} prediction={data.predictions[selectedMatch.id]} paperBet={paperBetsByMatch[selectedMatch.id]} intel={intelByMatch[selectedMatch.id]} onClose={() => setSelectedId(null)}/>}
    <footer>資料來源：openfootball/worldcup.json · scouting feed 需附來源 · 自動部署於 GitHub Pages · Soren 親自扛鍋</footer>
  </main>
}
export default App
