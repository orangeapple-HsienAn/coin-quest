/**
 * S 型蛇行路徑布局（5.2）
 * - 每行固定 4 格，不足者以空白填補（保持對齊）
 * - 奇數行（index 1, 3, ...）反向 + 靠右填補：右→左
 * - 偶數行靠左填補：左→右
 * - 水平虛線穿過卡片（被卡片底色覆蓋），形成「在線上」視覺
 * - 行末 U-shape 連接到下一行
 */
import { Fragment } from 'react'
import type { ChapterItem } from '../hooks/useChapters'
import { ChapterNode } from './ChapterNode'

interface SerpentinePathProps {
  chapters: ChapterItem[]
  hrefFor: (chapter: ChapterItem) => string
}

const PER_ROW = 4
// Icon 是 h-16 (64px)，連線對齊 icon 垂直中心
const LINE_TOP_PX = 32
// Row 之間預留空間給 U-shape；用 gap + U-shape 高度搭配
const ROW_GAP_PX = 64
const U_SHAPE_HEIGHT = 154 // ≈ 卡片高度 90 + ROW_GAP 64，連到下一行 icon 中心
const DASH = 'border-2 border-dashed border-[#E8B963]'

export function SerpentinePath({ chapters, hrefFor }: SerpentinePathProps) {
  // 切成多個 row（每 row 4 個 chapter）
  const rows: ChapterItem[][] = []
  for (let i = 0; i < chapters.length; i += PER_ROW) {
    rows.push(chapters.slice(i, i + PER_ROW))
  }

  return (
    <div className="flex flex-col" style={{ rowGap: ROW_GAP_PX }}>
      {rows.map((row, rowIdx) => {
        const isReversed = rowIdx % 2 === 1
        const isLast = rowIdx === rows.length - 1

        // 顯示用 4-slot array：null = 空白
        const slots: Array<ChapterItem | null> = new Array(PER_ROW).fill(null)
        if (isReversed) {
          // RTL：反轉後靠「右」填（短行也對齊右側 → 接上一行的右側 U-curve）
          const reversed = [...row].reverse()
          for (let i = 0; i < reversed.length; i++) {
            slots[PER_ROW - reversed.length + i] = reversed[i]
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

        return (
          <div key={rowIdx} className="relative">
            {/* 水平穿線 */}
            {row.length > 1 && (
              <div
                className={`absolute z-0 ${DASH} border-x-0 border-b-0`}
                style={{
                  top: LINE_TOP_PX,
                  left: `calc(${lineLeftPct}% + 32px)`,
                  right: `calc(${lineRightPct}% + 32px)`,
                }}
              />
            )}

            {/* 行末 U-shape（連接到下一行的 icon 中心） */}
            {!isLast && (
              <div
                className={`absolute z-0 ${DASH} border-t-0 ${
                  isReversed
                    ? 'left-8 rounded-bl-3xl border-r-0'
                    : 'right-8 rounded-br-3xl border-l-0'
                }`}
                style={{
                  top: LINE_TOP_PX,
                  height: U_SHAPE_HEIGHT,
                  width: 32,
                }}
              />
            )}

            {/* 卡片 grid（固定 4 欄，欄寬均分） */}
            <div className="relative z-10 grid grid-cols-4 gap-x-6">
              {slots.map((c, i) =>
                c ? (
                  <ChapterNode
                    key={c.id}
                    chapterId={c.id}
                    type={c.type}
                    title={c.title}
                    completed={c.completed}
                    href={hrefFor(c)}
                  />
                ) : (
                  <Fragment key={`empty-${rowIdx}-${i}`} />
                ),
              )}
            </div>
          </div>
        )
      })}
    </div>
  )
}
