/**
 * 呼叫 completeChapter Cloud Function 發放章節獎勵。
 *
 * 此 helper 留下「日後接軌學生資料」的窗口：
 * - 目前學生資料 schema 還沒最終確認，後端 completeChapter 仍可用，前端只是呼叫
 * - 失敗時不阻擋 UI（印錯誤訊息即可），讓 UX 順暢
 */
import { httpsCallable } from 'firebase/functions'
import { functions } from '@/lib/firebase'

export interface CompleteChapterPayload {
  courseId: string
  chapterId: string
  experienceReward: number
  coinReward: number
}

export async function completeChapter(payload: CompleteChapterPayload) {
  try {
    const fn = httpsCallable<CompleteChapterPayload, { success: boolean }>(
      functions,
      'completeChapter',
    )
    await fn(payload)
  } catch (e) {
    console.error('[completeChapter] 發放獎勵失敗（之後接軌學生資料時再處理）', e)
  }
}
