/**
 * 漂浮裝飾形狀 — 背景層的圓形、三角形、星星
 * 傳入 seed 讓每個場景產生不同但固定的裝飾位置
 */
import { AbsoluteFill, useCurrentFrame, interpolate } from 'remotion'
import { CORAL, TEAL, SUNSHINE, LAVENDER, MINT } from '../styles'

const COLORS = [CORAL, TEAL, SUNSHINE, LAVENDER, MINT]

// 簡易偽隨機（seed-based），保證同 seed 同結果
const seededRandom = (seed: number, index: number) => {
  const x = Math.sin(seed * 9301 + index * 4973) * 49297
  return x - Math.floor(x)
}

interface ShapeConfig {
  x: number       // % 水平位置
  y: number       // % 垂直位置
  size: number    // px
  color: string
  type: 'circle' | 'triangle' | 'star'
  speed: number   // 漂浮速度
  phase: number   // 起始相位
}

const generateShapes = (seed: number, count = 6): ShapeConfig[] =>
  Array.from({ length: count }, (_, i) => ({
    x: seededRandom(seed, i * 7) * 90 + 5,
    y: seededRandom(seed, i * 13) * 80 + 10,
    size: seededRandom(seed, i * 3) * 30 + 20,
    color: COLORS[Math.floor(seededRandom(seed, i * 11) * COLORS.length)],
    type: (['circle', 'triangle', 'star'] as const)[Math.floor(seededRandom(seed, i * 17) * 3)],
    speed: seededRandom(seed, i * 23) * 0.5 + 0.3,
    phase: seededRandom(seed, i * 29) * Math.PI * 2,
  }))

// SVG 星星路徑
const starPath = (s: number) => {
  const r1 = s / 2, r2 = r1 * 0.4
  const points = Array.from({ length: 10 }, (_, i) => {
    const angle = (i * Math.PI) / 5 - Math.PI / 2
    const r = i % 2 === 0 ? r1 : r2
    return `${r * Math.cos(angle) + r1},${r * Math.sin(angle) + r1}`
  })
  return `M${points.join('L')}Z`
}

const Shape: React.FC<{ config: ShapeConfig; frame: number }> = ({ config, frame }) => {
  // 緩慢上下漂浮
  const floatY = Math.sin(frame * 0.03 * config.speed + config.phase) * 15
  // 緩慢旋轉
  const rotation = interpolate(frame, [0, 300], [0, 360 * config.speed], {
    extrapolateRight: 'extend',
  })

  const style: React.CSSProperties = {
    position: 'absolute',
    left: `${config.x}%`,
    top: `${config.y}%`,
    transform: `translateY(${Math.round(floatY)}px) rotate(${Math.round(rotation)}deg)`,
    opacity: 0.15,
  }

  if (config.type === 'circle') {
    return (
      <div
        style={{
          ...style,
          width: config.size,
          height: config.size,
          borderRadius: '50%',
          backgroundColor: config.color,
        }}
      />
    )
  }

  if (config.type === 'triangle') {
    return (
      <div
        style={{
          ...style,
          width: 0,
          height: 0,
          borderLeft: `${config.size / 2}px solid transparent`,
          borderRight: `${config.size / 2}px solid transparent`,
          borderBottom: `${config.size}px solid ${config.color}`,
          backgroundColor: 'transparent',
        }}
      />
    )
  }

  // star
  return (
    <svg width={config.size} height={config.size} style={style}>
      <path d={starPath(config.size)} fill={config.color} />
    </svg>
  )
}

export const FloatingShapes: React.FC<{ seed?: number; count?: number }> = ({
  seed = 1,
  count = 6,
}) => {
  const frame = useCurrentFrame()
  const shapes = generateShapes(seed, count)

  return (
    <AbsoluteFill style={{ pointerEvents: 'none', overflow: 'hidden' }}>
      {shapes.map((config, i) => (
        <Shape key={i} config={config} frame={frame} />
      ))}
    </AbsoluteFill>
  )
}
