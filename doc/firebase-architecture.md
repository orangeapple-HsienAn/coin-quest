# Firebase 架構規劃

## 1. Firebase 服務配置

| 服務 | 用途 |
|------|------|
| **Firebase Authentication** | 使用者身份驗證 |
| **Cloud Firestore** | 主要資料庫 |
| **Cloud Functions** | 後端邏輯、排程任務 |
| **Firebase Hosting** | 前端靜態網站託管 |
| **Cloud Storage** | 圖片、素材儲存 |

---

## 2. 專案結構

```
coin-quest/
├── doc/                        # 規格文件
│   ├── spec.md
│   ├── visual-spec.md
│   ├── data-schema.md
│   └── firebase-architecture.md
├── frontend/                   # 前端應用
│   ├── src/
│   ├── public/
│   ├── package.json
│   └── vite.config.ts
├── functions/                  # Cloud Functions
│   ├── src/
│   ├── package.json
│   └── tsconfig.json
├── firestore.rules             # Firestore 安全規則
├── firestore.indexes.json      # Firestore 索引
├── storage.rules               # Storage 安全規則
├── firebase.json               # Firebase 配置
└── .firebaserc                 # Firebase 專案別名
```

---

## 3. Firebase Authentication

### 3.1 啟用的登入方式
- Email/Password（主要）
- Google 登入（選用）

### 3.2 使用者建立流程
1. 使用者註冊/登入
2. Cloud Function `onUserCreate` 觸發
3. 建立 `users/{uid}` 文件，初始化預設資料

---

## 4. Cloud Firestore

### 4.1 資料庫位置
- **Location**: `asia-east1` (台灣)

### 4.2 安全規則
詳見 `data-schema.md` 安全規則章節

### 4.3 索引
需建立的複合索引：

```json
{
  "indexes": [
    {
      "collectionGroup": "users",
      "queryScope": "COLLECTION",
      "fields": [
        { "fieldPath": "level", "order": "ASCENDING" },
        { "fieldPath": "totalAssets", "order": "DESCENDING" }
      ]
    },
    {
      "collectionGroup": "cashTransactions",
      "queryScope": "COLLECTION",
      "fields": [
        { "fieldPath": "createdAt", "order": "DESCENDING" }
      ]
    },
    {
      "collectionGroup": "stockPriceHistory",
      "queryScope": "COLLECTION",
      "fields": [
        { "fieldPath": "stockId", "order": "ASCENDING" },
        { "fieldPath": "date", "order": "DESCENDING" }
      ]
    }
  ]
}
```

---

## 5. Cloud Functions

### 5.1 Runtime
- **Node.js**: 22
- **Region**: `asia-east1`

### 5.2 Functions 清單

#### 認證觸發
| Function | 觸發條件 | 說明 |
|----------|----------|------|
| `onUserCreate` | `auth.user().onCreate()` | 建立使用者初始資料 |

#### HTTP Functions (API)
| Function | 方法 | 說明 |
|----------|------|------|
| `checkIn` | POST | 每日簽到、領薪水、抽風險卡 |
| `buyStock` | POST | 購買股票 |
| `sellStock` | POST | 賣出股票 |
| `deposit` | POST | 存款至銀行 |
| `withdraw` | POST | 從銀行提款 |
| `buyInsurance` | POST | 購買保險 |
| `claimInsurance` | POST | 保險理賠 |
| `completeChapter` | POST | 完成課程章節 |
| `completeTask` | POST | 完成每日任務 |

#### 排程 Functions
| Function | 排程 | 說明 |
|----------|------|------|
| `resetDailyTasks` | 每日 00:00 | 重置所有使用者每日任務狀態 |
| `updateStockPrices` | 每日 09:00 | 更新股票價格 |
| `calculateInterest` | 每月 1 日 | 計算並發放儲蓄利息 |
| `expireInsurances` | 每日 00:00 | 檢查並標記過期保險 |
| `assignDailyVariableTask` | 每日 00:00 | 為使用者分配變動任務 |

#### Callable Functions
| Function | 說明 |
|----------|------|
| `getLeaderboard` | 取得排行榜資料 |
| `getUserAssetSummary` | 取得使用者資產摘要 |

### 5.3 Functions 目錄結構

```
functions/
├── src/
│   ├── index.ts                # 進入點，匯出所有 functions
│   ├── auth/
│   │   └── onUserCreate.ts
│   ├── api/
│   │   ├── checkIn.ts
│   │   ├── stock.ts
│   │   ├── savings.ts
│   │   ├── insurance.ts
│   │   ├── course.ts
│   │   └── task.ts
│   ├── scheduled/
│   │   ├── resetDailyTasks.ts
│   │   ├── updateStockPrices.ts
│   │   ├── calculateInterest.ts
│   │   └── expireInsurances.ts
│   ├── callable/
│   │   ├── getLeaderboard.ts
│   │   └── getUserAssetSummary.ts
│   └── utils/
│       ├── firestore.ts
│       ├── validation.ts
│       └── transaction.ts
├── package.json
└── tsconfig.json
```

---

## 6. Firebase Hosting

### 6.1 配置

```json
{
  "hosting": {
    "public": "frontend/dist",
    "ignore": ["firebase.json", "**/.*", "**/node_modules/**"],
    "rewrites": [
      {
        "source": "**",
        "destination": "/index.html"
      }
    ],
    "headers": [
      {
        "source": "**/*.@(js|css)",
        "headers": [
          {
            "key": "Cache-Control",
            "value": "public, max-age=31536000, immutable"
          }
        ]
      }
    ]
  }
}
```

### 6.2 自訂網域
- 正式環境：`app.orangeapple.com.tw`（或其他自訂網域）
- 預設網域：`{project-id}.web.app`

---

## 7. Cloud Storage

### 7.1 Bucket 結構

```
gs://{project-id}.appspot.com/
├── courses/                    # 課程素材
│   └── {courseId}/
│       ├── thumbnail.png
│       └── chapters/
│           └── {chapterId}/
│               └── *.png
├── avatars/                    # 使用者頭像選項
│   └── {avatarId}.png
├── insurance/                  # 保險圖示
│   └── {productId}.png
├── risk-cards/                 # 風險卡圖片
│   └── {cardId}.png
├── levels/                     # 等級徽章
│   └── {level}.png
└── ui/                         # UI 素材
    ├── mascots/
    └── decorations/
```

### 7.2 安全規則

```javascript
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    // 所有素材為公開唯讀
    match /{allPaths=**} {
      allow read: if true;
      allow write: if false;  // 僅透過 Admin SDK 上傳
    }
  }
}
```

---

## 8. 環境配置

### 8.1 Firebase 專案

| 環境 | 專案 ID | 用途 |
|------|---------|------|
| Development | `coin-quest-dev` | 本地開發、測試 |
| Production | `coin-quest-prod` | 正式環境 |

### 8.2 .firebaserc

```json
{
  "projects": {
    "default": "coin-quest-dev",
    "dev": "coin-quest-dev",
    "prod": "coin-quest-prod"
  }
}
```

### 8.3 環境變數

透過 Firebase Functions 的 Secret Manager 管理敏感資訊：

```bash
# 設定 secret
firebase functions:secrets:set STOCK_API_KEY
```

---

## 9. 部署流程

### 9.1 開發環境部署

```bash
# 部署全部
npm run deploy

# 僅部署 Functions
firebase deploy --only functions -P dev

# 僅部署 Hosting
firebase deploy --only hosting -P dev

# 僅部署 Firestore 規則
firebase deploy --only firestore:rules -P dev
```

### 9.2 正式環境部署

```bash
# 建置前端
cd frontend && npm run build

# 部署至正式環境
firebase deploy -P prod
```

### 9.3 npm scripts

```json
{
  "scripts": {
    "build": "cd frontend && npm run build",
    "deploy": "npm run build && firebase deploy -P prod",
    "deploy:dev": "npm run build && firebase deploy -P dev",
    "deploy:functions": "firebase deploy --only functions",
    "deploy:hosting": "npm run build && firebase deploy --only hosting",
    "deploy:rules": "firebase deploy --only firestore:rules,storage"
  }
}
```

---

## 10. 本地開發

### 10.1 Firebase Emulators

```bash
# 啟動模擬器
firebase emulators:start
```

### 10.2 firebase.json emulator 配置

```json
{
  "emulators": {
    "auth": {
      "port": 9099
    },
    "functions": {
      "port": 5001
    },
    "firestore": {
      "port": 8080
    },
    "hosting": {
      "port": 5000
    },
    "storage": {
      "port": 9199
    },
    "ui": {
      "enabled": true,
      "port": 4000
    }
  }
}
```

### 10.3 前端連接 Emulator

```typescript
// frontend/src/lib/firebase.ts
import { connectAuthEmulator } from 'firebase/auth';
import { connectFirestoreEmulator } from 'firebase/firestore';
import { connectFunctionsEmulator } from 'firebase/functions';
import { connectStorageEmulator } from 'firebase/storage';

if (import.meta.env.DEV) {
  connectAuthEmulator(auth, 'http://localhost:9099');
  connectFirestoreEmulator(firestore, 'localhost', 8080);
  connectFunctionsEmulator(functions, 'localhost', 5001);
  connectStorageEmulator(storage, 'localhost', 9199);
}
```

---

## 11. 監控與日誌

### 11.1 Firebase Console
- Authentication：使用者管理
- Firestore：資料瀏覽、使用量
- Functions：執行日誌、錯誤追蹤
- Hosting：部署歷史、流量

### 11.2 Google Cloud Console
- Cloud Logging：詳細日誌查詢
- Error Reporting：錯誤彙總
- Cloud Monitoring：自訂警報

---

## 12. 費用估算

### 12.1 免費額度（Spark Plan 限制）

| 服務 | 免費額度 |
|------|----------|
| Authentication | 無限制 |
| Firestore | 1GB 儲存、50K 讀/日、20K 寫/日 |
| Functions | 2M 呼叫/月、400K GB-秒/月 |
| Hosting | 10GB 儲存、360MB/日 傳輸 |
| Storage | 5GB 儲存、1GB/日 下載 |

### 12.2 建議
- MVP 階段使用 Spark Plan（免費）
- 超過免費額度後升級至 Blaze Plan（隨用隨付）
- 設定預算警報避免超支
