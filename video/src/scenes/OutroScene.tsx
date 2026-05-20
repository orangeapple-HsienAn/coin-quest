/** 結尾場景：慶祝文字 + 紙屑動畫 + 平台 Logo */
import { AbsoluteFill, useCurrentFrame, useVideoConfig, spring, interpolate } from 'remotion'
import { fontFamily, BG_GREEN, DARK, GRAY, SPRING_BOUNCY } from '../styles'
import { Confetti } from '../components/Confetti'

interface Props {
  message: string
  audioSrc?: string
}

export const OutroScene: React.FC<Props> = ({ message }) => {
  const frame = useCurrentFrame()
  const { fps } = useVideoConfig()

  // 用 translateY 進場（避免 sub-pixel scale 抖動）
  const progress = spring({ frame, fps, config: SPRING_BOUNCY })
  const slideY = Math.round(interpolate(progress, [0, 1], [40, 0]))
  const opacity = interpolate(progress, [0, 0.5], [0, 1], { extrapolateRight: 'clamp' })

  return (
    <AbsoluteFill
      style={{
        backgroundColor: BG_GREEN,
        justifyContent: 'center',
        alignItems: 'center',
        fontFamily,
      }}
    >
      <Confetti />
      <div
        style={{
          fontSize: 56,
          fontWeight: 700,
          color: DARK,
          opacity,
          transform: `translateY(${slideY}px)`,
          textAlign: 'center',
          zIndex: 1,
        }}
      >
        {message}
      </div>
      <div
        style={{
          fontSize: 24,
          color: GRAY,
          marginTop: 40,
          opacity,
          transform: `translateY(${slideY}px)`,
          zIndex: 1,
        }}
      >
        Coin Quest 財商學習平台
      </div>
    </AbsoluteFill>
  )
}
