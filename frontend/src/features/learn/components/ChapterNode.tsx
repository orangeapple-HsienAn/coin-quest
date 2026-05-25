/**
 * S 型路徑中的單一章節節點卡片（5.2）
 * 結構（依 Figma）：
 *   [Icon container 大方塊] [類型 pill 在上 + 標題對話框在下]
 * 配色：完成=綠、未完成=黃
 */
import { Link } from 'react-router'
import type { ChapterType } from '../lib/types'
import type { Language } from '../lib/lessonKey'
import { getChapterTypeLabel } from '../lib/gameTranslations'

interface ChapterNodeProps {
  chapterId: string
  type: ChapterType
  title: string
  completed: boolean
  href: string
  language?: Language
}

const TYPE_EMOJI: Record<ChapterType, string> = {
  story: '📖',
  knowledge: '🔍',
  quiz: '📋',
  game: '🕹️',
}

export function ChapterNode({ type, title, completed, href, language = 'zh' }: ChapterNodeProps) {
  const label = getChapterTypeLabel(type, language)
  const emoji = TYPE_EMOJI[type]

  // 配色 token（淺色 = 卡片底、深色 = pill 與邊框）
  const palette = completed
    ? {
        cardBg: 'bg-[#D7F0DA]', // 淺綠
        pillBg: 'bg-[#7ED77C]', // 深綠 pill
        bubbleBg: 'bg-[#EAF8EC]', // 標題對話框底
        bubbleBorder: 'border-[#7ED77C]',
        iconBg: 'bg-[#EAF8EC]',
      }
    : {
        cardBg: 'bg-[#FFF1B8]', // 淺黃
        pillBg: 'bg-[#FFCC57]', // 深黃 pill
        bubbleBg: 'bg-[#FFFBEB]',
        bubbleBorder: 'border-[#FFCC57]',
        iconBg: 'bg-[#FFFBEB]',
      }

  return (
    <Link
      to={href}
      className="group flex w-[220px] items-start gap-2 transition hover:scale-[1.03]"
    >
      {/* Icon 容器：圓角方塊 */}
      <div
        className={`flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl ${palette.iconBg} text-3xl shadow-card`}
      >
        {emoji}
      </div>

      {/* 右側：類型 pill + 標題對話框 */}
      <div className="flex min-w-0 flex-1 flex-col gap-1">
        {/* 類型 pill */}
        <span
          className={`self-start rounded-md px-2 py-0.5 text-xs font-bold text-white ${palette.pillBg}`}
        >
          {label}
        </span>
        {/* 標題對話框 */}
        <div
          className={`rounded-lg border-2 px-3 py-2 text-sm leading-snug ${palette.bubbleBg} ${palette.bubbleBorder} ${palette.cardBg}`}
        >
          {title}
        </div>
      </div>
    </Link>
  )
}
