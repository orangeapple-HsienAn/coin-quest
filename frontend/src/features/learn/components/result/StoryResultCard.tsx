/**
 * 小故事結算卡（5.3 步驟三）
 * - 選項標題（A. {title}）— 顏色對應選項
 * - 劇情敘述文字
 * - 經驗 +N pill
 * - 星級：規則為 10 經驗 = 1 顆星
 * - 三顆按鈕：查看其它結果 / 回到主題 / 前往下個章節
 */
interface StoryResultCardProps {
  choiceIdx: number
  title: string
  description: string
  experienceReward: number
  onSeeOthers: () => void
  onBackToTopic: () => void
  onNext: () => void
}

const LETTER = ['A', 'B', 'C', 'D']
const COLORS = ['#FF6B4A', '#FFCA43', '#64D2AA', '#5BB7E5']

export function StoryResultCard({
  choiceIdx,
  title,
  description,
  experienceReward,
  onSeeOthers,
  onBackToTopic,
  onNext,
}: StoryResultCardProps) {
  const color = COLORS[choiceIdx] ?? COLORS[0]
  const starCount = Math.max(1, Math.floor(experienceReward / 10))

  return (
    <div className="mx-auto max-w-2xl rounded-3xl bg-white px-10 py-8 shadow-card">
      {/* 標題（彩色字母 + title） */}
      <h2 className="mb-4 text-center text-2xl font-bold" style={{ color }}>
        {LETTER[choiceIdx]}. {title}
      </h2>

      {/* 劇情敘述 */}
      <p className="mb-6 text-base leading-relaxed text-text-primary">{description}</p>

      {/* 經驗 pill + 星星 */}
      <div className="mb-8 flex flex-col items-center gap-3">
        <span className="inline-flex items-center gap-2 rounded-full border-2 border-[#FF6B6B] bg-white px-6 py-2 text-lg font-bold text-[#FF6B6B]">
          <span>⚡</span> 經驗 +{experienceReward} !
        </span>
        <div className="flex gap-1 text-2xl">
          {Array.from({ length: starCount }).map((_, i) => (
            <span key={i}>⭐</span>
          ))}
        </div>
      </div>

      <div className="flex flex-wrap justify-center gap-4">
        <button
          onClick={onSeeOthers}
          className="rounded-xl bg-[#FFC857] px-6 py-3 font-bold text-white shadow-card transition hover:scale-105 active:scale-95"
        >
          查看其它結果
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
