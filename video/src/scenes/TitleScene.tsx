/** 標題場景：課程圖示（旋轉彈入）+ 章節標題 + 漂浮裝飾 */
import { AbsoluteFill, useCurrentFrame, useVideoConfig, spring, interpolate } from 'remotion'
import { fontFamily, BG_TITLE, DARK, SPRING_BOUNCY } from '../styles'
import { FloatingShapes } from '../components/FloatingShapes'

interface Props {
  icon: string
  title: string
  audioSrc?: string
}

export const TitleScene: React.FC<Props> = ({ icon, title }) => {
  const frame = useCurrentFrame()
  const { fps } = useVideoConfig()

  // icon 用 translateY 進場（避免 emoji bitmap 的 sub-pixel scale 抖動）
  const iconProgress = spring({ frame, fps, config: SPRING_BOUNCY })
  const iconY = Math.round(interpolate(iconProgress, [0, 1], [60, 0]))
  const iconOpacity = interpolate(iconProgress, [0, 0.4], [0, 1], { extrapolateRight: 'clamp' })

  // 標題延遲滑入
  const titleProgress = spring({ frame: Math.max(0, frame - 5), fps, config: SPRING_BOUNCY })
  const titleY = Math.round(interpolate(titleProgress, [0, 1], [30, 0]))
  const titleOpacity = interpolate(titleProgress, [0, 0.5], [0, 1], { extrapolateRight: 'clamp' })

  return (
    <AbsoluteFill
      style={{
        backgroundColor: BG_TITLE,
        justifyContent: 'center',
        alignItems: 'center',
        fontFamily,
      }}
    >
      <FloatingShapes seed={42} />
      <div
        style={{
          fontSize: 120,
          opacity: iconOpacity,
          transform: `translateY(${iconY}px)`,
          zIndex: 1,
        }}
      >
        {icon}
      </div>
      <div
        style={{
          fontSize: 64,
          fontWeight: 700,
          color: DARK,
          marginTop: 24,
          opacity: titleOpacity,
          transform: `translateY(${titleY}px)`,
          zIndex: 1,
        }}
      >
        {title}
      </div>
    </AbsoluteFill>
  )
}
