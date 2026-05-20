/** 小知識影片 Composition：標題 → 場景（N段）→ 重點整理 → 結尾 */
import { AbsoluteFill, Audio, Sequence, staticFile, interpolate, CalculateMetadataFunction } from 'remotion'
import type { KnowledgeVideoProps } from '../types'
import { CONCEPT_BGS } from '../styles'
import { TitleScene } from '../scenes/TitleScene'
import { ConceptScene } from '../scenes/ConceptScene'
import { ImageScene } from '../scenes/ImageScene'
import { TakeawayScene } from '../scenes/TakeawayScene'
import { OutroScene } from '../scenes/OutroScene'
import { getAudioDuration } from '../get-audio-duration'

// 固定幀數 fallback（音檔不存在時使用）
const TITLE_F = 90
const CONCEPT_F = 150
const IMAGE_F = 120
const TAKEAWAY_F = 150
const OUTRO_F = 90

const FPS = 30
// 每個場景額外加的緩衝幀（給動畫進場用）
const BUFFER = 15

/** 音量淡入效果 */
const fadeInVolume = (f: number) =>
  interpolate(f, [0, 8], [0, 1], { extrapolateRight: 'clamp' })

/** 載入場景音檔 */
const SceneAudio: React.FC<{ compositionId: string; sceneIndex: number }> = ({
  compositionId,
  sceneIndex,
}) => {
  try {
    const src = staticFile(`audio/${compositionId}/scene-${sceneIndex}.wav`)
    return <Audio src={src} volume={fadeInVolume} />
  } catch {
    return null
  }
}

/** 動態計算場景長度（依音檔時長） */
export const calculateKnowledgeMetadata: CalculateMetadataFunction<KnowledgeVideoProps & { compositionId?: string }> = async ({
  props,
}) => {
  const compositionId = props.compositionId ?? 'knowledge'
  const fallbacks = [
    TITLE_F,
    ...props.scenes.map((s) => (s.type === 'image' ? IMAGE_F : CONCEPT_F)),
    TAKEAWAY_F,
    OUTRO_F,
  ]

  const sceneDurations = await Promise.all(
    fallbacks.map(async (fallback, i) => {
      try {
        const src = staticFile(`audio/${compositionId}/scene-${i}.wav`)
        const sec = await getAudioDuration(src)
        return Math.max(Math.ceil(sec * FPS) + BUFFER, fallback)
      } catch {
        return fallback
      }
    })
  )

  return {
    durationInFrames: sceneDurations.reduce((sum, d) => sum + d, 0),
    props: { ...props, sceneDurations, compositionId },
  }
}

export const KnowledgeVideo: React.FC<KnowledgeVideoProps & { compositionId?: string }> = ({
  title,
  courseIcon,
  scenes,
  takeaways,
  sceneDurations,
  compositionId = 'knowledge',
}) => {
  // 使用動態長度或 fallback
  const d = sceneDurations ?? [
    TITLE_F,
    ...scenes.map((s) => (s.type === 'image' ? IMAGE_F : CONCEPT_F)),
    TAKEAWAY_F,
    OUTRO_F,
  ]

  // 計算每個場景的起始幀
  const starts: number[] = []
  let cursor = 0
  for (const frames of d) {
    starts.push(cursor)
    cursor += frames
  }

  return (
    <AbsoluteFill>
      {/* 場景 1：標題 */}
      <Sequence from={starts[0]} durationInFrames={d[0]}>
        <TitleScene icon={courseIcon} title={title} />
        <SceneAudio compositionId={compositionId} sceneIndex={0} />
      </Sequence>

      {/* 場景 2~N：概念場景與配圖場景 */}
      {scenes.map((scene, i) => (
        <Sequence key={i} from={starts[1 + i]} durationInFrames={d[1 + i]}>
          {scene.type === 'concept' ? (
            <ConceptScene
              icon={scene.icon}
              heading={scene.heading}
              description={scene.description}
              backgroundColor={CONCEPT_BGS[i % CONCEPT_BGS.length]}
              seed={i + 20}
            />
          ) : (
            <ImageScene
              imageSrc={scene.src}
              caption={scene.caption}
              backgroundColor={CONCEPT_BGS[i % CONCEPT_BGS.length]}
              seed={i + 50}
            />
          )}
          <SceneAudio compositionId={compositionId} sceneIndex={1 + i} />
        </Sequence>
      ))}

      {/* 重點整理 */}
      <Sequence from={starts[1 + scenes.length]} durationInFrames={d[1 + scenes.length]}>
        <TakeawayScene takeaways={takeaways} />
        <SceneAudio compositionId={compositionId} sceneIndex={1 + scenes.length} />
      </Sequence>

      {/* 結尾 */}
      <Sequence from={starts[2 + scenes.length]} durationInFrames={d[2 + scenes.length]}>
        <OutroScene message="又學到新知識了！🎉" />
        <SceneAudio compositionId={compositionId} sceneIndex={2 + scenes.length} />
      </Sequence>
    </AbsoluteFill>
  )
}
