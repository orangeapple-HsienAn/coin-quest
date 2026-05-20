/** 角色登場場景：角色持續浮動 + 對話泡泡 + 裝飾 */
import { AbsoluteFill, useCurrentFrame, useVideoConfig, spring } from 'remotion'
import { fontFamily, BG_TITLE, DARK, SPRING_BOUNCY } from '../styles'
import { FloatingShapes } from '../components/FloatingShapes'
import { SpeechBubble } from '../components/SpeechBubble'

interface Props {
  name: string
  icon: string
  dialogue: string
  audioSrc?: string
}

export const CharacterScene: React.FC<Props> = ({ name, icon, dialogue }) => {
  const frame = useCurrentFrame()
  const { fps } = useVideoConfig()

  // 角色從底部彈入
  const entrance = spring({ frame, fps, config: SPRING_BOUNCY })
  const slideY = (1 - entrance) * 200
  // 持續微幅上下浮動（idle bounce）
  const idleBounce = Math.sin(frame * 0.08) * 6

  return (
    <AbsoluteFill
      style={{
        backgroundColor: BG_TITLE,
        justifyContent: 'center',
        alignItems: 'center',
        fontFamily,
        gap: 16,
      }}
    >
      <FloatingShapes seed={7} />
      {/* 角色 */}
      <div
        style={{
          transform: `translateY(${Math.round(slideY + idleBounce)}px)`,
          zIndex: 1,
          textAlign: 'center',
        }}
      >
        <div style={{ fontSize: 120 }}>{icon}</div>
        <div style={{ fontSize: 40, fontWeight: 700, color: DARK, marginTop: 8 }}>
          {name}
        </div>
      </div>
      {/* 對話泡泡 */}
      <div style={{ zIndex: 1, marginTop: 16 }}>
        <SpeechBubble delay={15}>{dialogue}</SpeechBubble>
      </div>
    </AbsoluteFill>
  )
}
