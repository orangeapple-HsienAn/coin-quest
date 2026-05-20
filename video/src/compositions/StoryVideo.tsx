/** 小故事影片 Composition：標題 → 角色登場 → 故事情境 → 選擇提示 → 結尾 */
import { AbsoluteFill, Audio, Sequence, staticFile, interpolate, CalculateMetadataFunction } from 'remotion'
import type { StoryVideoProps } from '../types'
import { CONCEPT_BGS } from '../styles'
import { TitleScene } from '../scenes/TitleScene'
import { CharacterScene } from '../scenes/CharacterScene'
import { StoryScene } from '../scenes/StoryScene'
import { ChoicePromptScene } from '../scenes/ChoicePromptScene'
import { OutroScene } from '../scenes/OutroScene'
import { getAudioDuration } from '../get-audio-duration'

// 固定幀數 fallback（音檔不存在時使用）
const TITLE_F = 90
const CHARACTER_F = 90
const STORY_F = 150
const CHOICE_F = 120
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
export const calculateStoryMetadata: CalculateMetadataFunction<StoryVideoProps & { compositionId?: string }> = async ({
  props,
}) => {
  const compositionId = props.compositionId ?? 'story-s1-L01'
  // 場景順序：標題, 角色, 故事×N, 選擇, 結尾
  const sceneCount = 2 + props.storyScenes.length + 2
  const fallbacks = [
    TITLE_F, CHARACTER_F,
    ...props.storyScenes.map(() => STORY_F),
    CHOICE_F, OUTRO_F,
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

export const StoryVideo: React.FC<StoryVideoProps & { compositionId?: string }> = ({
  title,
  courseIcon,
  character,
  storyScenes,
  choiceLabels,
  sceneDurations,
  compositionId = 'story-s1-L01',
}) => {
  // 使用動態長度或 fallback
  const d = sceneDurations ?? [
    TITLE_F, CHARACTER_F,
    ...storyScenes.map(() => STORY_F),
    CHOICE_F, OUTRO_F,
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

      {/* 場景 2：角色登場 */}
      <Sequence from={starts[1]} durationInFrames={d[1]}>
        <CharacterScene
          name={character.name}
          icon={character.icon}
          dialogue={`大家好，我是${character.name}！`}
        />
        <SceneAudio compositionId={compositionId} sceneIndex={1} />
      </Sequence>

      {/* 場景 3：故事情境（2～3 段） */}
      {storyScenes.map((scene, i) => (
        <Sequence key={i} from={starts[2 + i]} durationInFrames={d[2 + i]}>
          <StoryScene text={scene.text} icon={scene.icon} backgroundColor={CONCEPT_BGS[i]} seed={i + 10} />
          <SceneAudio compositionId={compositionId} sceneIndex={2 + i} />
        </Sequence>
      ))}

      {/* 場景 4：選擇提示 */}
      <Sequence from={starts[2 + storyScenes.length]} durationInFrames={d[2 + storyScenes.length]}>
        <ChoicePromptScene labels={choiceLabels} />
        <SceneAudio compositionId={compositionId} sceneIndex={2 + storyScenes.length} />
      </Sequence>

      {/* 場景 5：結尾 */}
      <Sequence from={starts[3 + storyScenes.length]} durationInFrames={d[3 + storyScenes.length]}>
        <OutroScene message="選出你的答案吧！✨" />
        <SceneAudio compositionId={compositionId} sceneIndex={3 + storyScenes.length} />
      </Sequence>
    </AbsoluteFill>
  )
}
