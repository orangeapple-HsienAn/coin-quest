/**
 * S 型蛇行路徑布局（5.2）
 * - 每行固定 4 格，不足者以空白填補（保持對齊）
 * - 奇數行（index 1, 3, ...）反向 + 靠右填補：右→左
 * - 偶數行靠左填補：左→右
 * - 最後一行若為「部分行」且整體列數為奇數，強制靠右填補（避免懸浮在左側）
 * - 水平虛線穿過卡片（被卡片底色覆蓋），形成「在線上」視覺
 * - 行末 U-shape 連接到下一行
 * - 在「下一個未完成章節」上方顯示吉祥物提示泡泡
 */
import type { ChapterItem } from '../hooks/useChapters'
import { ChapterNode } from './ChapterNode'
import type { Language } from '../lib/lessonKey'
import { tUI } from '@/lib/uiStrings'

interface SerpentinePathProps {
  chapters: ChapterItem[]
  hrefFor: (chapter: ChapterItem) => string
  language?: Language
}

const PER_ROW = 4
// Icon 是 h-16 (64px)，連線對齊 icon 垂直中心
const LINE_TOP_PX = 32
// Row 之間預留空間給 U-shape
const ROW_GAP_PX = 96
const DASH = 'border-2 border-dashed border-[#E8B963]'

export function SerpentinePath({ chapters, hrefFor, language = 'zh' }: SerpentinePathProps) {
  // 切成多個 row（每 row 4 個 chapter）
  const rows: ChapterItem[][] = []
  for (let i = 0; i < chapters.length; i += PER_ROW) {
    rows.push(chapters.slice(i, i + PER_ROW))
  }

  // 找出第一個未完成 chapter 的全域 index（吉祥物提示用）
  const nextIncompleteIdx = chapters.findIndex((c) => !c.completed)

  return (
    <div className="flex flex-col" style={{ rowGap: ROW_GAP_PX }}>
      {rows.map((row, rowIdx) => {
        const isReversed = rowIdx % 2 === 1
        const isLast = rowIdx === rows.length - 1
        const isPartial = row.length < PER_ROW

        // 部分行靠右規則：
        //   - 奇數行 reversed → 本來就靠右
        //   - 偶數行最後一行（partial）→ 也強制靠右，讓前一行的右側 U-curve 自然接到本行
        const alignRight = isReversed || (isLast && isPartial)

        // 顯示用 4-slot array：null = 空白
        const slots: Array<ChapterItem | null> = new Array(PER_ROW).fill(null)
        if (alignRight) {
          // 靠「右」填（reversed 時還要把順序倒過來；強制靠右的偶數行保持原順序）
          const seq = isReversed ? [...row].reverse() : row
          for (let i = 0; i < seq.length; i++) {
            slots[PER_ROW - seq.length + i] = seq[i]
          }
        } else {
          // LTR：依序靠「左」填
          for (let i = 0; i < row.length; i++) slots[i] = row[i]
        }

        // 計算水平線範圍：只覆蓋有卡片的區域
        const firstSlot = slots.findIndex((s) => s !== null)
        const lastSlot = slots.length - 1 - [...slots].reverse().findIndex((s) => s !== null)
        const lineLeftPct = (firstSlot / PER_ROW) * 100
        const lineRightPct = ((PER_ROW - 1 - lastSlot) / PER_ROW) * 100

        // 上一行 U-shape 從哪一側下來：奇數行 ← 上一行 LTR 從右下；偶數行 ← 上一行 RTL 從左下
        // 在那一側縮短 32px，把空間讓給 U-shape 底部那段水平線（避免兩條 dashed 重疊對不齊）
        const shortenRight = rowIdx > 0 && rowIdx % 2 === 1
        const shortenLeft = rowIdx > 0 && rowIdx % 2 === 0
        const linePadLeft = shortenLeft ? 64 : 32
        const linePadRight = shortenRight ? 64 : 32

        // 該行的 chapter 全域 index 範圍（用於判斷吉祥物要不要顯示）
        const rowGlobalStart = rowIdx * PER_ROW

        return (
          <div key={rowIdx} className="relative">
            {/* 水平穿線 */}
            {row.length > 1 && (
              <div
                className={`absolute z-0 ${DASH} border-x-0 border-b-0`}
                style={{
                  top: LINE_TOP_PX,
                  left: `calc(${lineLeftPct}% + ${linePadLeft}px)`,
                  right: `calc(${lineRightPct}% + ${linePadRight}px)`,
                }}
              />
            )}

            {/* 行末 U-shape（連接到下一行的 icon 中心）
                用 top + bottom 雙錨點：top 對齊本行 icon 中心，
                bottom 用負值延伸到下一行 icon 中心，避免寫死 row 高度造成斷線 */}
            {!isLast && (
              <div
                className={`absolute z-0 ${DASH} border-t-0 ${
                  isReversed
                    ? 'left-8 rounded-bl-3xl border-r-0'
                    : 'right-8 rounded-br-3xl border-l-0'
                }`}
                style={{
                  top: LINE_TOP_PX,
                  // 下一行 icon 中心 = 本行底 + ROW_GAP + LINE_TOP_PX
                  bottom: -(ROW_GAP_PX + LINE_TOP_PX),
                  width: 32,
                }}
              />
            )}

            {/* 卡片 grid（固定 4 欄，欄寬均分） */}
            <div className="relative z-10 grid grid-cols-4 gap-x-6">
              {slots.map((c, i) => {
                if (!c) return <div key={`empty-${rowIdx}-${i}`} />
                // 找出本卡片的全域 index：在 row 內找位置 → 換算成 chapters[] 的位置
                const inRowIdx = isReversed
                  ? row.length - 1 - (i - (PER_ROW - row.length))
                  : i
                const globalIdx = rowGlobalStart + inRowIdx
                const showHint = globalIdx === nextIncompleteIdx
                return (
                  <div key={c.id} className="relative">
                    {showHint && <MascotHint text={c.teaser ?? tUI('來挑戰這個吧！')} />}
                    <ChapterNode
                      chapterId={c.id}
                      type={c.type}
                      title={c.title}
                      completed={c.completed}
                      href={hrefFor(c)}
                      language={language}
                    />
                  </div>
                )
              })}
            </div>
          </div>
        )
      })}
    </div>
  )
}

/** 吉祥物提示泡泡（指向下一個未完成章節） */
function MascotHint({ text }: { text: string }) {
  return (
    <div className="pointer-events-none absolute -top-16 left-0 z-20 flex w-[260px] items-end gap-1">
      <span className="shrink-0 text-3xl">🦔</span>
      <div className="relative rounded-2xl border-2 border-coral bg-white px-3 py-1.5 text-xs font-medium text-coral shadow-md">
        {text}
        {/* 對話框小尾巴 */}
        <span className="absolute -bottom-1 left-3 h-2 w-2 rotate-45 border-b-2 border-r-2 border-coral bg-white" />
      </div>
    </div>
  )
}
