/**
 * 小考驗結算卡（5.6 步驟三）
 * - 總共答對 X 題
 * - 經驗 +XX! / 金幣 +XX! 兩個 pill
 * - 再看一次題目（黃）/ 前往下個章節（綠）兩個按鈕
 */
interface QuizResultCardProps {
  correctCount: number
  totalCount: number
  experienceReward: number
  coinReward: number
  onReplay: () => void
  onNext: () => void
}

export function QuizResultCard({
  correctCount,
  experienceReward,
  coinReward,
  onReplay,
  onNext,
}: QuizResultCardProps) {
  return (
    <div className="mx-auto max-w-xl rounded-3xl bg-white px-10 py-12 text-center shadow-card">
      <h2 className="mb-6 text-2xl font-bold">
        總共答對 <span className="text-[#FF6B6B]">{correctCount}</span> 題
      </h2>

      <div className="mb-10 flex flex-col items-center gap-3">
        <span className="inline-flex items-center gap-2 rounded-full border-2 border-[#FF6B6B] bg-white px-6 py-2 text-lg font-bold text-[#FF6B6B]">
          <span>⚡</span> 經驗 +{experienceReward} !
        </span>
        <span className="inline-flex items-center gap-2 rounded-full border-2 border-[#FFC857] bg-white px-6 py-2 text-lg font-bold text-[#E89E3F]">
          <span>🪙</span> 金幣 +{coinReward} !
        </span>
      </div>

      <div className="flex justify-center gap-4">
        <button
          onClick={onReplay}
          className="rounded-xl bg-[#FFC857] px-6 py-3 font-bold text-white shadow-card transition hover:scale-105 active:scale-95"
        >
          再看一次題目
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
