# 場景元件速查表

所有場景元件位於 `video/src/scenes/`，以下列出每個元件的 Props、動畫效果與使用時機。

## TitleScene

**用途：** 影片開頭，顯示課程圖示與章節標題。

**Props：**
```typescript
{
  icon: string        // emoji 圖示（120px）
  title: string       // 章節標題（64px bold）
  audioSrc?: string
}
```

**動畫：**
- icon: spring translateY(60→0) + opacity 淡入
- title: 延遲 spring translateY(30→0) + opacity 淡入
- 背景: FloatingShapes (seed=42)

**背景色：** `BG_TITLE`（暖白 #FFF8F0）

---

## CharacterScene

**用途：** 小故事中角色登場，從底部滑入並用對話泡泡自我介紹。

**Props：**
```typescript
{
  name: string        // 角色名稱
  icon: string        // 角色 emoji（120px）
  dialogue: string    // 對話內容
  audioSrc?: string
}
```

**動畫：**
- 角色: 從底部滑入（translateY 200→0）+ 持續上下漂浮（±6px）
- 對話泡泡: 延遲 15 frames 後 translateY + opacity 淡入
- 背景: FloatingShapes

**背景色：** `BG_TITLE`

---

## StoryScene

**用途：** 小故事的情境段落，展示故事文字與對應 icon。

**Props：**
```typescript
{
  text: string              // 情境文字（36px）
  icon: string              // 場景 emoji（100px）
  backgroundColor: string   // 場景背景色
  seed?: number             // FloatingShapes 隨機種子
  audioSrc?: string
}
```

**動畫：**
- icon: spring translateY(60→0) + opacity 淡入
- text: 延遲淡入（frame 12→28）+ translateY(25→0)
- 背景: FloatingShapes

**背景色：** 由 composition 傳入，交替使用 `CONCEPT_BGS`

---

## ChoicePromptScene

**用途：** 小故事結尾，展示「如果是你？」問題與三個選項卡。

**Props：**
```typescript
{
  labels: string[]    // 三個選項文字
  audioSrc?: string
}
```

**動畫：**
- 標題: spring translateY(40→0) + opacity 淡入
- 選項卡: staggered spring translateY(30→0) + opacity（延遲 20 + i×10 frames）
- 選項顏色: A=Coral, B=Teal, C=Lavender

**背景色：** `BG_YELLOW`（淺黃 #FFFFF0）

---

## ConceptScene

**用途：** 小知識影片的概念場景，展示知識點標題與說明。

**Props：**
```typescript
{
  icon: string              // emoji（100px）
  heading: string           // 知識點標題（48px bold, coral）
  description: string       // 說明文字（32px, max-width 900px）
  backgroundColor: string
  seed?: number
  audioSrc?: string
}
```

**動畫：**
- icon: spring translateY(60→0) + opacity 淡入
- heading: 延遲淡入（frame 10→25）+ 底線從 0% 延展到 100%
- description: 進一步延遲淡入（frame 30→48）
- 背景: FloatingShapes

**底線：** 4px coral 色，寬度隨時間延展

---

## ImageScene

**用途：** 小知識影片的插圖場景，展示 Gemini 生成的圖片。

**Props：**
```typescript
{
  imageSrc: string          // staticFile 路徑
  caption?: string          // 圖說（36px）
  backgroundColor: string
  seed?: number
}
```

**動畫：**
- 圖片: spring scale 彈入（圖片可用 scale）+ **Ken Burns 效果**（1.0 → 1.03 緩慢放大）
- caption: 延遲淡入（frame 15→30）+ translateY
- 背景: FloatingShapes

**圖片容器：** 圓角 16px + 陰影，maxWidth 80%, maxHeight 70%

---

## TakeawayScene

**用途：** 小知識影片結尾前的重點整理。

**Props：**
```typescript
{
  takeaways: string[]    // 重點列表（3 條）
  audioSrc?: string
}
```

**動畫：**
- 標題「📝 重點整理」: spring translateY(40→0) + opacity 淡入
- 卡片: staggered spring translateY(30→0) + opacity（延遲 15 + i×12 frames）
- ✅ 打勾: 額外延遲的 opacity 淡入

**背景色：** `BG_GREEN`（淺綠 #F0FFF4）

---

## OutroScene

**用途：** 影片結尾，慶祝訊息與平台名稱。

**Props：**
```typescript
{
  message: string       // 結尾訊息（56px）
  audioSrc?: string
}
```

**動畫：**
- message: spring translateY(40→0) + opacity 淡入
- 平台名稱「Coin Quest 財商學習平台」: spring translateY(40→0) + opacity 淡入
- Confetti: 30 粒紙屑從頂部飄落（5 色 + 搖擺 + 旋轉）

**背景色：** `BG_GREEN`

---

## 共用元件

### FloatingShapes

背景裝飾，6 個半透明幾何形狀（圓形、三角、星形）漂浮旋轉。

```typescript
<FloatingShapes seed={42} count={6} />
```

- seed 控制隨機位置（確保可重現）
- 透明度 0.15，不干擾主內容

### SpeechBubble

對話泡泡容器，白底圓角 + 三角箭頭。

```typescript
<SpeechBubble delay={15}>{children}</SpeechBubble>
```

- delay: 延遲進場的 frame 數
- 動畫: opacity + translateY 淡入滑入

### Confetti

紙屑動畫，30 粒彩色粒子從頂部飄落。

- 自動播放，無需 props
- 使用 5 色主色板
