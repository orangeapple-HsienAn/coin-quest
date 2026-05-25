/**
 * 小知識整體流程（5.4）：
 *   playing（影片）→ result（結算）
 * - 影片必須播完，右側黃箭頭才會啟用
 * - 再看一次：用 key 重置 Player 強制 reload
 * - 回到主題：跳回章節列表，不發獎勵
 * - 前往下個章節：發放經驗 +50 + 跳回章節列表
 */
import { useState } from 'react'
import type { KnowledgeContent } from '../hooks/useChapterContent'
import { UnitPlayer } from '../components/UnitPlayer'
import { NextArrowButton } from '../components/NextArrowButton'
import { KnowledgeResultCard } from '../components/result/KnowledgeResultCard'
import type { Language } from '../lib/lessonKey'

const EXP_REWARD = 50

interface KnowledgeViewProps {
  lessonKey: string
  content: KnowledgeContent
  language?: Language
  onComplete: (params: { experienceReward: number; coinReward: number }) => void
  onNext: () => void
  /** 回到主題（章節列表）— 由上層提供，與 onNext 相同目的地但不發獎勵 */
  onBackToTopic: () => void
}

export function KnowledgeView({
  lessonKey,
  content,
  language = 'zh',
  onComplete,
  onNext,
  onBackToTopic,
}: KnowledgeViewProps) {
  const [phase, setPhase] = useState<'playing' | 'result'>('playing')
  const [videoEnded, setVideoEnded] = useState(false)
  const [replayCount, setReplayCount] = useState(0)

  if (phase === 'result') {
    return (
      <div className="flex w-full justify-center py-6">
        <KnowledgeResultCard
          experienceReward={EXP_REWARD}
          language={language}
          onReplay={() => {
            setPhase('playing')
            setVideoEnded(false)
            setReplayCount((c) => c + 1)
          }}
          onBackToTopic={onBackToTopic}
          onNext={() => {
            onComplete({ experienceReward: EXP_REWARD, coinReward: 0 })
            onNext()
          }}
        />
      </div>
    )
  }

  return (
    <div className="flex w-full items-center justify-center gap-6 py-6">
      <div className="w-full max-w-4xl">
        <UnitPlayer
          // 用 key 強制重新掛載 Player（再看一次時）
          key={`${content.unitId}-knowledge-${replayCount}`}
          lessonKey={lessonKey}
          unitId={content.unitId}
          section="knowledge"
          onEnded={() => setVideoEnded(true)}
        />
      </div>
      <NextArrowButton
        onClick={() => setPhase('result')}
        disabled={!videoEnded}
      />
    </div>
  )
}
