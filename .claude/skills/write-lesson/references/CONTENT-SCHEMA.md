# Content Schema — Lesson Plan → Seed 資料對應

## Firestore 資料結構

### Course 文件

```
courses/{courseId}
```

```typescript
interface Course {
  name: string           // 課程主題名稱
  description: string    // 課程說明
  iconUrl: string        // emoji 圖示
  order: number          // 顯示順序
  unlockLevel: number    // 解鎖等級
  chapterCount: number   // 章節數
  isActive: boolean      // 是否啟用
}
```

### Chapter 文件

```
courses/{courseId}/chapters/{chapterId}
```

```typescript
interface Chapter {
  title: string
  type: 'story' | 'knowledge' | 'quiz' | 'game'
  order: number
  experienceReward: number
  coinReward: number
  content: StoryContent | KnowledgeContent | QuizContent | GameContent
}
```

## Content 型別

### StoryContent

```typescript
interface StoryContent {
  videoUrl: string    // 影片 URL（初始為空）
  scenarios: {
    label: string         // 'A. 全部拿去買玩具'
    description: string   // 選擇的行為描述（1 句）
    result: string        // 結果說明（1～2 句，帶教學意義）
    stars: number         // 星數（1、2 或 3）
    experienceReward: number  // 經驗值（10、20 或 30）
  }[]
}
```

**對應 lesson plan**：「情境選項 A/B/C」區塊。

### KnowledgeContent

```typescript
interface KnowledgeContent {
  videoUrl: string    // 影片 URL（初始為空）
}
```

> 注意：KnowledgeContent 僅有 videoUrl，影片內容（知識點、重點整理）由 course-video skill 從 lesson plan 讀取，不存在 Firestore 中。

**對應 lesson plan**：「知識點」和「重點整理」區塊 → 用於 course-video skill 的 `KnowledgeVideoProps`。

### QuizContent

```typescript
interface QuizContent {
  questions: {
    question: string       // 題目文字
    options: string[]      // 4 個選項（純文字，不含 A/B/C/D 前綴）
    correctIndex: number   // 正解索引（0～3）
    explanation: string    // 詳解（2～3 句）
  }[]
}
```

**對應 lesson plan**：「測驗題目」區塊。注意 options 不含前綴字母。

### GameContent

```typescript
interface GameContent {
  gameType: 'guessNumber' | 'memoryFlip'
}
```

## 影片 Props（course-video skill 用）

### StoryVideoProps

```typescript
interface StoryVideoProps {
  title: string
  courseIcon: string
  storyScenes: {
    text: string    // 旁白文字
    icon: string    // emoji
  }[]
  choiceLabels: string[]  // 三個選項的 label
}
```

**對應 lesson plan**：「影片腳本」表格中的「文字/旁白」與「Icon」欄位。

### KnowledgeVideoProps

```typescript
type KnowledgeScene =
  | { type: 'concept'; icon: string; heading: string; description: string }
  | { type: 'image'; src: string; caption?: string }

interface KnowledgeVideoProps {
  title: string
  courseIcon: string
  scenes: KnowledgeScene[]  // 概念場景與配圖場景自由組合
  takeaways: string[]
}
```

**對應 lesson plan**：
- `type: 'concept'` 場景 → 概念場景（icon + 標題 + 概念說明）
- `type: 'image'` 場景 → 配圖場景（Gemini 生成插圖 + caption）
- scenes 陣列中 concept 和 image 可自由組合排列
- 圖片 src 格式：`images/{compositionId}/scene-{index}.png`

## ID 命名規範

| 層級 | 格式 | 範例 |
|------|------|------|
| Course | `course-s{階段}-L{起始堂次}-L{結束堂次}` | `course-s1-L01-L03` |
| Chapter | `ch-s{階段}-L{堂次}-{序號}` | `ch-s1-L01-1` |

> 一個 Course 可能涵蓋多堂課（例如第 1～3 堂合為一個主題），或一堂課獨立成一個 Course，依內容主題相近度決定。
