/**
 * 小故事情境選擇（5.3 步驟二）
 * 三張卡片 A/B/C，配色固定：A 橘紅、B 黃、C 綠（依 Figma）
 * - 未選：白底邊框
 * - 選中：對應顏色高亮、變大
 * - 未選的其他：灰色半透明
 */
interface ChoiceItem {
  label: string
  ending: { title: string; description: string; score: number }
}

interface StoryChoiceCardsProps {
  choices: ChoiceItem[]
  selectedIdx: number | null
  onSelect: (idx: number) => void
}

const LETTER = ['A', 'B', 'C', 'D']
// A/B/C 三色（依 Figma 與 CMS StoryEndingOverlay）
const COLORS = [
  { bg: '#FF6B4A', border: '#FF6B4A', text: '#FFFFFF' },
  { bg: '#FFCA43', border: '#FFCA43', text: '#5C4500' },
  { bg: '#64D2AA', border: '#64D2AA', text: '#FFFFFF' },
  { bg: '#5BB7E5', border: '#5BB7E5', text: '#FFFFFF' },
]

export function StoryChoiceCards({ choices, selectedIdx, onSelect }: StoryChoiceCardsProps) {
  return (
    <div className="flex w-full max-w-3xl flex-col gap-3">
      {choices.map((c, i) => {
        const isSelected = selectedIdx === i
        const isDimmed = selectedIdx !== null && !isSelected
        const color = COLORS[i] ?? COLORS[0]

        const stateStyle = isSelected
          ? { backgroundColor: color.bg, borderColor: color.border, color: color.text }
          : isDimmed
            ? { backgroundColor: '#F3F3F3', borderColor: '#E5E5E5', color: '#999', opacity: 0.6 }
            : { backgroundColor: '#FFF', borderColor: color.border, color: '#2D2D2D' }

        return (
          <button
            key={i}
            type="button"
            onClick={() => onSelect(i)}
            className="flex items-start gap-3 rounded-2xl border-3 px-5 py-4 text-left transition hover:scale-[1.01]"
            style={{ ...stateStyle, borderWidth: 3 }}
          >
            {/* A/B/C 字母圓圈 */}
            <span
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-lg font-bold"
              style={{
                backgroundColor: isSelected ? '#FFFFFF' : color.bg,
                color: isSelected ? color.bg : '#FFFFFF',
              }}
            >
              {LETTER[i]}
            </span>
            <p className="flex-1 text-base leading-snug">{c.label}</p>
          </button>
        )
      })}
    </div>
  )
}
