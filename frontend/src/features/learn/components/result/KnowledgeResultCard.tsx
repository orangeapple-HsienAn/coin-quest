/**
 * 小知識結算卡（5.4 步驟二）
 * - 標題：完成小知識 成功獲得經驗
 * - 經驗 +50! 橘色 pill
 * - 三顆按鈕：再看一次 / 回到主題 / 前往下個章節
 */
interface KnowledgeResultCardProps {
  experienceReward: number
  onReplay: () => void
  onBackToTopic: () => void
  onNext: () => void
}

export function KnowledgeResultCard({
  experienceReward,
  onReplay,
  onBackToTopic,
  onNext,
}: KnowledgeResultCardProps) {
  return (
    <div className="mx-auto max-w-xl rounded-3xl bg-white px-10 py-12 text-center shadow-card">
      <h2 className="mb-6 text-2xl font-bold leading-relaxed">
        完成小知識
        <br />
        成功獲得經驗！
      </h2>

      <div className="mb-10 flex justify-center">
        <span className="inline-flex items-center gap-2 rounded-full border-2 border-[#FF6B6B] bg-white px-6 py-2 text-lg font-bold text-[#FF6B6B]">
          <span>⚡</span> 經驗 +{experienceReward} !
        </span>
      </div>

      <div className="flex flex-wrap justify-center gap-4">
        <button
          onClick={onReplay}
          className="rounded-xl bg-[#FFC857] px-6 py-3 font-bold text-white shadow-card transition hover:scale-105 active:scale-95"
        >
          再看一次
        </button>
        <button
          onClick={onBackToTopic}
          className="rounded-xl bg-[#5BB7E5] px-6 py-3 font-bold text-white shadow-card transition hover:scale-105 active:scale-95"
        >
          回到主題
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
