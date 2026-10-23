# Icon 與品牌標記（第六輪）

## 唯一 icon 集：Lucide（MIT，`lucide-react` 0.552.0）

繪製參數固定在 `src/components/ui.jsx` 的 `Icon` 元件：24 格、`stroke-width 1.75`（`absoluteStrokeWidth`）、圓頭圓角、`fill: none`、`currentColor`。尺寸只有 16 / 20 / 24：表格與標籤 16、按鈕內 20、導覽與標題 24。

| 站內用途 | 元件 / 位置 | Lucide 名稱 | 尺寸 |
|---|---|---|---|
| 猜中判定膠囊 | `Verdict` | `check` | 16 |
| 猜錯判定膠囊 | `Verdict` | `x` | 16 |
| 比分全中判定膠囊 | `Verdict` | `star` | 16 |
| 主題切換（淺色 / 深色 / 系統） | 頂欄按鈕 | `sun` / `moon` / `monitor` | 20 |
| 搜尋欄 | 賽事頁 toolbar | `search` | 20 |
| 關閉詳情抽屜 | `MatchSheet` | `x` | 20 |
| 上一場 / 下一場、分頁器 | `MatchSheet`、小組 tab 卡 | `chevron-left` / `chevron-right` | 16 / 20 |
| 「全部 104 場 →」等更多連結 | `more-link` | `chevron-right` | 16 |
| 外部來源連結 | 情報來源清單 | `external-link` | 16 |
| 冠軍標籤、對戰圖獎盃卡 | 總覽、淘汰賽 | `trophy` | 20 / 24 |
| 資料驗證 / 說明 / 錯誤狀態 | 狀態列、備註、錯誤卡 | `info` | 16 / 24 |
| 空狀態 | 賽事頁無結果 | `search` | 24 |

## 被替換掉的手繪 SVG

| 原本 | 替代 |
|---|---|
| `src/components/ui.jsx` 內手繪 13 個 20 格 path（check / x / star / sun / moon / monitor / search / close / left / right / external / trophy / info） | 上表的 Lucide 元件 |
| `src/App.jsx` 頂欄手繪品牌標記（圓角方 + 圓 + 五邊形） | `public/brand/mark.svg` |
| `public/favicon.svg`（Vite 範本的紫色閃電） | 同一個 `mark.svg` |
| `public/icons.svg` sprite（Vite 範本：bluesky / github / discord 等社群圖示，站內沒有引用） | 刪除 |
| `src/components/charts.jsx` 的走勢線 SVG | 保留：那是資料圖表，不是 icon |

## 品牌標記

- 檔案：`public/brand/mark.svg`（viewBox 0 0 64 64）。容器圓角 14.08 = 邊長 22%，實心 indigo `#4f46e5`（HSL 243° 75% 59%，取 Tailwind indigo-600），無邊框、陰影、漸層；內容是 Lucide `trophy`，白色，`stroke-width 2`，佔邊長 58%，置中。
- 用途：頂欄 32px（`<img>`）、`public/favicon.svg`（同檔）、`public/apple-touch-icon.png` 180px（由 mark.svg 渲染）。深色模式容器色不變。
- 字標：站名 16px / 600 / 字距 -0.01em；副標 12px / 500 次文字色；標記與字標間距 10px。
- 輸出副本：`docs/brand/mark.svg`、`docs/brand/favicon.svg`、`docs/brand/apple-touch-icon.png`。
