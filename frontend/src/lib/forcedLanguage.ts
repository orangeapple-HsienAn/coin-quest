/**
 * Demo 用：全站強制語言切換 flag。
 *
 * 設定為 'ja' 時，所有非 learn-lesson-content 的 UI 強制顯示日文。
 * 設定為 null 時，行為回到原本（中文）。
 *
 * 注意：learn 模組的 lesson 內容（影片、quiz、story 選項、章節 pill 等）
 * 仍依 lessonKey 解析後的 language 顯示，不受此 flag 影響。
 * → 例：/course/stage-1-lesson-1 內容仍是中文，但外層 Header 會跟 flag 走。
 *
 * Demo 結束後改為 null（或直接刪除此檔 + 相關 import）即可恢復中文。
 */
import type { Language } from '@/features/learn/lib/lessonKey'

export const FORCED_LANGUAGE: Language | null = null
