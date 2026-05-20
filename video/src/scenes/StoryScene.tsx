/** 故事情境場景：icon 旋轉彈入 + 旁白文字 + 漂浮裝飾 */
import { AbsoluteFill, useCurrentFrame, useVideoConfig, spring, interpolate } from 'remotion'
import { fontFamily, DARK, SPRING_BOUNCY } from '../styles'
import { FloatingShapes } from '../components/FloatingShapes'

interface Props {
  text: string
  icon: string
  backgroundColor: string
  /** 用於 FloatingShapes seed，避免每個場景裝飾重複 */
  seed?: number
  audioSrc?: string
}

export const StoryScene: React.FC<Props> = ({ text, icon, backgroundColor, seed = 1 }) => {
  const frame = useCurrentFrame()
  const { fps } = useVideoConfig()

  // icon 用 translateY 進場（避免 emoji bitmap 的 sub-pixel scale 抖動）
  const iconProgress = spring({ frame, fps, config: { damping: 8, stiffness: 100 } })
  const iconY = Math.round(interpolate(iconProgress, [0, 1], [60, 0]))
  const iconOpacity = interpolate(iconProgress, [0, 0.4], [0, 1], { extrapolateRight: 'clamp' })
  // 文字延遲淡入
  const textOpacity = interpolate(frame, [12, 28], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  })
  const textY = interpolate(frame, [12, 28], [25, 0], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  })

  return (
    <AbsoluteFill
      style={{
        backgroundColor,
        justifyContent: 'center',
        alignItems: 'center',
        fontFamily,
      }}
    >
      <FloatingShapes seed={seed} />
      <div
        style={{
          fontSize: 100,
          opacity: iconOpacity,
          transform: `translateY(${iconY}px)`,
          zIndex: 1,
        }}
      >
        {icon}
      </div>
      <div
        style={{
          fontSize: 36,
          color: DARK,
          marginTop: 32,
          maxWidth: 900,
          textAlign: 'center',
          lineHeight: 1.7,
          opacity: textOpacity,
          transform: `translateY(${Math.round(textY)}px)`,
          zIndex: 1,
        }}
      >
        {text}
      </div>
    </AbsoluteFill>
  )
}
