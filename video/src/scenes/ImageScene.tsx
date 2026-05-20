/** 配圖場景：Gemini 生成的插圖 + 可選標題，帶 Ken Burns 緩慢放大效果 */
import { AbsoluteFill, Img, useCurrentFrame, useVideoConfig, spring, interpolate, staticFile } from 'remotion'
import { fontFamily, DARK, SPRING_GENTLE } from '../styles'
import { FloatingShapes } from '../components/FloatingShapes'

interface Props {
  /** staticFile 路徑，如 images/knowledge-s1-L01-2/scene-1.png */
  imageSrc: string
  caption?: string
  backgroundColor: string
  seed?: number
}

export const ImageScene: React.FC<Props> = ({
  imageSrc,
  caption,
  backgroundColor,
  seed = 50,
}) => {
  const frame = useCurrentFrame()
  const { fps } = useVideoConfig()

  // 圖片彈入動畫
  const imgScale = spring({ frame, fps, config: { damping: 12, stiffness: 80 } })
  // Ken Burns 緩慢放大 1.0 → 1.03
  const kenBurns = interpolate(frame, [0, 300], [1, 1.03], {
    extrapolateRight: 'clamp',
  })

  // caption 延遲淡入
  const captionOpacity = interpolate(frame, [15, 30], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  })
  const captionY = interpolate(frame, [15, 30], [20, 0], {
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

      {/* 圖片容器 */}
      <div
        style={{
          transform: `scale(${imgScale * kenBurns})`,
          maxWidth: '80%',
          maxHeight: caption ? '65%' : '75%',
          borderRadius: 24,
          overflow: 'hidden',
          boxShadow: '0 12px 40px rgba(0,0,0,0.12)',
          zIndex: 1,
        }}
      >
        <Img src={staticFile(imageSrc)} style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
      </div>

      {/* 可選標題 */}
      {caption && (
        <div
          style={{
            marginTop: 24,
            fontSize: 36,
            fontWeight: 600,
            color: DARK,
            textAlign: 'center',
            opacity: captionOpacity,
            transform: `translateY(${Math.round(captionY)}px)`,
            zIndex: 1,
          }}
        >
          {caption}
        </div>
      )}
    </AbsoluteFill>
  )
}
