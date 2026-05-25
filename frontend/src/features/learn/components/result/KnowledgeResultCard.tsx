/**
 * 小知識結算卡（5.4 步驟二）
 */
import { t } from '../../lib/gameTranslations'
import type { Language } from '../../lib/lessonKey'

interface KnowledgeResultCardProps {
  experienceReward: number
  language?: Language
  onReplay: () => void
  onBackToTopic: () => void
  onNext: () => void
}

export function KnowledgeResultCard({
  experienceReward,
  language = 'zh',
  onReplay,
  onBackToTopic,
  onNext,
}: KnowledgeResultCardProps) {
  return (
    <div className="mx-auto max-w-xl rounded-3xl bg-white px-10 py-12 text-center shadow-card">
      <h2 className="mb-6 text-2xl font-bold leading-relaxed">
        {t('完成小知識', language)}
        <br />
        {t('成功獲得經驗！', language)}
      </h2>

      <div className="mb-10 flex justify-center">
        <span className="inline-flex items-center gap-2 rounded-full border-2 border-[#FF6B6B] bg-white px-6 py-2 text-lg font-bold text-[#FF6B6B]">
          <span>⚡</span> {t('經驗', language)} +{experienceReward} !
        </span>
      </div>

      <div className="flex flex-wrap justify-center gap-4">
        <button
          onClick={onReplay}
          className="rounded-xl bg-[#FFC857] px-6 py-3 font-bold text-white shadow-card transition hover:scale-105 active:scale-95"
        >
          {t('再看一次', language)}
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
