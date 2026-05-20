# 課程影片製作指南

本文件定義課程影片的視覺風格、色彩、結構與製作流程。Remotion 的 API 用法請參考官方 Agent Skill（`.claude/skills/remotion-best-practices/`）。

## 影片規格

| 屬性 | 值 |
|------|-----|
| 解析度 | 1920 × 1080 (16:9) |
| FPS | 30 |
| 編碼 | H.264 (mp4) |
| 語言 | 繁體中文 |

## 視覺風格

**Motion Graphic · Flat · Cute · Fun**

- 扁平設計、無陰影、圓角元素
- 大字體 + emoji / 簡筆 icon 作為插圖
- 彈跳式進場動畫（spring overshoot）
- 鮮豔但柔和的配色，背景乾淨留白
- 適合 7～15 歲年齡層觀看

## 配色

### 主色板

| 名稱 | 色碼 | 變數 | 用途 |
|------|------|------|------|
| Coral | `#FF6B6B` | `CORAL` | 主色、標題、重要數字 |
| Teal | `#4ECDC4` | `TEAL` | 副色、正面結果、成功 |
| Sunshine | `#FFE66D` | `SUNSHINE` | 強調、提示框、星星 |
| Lavender | `#A29BFE` | `LAVENDER` | 裝飾、次要元素 |
| Mint | `#55EFC4` | `MINT` | 正確 / 獎勵 |

### 中性色

| 名稱 | 色碼 | 變數 | 用途 |
|------|------|------|------|
| Dark | `#2D3436` | `DARK` | 主要文字 |
| Gray | `#636E72` | `GRAY` | 次要文字 |
| Warm White | `#FFF8F0` | `WARM_WHITE` | 預設背景 |

### 場景背景色

不同場景使用不同淺底色，保持視覺變化：

| 場景 | 色碼 | 變數 |
|------|------|------|
| 標題場景 | `#FFF8F0`（暖白） | `BG_TITLE` |
| 知識點場景（交替） | `#F0F9FF`（淺藍）、`#FFF0F0`（淺粉）、`#FFFFF0`（淺黃）、`#F0FFF4`（淺綠） | `CONCEPT_BGS` |
| 選擇提示場景 | `#FFFFF0`（淺黃） | `BG_YELLOW` |
| 結尾場景 | `#F0FFF4`（淺綠） | `BG_GREEN` |

> 所有配色常數定義於 `video/src/styles.ts`

## 字型

| 用途 | 字型 | 字重 | 大小 |
|------|------|------|------|
| 大標題 | Noto Sans TC | Bold (700) | 64–80px |
| 小標題 / 知識點標題 | Noto Sans TC | Bold (700) | 44–52px |
| 內文 / 說明 | Noto Sans TC | Regular (400) | 28–36px |
| 數字強調 | Noto Sans TC | Black (900) | 72–96px |
| Emoji / Icon | 系統預設 | — | 80–120px |

> 透過 `@remotion/google-fonts/NotoSansTC` 載入，見 `video/src/styles.ts`

## 動畫參數

| 效果 | damping | stiffness | 變數 | 適用 |
|------|---------|-----------|------|------|
| 可愛彈跳 | 10 | 100 | `SPRING_BOUNCY` | icon、標題進場 |
| 穩重進場 | 15 | 100 | `SPRING_GENTLE` | 段落文字 |

- 文字進場：`interpolate` 做 opacity（0→1）+ translateY（40→0），約 20 frames
- 列表依序進場：每項延遲 8 frames
- 退場：一般不需要，靠 `<Sequence>` 的 `durationInFrames` 自然切換

## 版面佈局

### 標題場景

```
┌──────────────────────────────────┐
│                                  │
│           [emoji 120px]          │
│                                  │
│        章節標題 (64px bold)       │
│                                  │
└──────────────────────────────────┘
```

### 知識點場景（ConceptScene）

```
┌──────────────────────────────────┐
│                                  │
│           [icon 100px]           │
│                                  │
│       小標題 (48px bold coral)    │
│                                  │
│    說明文字 (32px dark, max 900w) │
│                                  │
└──────────────────────────────────┘
```

### 插圖場景（ImageScene）

```
┌──────────────────────────────────┐
│                                  │
│    ┌────────────────────────┐    │
│    │                        │    │
│    │   Gemini 生成的插圖     │    │
│    │   (maxW 80%, 圓角陰影)  │    │
│    │                        │    │
│    └────────────────────────┘    │
│                                  │
│       caption (36px dark)        │
│                                  │
└──────────────────────────────────┘
```

### 選擇提示場景

```
┌──────────────────────────────────┐
│                                  │
│    如果是你，你會怎麼做？🤔       │
│                                  │
│    A. 選項一                     │
│    B. 選項二                     │
│    C. 選項三                     │
│                                  │
└──────────────────────────────────┘
```

### 重點整理場景

```
┌──────────────────────────────────┐
│                                  │
│     📝 重點整理                  │
│                                  │
│     ✅ 第一點                    │
│     ✅ 第二點                    │
│     ✅ 第三點                    │
│                                  │
└──────────────────────────────────┘
```

## 影片類型與場景結構

### 類型一：小故事（Story）

以情境故事引導學生思考，最後提示做出選擇（選擇在前端互動完成，不在影片中）。

| # | 場景 | 秒數 | 內容 |
|---|------|------|------|
| 1 | 標題場景 | 3s | 課程圖示 + 章節標題，spring 彈入 |
| 2 | 角色登場 | 3s | 主角名稱 + emoji 角色，從底部滑入 |
| 3 | 故事情境 | 12–18s | 2～3 個分段，每段展示情境文字 + 對應 icon 動畫 |
| 4 | 選擇提示 | 4s | 「如果是你，你會怎麼做？🤔」+ 三個選項文字依序淡入 |
| 5 | 結尾 | 3s | 「選出你的答案吧！」+ 平台 Logo |

**Props**（定義於 `video/src/types.ts`）：

```typescript
interface StoryVideoProps {
  title: string
  courseIcon: string
  character: { name: string; icon: string }
  storyScenes: { text: string; icon: string }[]
  choiceLabels: string[]
}
```

### 類型二：小知識（Knowledge）

講解財商核心概念，以**概念場景**與**配圖場景**自由組合：
- **ConceptScene**（概念場景）：icon + 標題 + 概念說明
- **ImageScene**（配圖場景）：Gemini 生成的插圖 + 可選標題

兩種場景可任意順序排列，依旁白敘事節奏決定。配圖應頻繁更換——講到新主題就配新圖。

| # | 場景 | 秒數 | 內容 |
|---|------|------|------|
| 1 | 標題場景 | 3s | 課程圖示 + 章節標題，spring 彈入 |
| 2~N | 概念場景 或 配圖場景 | 4–5s | 依旁白內容自由搭配 |
| N+1 | 重點整理 | 5s | 關鍵 takeaway 以列表動畫呈現 |
| N+2 | 結尾 | 3s | 「又學到新知識了！🎉」+ 平台 Logo |

**Props**（定義於 `video/src/types.ts`）：

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

### 配圖場景（ImageScene）

佈局：全幅背景色 + 居中圖片（maxWidth 80%、圓角 + 陰影）+ 底部 caption

動畫效果：
- 圖片 spring scale 彈入（圖片可用 scale，文字/emoji 禁用）
- Ken Burns 緩慢放大（1.0 → 1.03）
- caption 延遲淡入（frame 15→30）
- FloatingShapes 背景裝飾

圖片存放路徑：`video/public/images/{compositionId}/scene-{i}.png`

## 配圖生成

1. 在 `video/scripts/generate-images.ts` 的 `imagePrompts` 中定義每張配圖的 prompt：
   - key = compositionId, value = `{ sceneIndex: prompt }` 的對應表
   - sceneIndex 對應 Root.tsx 中 scenes 陣列的 index（僅 `type: 'image'` 的場景）
   - 統一風格 prefix：`"Flat vector illustration for children's educational video. Kawaii cute style, soft pastel colors (pink, mint, yellow, lavender), rounded shapes, no text or words in the image. Simple clean composition on light background. 16:9 aspect ratio. Subject: "`

2. 生成圖片：
   ```bash
   cd video && GEMINI_API_KEY=xxx npm run generate-images
   ```
   - 使用 Gemini `gemini-2.5-flash-image` 模型（約 $0.04/張）
   - 圖片輸出至 `video/public/images/{compositionId}/scene-{index}.png`
   - 自動跳過已存在的檔案，支援增量生成

## TTS 旁白

1. 在 `video/scripts/narrations.ts` 撰寫每支影片的旁白文字：
   - key = composition ID（如 `story-s1-L01`）
   - value = 按場景順序排列的旁白字串陣列
   - 知識影片場景順序：title → scenes × N → takeaway → outro
   - 每個場景各有自己的旁白，旁白與畫面必須協調
   - 語氣：溫暖親切、活潑有趣，適合 7～12 歲學生
   - 數字一律寫成中文字（如「三百五十」而非「350」）

2. 生成音檔：
   ```bash
   cd video && GEMINI_API_KEY=xxx npm run tts
   ```
   - 使用 Gemini `gemini-2.5-pro-preview-tts` 模型、`Zephyr` 語音
   - 音檔輸出至 `video/public/audio/{compositionId}/scene-{index}.wav`
   - 自動跳過已存在的檔案，支援增量生成

3. Composition 中每個 `<Sequence>` 已內建 `<SceneAudio>` 元件，自動依慣例路徑載入對應音檔

## 製作步驟

1. 讀取章節 seed 資料（`functions/src/seed/courses.ts`），取得 content 欄位
2. 在 `video/src/Root.tsx` 定義 scenes 陣列（概念場景與配圖場景自由組合），撰寫配圖 prompt
3. 撰寫旁白文本（每個場景各有自己的旁白）
4. `cd video && GEMINI_API_KEY=xxx npm run generate-images` 生成插圖
5. `cd video && GEMINI_API_KEY=xxx npm run tts` 生成音檔
6. `cd video && npm run studio` 預覽，確認配圖頻率與旁白同步
7. `npx remotion render src/index.ts {composition-id} out/{filename}.mp4` 渲染輸出
