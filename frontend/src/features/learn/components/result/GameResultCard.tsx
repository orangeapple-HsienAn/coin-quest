/**
 * 小遊戲結算卡（5.5 步驟二）
 * - 「獲得 X 分」大字體
 * - 1/2/3 星金幣對照表，本次達成的那一行黃底高亮
 * - 再玩一次（黃）/ 前往下個章節（綠）
 */
import { STAR_COIN_REWARDS } from '../../lib/gameScoring'

interface GameResultCardProps {
  score: number
  stars: number
  onReplay: () => void
  onNext: () => void
}

export function GameResultCard({ score, stars, onReplay, onNext }: GameResultCardProps) {
  return (
    <div className="mx-auto max-w-xl rounded-3xl bg-white px-10 py-10 text-center shadow-card">
      <h2 className="mb-6 text-3xl font-bold">
        獲得 <span className="text-[#FF6B6B]">{score}</span> 分
      </h2>

      <div className="mb-8 space-y-2">
        {[1, 2, 3].map((tier) => {
          const isAchieved = stars === tier
          return (
            <div
              key={tier}
              className={`flex items-center justify-between rounded-xl border-2 px-6 py-3 ${
                isAchieved ? 'border-[#FFC857] bg-[#FFF5DC]' : 'border-transparent bg-transparent'
              }`}
            >
              <div className="flex gap-1 text-2xl">
                {Array.from({ length: tier }).map((_, i) => (
                  <span key={i}>⭐</span>
                ))}
              </div>
              <div className="text-lg font-bold text-[#E89E3F]">
                🪙 + {STAR_COIN_REWARDS[tier]}
              </div>
            </div>
          )
        })}
      </div>

      <div className="flex justify-center gap-4">
        <button
          onClick={onReplay}
          className="rounded-xl bg-[#FFC857] px-6 py-3 font-bold text-white shadow-card transition hover:scale-105 active:scale-95"
        >
          再玩一次
        </button>
        <button
          onClick={onNext}
          className="rounded-xl bg-[#4ECDC4] px-6 py-3 font-bold text-white shadow-card transition hover:scale-105 active:scale-95"
        >
          前往下個章節
        </button>
      </div>
    </div>
  )
}
