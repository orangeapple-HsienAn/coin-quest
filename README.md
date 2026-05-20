# Coin Quest 財商學習平台

一個遊戲化的財商學習平台，讓使用者透過遊戲方式學習理財知識。

## 技術棧

- **Frontend**: React 19 + TypeScript + Vite + Tailwind CSS v4
- **Backend**: Firebase (Auth, Firestore, Cloud Functions, Storage)
- **State Management**: TanStack Query + Zustand

## 本機開發

### 前置需求

- Node.js 22+
- Firebase CLI

```bash
npm install -g firebase-tools
```

### 步驟一：取得專案存取權

請聯絡專案管理員，將你的 Google 帳號加入 Firebase 專案 `oa-coin-quest`，再登入：

```bash
firebase login
```

### 步驟二：安裝依賴

```bash
npm install && cd frontend && npm install && cd ../functions && npm install && cd ..
```

### 步驟三：啟動開發環境

需要開啟 **兩個終端**：

**終端 1 - 啟動 Firebase Emulators：**
```bash
npm run emulators
```

Emulators 啟動後可以在 http://localhost:4000 查看 Emulator UI。

**終端 2 - 啟動 Vite 開發伺服器：**
```bash
npm run dev
```

開啟 http://localhost:5173 即可進行開發，支援 HMR 自動重整。

### 步驟四：寫入初始資料（Seed）

Emulator 啟動後 Firestore 預設為空，需手動執行 seed 寫入初始資料。

seed 指令已內建 `FIRESTORE_EMULATOR_HOST=localhost:8080`，執行時會自動寫入 Emulator 而非 production。但腳本使用 `applicationDefault()` 初始化，仍需本機 gcloud 憑證（僅首次需要）：

```bash
gcloud auth application-default login
```

接著確認 Emulator 已在執行，再寫入所有初始資料：

```bash
cd functions
npm run seed:levels      # 等級與稱號（Lv.1~10）
npm run seed:fateCards   # 命運卡（風險/中立/獎勵）
npm run seed:insurance   # 保險產品（意外險、醫療險等 5 種）
npm run seed:stocks      # 股票標的（台灣50成分股 + ETF + 加權指數）
npm run seed:courses     # 課程與章節內容
cd ..
```

### Emulator Ports

| 服務 | Port |
|------|------|
| Emulator UI | 4000 |
| Auth | 9099 |
| Firestore | 8080 |
| Functions | 5001 |
| Hosting | 5002 |
| Storage | 9199 |

## 部署 Production

### 前置需求

需具備 Firebase 專案的部署權限（Editor 以上）。

### 部署指令

```bash
npm run deploy
```

此指令會自動執行 frontend build 後，將 Hosting、Cloud Functions、Firestore Rules 一併部署至 Firebase。

### 寫入資料至 Production

各 seed 腳本使用固定 Document ID 搭配 `.set()` 寫入，重複執行會覆蓋原有資料，不會產生重複。需具備 gcloud 憑證：

```bash
cd functions
npm run seed:prod:levels      # 等級與稱號（Lv.1~10）
npm run seed:prod:fateCards   # 命運卡（風險/中立/獎勵）
npm run seed:prod:insurance   # 保險產品（意外險、醫療險等 5 種）
npm run seed:prod:stocks      # 股票標的（台灣50成分股 + ETF + 加權指數）
npm run seed:prod:courses     # 課程與章節內容
cd ..
```

## 課程內容製作

課程資料的製作流程分為三個階段，各階段有專屬的 Claude Code Skill 輔助。

### 製作流程

```
課綱 (doc/curriculums/)
    ↓  /write-lesson
教案 (doc/lesson-plans/)
    ↓  /generate-lesson-video
影片 (video/out/*.mp4)
    ↓  上傳至 Firebase Storage
前端播放
```

### 階段一：課綱

位於 `doc/curriculums/`，定義每個學習階段的教學目標與學習元素。

目前包含：
- `stage-1.md` — 第一階段（15 堂）：貨幣演變、家庭財務、消費決策

### 階段二：教案（Lesson Plan）

位於 `doc/lesson-plans/`，每堂課一份，定義章節結構與影片腳本。

每堂課包含 5 個章節：小故事、小知識 ×2、小測驗、小遊戲。
目前已完成第一階段全部 15 堂（`stage-1-lesson-01.md` ～ `stage-1-lesson-15.md`）。

使用 `/write-lesson` Skill 從課綱自動生成教案：

```
/write-lesson stage-1 lesson-4
```

### 階段三：課程影片

位於 `video/`，使用 Remotion 製作動態課程影片（小故事 / 小知識章節）。
渲染完成的 MP4 放在 `video/out/`，並上傳至 Firebase Storage 供前端播放。

影片製作需要 Gemini API Key（用於生成配圖與 TTS 語音）：

```bash
export GEMINI_API_KEY=your_api_key_here
```

使用 `/generate-lesson-video` Skill 從教案自動製作影片：

```
/generate-lesson-video stage-1 lesson-4 story
```

### 專屬 Skills

本專案搭配以下 Claude Code Skill，使用方式為在 Claude Code 中輸入對應指令：

| Skill | 指令 | 用途 |
|-------|------|------|
| write-lesson | `/write-lesson` | 從課綱生成完整教案（含影片腳本、測驗題、遊戲設計） |
| generate-lesson-video | `/generate-lesson-video` | 從教案製作 Remotion 課程影片（含配圖生成、TTS 語音） |
| generate-art-asset | `/generate-art-asset` | 使用 Gemini 生成符合專案風格的美術素材（支援去背） |

## 專案結構

```
coin-quest/
├── frontend/           # React 前端應用
│   ├── src/
│   │   ├── components/ # 共用元件
│   │   ├── features/   # 功能模組
│   │   ├── hooks/      # Custom Hooks
│   │   ├── lib/        # 工具函式、Firebase 設定
│   │   └── types/      # TypeScript 型別定義
│   └── dist/           # Build 產物
├── functions/          # Cloud Functions
│   └── src/
│       ├── api/        # HTTP Callable Functions
│       ├── auth/       # Auth Triggers
│       ├── scheduled/  # Scheduled Functions
│       └── seed/       # 初始資料腳本
├── video/              # Remotion 課程影片製作
├── doc/                # 專案文件
└── emulator-data/      # Emulator 資料 (git ignored)
```

## 注意事項

- 開發時請使用 `localhost:5173`（Vite dev server），不要使用 `localhost:5002`（Hosting emulator）
- `localhost:5173` 有 HMR 自動重整，`localhost:5002` 需要手動 rebuild
- Emulator 資料會自動保存在 `emulator-data/`，關閉後重啟會保留資料
