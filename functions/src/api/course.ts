import * as functions from 'firebase-functions/v1'
import { getFirestore, FieldValue } from 'firebase-admin/firestore'
import { initializeApp, getApps } from 'firebase-admin/app'

if (getApps().length === 0) {
  initializeApp()
}

const db = getFirestore()

interface CompleteChapterRequest {
  courseId: string
  chapterId: string
  experienceReward: number
  coinReward: number
}

/**
 * 完成章節 API
 * - 更新 courseProgress 的 completedChapters
 * - 發放經驗值和金幣
 * - 記錄 cashTransaction（如有金幣獎勵）
 */
export const completeChapter = functions
  .region('asia-east1')
  .https.onCall(async (data: CompleteChapterRequest, context) => {
    if (!context.auth) {
      throw new functions.https.HttpsError('unauthenticated', '請先登入')
    }

    const userId = context.auth.uid
    const { courseId, chapterId, experienceReward, coinReward } = data

    const userRef = db.collection('users').doc(userId)
    const progressRef = userRef.collection('courseProgress').doc(courseId)

    await db.runTransaction(async (transaction) => {
      const [userDoc, progressDoc] = await Promise.all([
        transaction.get(userRef),
        transaction.get(progressRef),
      ])

      if (!userDoc.exists) {
        throw new functions.https.HttpsError('not-found', '用戶不存在')
      }

      const userData = userDoc.data()!

      // 檢查是否已完成（避免重複領獎）
      const completedChapters = progressDoc.exists
        ? progressDoc.data()?.completedChapters || []
        : []
      if (completedChapters.includes(chapterId)) {
        return // 已完成，不重複發放獎勵
      }

      // 更新 courseProgress
      if (progressDoc.exists) {
        transaction.update(progressRef, {
          completedChapters: FieldValue.arrayUnion(chapterId),
          lastAccessedAt: FieldValue.serverTimestamp(),
        })
      } else {
        transaction.set(progressRef, {
          courseId,
          completedChapters: [chapterId],
          lastAccessedAt: FieldValue.serverTimestamp(),
        })
      }

      // 發放經驗值和金幣
      const newExp = (userData.experience || 0) + experienceReward
      const newCoins = (userData.coins || 0) + coinReward
      const updateData: Record<string, any> = {
        experience: newExp,
        totalAssets: newCoins + (userData.totalStockValue || 0) + (userData.totalSavings || 0),
      }
      if (coinReward > 0) {
        updateData.coins = newCoins
      }
      transaction.update(userRef, updateData)

      // 金幣獎勵時記錄 cashTransaction
      if (coinReward > 0) {
        transaction.set(userRef.collection('cashTransactions').doc(), {
          type: 'income',
          category: 'course_reward',
          amount: coinReward,
          balance: newCoins,
          note: `完成課程章節獎勵`,
          relatedId: `${courseId}/${chapterId}`,
          createdAt: FieldValue.serverTimestamp(),
        })
      }
    })

    return { success: true }
  })
