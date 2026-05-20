# 進階動畫效果範例

本文件提供可直接套用的動畫 pattern，讓影片更加生動有趣。所有動畫都使用 `useCurrentFrame()` 驅動，**禁用 CSS transition/animation**。

## 基礎：frame 與 interpolate

```typescript
import { useCurrentFrame, useVideoConfig, interpolate, spring } from 'remotion'
import { SPRING_BOUNCY, SPRING_GENTLE } from '../styles'

const frame = useCurrentFrame()
const { fps } = useVideoConfig()
```

## 1. 滑入效果（Slide In）

### 從底部滑入（角色登場）

```typescript
const slideUp = interpolate(frame, [0, 20], [200, 0], {
  extrapolateRight: 'clamp',
})
const opacity = interpolate(frame, [0, 15], [0, 1], {
  extrapolateRight: 'clamp',
})

<div style={{
  transform: `translateY(${slideUp}px)`,
  opacity,
}}>
  {/* 角色內容 */}
</div>
```

### 從左側滑入

```typescript
const slideRight = interpolate(frame, [0, 20], [-300, 0], {
  extrapolateRight: 'clamp',
})

<div style={{ transform: `translateX(${slideRight}px)`, opacity }}>
```

### 從右側滑入

```typescript
const slideLeft = interpolate(frame, [0, 20], [300, 0], {
  extrapolateRight: 'clamp',
})
```

### 搭配 spring（更有彈性）

```typescript
const progress = spring({ frame, fps, config: SPRING_BOUNCY })
const slideUp = interpolate(progress, [0, 1], [200, 0])

<div style={{ transform: `translateY(${slideUp}px)` }}>
```

## 2. 彈入效果（Bounce In）

> ⚠️ **禁止對文字和 emoji 使用 `scale()` 進場動畫！**
> `spring()` 收斂時會產生接近但不等於 1.0 的浮點值，導致 CJK 文字和 emoji bitmap 每幀微幅重新渲染，造成可見抖動。
> 所有文字/emoji 進場一律使用 `translateY()` + `opacity`，搭配 `Math.round()` 取整數。
> `scale()` 僅可用於純圖片元素（如 `<Img>`）。

### spring translateY 彈入

最常用的進場效果，適合 icon、標題、卡片。spring 驅動 translateY 同樣有彈跳效果（overshoot 會讓元素滑過目標位置再彈回）。

```typescript
const progress = spring({ frame, fps, config: SPRING_BOUNCY })
const slideY = Math.round(interpolate(progress, [0, 1], [60, 0]))
const opacity = interpolate(progress, [0, 0.4], [0, 1], { extrapolateRight: 'clamp' })

<div style={{ opacity, transform: `translateY(${slideY}px)` }}>
```

### 延遲彈入

```typescript
const progress = spring({
  frame: Math.max(0, frame - 15),  // 延遲 15 frames
  fps,
  config: SPRING_BOUNCY,
})
const slideY = Math.round(interpolate(progress, [0, 1], [40, 0]))
const opacity = interpolate(progress, [0, 0.5], [0, 1], { extrapolateRight: 'clamp' })

<div style={{ opacity, transform: `translateY(${slideY}px)` }}>
```

### Staggered 依序彈入（列表項目）

```typescript
{items.map((item, i) => {
  const progress = spring({
    frame: Math.max(0, frame - (15 + i * 10)),  // 每項延遲 10 frames
    fps,
    config: SPRING_BOUNCY,
  })
  const slideY = Math.round(interpolate(progress, [0, 1], [30, 0]))
  const opacity = interpolate(progress, [0, 0.5], [0, 1], { extrapolateRight: 'clamp' })
  return (
    <div key={i} style={{ opacity, transform: `translateY(${slideY}px)` }}>
      {item}
    </div>
  )
})}
```

## 3. 持續動態效果（Continuous）

> ⚠️ **Emoji 和文字禁止使用 scale / rotate 持續動畫！**
> Emoji 是 bitmap glyph，持續改變 `scale()` 或 `rotate()` 會導致每幀重新光柵化，造成可見的抖動（jitter）。
> 如果需要讓 emoji 有持續動態感，只能使用 `translateY`（上下漂浮），且必須用 `Math.round()` 取整數。

### 上下漂浮（Float）— 唯一適合 emoji 的持續動畫

```typescript
const float = Math.round(Math.sin(frame * 0.08) * 6)  // ±6px，取整數

<div style={{ transform: `translateY(${float}px)` }}>
  <span style={{ fontSize: 100 }}>💡</span>
</div>
```

### 晃動（Wobble）— 僅限非 emoji 元素

⚠️ 不可用於 emoji，僅適用於向量文字或 SVG 圖形。

```typescript
const wobble = Math.sin(frame * 0.15) * 3  // ±3 度

<div style={{ transform: `rotate(${wobble}deg)` }}>
  {/* 非 emoji 的向量元素 */}
</div>
```

### 脈動（Pulse）— 僅限非 emoji 元素

⚠️ 不可用於 emoji，僅適用於向量文字或 SVG 圖形。

```typescript
const pulse = 1 + Math.sin(frame * 0.1) * 0.03  // ±3% 縮放

<div style={{ transform: `scale(${pulse})` }}>
  {/* 非 emoji 的向量元素 */}
</div>
```

## 4. 進場 + 持續動態組合

### 彈入後開始漂浮（適合 emoji icon）

先用 spring translateY 進場，完成後加入上下漂浮。

```typescript
const progress = spring({ frame, fps, config: SPRING_BOUNCY })
const enterY = Math.round(interpolate(progress, [0, 1], [60, 0]))
const opacity = interpolate(progress, [0, 0.4], [0, 1], { extrapolateRight: 'clamp' })

// 進場完成後開始上下漂浮（取整數避免 sub-pixel 抖動）
const float = frame > 20 ? Math.round(Math.sin(frame * 0.08) * 5) : 0

<div style={{
  opacity,
  transform: `translateY(${enterY + float}px)`,
}}>
```

### 滑入後開始漂浮

```typescript
const progress = spring({ frame, fps, config: SPRING_GENTLE })
const slideUp = interpolate(progress, [0, 1], [200, 0])
const float = frame > 25 ? Math.round(Math.sin(frame * 0.08) * 6) : 0

<div style={{ transform: `translateY(${Math.round(slideUp) + float}px)` }}>
```

## 5. 底線延展（Underline Extend）

適合標題下方的裝飾線。

```typescript
const underlineWidth = interpolate(frame, [20, 40], [0, 100], {
  extrapolateLeft: 'clamp',
  extrapolateRight: 'clamp',
})

<div style={{
  width: `${underlineWidth}%`,
  height: 4,
  backgroundColor: COLORS.CORAL,
  borderRadius: 2,
  margin: '8px auto 0',
}}>
```

## 6. 淡入 + 上移（Fade In Up）

最常用的文字進場效果。

```typescript
function fadeInUp(frame: number, startFrame: number, duration = 16) {
  const opacity = interpolate(
    frame, [startFrame, startFrame + duration], [0, 1],
    { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' }
  )
  const translateY = interpolate(
    frame, [startFrame, startFrame + duration], [40, 0],
    { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' }
  )
  return { opacity, transform: `translateY(${translateY}px)` }
}

// 使用
<p style={fadeInUp(frame, 12)}>第一段文字</p>
<p style={fadeInUp(frame, 20)}>第二段文字</p>
```

## 7. Ken Burns 效果

圖片緩慢放大，製造電影感。

```typescript
const zoom = interpolate(
  frame, [0, durationInFrames], [1.0, 1.03],
  { extrapolateRight: 'clamp' }
)

<div style={{
  transform: `scale(${zoom})`,
  overflow: 'hidden',
  borderRadius: 16,
}}>
  <Img src={staticFile(imageSrc)} />
</div>
```

## 8. 數字跳動（Count Up）

適合展示金額或數字。

```typescript
const targetNumber = 350
const count = Math.round(
  interpolate(frame, [10, 40], [0, targetNumber], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  })
)

<span style={{ fontSize: 72, fontWeight: 900 }}>
  ${count}
</span>
```

## 動畫時間軸參考

一個典型場景的動畫時間軸（150 frames = 5 秒）：

```
Frame:  0         15        30        45        150
        |---------|---------|---------|---------|
        [icon translateY+opacity 彈入]
                  [標題 fadeInUp]
                            [文字 fadeInUp]
        [FloatingShapes ~~~~~~~~~~~~~~~~~~~ 持續]
```

## 組合建議

| 場景類型 | 建議動畫組合 |
|----------|-------------|
| TitleScene | icon translateY+opacity → title translateY+opacity → FloatingShapes |
| CharacterScene | slideUp+float → SpeechBubble translateY+opacity → FloatingShapes |
| StoryScene | icon translateY+opacity → text fadeInUp → FloatingShapes |
| ConceptScene | icon translateY+opacity → heading fadeInUp+underline → desc fadeInUp |
| ImageScene | image scale+KenBurns → caption fadeInUp → FloatingShapes |
| TakeawayScene | title translateY+opacity → cards staggered fadeIn → checkmark fadeIn |
| OutroScene | message translateY+opacity → platform translateY+opacity → Confetti |
