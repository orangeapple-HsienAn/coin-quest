/**
 * 小考驗題目 + 選項區（5.6 步驟一）
 * - 顯示題號 + 題目
 * - 選項採 2×2 或 1×4 排版（依字長自動判定，或 CMS 端指定）
 * - 互動三態：
 *    - 預設：白底邊框淡灰
 *    - 選中（answering）：藍框
 *    - 詳解模式（reviewing）：正確 = 綠框、錯誤(被使用者選) = 紅框、其他 = 灰色淡化
 */
import type { QuizQuestion as QuizQuestionType } from '../lib/types'
import { detectQuizLayout } from '../lib/quizLayout'

interface QuizQuestionProps {
  index: number
  question: QuizQuestionType
  selectedIdx: number | null
  /** true = 詳解模式（揭曉答案） */
  revealed: boolean
  onSelect: (idx: number) => void
}

const LABELS = ['A', 'B', 'C', 'D']

export function QuizQuestion({ index, question, selectedIdx, revealed, onSelect }: QuizQuestionProps) {
  const layout = detectQuizLayout(question)
  const gridClass = layout === '2x2' ? 'grid-cols-2' : 'grid-cols-1'

  return (
    <div className="rounded-2xl bg-white px-8 py-6 shadow-card">
      <p className="mb-5 text-lg font-medium leading-snug">
        {index + 1}. {question.question}
      </p>
      <div className={`grid gap-3 ${gridClass}`}>
        {question.options.map((opt, i) => {
          const isSelected = selectedIdx === i
          const isCorrect = question.answer === i

          // 邊框顏色邏輯
          let stateClass: string
          if (revealed) {
            if (isCorrect) {
              stateClass = 'border-[#4ECDC4] bg-white' // 綠框正確
            } else if (isSelected) {
              stateClass = 'border-[#FF6B6B] bg-white' // 紅框（錯選）
            } else {
              stateClass = 'border-gray-200 bg-white opacity-50'
            }
          } else {
            stateClass = isSelected
              ? 'border-[#5BB7E5] bg-white' // 藍框選中
              : 'border-gray-200 bg-white hover:border-gray-300'
          }

          return (
            <button
              key={i}
              type="button"
              onClick={() => !revealed && onSelect(i)}
              disabled={revealed}
              className={`rounded-xl border-2 px-4 py-3 text-left text-base transition ${stateClass} ${
                revealed ? 'cursor-default' : 'cursor-pointer'
              }`}
            >
              <span className="mr-2 font-bold">{LABELS[i]}.</span>
              {opt}
            </button>
          )
        })}
      </div>
    </div>
  )
}
