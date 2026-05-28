# 🛠️ 實作規劃書（工程交接用）

> **用途**：給接手的 session 看。本文件自成一體，不需依賴前一輪對話記憶。
> **最後更新**：2026/05/27
> **相關文件**：`doc/launch-plan.md`（主管視角）、`doc/requirements-annotations.md`（PM 規格補充）、`doc/spec.md`、`doc/todo.md`

---

## 0. 專案脈絡（30 秒上手）

- **產品**：財商學習平台（遊戲化 + 模擬交易），需求書 = `財商學習平台需求文件`（PDF/docx 在使用者 Downloads）
- **技術**：Vite + React + TS 前端 / Firebase（Auth, Firestore, Functions, Hosting）後端 / Remotion 課程影片
- **課程資料來源**：CMS（`oafq-cms-1313`，source 在 `C:\Users\brian\Documents\GitHub\finance-cms`）→ 同步到 coin-quest（`oa-coin-quest`）Firestore + Storage
- **目前 prod 狀態**：強制日文 demo（`frontend/src/lib/forcedLanguage.ts` 的 `FORCED_LANGUAGE`）。改 `null` = 中文
- **開發部署規範**：改動先推 preview channel `npx firebase hosting:channel:deploy cms-sync-test`，**不要動 prod**。改前端記得先 `npm run build`
- **Service account keys**（repo root）：`oafq-cms-1313-4c71212d9a8b.json`（CMS 唯讀）、`oa-coin-quest-firebase-adminsdk-fbsvc-9bc8452d6c.json`（coin-quest 讀寫）

---

## 1. 本輪已完成（不要重做）

| 項目 | 檔案 / 結果 |
|---|---|
| 小遊戲 3 星金幣 200→150 | `frontend/src/features/learn/lib/gameScoring.ts`（`STAR_COIN_REWARDS = [0,50,100,150]`）|
| CMS 多語 probe 工具 | `functions/scripts/probe-cms-game.ts`（純讀，驗 htmlByLang）|
| 測試帳號 seed | `functions/scripts/seed-test-users.ts`，已建 6 帳號（見 §6）|
| 匿名清理 script（**未執行**） | `functions/scripts/cleanup-anonymous-users.ts`（使用者決定保留匿名，先不跑）|
| LoginPage 移除「匿名體驗」 | `frontend/src/features/auth/pages/LoginPage.tsx`（改 email/密碼登入為主）|
| preview channel 已部署中文版 | `forcedLanguage.ts` = `null`，已 deploy 到 cms-sync-test |
| 規劃文件 | `doc/launch-plan.md`、`doc/requirements-annotations.md`、本文件 |

**⚠️ 注意**：`forcedLanguage.ts` 目前是 `null`（中文）。prod 仍是日文（因為只 deploy 到 preview channel）。若要 deploy prod 前需確認語言設定。

---

## 2. CMS 驗證結果（重要前提）

CMS `publishedGames/{shareId}` doc 已升級為多語結構：
```
htmlByLang: { zh, ja, en }          # 三份完整 HTML
scoreThresholds: { star1, star2, star3 }   # 每遊戲自訂
scoreCoinRewards: { star1: 50, star2: 100, star3: 150 }
html: <legacy 單語>                  # 仍保留
```
- ✅ 7 個 active games 中 **6 個**已升級
- ❌ **1 個未升級**：`pn971sgj`（stage-1 / lesson-7 / unit-7-1）→ 等 CMS 同事按「更新分享」
- **驗證指令**：`cd functions && npx tsx scripts/probe-cms-game.ts`

---

## 3. 待實作任務（依建議順序）

### 🟢 可立即動（無外部依賴）

#### T1. 小遊戲 3 次金幣（~0.5d）
**規格**：小遊戲前 3 次遊玩，每次依當次星數發金幣（50/100/150），第 4 次起不發。其他章節維持金幣 1 次。
**現況**：`functions/src/api/course.ts` 的 `completeChapter` 目前用 `completedChapters` 陣列擋所有重複（連遊戲都只給 1 次）。
**改法**：
- 後端 `CompleteChapterRequest` 加 `chapterType?: string`
- game 類型：courseProgress 加 `gameClaimCounts: { [chapterId]: number }`，< 3 才發金幣 + 計數+1；首次仍寫 `completedChapters`
- 非 game：維持現有一次性邏輯
- 前端 `frontend/src/features/learn/lib/completeChapter.ts` payload 加 `chapterType`
- `frontend/src/features/learn/pages/ChapterPage.tsx` 傳入 chapter type
- （可選）`GameResultCard` 顯示「還可領 X 次」
**注意**：`gameClaimCounts` 不存在時當 0，向下相容。

#### T2. Schema 擴充：多語 + 等級門檻（~0.75d）
**規格**：命運卡 / 保險產品加多語欄位 + 命運卡加等級門檻（避免高等級玩家抽到小金額卡）。
**改法**：
- `functions/src/seed/fateCards.ts`：interface 加 `titleByLang: {zh,en,ja}`、`descriptionByLang`、`minLevel?`、`maxLevel?`；保留舊 `title`/`description` fallback。seed 資料把現有中文填入 `*ByLang.zh`，en/ja 填 null
- `functions/src/seed/insuranceProducts.ts`：加 `nameByLang`、`descriptionByLang`，保留舊欄位
- `functions/src/api/checkIn.ts`：抽命運卡前過濾 `minLevel <= user.level <= maxLevel`（未指定 = 全等級）
- 前端 `FateCardModal` / `InsurancePage`：依語言讀 `*ByLang[lang]`，fallback chain `[lang] → zh → 舊欄位`
- Admin CRUD 介面（`frontend/src/features/admin/`）：表單加多語 tab + 等級門檻 input
- 重跑 seed：`cd functions && npx tsx src/seed/fateCards.ts` + `insuranceProducts.ts`（注意這些是直接寫 prod，無 --apply flag，跑前先確認）

#### T3. 每日測驗核心（~2d）
**規格**（需求書 §3.1，詳見 `requirements-annotations.md`）：
- 題庫 = 所有單元的「小測驗」+「小議題測驗」題目
- 每日隨機抽 5 題，每題標註「第幾課第幾單元」
- 詳解處標註未上過內容（**依賴 T5 解鎖機制**，可先留 TODO）
- 獎勵：基礎 200 + 答對×20（最高 300）+ 鼓勵文案
- 每日一次（`user.dailyTaskStatus.dailyQuizCompleted`）
**現況**：HomePage tile 是 placeholder（`linkTo: '/course'`），無實際邏輯
**改法**：
- 題庫聚合：掃 `stages/{s}/lessons/{l}/units/{u}` 的 `components.quiz` + `components.topicQuiz`
- 新增 `/daily-quiz` 頁面 + route
- 新增 `completeDailyQuiz` Cloud Function（基礎 200 + 答對×20）
- HomePage tile 改 `linkTo: '/daily-quiz'`
- 題庫不足 5 題時的 fallback（早期只有 lesson-1）
- 鼓勵文案（全對/過半/不及格 三種）+ 每日重置時間（建議台北 00:00）

#### T4. A1+A2 章節完成狀態 + 吉祥物導引（~1d）
**規格**（需求書 §5.2）：
- 已完成章節卡片背景變綠（讀 `users/{uid}/courseProgress.completedChapters`）
- 吉祥物對話框指向下一個未完成單元
**檔案**：`frontend/src/features/learn/pages/CourseDetailPage.tsx`

#### T6. A4 topic / topicQuiz 章節類型（~1d）
**規格**：CMS 已有 `topic`/`topicQuiz` component 資料（unit-1-2、unit-1-4），前端尚未支援為 chapter view。
**現況**：前端 chapter type 只有 story/knowledge/quiz/game（`useChapterContent.ts`）
**改法**：
- chapter type 列表加 `topic`/`topicQuiz`
- 新增 `TopicView`（可複用 KnowledgeView）/ `TopicQuizView`（可複用 QuizView）
- `CourseDetailPage` S 型路徑加這兩種 icon/label

### 🔴 卡外部依賴

#### T5. A3 解鎖機制（~1d）— 卡「解鎖規則表」
**規格**（需求書 §5.1）：已解鎖彩色 / 待解鎖灰+鎖頭。解鎖條件 = 等級門檻 OR 前一課完成。
**阻塞**：需使用者提供「15 lessons 各自的解鎖門檻表」
**改法**：course/lesson schema 加 `prerequisiteLessonId` + `requiredLevel`；前端 `CourseListPage` / `CourseDetailPage` 套用
**連動**：T3 每日測驗的「未上過提示」依賴此

#### T7. Sync script htmlByLang（~0.5d）— 卡 lesson-7
**現況**：`functions/scripts/sync-cms-lesson.ts` 第 243 行只讀舊 `d.html` 欄位（已不存在於新結構）
**改法**：讀 `htmlByLang.zh/ja/en`，各上傳 Storage 為 `game.{lang}.html`；`gameMeta` 保留 `scoreThresholds`/`scoreCoinRewards`，不要把 htmlByLang 原文塞進 Firestore（會過大）
**阻塞**：等 lesson-7 unit-7-1 升級後一起 `--apply`
**之後**：前端遊戲改讀 `htmlByLang[lang]` + CMS 的 scoreThresholds/scoreCoinRewards（移除 `gameTranslations.ts` runtime translate + 移除 `gameScoring.ts` 寫死門檻）

#### T8. Admin「同步 CMS」按鈕（~2d）
把 `sync-cms-lesson.ts` 包成 admin-only Callable Cloud Function + Admin UI 觸發按鈕 + 進度/結果顯示。沿用現有 `user.role === 'admin'` 機制。

### 🟡 後期（上線正式版）

#### T9. Figma pixel-perfect 對齊（~6d）— 卡 Figma 訂閱
- 使用者將訂閱 Figma Professional / Dev seat，用官方 Dev Mode MCP
- **需設計一個 `figma-fidelity` subagent**（用 skill-creator）：抓 Figma frame → 列差異 → 用 design token 改 Tailwind → build 驗證；不准 Write 新檔、不改 business logic
- 既有 ~15 頁面分 4 batch（首頁/簽到/排行 → 課程系列 → 股票/儲蓄/保險 → 收支/Header/Admin）
- 先抽 design token 更新 `tailwind.config.ts`

#### T10. 平板支援（~1.5d）
網頁需可在 iPad / Android 平板瀏覽器使用。重點檢查：股票/儲蓄 `grid-cols-2` 分欄、Hover Tooltip 改 tap、S 型路徑窄螢幕、Modal 寬度、觸控目標 ≥44px。建議併入 T9 / 上線測試。

#### T11. i18n 框架 + bundle 拆分 + 隱私頁（~4.5d）
- react-i18next 取代手寫 `tUI()` / `*_JA` 對照表
- 移除 `gameTranslations.ts`（CMS 多語就位後）
- React.lazy 拆 Remotion / 章節頁（目前 bundle 1.4MB）
- 語言切換 UI（Header 加切換器，取代 forcedLanguage flag）
- 隱私權政策 + 服務條款頁面

---

## 4. 任務依賴圖

```
解鎖規則表(使用者) ──► T5 解鎖機制 ──► T3 每日測驗「未上過提示」
lesson-7升級(同事) ──► T7 sync htmlByLang ──► (前端讀 htmlByLang, 移除過渡方案)
Figma訂閱(使用者) ──► figma-fidelity subagent ──► T9 對齊

無依賴可立即動：T1, T2, T3核心, T4, T6, T8
```

---

## 5. 使用者待辦（外部依賴）

1. CMS 同事補 **lesson-7 unit-7-1** 三語（CMS 後台 → lesson-7 → unit-7-1 → Game tab → 「更新分享」）
2. 訂閱 **Figma Professional/Dev seat** + 提供 Figma 檔案 URL + 開 Dev Mode MCP
3. 決定 **15 lessons 解鎖規則表**（等級門檻 / 前置課程）
4. 決定 **正式帳號機制**（SSO / 自助註冊 / Admin 建帳號）— M1 用測試帳號過渡
5. PM 補規格：命運卡完整清單、保險對應 category、變動任務池、鼓勵文案（見 `requirements-annotations.md`）

---

## 6. 測試環境

- **Preview URL**：`https://oa-coin-quest--cms-sync-test-2gkg8mpv.web.app`（會過期，需重 deploy 取新 URL）
- **測試帳號**（密碼統一 `test1234`）：
  | Email | 角色 | 狀態 |
  |---|---|---|
  | `admin@test.local` | admin | Lv.5 / $50000 |
  | `student-1@test.local` | 新手 | Lv.1 / $1000 |
  | `student-2@test.local` | 中等 | Lv.3 / $10000 + 儲蓄 |
  | `student-3@test.local` | 進階 | Lv.5 / $30000 + 儲蓄 |
  | `student-4@test.local` | 測續保 | Lv.2 / $5000 |
  | `student-5@test.local` | 負餘額 | Lv.1 / $-2000 |
- **Firebase 設定**：Email/Password 登入方式已在 Console 啟用

---

## 7. 上線前測試 Checklist（T9/T10 後執行）

### 🔴 必測
- [ ] 端對端：登入 → 簽到 → 上課 → 交易 → 排行榜
- [ ] 金錢守恆：所有交易進出對帳 cashTransactions
- [ ] 跨裝置：iPhone Safari / Android Chrome / 桌面 Chrome / **平板**
- [ ] 三語切換無殘留 / 破版
- [ ] 斷網重試不重複發薪、競態（連點簽到只發一次）
- [ ] 權限隔離：學生打 admin API → 403
- [ ] 時區邊界（台北 00:00 跨日）
- [ ] 小遊戲金幣領取上限 3 次正確

### 🟡 應測
- [ ] 100 人同時簽到 / 看排行榜效能
- [ ] 影片載入失敗 fallback
- [ ] 超長 quiz / story 文字不破版
- [ ] 股市休市日 / 跨年股價邏輯

---

## 8. 常用指令

```bash
# 驗證 CMS 多語
cd functions && npx tsx scripts/probe-cms-game.ts

# 同步 CMS lesson（dry-run / apply）
cd functions && npx tsx scripts/sync-cms-lesson.ts stage-1 lesson-1
cd functions && npx tsx scripts/sync-cms-lesson.ts stage-1 lesson-1 --apply

# seed 測試帳號
cd functions && npx tsx scripts/seed-test-users.ts --apply

# 前端 build + 部署 preview
cd frontend && npm run build
npx firebase hosting:channel:deploy cms-sync-test

# 部署 functions
cd functions && npm run deploy
```

---

## 9. 開工建議

**第一個 session 建議從 T1（小遊戲 3 次金幣）開始**：最小、無依賴、需求明確、能驗證後端改動模式。接著 T2（schema 擴充）→ T4（章節狀態）→ T6（topic）。T3/T5 待解鎖規則表，T7 待 lesson-7，T9 待 Figma。

每完成一項 commit 後依 `CLAUDE.md` 規範更新 `doc/todo.md` + `doc/spec.md`。
