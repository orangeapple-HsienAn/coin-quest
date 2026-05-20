/** 選擇提示場景：問題 + 三個選項 translateY 進場 + 裝飾 */
import { AbsoluteFill, useCurrentFrame, useVideoConfig, spring, interpolate } from 'remotion'
import { fontFamily, BG_YELLOW, DARK, CORAL, TEAL, LAVENDER } from '../styles'
import { FloatingShapes } from '../components/FloatingShapes'

const CHOICE_COLORS = [CORAL, TEAL, LAVENDER]
const CHOICE_ICONS = ['🅰️', '🅱️', '🅲']

interface Props {
  labels: string[]
  audioSrc?: string
}

export const ChoicePromptScene: React.FC<Props> = ({ labels }) => {
  const frame = useCurrentFrame()
  const { fps } = useVideoConfig()

  // 標題用 translateY 進場（避免 sub-pixel scale 抖動）
  const titleProgress = spring({ frame, fps, config: { damping: 12, stiffness: 100 } })
  const titleY = Math.round(interpolate(titleProgress, [0, 1], [40, 0]))
  const titleOpacity = interpolate(titleProgress, [0, 0.5], [0, 1], { extrapolateRight: 'clamp' })

  return (
    <AbsoluteFill
      style={{
        backgroundColor: BG_YELLOW,
        justifyContent: 'center',
        alignItems: 'center',
        fontFamily,
      }}
    >
      <FloatingShapes seed={99} />
      <div
        style={{
          fontSize: 48,
          fontWeight: 700,
          color: DARK,
          marginBottom: 48,
          opacity: titleOpacity,
          transform: `translateY(${titleY}px)`,
          zIndex: 1,
        }}
      >
        如果是你，你會怎麼做？🤔
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 24, zIndex: 1 }}>
        {labels.map((label, i) => {
          // 每個選項用 spring translateY 進場（避免 sub-pixel scale 抖動）
          const delay = 20 + i * 10
          const cardProgress = spring({
            frame: Math.max(0, frame - delay),
            fps,
            config: { damping: 10, stiffness: 120 },
          })
          const cardY = Math.round(interpolate(cardProgress, [0, 1], [30, 0]))
          const cardOpacity = interpolate(cardProgress, [0, 0.5], [0, 1], { extrapolateRight: 'clamp' })

          return (
            <div
              key={i}
              style={{
                fontSize: 34,
                fontWeight: 700,
                color: CHOICE_COLORS[i],
                opacity: cardOpacity,
                transform: `translateY(${cardY}px)`,
                padding: '18px 32px',
                borderRadius: 20,
                backgroundColor: 'white',
                border: `3px solid ${CHOICE_COLORS[i]}`,
                boxShadow: '0 4px 16px rgba(0,0,0,0.06)',
                minWidth: 600,
                display: 'flex',
                alignItems: 'center',
                gap: 12,
              }}
            >
              <span style={{ fontSize: 28 }}>{CHOICE_ICONS[i]}</span>
              {label}
            </div>
          )
        })}
      </div>
    </AbsoluteFill>
  )
}
