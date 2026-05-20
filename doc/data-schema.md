# Data Schema 規格文件

本文件定義 Firestore 資料庫的資料結構。

## 資料庫架構總覽

```
firestore/
├── users/                      # 使用者
│   └── {userId}/
│       ├── checkIns/           # 簽到紀錄
│       ├── cashTransactions/   # 現金交易紀錄
│       ├── stockHoldings/      # 股票持倉
│       ├── stockTransactions/  # 股票交易紀錄
│       ├── savingsTransactions/# 儲蓄交易紀錄
│       ├── insurances/         # 持有保險
│       ├── courseProgress/     # 課程進度
│       └── taskCompletions/    # 任務完成紀錄
├── courses/                    # 課程定義
│   └── {courseId}/
│       └── chapters/           # 章節定義
├── stocks/                     # 股票定義（含 priceHistory 歷史收盤價）
├── insuranceProducts/          # 保險產品定義
├── fateCards/                  # 命運卡定義
├── levels/                     # 等級定義
└── dailyTaskPool/              # 變動任務池
```

---

## 1. users

使用者主文件。

**Collection**: `users`
**Document ID**: `{userId}` (Firebase Auth UID)

```typescript
interface User {
  // 基本資訊
  displayName: string;          // 暱稱
  avatarId: string;             // 頭像 ID
  role?: string;                // 角色（'admin' 可訪問後台，手動設定）
  createdAt: Timestamp;         // 註冊時間
  lastLoginAt: Timestamp;       // 最後登入時間

  // 等級與經驗
  level: number;                // 當前等級
  experience: number;           // 當前經驗值

  // 資產（denormalized，方便查詢排行榜）
  coins: number;                // 可用現金（金幣）
  totalStockValue: number;      // 股票總市值
  totalSavings: number;         // 銀行儲蓄總額
  totalAssets: number;          // 資產總額 = coins + totalStockValue + totalSavings

  // 保險數量（denormalized）
  activeInsuranceCount: number; // 有效保險數量

  // 今日任務狀態（每日重置）
  dailyTaskStatus: {
    date: string;               // 格式：YYYY-MM-DD
    dailyQuizCompleted: boolean;
    variableTaskId: string | null;     // 今日變動任務 ID
    variableTaskCompleted: boolean;
    courseCompleted: boolean;
  };
}
```

### 1.1 users/{userId}/checkIns

簽到紀錄。

**Document ID**: `{YYYY-MM-DD}`

```typescript
interface CheckIn {
  date: string;                 // YYYY-MM-DD
  checkedInAt: Timestamp;       // 簽到時間
  salaryReceived: number;       // 領取的薪水
  levelAtCheckIn: number;       // 簽到時的等級

  // 命運卡
  fateCard: {
    cardId: string;             // 命運卡 ID
    type: 'risk' | 'neutral' | 'reward';  // 類型
    title: string;              // 標題
    description: string;        // 描述
    coinLoss: number;           // 損失金額（risk 類型）
    coinGain: number;           // 獲得金額（reward 類型）
    insuranceProductId: string | null;  // 對應保險產品
    usedInsurance: boolean;     // 是否使用保險
    claimAmount: number;        // 理賠金額（若使用保險）
  } | null;
}
```

### 1.2 users/{userId}/cashTransactions

現金交易紀錄。

**Document ID**: auto-generated

```typescript
interface CashTransaction {
  type: 'income' | 'expense';
  category: 'salary' | 'task_reward' | 'quiz_reward' | 'course_reward'
          | 'stock_buy' | 'stock_sell' | 'stock_dividend'
          | 'savings_deposit' | 'savings_withdraw' | 'savings_interest'
          | 'insurance_buy' | 'insurance_claim'
          | 'risk_card_loss';
  amount: number;               // 正數為收入，負數為支出
  balance: number;              // 交易後餘額
  note: string;                 // 備註
  relatedId: string | null;     // 關聯 ID（股票代號、保險 ID 等）
  createdAt: Timestamp;
}
```

### 1.3 users/{userId}/stockHoldings

股票持倉。

**Document ID**: `{stockId}`

```typescript
interface StockHolding {
  stockId: string;              // 股票 ID
  stockName: string;            // 股票名稱（denormalized）
  quantity: number;             // 持有數量（股）
  totalCost: number;            // 總成本
  averageCost: number;          // 平均成本
  updatedAt: Timestamp;
}
```

### 1.4 users/{userId}/stockTransactions

股票交易紀錄。

**Document ID**: auto-generated

```typescript
interface StockTransaction {
  stockId: string;
  stockName: string;
  type: 'buy' | 'sell' | 'dividend';
  quantity: number;             // 交易數量
  price: number;                // 成交價格
  totalAmount: number;          // 總金額
  realizedGain: number | null;  // 已實現損益（僅 sell 時）
  createdAt: Timestamp;
}
```

### 1.5 users/{userId}/savingsTransactions

儲蓄交易紀錄。

**Document ID**: auto-generated

```typescript
interface SavingsTransaction {
  type: 'deposit' | 'withdraw' | 'interest';
  amount: number;               // 金額
  balance: number;              // 交易後儲蓄餘額
  note: string;                 // 備註
  createdAt: Timestamp;
}
```

### 1.6 users/{userId}/insurances

持有的保險。

**Document ID**: `{insuranceProductId}`

```typescript
interface UserInsurance {
  insuranceProductId: string;
  insuranceName: string;        // denormalized
  purchasedAt: Timestamp;       // 購買時間
  expiresAt: Timestamp;         // 到期時間
  premium: number;              // 保費
  claimAmount: number;          // 理賠金額
  status: 'active' | 'expired';
}
```

### 1.7 users/{userId}/courseProgress

課程進度。

**Document ID**: `{courseId}`

```typescript
interface CourseProgress {
  courseId: string;
  courseName: string;           // denormalized
  status: 'locked' | 'in_progress' | 'completed';
  unlockedAt: Timestamp | null;
  completedAt: Timestamp | null;

  // 章節進度 map
  chapters: {
    [chapterId: string]: {
      status: 'locked' | 'completed';
      completedAt: Timestamp | null;
      experienceEarned: number;
      coinsEarned: number;
    };
  };
}
```

### 1.8 users/{userId}/taskCompletions

任務完成紀錄。

**Document ID**: `{YYYY-MM-DD}_{taskType}`

```typescript
interface TaskCompletion {
  date: string;                 // YYYY-MM-DD
  taskType: 'daily_quiz' | 'variable_task' | 'course_completion';
  taskId: string | null;        // 變動任務的 ID
  coinsEarned: number;
  experienceEarned: number;
  completedAt: Timestamp;
}
```

---

## 2. courses

課程定義（管理後台維護）。

**Collection**: `courses`
**Document ID**: `{courseId}`

```typescript
interface Course {
  name: string;                 // 課程名稱
  description: string;          // 課程描述
  iconUrl: string;              // 圖示（emoji 字元）
  order: number;                // 排序
  unlockLevel: number;          // 解鎖所需等級
  chapterCount: number;         // 章節數量
  isActive: boolean;            // 是否啟用
}
```

### 2.1 courses/{courseId}/chapters

章節定義。

**Document ID**: `{chapterId}`

```typescript
interface Chapter {
  title: string;                // 章節標題
  type: 'story' | 'knowledge' | 'game' | 'quiz';
  order: number;                // 排序

  // 獎勵
  experienceReward: number;
  coinReward: number;

  // 內容（依類型不同）
  content: StoryContent | KnowledgeContent | QuizContent;
}

interface StoryContent {
  videoUrl: string;             // Vimeo 影片 URL（暫為空）
  scenarios: {
    label: string;              // 選項標題（如 "A. 全部拿去買玩具"）
    description: string;        // 選項描述
    result: string;             // 結果文字
    stars: number;              // 星級評價（1~3）
    experienceReward: number;   // 該選項的經驗獎勵
  }[];
}

interface KnowledgeContent {
  videoUrl: string;             // Vimeo 影片 URL（暫為空）
}

interface QuizContent {
  questions: {
    question: string;
    options: string[];
    correctIndex: number;
    explanation: string;
  }[];
}
```

---

## 3. stocks

股票定義。

**Collection**: `stocks`
**Document ID**: `{stockId}`

```typescript
interface Stock {
  symbol: string;               // 股票代號（如 2330）
  name: string;                 // 股票名稱（如 台積電）
  currentPrice: number;         // 當前價格
  previousClose: number;        // 前一日收盤價
  change: number;               // 漲跌
  changePercent: number;        // 漲跌幅 %
  isIndex: boolean;             // 是否為指數（如加權指）
  isActive: boolean;            // 是否可交易
  updatedAt: Timestamp;

  // 歷史收盤價（object field，由 scheduled function 每日寫入）
  priceHistory?: {
    [date: string]: number;     // 'YYYY-MM-DD': 收盤價
  };
}
```

---

## 4. insuranceProducts

保險產品定義。

**Collection**: `insuranceProducts`
**Document ID**: `{insuranceProductId}`

```typescript
interface InsuranceProduct {
  name: string;                 // 保險名稱
  description: string;          // 保險說明
  iconUrl: string;              // 圖示
  claimAmount: number;          // 理賠金額
  premium: number;              // 保費
  durationDays: number;         // 效期（天）
  fateCardCategory: string;     // 對應的風險卡類別
  isActive: boolean;
  order: number;                // 排序
}
```

---

## 5. fateCards

命運卡定義。支援三種類型：risk（風險損失）、neutral（無事發生）、reward（正面獎勵）。

**Collection**: `fateCards`
**Document ID**: `{fateCardId}`

```typescript
interface FateCard {
  type: 'risk' | 'neutral' | 'reward';  // 命運卡類型
  title: string;                // 標題
  description: string;          // 描述
  imageUrl: string;             // 圖片
  coinLoss: number;             // 損失金幣（risk 類型使用）
  coinGain: number;             // 獲得金幣（reward 類型使用）
  category: string;             // 類別（risk 類型對應保險的 fateCardCategory）
  weight: number;               // 抽中權重
  isActive: boolean;
}
```

---

## 6. levels

等級定義。

**Collection**: `levels`
**Document ID**: `{level}` (數字字串，如 "1", "2")

```typescript
interface Level {
  level: number;                // 等級
  name: string;                 // 等級名稱（如「打工新手」）
  dailySalary: number;          // 日薪
  experienceRequired: number;   // 升到此等級所需累積經驗
  badgeUrl: string;             // 等級徽章圖示
}
```

---

## 7. dailyTaskPool

變動任務池。

**Collection**: `dailyTaskPool`
**Document ID**: `{taskId}`

```typescript
interface DailyTask {
  title: string;                // 任務標題
  description: string;          // 任務描述
  type: string;                 // 任務類型
  coinsReward: number;          // 金幣獎勵
  experienceReward: number;     // 經驗獎勵
  condition: {                  // 完成條件
    type: 'visit_page' | 'complete_action' | 'reach_value';
    target: string;
    value: number | null;
  };
  isActive: boolean;
  weight: number;               // 抽中權重
}
```

---

## 8. 系統設定

**Collection**: `config`

### 8.1 config/system

系統全域設定。

```typescript
interface SystemConfig {
  bankInterestRate: number;     // 銀行年利率（如 0.0073 表示 0.73%）
  interestPayoutDay: number;    // 每月發放利息日
  maxInsurancePerType: number;  // 每種保險最多持有數量
  stockTradingEnabled: boolean; // 股票交易開關
  maintenanceMode: boolean;     // 維護模式
  updatedAt: Timestamp;
}
```

### 8.2 config/currentStockPrices

股票當日價格聚合文件（由 scheduled function 每日更新，前端列表頁 1 read 取得所有股價）。

```typescript
interface CurrentStockPrices {
  stocks: {
    [stockId: string]: {        // e.g. 'TW-2330'
      name: string;             // 股票名稱
      symbol: string;           // 股票代號
      price: number;            // 當日收盤價
      prevClose: number;        // 前一日收盤價
      change: number;           // 漲跌金額
      changePercent: number;    // 漲跌幅 %
      isIndex: boolean;         // 是否為指數
    };
  };
  updatedAt: Timestamp;
}
```

---

## 索引建議

### Composite Indexes

1. **排行榜查詢**
   ```
   Collection: users
   Fields: level ASC, totalAssets DESC
   ```

2. **現金交易查詢**
   ```
   Collection: users/{userId}/cashTransactions
   Fields: createdAt DESC
   ```

3. **股票交易查詢**
   ```
   Collection: users/{userId}/stockTransactions
   Fields: stockId ASC, createdAt DESC
   ```

---

## 安全規則重點

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // 使用者只能讀寫自己的資料
    match /users/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;

      match /{subcollection}/{docId} {
        allow read, write: if request.auth != null && request.auth.uid == userId;
      }
    }

    // 公開唯讀資料
    match /courses/{courseId} {
      allow read: if request.auth != null;
      match /chapters/{chapterId} {
        allow read: if request.auth != null;
      }
    }

    match /stocks/{stockId} {
      allow read: if request.auth != null;
    }

    match /levels/{level} {
      allow read: if request.auth != null;
    }

    match /insuranceProducts/{productId} {
      allow read: if request.auth != null;
    }

    match /fateCards/{cardId} {
      allow read: if request.auth != null;
    }

    match /config/{docId} {
      allow read: if request.auth != null;
    }
  }
}
```
