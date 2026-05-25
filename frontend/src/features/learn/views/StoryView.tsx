/**
 * 小故事整體流程（5.3）：
 *   playing（影片）→ choosing（A/B/C 選項）→ result（結算）
 * - 影片必須播完，右側黃箭頭才啟用
 * - 選擇後右側黃箭頭啟用 → 進入結算
 * - 查看其它結果：回到 choosing 不重看影片，可挑另一個結局
 * - 回到主題：跳回章節列表，不發獎勵
 * - 前往下個章節：發放經驗（= 選項 score）+ 跳回章節列表
 */
import { useState } from 'react'
import type { StoryContent } from '../hooks/useChapterContent'
import { UnitPlayer } from '../components/UnitPlayer'
import { NextArrowButton } from '../components/NextArrowButton'
import { StoryChoiceCards } from '../components/StoryChoiceCards'
import { StoryResultCard } from '../components/result/StoryResultCard'
import type { Language } from '../lib/lessonKey'

type Phase = 'playing' | 'choosing' | 'result'

interface StoryViewProps {
  lessonKey: string
  content: StoryContent
  language?: Language
  onComplete: (params: { experienceReward: number; coinReward: number }) => void
  onNext: () => void
  onBackToTopic: () => void
}

export function StoryView({
  lessonKey,
  content,
  language = 'zh',
  onComplete,
  onNext,
  onBackToTopic,
}: StoryViewProps) {
  const [phase, setPhase] = useState<Phase>('playing')
  const [videoEnded, setVideoEnded] = useState(false)
  const [selectedIdx, setSelectedIdx] = useState<number | null>(null)
  const [replayCount, setReplayCount] = useState(0)

  const choices = content.choices ?? []

  // === 結算階段 ===
  if (phase === 'result' && selectedIdx !== null && choices[selectedIdx]) {
    const ending = choices[selectedIdx].ending
    return (
      <div className="flex w-full justify-center py-6">
        <StoryResultCard
          choiceIdx={selectedIdx}
          title={ending.title}
          description={ending.description}
          experienceReward={ending.score}
          language={language}
          onSeeOthers={() => {
            // 回到選項頁，重新挑（保留影片不重播）
            setPhase('choosing')
            setSelectedIdx(null)
          }}
          onBackToTopic={onBackToTopic}
          onNext={() => {
            onComplete({ experienceReward: ending.score, coinReward: 0 })
            onNext()
          }}
        />
      </div>
    )
  }

  // === 選擇情境階段 ===
  if (phase === 'choosing') {
    return (
      <div className="flex w-full items-start justify-center gap-6 py-6">
        <StoryChoiceCards
          choices={choices}
          selectedIdx={selectedIdx}
          onSelect={setSelectedIdx}
        />
        <NextArrowButton
          onClick={() => setPhase('result')}
          disabled={selectedIdx === null}
        />
      </div>
    )
  }

  // === 播放影片階段 ===
  return (
    <div className="flex w-full items-center justify-center gap-6 py-6">
      <div className="w-full max-w-4xl">
        <UnitPlayer
          key={`${content.unitId}-story-${replayCount}`}
          lessonKey={lessonKey}
          unitId={content.unitId}
          section="story"
          onEnded={() => setVideoEnded(true)}
        />
        {/* 重播按鈕：左側（PRD 步驟二有左側「重播影片」，這裡放在播放階段） */}
        {videoEnded && (
          <button
            onClick={() => {
              setReplayCount((c) => c + 1)
              setVideoEnded(false)
            }}
            className="mt-3 text-sm text-text-secondary underline"
          >
            重新播放
          </button>
        )}
      </div>
      <NextArrowButton
        onClick={() => setPhase('choosing')}
        disabled={!videoEnded || choices.length === 0}
      />
    </div>
  )
}
