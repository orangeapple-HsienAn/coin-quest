# Frontend 技術棧

## 核心框架

| 類別 | 選擇 | 版本 |
|------|------|------|
| Framework | React | 19.2 |
| Build Tool | Vite | 7.3 |
| Language | TypeScript | 5.9 |

## 路由與狀態管理

| 類別 | 選擇 | 說明 |
|------|------|------|
| Routing | React Router | v7.13，SPA 路由 |
| Server State | TanStack Query | Firebase 資料快取與同步 |
| Client State | Zustand | 輕量、簡潔的全域狀態管理 |

## UI 與樣式

| 類別 | 選擇 | 說明 |
|------|------|------|
| CSS Framework | Tailwind CSS | v4.1，utility-first |
| Component Library | shadcn/ui | 可客製化、無 runtime |
| Icons | Lucide React | 輕量 icon 庫 |
| Animation | Framer Motion | 宣告式動畫、手勢支援 |
| Charts | Recharts | 股票走勢圖、圓餅圖 |

## 表單與驗證

| 類別 | 選擇 | 說明 |
|------|------|------|
| Form | React Hook Form | 高效能表單處理 |
| Validation | Zod | TypeScript-first schema 驗證 |

## Firebase 整合

| 類別 | 選擇 | 說明 |
|------|------|------|
| Firebase SDK | firebase | v12 modular SDK |
| React Hooks | react-firebase-hooks | Auth、Firestore hooks |

---

## 目錄結構

```
frontend/
├── public/
│   └── favicon.ico
├── src/
│   ├── main.tsx                    # 進入點
│   ├── App.tsx                     # 根元件、路由設定
│   ├── vite-env.d.ts
│   │
│   ├── components/                 # 共用元件
│   │   ├── ui/                     # shadcn/ui 元件
│   │   │   ├── button.tsx
│   │   │   ├── card.tsx
│   │   │   └── ...
│   │   ├── layout/                 # 版面元件
│   │   │   ├── Header.tsx
│   │   │   ├── PageContainer.tsx
│   │   │   └── BackButton.tsx
│   │   └── shared/                 # 業務共用元件
│   │       ├── CoinDisplay.tsx
│   │       ├── ExpDisplay.tsx
│   │       ├── AssetPieChart.tsx
│   │       └── ProgressBar.tsx
│   │
│   ├── features/                   # 功能模組
│   │   ├── auth/
│   │   │   ├── components/
│   │   │   ├── hooks/
│   │   │   └── pages/
│   │   │       ├── LoginPage.tsx
│   │   │       └── RegisterPage.tsx
│   │   ├── home/
│   │   │   ├── components/
│   │   │   │   ├── DailyTasks.tsx
│   │   │   │   ├── CheckInButton.tsx
│   │   │   │   ├── CourseEntryButton.tsx
│   │   │   │   └── AssetOverview.tsx
│   │   │   └── pages/
│   │   │       └── HomePage.tsx
│   │   ├── check-in/
│   │   │   ├── components/
│   │   │   │   ├── Calendar.tsx
│   │   │   │   ├── LevelProgress.tsx
│   │   │   │   └── FateCardModal.tsx
│   │   │   └── pages/
│   │   │       └── CheckInPage.tsx
│   │   ├── course/
│   │   │   ├── components/
│   │   │   │   ├── CourseCard.tsx
│   │   │   │   ├── ChapterNode.tsx
│   │   │   │   ├── StoryViewer.tsx
│   │   │   │   ├── KnowledgeViewer.tsx
│   │   │   │   ├── GamePlayer.tsx
│   │   │   │   └── QuizPlayer.tsx
│   │   │   └── pages/
│   │   │       ├── CourseListPage.tsx
│   │   │       ├── ChapterMapPage.tsx
│   │   │       └── ChapterPage.tsx
│   │   ├── cash/
│   │   │   ├── components/
│   │   │   │   └── TransactionTable.tsx
│   │   │   └── pages/
│   │   │       └── CashDetailPage.tsx
│   │   ├── investment/
│   │   │   ├── components/
│   │   │   │   ├── StockList.tsx
│   │   │   │   ├── StockChart.tsx
│   │   │   │   ├── TradePanel.tsx
│   │   │   │   └── GainLossTable.tsx
│   │   │   └── pages/
│   │   │       └── InvestmentPage.tsx
│   │   ├── savings/
│   │   │   ├── components/
│   │   │   │   ├── SavingsOverview.tsx
│   │   │   │   ├── DepositWithdrawModal.tsx
│   │   │   │   └── SavingsHistory.tsx
│   │   │   └── pages/
│   │   │       └── SavingsPage.tsx
│   │   ├── insurance/
│   │   │   ├── components/
│   │   │   │   ├── InsuranceCard.tsx
│   │   │   │   └── ClaimModal.tsx
│   │   │   └── pages/
│   │   │       └── InsurancePage.tsx
│   │   └── ranking/
│   │       ├── components/
│   │       │   ├── TopThree.tsx
│   │       │   └── RankingList.tsx
│   │       └── pages/
│   │           └── RankingPage.tsx
│   │
│   ├── hooks/                      # 共用 hooks
│   │   ├── useAuth.ts
│   │   └── useUser.ts
│   │
│   ├── lib/                        # 工具與設定
│   │   ├── firebase.ts             # Firebase 初始化
│   │   ├── utils.ts                # 共用工具函式
│   │   └── cn.ts                   # className 合併工具
│   │
│   ├── stores/                     # Zustand stores
│   │   └── uiStore.ts              # UI 狀態（modal、toast）
│   │
│   ├── types/                      # TypeScript 型別
│   │   ├── user.ts
│   │   ├── course.ts
│   │   ├── stock.ts
│   │   ├── insurance.ts
│   │   └── index.ts
│   │
│   └── styles/
│       └── globals.css             # Tailwind 全域樣式
│
├── index.html
├── package.json
├── tsconfig.json
├── tsconfig.node.json
├── vite.config.ts
├── tailwind.config.ts
├── postcss.config.js
└── eslint.config.js
```

---

## 路由結構

```typescript
const routes = [
  { path: '/login', element: <LoginPage /> },
  { path: '/register', element: <RegisterPage /> },
  {
    path: '/',
    element: <AuthLayout />,  // 需登入
    children: [
      { index: true, element: <HomePage /> },
      { path: 'check-in', element: <CheckInPage /> },
      { path: 'courses', element: <CourseListPage /> },
      { path: 'courses/:courseId', element: <ChapterMapPage /> },
      { path: 'courses/:courseId/:chapterId', element: <ChapterPage /> },
      { path: 'cash', element: <CashDetailPage /> },
      { path: 'investment', element: <InvestmentPage /> },
      { path: 'savings', element: <SavingsPage /> },
      { path: 'insurance', element: <InsurancePage /> },
      { path: 'ranking', element: <RankingPage /> },
    ],
  },
];
```

---

## 開發規範

### 元件命名
- 頁面元件：`*Page.tsx`
- 彈窗元件：`*Modal.tsx`
- 清單項目：`*Card.tsx`、`*Item.tsx`

### 檔案命名
- 元件檔案：PascalCase（`DailyTasks.tsx`）
- 工具/hooks：camelCase（`useAuth.ts`）
- 型別檔案：camelCase（`user.ts`）

### Import 順序
1. React / 外部套件
2. 內部 components
3. hooks / stores
4. lib / utils
5. types
6. styles

### 型別定義
- 所有 props 使用 interface 定義
- 匯出供其他模組使用的型別放在 `types/`
- 元件內部型別可定義在同一檔案

---

## 關鍵套件版本

```json
{
  "dependencies": {
    "react": "^19.2.3",
    "react-dom": "^19.2.3",
    "react-router": "^7.13.0",
    "@tanstack/react-query": "^5.90.20",
    "zustand": "^5.0.10",
    "firebase": "^12.8.0",
    "react-firebase-hooks": "^5.1.1",
    "framer-motion": "^12.29.0",
    "recharts": "^3.7.0",
    "react-hook-form": "^7.71.1",
    "zod": "^4.3.6",
    "@hookform/resolvers": "^5.2.2",
    "lucide-react": "^0.563.0",
    "clsx": "^2.1.1",
    "tailwind-merge": "^3.4.0"
  },
  "devDependencies": {
    "@types/react": "^19.2.9",
    "@types/react-dom": "^19.2.3",
    "typescript": "^5.9.3",
    "vite": "^7.3.1",
    "@vitejs/plugin-react": "^5.1.2",
    "tailwindcss": "^4.1.18",
    "postcss": "^8.5.6",
    "autoprefixer": "^10.4.23",
    "eslint": "^9.39.2",
    "@eslint/js": "^9.39.2",
    "typescript-eslint": "^8.53.1",
    "eslint-plugin-react-hooks": "^7.0.1"
  }
}
```
