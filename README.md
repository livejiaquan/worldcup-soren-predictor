# Soren World Cup Predictor

世界盃 2026 預測儀表板。資料來源為公開的 [`openfootball/worldcup.json`](https://github.com/openfootball/worldcup.json)，每 2 小時由 GitHub Actions 重新整理資料、計算預測並部署到 GitHub Pages。

> 預測僅供研究與娛樂交流，不構成投注、投資或任何保證建議；反對非法博彩。

## Local commands

```bash
npm install
npm run update-data
npm run validate
npm run build
npm run dev
```

## Method

Soren 模型使用：

1. 隊伍強度先驗
2. 當屆已完賽積分、淨勝球與狀態修正
3. Poisson 進球分布估計勝 / 平 / 負機率
4. 公開追蹤命中率：勝平負命中 1 分、比分精準 3 分

## Deploy

Workflow: `.github/workflows/update-and-deploy.yml`

- `schedule`: every 2 hours
- `workflow_dispatch`: manual update
- `push main`: deploy after code changes
