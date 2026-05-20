---
name: generate-lesson-video
description: >
  從 lesson plan 出發，使用 Remotion 製作課程影片（小故事 / 小知識）。
  涵蓋 composition 定義、旁白撰寫、配圖生成、TTS 音檔生成、預覽與渲染的完整流程。
  當用戶需要製作課程影片、新增影片場景、或調整影片動畫時使用。
compatibility: Requires Node.js, Remotion CLI, GEMINI_API_KEY
metadata:
  author: coin-quest
  version: "1.0"
---

# 課程影片製作指南

本 Skill 引導你從 lesson plan 出發，使用 Remotion 製作課程影片。影片目錄位於 `video/`。

## 相關 Skills

| Skill | 用途 |
|-------|------|
| `remotion-best-practices` | Remotion API 用法、動畫原則、最佳實務。**撰寫場景元件前務必參考** |
| `generate-art-asset` | 使用 Gemini API 生成配圖或角色素材，含浮水印移除與去背 |

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
- 鮮豔但柔和的粉彩配色
- 適合 7～15 歲年齡層觀看

### 配色（定義於 `video/src/styles.ts`）

**主色板：**

| 名稱 | 色碼 | 用途 |
|------|------|------|
| Coral | `#FF6B6B` | 主色、標題、重要數字 |
| Teal | `#4ECDC4` | 副色、正面結果 |
| Sunshine | `#FFE66D` | 強調、提示框 |
| Lavender | `#A29BFE` | 裝飾、次要元素 |
| Mint | `#55EFC4` | 正確 / 獎勵 |

**場景背景色（交替使用）：**
`#F0F9FF`（淺藍）→ `#FFF0F0`（淺粉）→ `#FFFFF0`（淺黃）→ `#F0FFF4`（淺綠）

### 字型

Noto Sans TC（透過 `@remotion/google-fonts/NotoSansTC` 載入）

**重要：`loadFont()` 必須指定 `weights`，只載入實際使用的字重。** 不帶參數的 `loadFont()` 會載入全部 9 個字重的所有 unicode range subsets（CJK 字型高達 945 個請求），在多 tab 並行渲染時會因字型載入時序差異導致文字抖動。

```typescript
// ✅ 正確：只載入需要的字重
export const { fontFamily } = loadFont('normal', {
  weights: ['400', '700'],
})

// ❌ 錯誤：載入全部字重，945 個請求，造成文字抖動
export const { fontFamily } = loadFont()
```

| 用途 | 字重 | 大小 |
|------|------|------|
| 大標題 | Bold 700 | 64–80px |
| 小標題 | Bold 700 | 44–52px |
| 內文 | Regular 400 | 28–36px |
| 數字強調 | Bold 700 | 72–96px |

### 動畫參數

| 效果 | damping | stiffness | 適用 |
|------|---------|-----------|------|
| 可愛彈跳 | 10 | 100 | icon、標題進場 |
| 穩重進場 | 15 | 100 | 段落文字 |

## 影片類型

### 類型一：小故事（StoryVideo）

以情境故事引導學生思考，最後提示做出選擇。

**場景順序：**

```
TitleScene → CharacterScene → StoryScene ×2~3 → ChoicePromptScene → OutroScene
```

| # | 場景元件 | 秒數 | 說明 |
|---|----------|------|------|
| 0 | TitleScene | 3s | 課程圖示 + 章節標題 |
| 1 | CharacterScene | 3s | 主角滑入 + 對話泡泡自我介紹 |
| 2~N | StoryScene | 5–6s/段 | 情境文字 + icon 動畫 |
| N+1 | ChoicePromptScene | 4s | 「如果是你？」+ ABC 選項卡 |
| N+2 | OutroScene | 3s | 結尾訊息 + 紙屑動畫 |

**Props 型別：**

```typescript
interface StoryVideoProps {
  title: string
  courseIcon: string
  character: { name: string; icon: string }
  storyScenes: { text: string; icon: string }[]
  choiceLabels: string[]
  sceneDurations?: number[]  // calculateMetadata 注入
}
```

### 類型二：小知識（KnowledgeVideo）

講解財商核心概念，以**概念場景**與**配圖場景**自由組合：

- **ConceptScene**（概念場景）：icon + 標題 + 說明文字
- **ImageScene**（配圖場景）：Gemini 生成插圖 + caption

兩種場景可以**任意順序、任意組合**排列，不需要交替。根據旁白的敘事節奏決定何時用概念、何時用配圖。

**場景順序：**

```
TitleScene → [ConceptScene | ImageScene] ×N → TakeawayScene → OutroScene
```

| # | 場景元件 | 秒數 | 說明 |
|---|----------|------|------|
| 0 | TitleScene | 3s | 課程圖示 + 章節標題 |
| 1~N | ConceptScene 或 ImageScene | 4–5s | 依旁白內容自由搭配 |
| N+1 | TakeawayScene | 5s | 重點整理列表 |
| N+2 | OutroScene | 3s | 結尾慶祝 |

**重要原則：**

1. **配圖應頻繁更換** — 講到新主題、新物品、新例子就配新圖。一支影片有十幾到數十張配圖是正常的。
2. **旁白與畫面必須協調** — 如果旁白正在提問或製造懸念，畫面上**絕對不能顯示答案**。答案應在下一個場景才揭曉。
3. **每個場景獨立** — 每個場景有自己的旁白，不存在「前半 / 後半」的拆分。

**Props 型別：**

```typescript
type KnowledgeScene =
  | { type: 'concept'; icon: string; heading: string; description: string }
  | { type: 'image'; src: string; caption?: string }

interface KnowledgeVideoProps {
  title: string
  courseIcon: string
  scenes: KnowledgeScene[]
  takeaways: string[]
  sceneDurations?: number[]
}
```

## 動態效果指引

影片應該有豐富的動態感，避免靜態畫面。以下是建議的動態效果：

### 必用效果

- **spring translateY 進場**：所有 icon、標題都用 spring `translateY` + `opacity` 淡入滑入
- **延遲淡入**：文字、列表項目依序延遲進場（stagger 8~12 frames）
- **FloatingShapes 背景裝飾**：每個場景加入漂浮的幾何形狀

### 建議加入的動態效果

- **角色滑入**：CharacterScene 的角色從畫面底部或側邊滑入
- **對話泡泡淡入**：SpeechBubble 搭配 `translateY` + `opacity` 彈出
- **Ken Burns 效果**：ImageScene 的圖片緩慢放大（1.0 → 1.03）
- **底線延展**：ConceptScene 標題下方的 coral 底線從 0% 延展到 100%
- **打勾淡入**：TakeawayScene 的 ✅ 用延遲 `opacity` 進場

### ⚠️ 禁止對文字和 Emoji 使用 `scale()`

**所有文字和 emoji 元素禁止使用 `scale()` 進場動畫。** `spring()` 收斂時會產生接近但不等於 1.0 的浮點值，導致 CJK 文字和 emoji bitmap 每幀微幅重新渲染，造成可見的抖動（jitter）。

**正確做法：** 使用 `translateY()` + `opacity` 搭配 `Math.round()` 取整數。spring 驅動 `translateY` 同樣有彈跳效果（overshoot 會讓元素滑過目標位置再彈回）。

```typescript
// ✅ 正確：translateY + opacity 進場
const progress = spring({ frame, fps, config: SPRING_BOUNCY })
const slideY = Math.round(interpolate(progress, [0, 1], [60, 0]))
const opacity = interpolate(progress, [0, 0.4], [0, 1], { extrapolateRight: 'clamp' })
<div style={{ opacity, transform: `translateY(${slideY}px)` }}>

// ❌ 錯誤：scale() 會造成文字/emoji 抖動
const scale = spring({ frame, fps, config: SPRING_BOUNCY })
<div style={{ transform: `scale(${scale})` }}>
```

**唯一例外：** `scale()` 可用於純圖片元素（如 ImageScene 的 `<Img>`），因為圖片不受 sub-pixel 文字渲染影響。

> 詳細動畫範例程式碼請參考 [references/ANIMATION-PATTERNS.md](references/ANIMATION-PATTERNS.md)
> 場景元件完整規格請參考 [references/SCENE-CATALOG.md](references/SCENE-CATALOG.md)

## 完整製作流程

### Step 1：讀取 Lesson Plan

開啟 `doc/lesson-plans/stage-{N}-lesson-{NN}.md`，取得：

- 小故事：角色、情境段落、選項標籤、影片腳本表格
- 小知識：知識點（旁白 + 畫面描述 + 配圖 prompt + caption）、重點整理

### Step 2：定義 Composition Props

在 `video/src/Root.tsx` 中新增 `<Composition>`：

```typescript
<Composition
  id="story-s1-L02"
  component={StoryVideo}
  width={1920}
  height={1080}
  fps={30}
  durationInFrames={720}
  calculateMetadata={calculateStoryMetadata}
  defaultProps={{
    title: '章節標題',
    courseIcon: '💰',
    character: { name: '小明', icon: '👦' },
    storyScenes: [
      { text: '情境文字...', icon: '🏪' },
      { text: '衝突文字...', icon: '😱' },
    ],
    choiceLabels: ['A. 選項一', 'B. 選項二', 'C. 選項三'],
  }}
/>
```

Knowledge 影片的 `scenes` 陣列中，概念場景與配圖場景可**自由組合**，依旁白敘事節奏排列：

```typescript
scenes: [
  { type: 'concept', icon: '📊', heading: '標題', description: '說明' },
  { type: 'image', src: 'images/knowledge-xxx/scene-1.png', caption: '圖說' },
  { type: 'image', src: 'images/knowledge-xxx/scene-2.png', caption: '圖說' },
  { type: 'concept', icon: '💡', heading: '標題', description: '說明' },
  { type: 'image', src: 'images/knowledge-xxx/scene-4.png', caption: '圖說' },
]
```

### Step 3：撰寫旁白

在 `video/scripts/narrations.ts` 新增旁白文字陣列：

```typescript
'story-s1-L02': [
  '章節標題',           // scene 0: TitleScene
  '嗨～大家好...',      // scene 1: CharacterScene
  '有一天小明...',      // scene 2: StoryScene 1
  '結果竟然...',        // scene 3: StoryScene 2
  '如果你是小明...',    // scene 4: ChoicePromptScene
  '選出你的答案吧！',   // scene 5: OutroScene
],
```

**旁白撰寫原則：**
- 語氣溫暖親切、活潑有趣，適合 7～12 歲學生
- 數字一律寫成中文字（如「三百五十」而非「350」）
- 知識影片每個場景各有自己的旁白，旁白與畫面必須協調
- 場景順序：title → content scenes → takeaway → outro

### Step 4：生成配圖

**方法 A：使用 generate-images 腳本（批次生成）**

在 `video/scripts/generate-images.ts` 的 `imagePrompts` 中新增 prompt：

```typescript
'knowledge-s1-L02-2': {
  1: 'A child looking at a piggy bank with coins...',
  3: 'Two children comparing lunchboxes...',
},
```

然後執行：
```bash
cd video && GEMINI_API_KEY=xxx npm run generate-images
```

圖片輸出至 `video/public/images/{compositionId}/scene-{index}.png`

**方法 B：使用 generate-art-asset skill（單張生成）**

適合需要特殊處理（去背、自訂比例）的素材：

```bash
cd .claude/skills/generate-art-asset
GEMINI_API_KEY=xxx npx tsx scripts/generate-image.ts \
  --prompt "Flat vector illustration... Subject: ..." \
  --output ../../video/public/images/knowledge-xxx/scene-1.png \
  --aspect "16:9"

npx tsx scripts/remove-watermark.ts ../../video/public/images/knowledge-xxx/scene-1.png
```

### Step 5：生成 TTS 音檔

```bash
cd video && GEMINI_API_KEY=xxx npm run tts
```

- 使用 Gemini `gemini-2.5-pro-preview-tts` 模型、`Zephyr` 語音
- 音檔輸出至 `video/public/audio/{compositionId}/scene-{index}.wav`
- 自動跳過已存在的檔案

### Step 6：預覽

```bash
cd video && npm run studio
```

在 Remotion Studio 中確認：
- [ ] 配圖頻率適當，每次提到新元素都有對應的視覺
- [ ] 旁白與畫面協調，不提前揭露答案
- [ ] 旁白與場景同步
- [ ] 動畫效果自然
- [ ] 文字不超出畫面

### Step 7：渲染輸出

```bash
cd video && npx remotion render src/index.ts {composition-id} out/{filename}.mp4
```

### Step 8：部署

將 MP4 複製到 `frontend/public/videos/`，更新 seed 資料中的 `videoUrl`。

## 注意事項

### 字型載入必須限定 weights（最重要）

CJK 字型（如 Noto Sans TC）的 unicode range 被拆分為上百個 subsets。若 `loadFont()` 不帶參數，會載入全部 9 個字重 × 105 個 subsets = 945 個字型檔案請求。Remotion 多 tab 並行渲染時，字型載入的時序差異會導致不同幀使用不同的字型狀態，造成**文字抖動（text jitter）**。

修正方式：在 `styles.ts` 的 `loadFont()` 中指定 `weights`，只載入實際使用的字重。

### 文字定位必須使用整數

所有文字元素的 `translateX`、`translateY`、`top`、`left` 等位置屬性必須使用 `Math.round()` 取整數，避免 sub-pixel rendering 導致文字抖動。

```typescript
// ✅ 正確：取整數
const y = Math.round(interpolate(frame, [0, 30], [50, 0]))
<div style={{ transform: `translateY(${y}px)` }}>標題</div>

// ❌ 錯誤：小數會導致文字抖動
const y = interpolate(frame, [0, 30], [50, 0])
<div style={{ transform: `translateY(${y}px)` }}>標題</div>
```

### 配圖不可包含中文字

生成配圖時，prompt 中必須加入 `no text or words in the image`（已包含在 `STYLE_PREFIX` 中），且不要在 prompt 中要求生成中文字。數字和英文字母則沒問題。即使需要標示物品名稱，也應透過場景元件的 caption 呈現，而非燒在圖片上。

原因：
- Gemini 目前生成中文字的品質不穩定，容易出現亂碼或錯字
- 課程未來可能翻譯為其他語言，圖片中的中文字無法被替換

## 新增場景元件

如果需要新的場景類型，遵循以下原則：

1. **建立在 `video/src/scenes/` 目錄下**
2. **Props 必須包含 `audioSrc?: string`**（供 SceneAudio 使用）
3. **所有動畫使用 `useCurrentFrame()` + `interpolate()` 或 `spring()`**，禁用 CSS transition
4. **加入 `<FloatingShapes>` 背景裝飾**
5. **配色使用 `styles.ts` 的常數**
6. **參考 `remotion-best-practices` skill 的動畫規則**

```typescript
// 場景元件基本結構
import { useCurrentFrame, useVideoConfig, interpolate, spring } from 'remotion'
import { COLORS, SPRING_BOUNCY } from '../styles'
import { FloatingShapes } from '../components/FloatingShapes'

export function MyScene({ title, audioSrc }: MySceneProps) {
  const frame = useCurrentFrame()
  const { fps } = useVideoConfig()

  // 用 translateY + opacity 進場（禁止對文字/emoji 使用 scale）
  const progress = spring({ frame, fps, config: SPRING_BOUNCY })
  const slideY = Math.round(interpolate(progress, [0, 1], [40, 0]))
  const opacity = interpolate(progress, [0, 0.5], [0, 1], { extrapolateRight: 'clamp' })

  return (
    <div style={{ /* 全幅背景 */ }}>
      <FloatingShapes seed={99} />
      {audioSrc && <SceneAudio src={audioSrc} />}
      <div style={{ opacity, transform: `translateY(${slideY}px)` }}>
        {title}
      </div>
    </div>
  )
}
```

## 檔案路徑慣例

| 類型 | 路徑格式 |
|------|----------|
| Composition 定義 | `video/src/Root.tsx` |
| 場景元件 | `video/src/scenes/{SceneName}.tsx` |
| 組合元件 | `video/src/compositions/{VideoType}.tsx` |
| 共用元件 | `video/src/components/{Component}.tsx` |
| 旁白文本 | `video/scripts/narrations.ts` |
| 配圖 | `video/public/images/{compositionId}/scene-{i}.png` |
| TTS 音檔 | `video/public/audio/{compositionId}/scene-{i}.wav` |
| 渲染輸出 | `video/out/{filename}.mp4` |
| 前端部署 | `frontend/public/videos/{filename}.mp4` |

## 自我檢查

- [ ] lesson plan 的所有場景都已定義 composition props？
- [ ] 旁白數量與場景數量一致？
- [ ] 知識影片的配圖是否足夠頻繁？旁白與畫面是否協調？
- [ ] 配圖已生成並放在正確路徑？
- [ ] TTS 音檔已生成？
- [ ] 預覽時動畫與旁白同步？
- [ ] 使用了足夠的動態效果（彈跳、滑入、晃動）？
