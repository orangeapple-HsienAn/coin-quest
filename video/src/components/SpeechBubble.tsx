/** 對話泡泡 — 白色圓角矩形 + 底部三角箭頭 */
import { useCurrentFrame, interpolate } from 'remotion'
import { DARK } from '../styles'

interface Props {
  children: React.ReactNode
  /** 進場延遲（frame） */
  delay?: number
}

export const SpeechBubble: React.FC<Props> = ({ children, delay = 0 }) => {
  const frame = useCurrentFrame()

  const opacity = interpolate(frame, [delay, delay + 12], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  })
  // 用 translateY 取代 scale（避免 sub-pixel scale 抖動）
  const slideY = Math.round(
    interpolate(frame, [delay, delay + 12], [15, 0], {
      extrapolateLeft: 'clamp',
      extrapolateRight: 'clamp',
    })
  )

  return (
    <div
      style={{
        opacity,
        transform: `translateY(${slideY}px)`,
        position: 'relative',
        display: 'inline-block',
      }}
    >
      {/* 泡泡本體 */}
      <div
        style={{
          backgroundColor: 'white',
          borderRadius: 24,
          padding: '20px 32px',
          boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
          color: DARK,
          fontSize: 32,
          maxWidth: 800,
          textAlign: 'center',
          lineHeight: 1.6,
        }}
      >
        {children}
      </div>
      {/* 底部三角箭頭 */}
      <div
        style={{
          position: 'absolute',
          bottom: -16,
          left: '50%',
          marginLeft: -12,
          width: 0,
          height: 0,
          borderLeft: '12px solid transparent',
          borderRight: '12px solid transparent',
          borderTop: '16px solid white',
        }}
      />
    </div>
  )
}
