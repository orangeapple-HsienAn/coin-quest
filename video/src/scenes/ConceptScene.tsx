/** 知識點場景：icon 彈入 → 標題（含底線動畫）→ 說明淡入 + 漂浮裝飾 */
import { AbsoluteFill, useCurrentFrame, useVideoConfig, spring, interpolate } from 'remotion'
import { fontFamily, CORAL, DARK, SPRING_BOUNCY } from '../styles'
import { FloatingShapes } from '../components/FloatingShapes'

interface Props {
  icon: string
  heading: string
  description: string
  backgroundColor: string
  seed?: number
  audioSrc?: string
}

export const ConceptScene: React.FC<Props> = ({
  icon,
  heading,
  description,
  backgroundColor,
  seed = 1,
}) => {
  const frame = useCurrentFrame()
  const { fps } = useVideoConfig()

  // icon 用 translateY 進場（避免 emoji bitmap 的 sub-pixel scale 抖動）
  const iconProgress = spring({ frame, fps, config: { damping: 8, stiffness: 100 } })
  const iconY = Math.round(interpolate(iconProgress, [0, 1], [60, 0]))
  const iconOpacity = interpolate(iconProgress, [0, 0.4], [0, 1], { extrapolateRight: 'clamp' })
  // 標題延遲滑入
  const headingOpacity = interpolate(frame, [10, 25], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  })
  const headingY = interpolate(frame, [10, 25], [30, 0], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  })
  // 底線從左到右延伸
  const underlineWidth = interpolate(frame, [20, 40], [0, 100], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  })

  // 說明文字再延遲淡入
  const descOpacity = interpolate(frame, [30, 48], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  })
  const descY = interpolate(frame, [30, 48], [20, 0], {
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
      {/* 標題 + 底線 */}
      <div
        style={{
          marginTop: 20,
          opacity: headingOpacity,
          transform: `translateY(${Math.round(headingY)}px)`,
          textAlign: 'center',
          zIndex: 1,
        }}
      >
        <div style={{ fontSize: 48, fontWeight: 700, color: CORAL }}>{heading}</div>
        <div
          style={{
            height: 4,
            backgroundColor: CORAL,
            borderRadius: 2,
            width: `${underlineWidth}%`,
            margin: '8px auto 0',
          }}
        />
      </div>
      <div
        style={{
          fontSize: 32,
          color: DARK,
          marginTop: 20,
          maxWidth: 900,
          textAlign: 'center',
          lineHeight: 1.6,
          opacity: descOpacity,
          transform: `translateY(${Math.round(descY)}px)`,
          zIndex: 1,
        }}
      >
        {description}
      </div>
    </AbsoluteFill>
  )
}
