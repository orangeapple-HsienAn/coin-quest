/**
 * 小故事結算卡（5.3 步驟三）
 */
import { t } from '../../lib/gameTranslations'
import type { Language } from '../../lib/lessonKey'

interface StoryResultCardProps {
  choiceIdx: number
  title: string
  description: string
  experienceReward: number
  language?: Language
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
  language = 'zh',
  onSeeOthers,
  onBackToTopic,
  onNext,
}: StoryResultCardProps) {
  const color = COLORS[choiceIdx] ?? COLORS[0]
  const starCount = Math.max(1, Math.floor(experienceReward / 10))

  return (
    <div className="mx-auto max-w-2xl rounded-3xl bg-white px-10 py-8 shadow-card">
      <h2 className="mb-4 text-center text-2xl font-bold" style={{ color }}>
        {LETTER[choiceIdx]}. {title}
      </h2>

      <p className="mb-6 text-base leading-relaxed text-text-primary">{description}</p>

      <div className="mb-8 flex flex-col items-center gap-3">
        <span className="inline-flex items-center gap-2 rounded-full border-2 border-[#FF6B6B] bg-white px-6 py-2 text-lg font-bold text-[#FF6B6B]">
          <span>⚡</span> {t('經驗', language)} +{experienceReward} !
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
          {t('查看其它結果', language)}
        </button>
        <button
          onClick={onBackToTopic}
          className="rounded-xl bg-[#5BB7E5] px-6 py-3 font-bold text-white shadow-card transition hover:scale-105 active:scale-95"
        >
          {t('回到主題', language)}
        </button>
        <button
          onClick={onNext}
          className="rounded-xl bg-[#4ECDC4] px-6 py-3 font-bold text-white shadow-card transition hover:scale-105 active:scale-95"
        >
          {t('前往下個章節', language)}
        </button>
      </div>
    </div>
  )
}
