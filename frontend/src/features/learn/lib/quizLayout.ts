/**
 * 自動偵測 quiz 選項排版：短選項 2×2、長選項 1×4
 * 若 CMS 端有指定 layout 欄位（'2x2' | '1x4'）則優先採用
 */
import type { QuizQuestion } from './types'

const SHORT_OPTION_THRESHOLD = 8 // chars

export function detectQuizLayout(q: QuizQuestion): '2x2' | '1x4' {
  if (q.layout) return q.layout
  const maxLen = Math.max(...q.options.map((o) => o.length))
  return maxLen <= SHORT_OPTION_THRESHOLD ? '2x2' : '1x4'
}
