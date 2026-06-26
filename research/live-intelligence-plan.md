# Live Intelligence Plan

Soren 的世界盃預測不能只靠靜態強弱與 Poisson。爆冷通常來自臨場資訊：球員傷停、首發變化、教練戰術、社群輿論與新聞事件。因此本專案新增「Live Intelligence」方向，作為量化模型之外的分析層。

## YouTube reference takeaways

來源：`Fd4t35xAaGQ` transcript snapshot in `research/youtube/Fd4t35xAaGQ-transcript.txt`.

1. **naive LLM 會偏向傳統強隊**：沒有資料與 prompt design 時，模型多半只猜強隊，爆冷抓不到。
2. **球員才是核心**：應追蹤球員能力、近 10 場狀態、位置對比、傷停、首發可能性。
3. **戰術與教練要拆模組**：球隊風格、教練傾向、賽前新聞、場地天氣、左右路/中前後場 matchup 都要分開看。
4. **過度專業推演會 brittle**：假設一張黃牌或一個對位弱點後，LLM 可能越推越偏，形成蝴蝶效應式幻覺。
5. **需要「敢下判斷」但要有根據**：簡化版 Jiahao 的優勢是敢抓弱點與爆冷路徑，但 Soren 必須把「事實」和「判斷」分開，避免拍腦袋。
6. **規則要搞清楚**：90 分鐘、延長賽、點球、晉級/勝平負口徑必須標清楚。

## Intelligence dimensions

For each upcoming match, collect and cite:

- Injuries / suspensions / doubtful players
- Likely lineups and rotation risk
- Coach quotes and tactical tendency
- Team form and player recent form
- Tactical mismatch: flanks, transitions, set pieces, pressing resistance
- Weather / venue / travel / rest
- Social and analyst sentiment, clearly labeled as sentiment rather than fact
- Upset path: what must happen for the underdog to win or draw
- Confidence and source quality

## Public presentation rules

- Never imply certainty.
- Never encourage betting.
- Cite sources for live claims.
- Label unverified social chatter.
- Preserve model transparency: quantitative model + live analyst notes are separate layers.

## Automation plan

1. Keep the 2-hour data cron for fixture/result refresh.
2. Add a 6-hour intelligence scout cron during active tournament periods.
3. Scout job reads upcoming fixtures, researches top matches, writes `public/data/intelligence.json` or a report.
4. Human-facing site displays source-backed analysis only when enough credible sources exist.
5. If sources conflict, show conflict rather than forcing a conclusion.

## Next implementation steps

1. Add `scripts/update-intelligence.mjs` or an agent-driven report generator.
2. Add `public/data/intelligence.json` schema.
3. Add front-end cards: injury watch, tactical key, upset path, source list.
4. Add validation: every live claim must have source URL, timestamp, and confidence.
