/**
 * 小遊戲整體流程（5.5）
 *   playing → result
 * 再玩一次：用 key 重置 iframe（強制 reload 遊戲）
 */
import { useState } from 'react'
import type { GameContent } from '../hooks/useChapterContent'
import { GameFrame } from '../components/GameFrame'
import { GameResultCard } from '../components/result/GameResultCard'
import { computeStars, coinsForStars } from '../lib/gameScoring'

interface GameViewProps {
  content: GameContent
  onComplete: (params: { experienceReward: number; coinReward: number }) => void
  onNext: () => void
}

export function GameView({ content, onComplete, onNext }: GameViewProps) {
  const [score, setScore] = useState<number | null>(null)
  const [playCount, setPlayCount] = useState(0) // 換 key 強制 iframe reload

  const handleResult = (s: number) => {
    setScore(s)
    const stars = computeStars(s)
    const coinReward = coinsForStars(stars)
    onComplete({ experienceReward: 0, coinReward })
  }

  if (score === null) {
    return (
      <GameFrame
        key={`game-${playCount}`}
        htmlUrl={content.gameHtmlUrl}
        onResult={handleResult}
      />
    )
  }

  return (
    <div className="flex w-full justify-center py-6">
      <GameResultCard
        score={score}
        stars={computeStars(score)}
        onReplay={() => {
          setScore(null)
          setPlayCount((c) => c + 1)
        }}
        onNext={onNext}
      />
    </div>
  )
}
