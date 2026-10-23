# 參考頁 token：Opta Analyst — FIFA World Cup hub

- 參考頁：<https://theanalyst.com/competition/fifa-world-cup>（2026-10-23 以 Playwright Chromium 實際載入並量測）
- 指定的主參考 URL `https://theanalyst.com/competition/world-cup` 回 **404「Page not found」**（截圖在 scratchpad，未收錄）；同站的世界盃 hub 真正網址是上面的 `fifa-world-cup`，內容就是主 session 指定的「Opta Analyst 世界盃預測」頁，所以以它為主參考，沒有改用備選。
- 截圖：`ref-1440.png`、`ref-390.png`（首屏）、`ref-1440-full.png`、`ref-390-full.png`（整頁），皆為 DPR 1 的真實瀏覽器畫面。
- 量測方式：`getComputedStyle` + `getBoundingClientRect`（腳本 `scratchpad/shot/tokens.cjs`、`tokens2.cjs`），數字為 1440×900 視窗，另附 390×844。

## 1. 容器與欄位

| 項目 | 1440 | 390 |
|---|---|---|
| 內容最大寬度 | **1400px**（左緣 x=20） | 358px（x=16） |
| 左右 gutter | 20px | 16px |
| 首屏欄位 | **3 等欄：451 / 451 / 451，欄距 24px**（x = 20、495、969） | 單欄堆疊 |
| 頂層區塊垂直間距 | **24px** | **12px** |
| 全幅帶（深色「Tournament Leaders」） | 1440 全幅，內容仍對齊 1400 容器 | 同 |
| 頁面總高 | 4817px | 7284px |

## 2. 字體與字級（首屏前 5 大文字）

| 文字 | 字級 / 字重 / 行高 | 字體 | 其他 |
|---|---|---|---|
| 區塊標題「Standings」「Featured Articles」（視覺上隱藏的 h2） | 36 / 500 / 39.6 | Big Shoulders Text | — |
| 文章標題 h3「World Cup Host Nations…」 | **36 / 700 / 39.6** | Big Shoulders Text | 首屏最大可見文字 |
| h1「FIFA World Cup」 | **30 / 800 / 33** | Big Shoulders Text | 在白色 hub 卡內 |
| 卡片標頭 h2「PREDICTIONS」 | **22 / 700 / 48** | Big Shoulders Text | uppercase，置於 48px 高的灰色標頭帶 |
| 「Group A」 | 21 / 700 / 26 | Big Shoulders Text | — |
| hub 子分頁「OVERVIEW ARTICLES…」 | 18 / 800 | Big Shoulders Text | uppercase，active 以粉色底線 |
| 卡片內 tab「STANDINGS / FIXTURES」 | 20 / 700 / 48 | Big Shoulders Text | uppercase |
| 深色帶 h2「TOURNAMENT LEADERS」 | 36 / 700 | Big Shoulders Text | uppercase，白字 |
| 深色帶內卡片 h3「GOALS」 | 24 / 700 / 28.8 | Big Shoulders Text | uppercase，letter-spacing .6px |
| 內文 | **13 / 15.6**（最多）、11 / 13.2 | **Lora**（襯線） | body 預設 16px，但實際內文多為 13px |
| 表格資料 | **12 / 400**，th 12 / 600 uppercase | **IBM Plex Mono** | — |
| 導覽列連結 | 13 / 400 | Lora | 白字 |
| 「ALL PREDICTIONS →」等卡片底部連結 | 16 / 800 | Big Shoulders Text | 粉色 |

字體家族共三套：**Big Shoulders Text（窄體展示字，所有標題與數字）、Lora（襯線內文）、IBM Plex Mono（表格數據）**。三者都是 Google Fonts（OFL）。

390 寬度：h1 30 / 800；卡片 tab 20 / 700；「Group A」21 / 700；內文同 13 / 11。

## 3. 間距

| 項目 | 值 |
|---|---|
| 卡片內距 | **24px**（深色帶內的灰卡 16px） |
| 卡片標頭帶高度 | 48px（h2 行高 48，左右 padding 24） |
| 表格列高 | **36px**（td padding 6px 10px） |
| 表頭列高 | 28px（th padding 8px 10px） |
| 導覽列高度 | 79px（內距 0 20px，項目 gap 16） |
| hub 卡高度 | 80px |
| 區塊垂直間距 | 24（桌面）/ 12（手機） |
| 欄距 | 24 |

整理成階梯：**6 / 10 / 12 / 16 / 20 / 24 / 36 / 48**（本站落實時對齊到 4 / 8 / 12 / 16 / 24 / 32 / 48 的 8pt 階梯，36 用於列高）。

## 4. 形狀

| 項目 | 值 |
|---|---|
| 圓角 | **6px**（所有卡片、導覽列、hub 卡） |
| 邊框 | 無（0px） |
| 陰影 | **硬邊陰影 `0 3px 0 0 rgba(0,0,0,.1)`**（無模糊，像一條 3px 底邊）；深色帶內灰卡 `0 3px 0 0 rgb(159,159,159)` |
| 分隔線 | hub 卡底部一條 **漸層線** `linear-gradient(to left, rgb(178,37,195), rgb(224,43,143))`，約 3px |
| 表格 | 無邊框，**斑馬紋**：白 / `rgb(242,242,242)` 交錯；重點列整列塗成粉色 `≈ rgb(254,127,177)` |

## 5. 色彩（預設 **淺色**）

| 角色 | 值 |
|---|---|
| 頁面背景 | `rgb(247,247,247)` #f7f7f7 |
| 卡片底 | `#ffffff` |
| 卡片標頭帶 | `rgb(233,230,236)` #e9e6ec（帶一點紫的灰） |
| 斑馬列 / 次卡片 | `rgb(242,242,242)` #f2f2f2 |
| 主文字 | `#000000`；標題次色 `rgb(29,10,48)` #1d0a30 |
| 次文字 | `rgba(255,255,255,.7)`（深底上）；淺底上用 #1d0a30 |
| 導覽列 / 深色帶 | **`rgb(29,10,48)` #1d0a30**（深紫），頂部跑馬燈 `rgb(19,4,34)` |
| 強調色 | **粉 `rgb(253,72,144)` #fd4890**（連結、active 底線、重點列）；第二強調 紫 `rgb(178,37,195)`→`rgb(224,43,143)` 漸層 |
| 深底上的輔助色 | `rgb(255,138,184)` 粉、`rgb(192,166,239)` 淡紫 |

色彩結構：**淺灰頁面 → 白卡 → 灰標頭帶** 三層灰；一個高飽和強調色用在連結／底線／重點列；深紫用在導覽列與一條全幅帶，形成「淺—深—淺」的節奏。本站換成自己的色票（深藍 navy 取代深紫、藍取代粉、青藍漸層取代紫粉漸層），結構照抄。

## 6. 首屏結構（1440×900）

| 項目 | 值 |
|---|---|
| y 0–96 | 深色比分跑馬燈（全幅） |
| y 101–180 | 深紫導覽列（圓角卡，在 1400 容器內） |
| y 184–228 | 深色 LIVE 連結帶 |
| y 251–331 | 白色 hub 卡：左 logo + h1「FIFA World Cup」+ 副標；右側 6 個 uppercase 子分頁，底部漸層線 |
| y 355–979 | **三欄卡**：① 文章卡（圖片 + 36px 標題 + 摘要 + 日期/作者）② PREDICTIONS 卡（灰標頭帶 + 黑色膠囊按鈕 + 10 列 mono 表格，第 1 列粉色）③ STANDINGS/FIXTURES tab 卡（Group A 上一組/下一組 + 4 列表） |
| hero 高度佔比 | 首屏沒有傳統 hero；三欄卡頂端在 **39%** 視窗高，卡片高 624（69%） |
| 主焦點位置 | 左欄（文章標題 36/700，x=44 y=602） |
| 第一個互動元件 | 導覽列連結（y=101）；內容區第一個是「OUTCOMES」膠囊（x=519 y=421） |
| 整頁節奏 | 三欄卡 → 深色全幅帶（4 張灰卡） → 白卡「ALL GROUPS」（12 組 4 欄） → 兩張半幅卡 → 深色頁尾 |

## 7. 用 audit 腳本量到的分佈（供對照）

| | 1440 | 390 |
|---|---|---|
| < 14px 字佔比 | 約 85%（內文 13、表格 12、跑馬燈 11） | 同 |
| 首屏最大文字 | 36 / 700（文章標題），第二 30 / 800（h1） | 30 / 800 |

參考頁本身**不符合**第三輪的字級門檻（內文 13、表格 12）。本站照抄的是容器、欄比、留白、圓角、陰影、標頭帶、斑馬表、深色帶與字體家族；字級階梯則以參考頁的「比例」套進 16px 內文的基準（標頭帶 22、h1 30、焦點數字 96、表格 14 mono），好讓 lt14 ≤ 15% 不退步。
