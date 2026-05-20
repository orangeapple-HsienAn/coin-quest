/** 重點整理場景：✅ 逐個淡入 + 卡片化列表 */
import { AbsoluteFill, useCurrentFrame, useVideoConfig, spring, interpolate } from 'remotion'
import { fontFamily, BG_GREEN, DARK, TEAL, SPRING_BOUNCY } from '../styles'
import { FloatingShapes } from '../components/FloatingShapes'

interface Props {
  takeaways: string[]
  audioSrc?: string
}

export const TakeawayScene: React.FC<Props> = ({ takeaways }) => {
  const frame = useCurrentFrame()
  const { fps } = useVideoConfig()

  // 標題用 translateY 進場（避免 sub-pixel scale 抖動）
  const titleProgress = spring({ frame, fps, config: SPRING_BOUNCY })
  const titleY = Math.round(interpolate(titleProgress, [0, 1], [40, 0]))
  const titleOpacity = interpolate(titleProgress, [0, 0.5], [0, 1], { extrapolateRight: 'clamp' })

  return (
    <AbsoluteFill
      style={{
        backgroundColor: BG_GREEN,
        justifyContent: 'center',
        alignItems: 'center',
        fontFamily,
      }}
    >
      <FloatingShapes seed={55} />
      <div
        style={{
          fontSize: 52,
          fontWeight: 700,
          color: DARK,
          marginBottom: 40,
          opacity: titleOpacity,
          transform: `translateY(${titleY}px)`,
          zIndex: 1,
        }}
      >
        📝 重點整理
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 20, zIndex: 1 }}>
        {takeaways.map((text, i) => {
          const delay = 15 + i * 12
          // 卡片用 translateY 進場（避免 sub-pixel scale 抖動）
          const cardProgress = spring({
            frame: Math.max(0, frame - delay),
            fps,
            config: { damping: 10, stiffness: 120 },
          })
          const cardY = Math.round(interpolate(cardProgress, [0, 1], [30, 0]))
          const cardOpacity = interpolate(cardProgress, [0, 0.5], [0, 1], { extrapolateRight: 'clamp' })
          // ✅ 打勾延遲淡入
          const checkProgress = spring({
            frame: Math.max(0, frame - delay - 6),
            fps,
            config: { damping: 8, stiffness: 150 },
          })
          const checkOpacity = interpolate(checkProgress, [0, 0.5], [0, 1], { extrapolateRight: 'clamp' })

          return (
            <div
              key={i}
              style={{
                opacity: cardOpacity,
                transform: `translateY(${cardY}px)`,
                display: 'flex',
                alignItems: 'center',
                gap: 16,
                backgroundColor: 'white',
                borderRadius: 16,
                padding: '16px 28px',
                boxShadow: '0 3px 12px rgba(0,0,0,0.06)',
                border: `2px solid ${TEAL}33`,
                minWidth: 700,
              }}
            >
              <span
                style={{
                  color: TEAL,
                  fontSize: 32,
                  opacity: checkOpacity,
                  display: 'inline-block',
                }}
              >
                ✅
              </span>
              <span style={{ fontSize: 30, color: DARK }}>{text}</span>
            </div>
          )
        })}
      </div>
    </AbsoluteFill>
  )
}
