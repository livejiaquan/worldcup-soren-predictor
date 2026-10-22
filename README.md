# Soren World Cup Predictor

世界盃 2026 預測儀表板，資料來源為公開的 [`openfootball/worldcup.json`](https://github.com/openfootball/worldcup.json)。賽事期間由自動化流程更新資料與預測；賽事結束後改為唯讀封存，只在官方更正或明確維護需求時更新。

> 預測僅供研究與娛樂交流，不構成投注、投資或任何保證建議；反對非法博彩。

## Archive status

- 104 / 104 場賽事已完賽
- 冠軍：Spain（決賽 1–0 Argentina）
- 公開封存站：<https://worldcup.kyasen.com/>
- 封存資料快照：2026-07-20

## 網站介面

封存站分五個分頁：**總覽**（結論、冠軍、KPI、104 格逐場戰績）、**賽事**（可搜尋與篩選的逐場預測 vs 實際）、**淘汰賽**（對戰樹）、**小組**（最終排名）、**戰績**（記分板、RPS／Brier、校準、紙上本金、方法）。每場都能打開詳情抽屜，網址可直接分享（例如 `#/matches/m104`）。

頁面上的每場預測都是**賽前重放**：只用該場開賽前已完賽的結果重算（與 `buildLeaderboard` 和 `validate-data` 相同的流程），所以命中數與記分板一致（64/104）。`worldcup.json` 裡的 `predictions` 與 `paperBankroll` 是用終局戰績重算的版本，帶有後見之明，介面不直接使用；`scripts/archive-view.test.mjs` 會檢查這兩件事。

設計與研究文件：[`docs/ux-research.md`](docs/ux-research.md)、[`docs/design-research.md`](docs/design-research.md)、截圖在 [`docs/screenshots/`](docs/screenshots/)。

## Local commands

```bash
npm ci
npm run validate
npm run archive-summary
npm run lint
npm run build
npm run dev
```

`npm run archive-summary` 會從 `public/data/worldcup.json` 產生封存摘要：冠軍、模型榜、紙上本金、高信心命中／翻車與最大比分誤差，方便收尾報告或檢查公開頁文案是否和資料一致。紙上投注明細只保留最近 12 筆結算，摘要顯示的是保留筆數，不代表整屆總下注數；本金與 ROI 是產生資料時累計的結果。

`npm run update-data` 會重新抓取上游資料並重算預測；封存期請只在需要處理官方更正時執行。

## Method

Soren 模型使用：

1. 隊伍強度先驗
2. 當屆已完賽積分、淨勝球與狀態修正
3. Poisson 進球分布估計勝 / 平 / 負機率
4. 公開追蹤命中率：勝平負命中 1 分、比分精準 3 分

## Deploy

GitHub Pages 直接發布 `main` 分支的 `/docs`。建置只會清掉 `docs/assets/` 再重新輸出，`docs/*.md` 與 `docs/screenshots/` 會保留。`npm run build` 會先驗證資料、產生靜態檔，再檢查部署資料、資產、`CNAME` 與 `.nojekyll` 是否完整。推送前應確認：

```bash
npm run lint
npm run build
git status --short
```

## License

程式碼以 [MIT](LICENSE) 授權。賽程資料來自 openfootball（CC0）；`research/` 中引用的外部影片只保留連結與自行撰寫的摘要。
