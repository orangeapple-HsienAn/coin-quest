/** 慶祝紙屑動畫 — 彩色方塊從上方灑落 */
import { AbsoluteFill, useCurrentFrame } from 'remotion'
import { CORAL, TEAL, SUNSHINE, LAVENDER, MINT } from '../styles'

const COLORS = [CORAL, TEAL, SUNSHINE, LAVENDER, MINT]

interface Particle {
  x: number
  delay: number
  size: number
  color: string
  speed: number
  wobble: number
  rotation: number
}

// 偽隨機
const rand = (seed: number) => {
  const x = Math.sin(seed * 9301 + 49297) * 49297
  return x - Math.floor(x)
}

const generateParticles = (count = 30): Particle[] =>
  Array.from({ length: count }, (_, i) => ({
    x: rand(i * 7) * 100,
    delay: rand(i * 13) * 20,
    size: rand(i * 3) * 10 + 6,
    color: COLORS[Math.floor(rand(i * 11) * COLORS.length)],
    speed: rand(i * 17) * 3 + 4,
    wobble: rand(i * 23) * 40 + 20,
    rotation: rand(i * 29) * 720,
  }))

const particles = generateParticles()

export const Confetti: React.FC = () => {
  const frame = useCurrentFrame()

  return (
    <AbsoluteFill style={{ pointerEvents: 'none', overflow: 'hidden' }}>
      {particles.map((p, i) => {
        const elapsed = Math.max(0, frame - p.delay)
        // 從上方落下
        const y = -20 + elapsed * p.speed
        // 左右擺動
        const wobbleX = Math.sin(elapsed * 0.1) * p.wobble
        // 旋轉
        const rot = elapsed * p.rotation * 0.02

        // 超出畫面就不渲染
        if (y > 1120) return null

        return (
          <div
            key={i}
            style={{
              position: 'absolute',
              left: `${p.x}%`,
              top: y,
              transform: `translateX(${wobbleX}px) rotate(${rot}deg)`,
              width: p.size,
              height: p.size * 0.6,
              backgroundColor: p.color,
              borderRadius: 2,
              opacity: 0.8,
            }}
          />
        )
      })}
    </AbsoluteFill>
  )
}
