/**
 * UnitPlayer — Remotion Player wrapper
 *
 * 載入 unit 全部資料 → buildVideoConfig → prepareTimeline → <Player>
 * 用法：
 *   <UnitPlayer lessonKey="stage-1-lesson-1" unitId="unit-1-1" section="knowledge" onEnded={...} />
 */
import { useEffect, useMemo, useRef } from 'react'
import { Player, type PlayerRef } from '@remotion/player'
import { MyComposition } from '../lib/remotion/Composition'
import { buildVideoConfig, type PreviewSection } from '../lib/remotion/buildConfig'
import { prepareTimelineFromDurations } from '../lib/remotion/timeline'
import { setSnapshotLessonKey } from '../lib/remotion/proxyUrl'
import { usePlayerInputs } from '../hooks/usePlayerInputs'
import { parseLessonKey } from '../lib/lessonKey'

interface UnitPlayerProps {
  /** 帶語言 suffix 的 lessonKey（例：stage-1-lesson-1-ja） */
  lessonKey: string
  unitId: string
  section: PreviewSection
  /** 影片播完觸發 */
  onEnded?: () => void
}

export function UnitPlayer({ lessonKey, unitId, section, onEnded }: UnitPlayerProps) {
  const playerRef = useRef<PlayerRef>(null)
  const { snapshotKey, language } = parseLessonKey(lessonKey)
  const { inputs, loading, error } = usePlayerInputs({
    lessonKey: snapshotKey,
    unitId,
    section,
    language,
  })

  // 設定 snapshot 路徑前綴（給 proxyUrl 用，把 CMS Storage URL → /cms-snapshot/…）
  useEffect(() => {
    setSnapshotLessonKey(snapshotKey)
    return () => setSnapshotLessonKey(null)
  }, [snapshotKey])

  // 用 useMemo 避免每次 render 都重建 inputProps 而打斷 Player
  const playerData = useMemo(() => {
    if (!inputs) return null
    const { config, pageDurations } = buildVideoConfig(inputs)
    const timeline = prepareTimelineFromDurations(config, pageDurations)
    return { config, timeline }
  }, [inputs])

  // 綁 ended 事件
  useEffect(() => {
    const player = playerRef.current
    if (!player || !onEnded) return
    const handler = () => onEnded()
    player.addEventListener('ended', handler)
    return () => player.removeEventListener('ended', handler)
  }, [onEnded, playerData])

  if (error) return <div className="text-red-500">Player 載入失敗：{error.message}</div>
  if (loading || !playerData) return <div className="py-10 text-center">載入影片中...</div>

  return (
    <Player
      ref={playerRef}
      // 切 section / 語言時用 key 強制 remount，清掉所有播放狀態
      key={`${unitId}-${section}-${language}`}
      component={MyComposition}
      inputProps={{ config: playerData.config, timeline: playerData.timeline }}
      durationInFrames={playerData.timeline.durationInFrames}
      compositionWidth={1920}
      compositionHeight={1080}
      fps={24}
      controls
      clickToPlay
      numberOfSharedAudioTags={20}
      style={{ width: '100%', borderRadius: 16, overflow: 'hidden' }}
      acknowledgeRemotionLicense
    />
  )
}
