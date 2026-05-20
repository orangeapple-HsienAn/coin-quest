import * as functions from 'firebase-functions/v1'
import { getFirestore, FieldValue } from 'firebase-admin/firestore'
import { initializeApp, getApps } from 'firebase-admin/app'

// 確保 Firebase Admin 只初始化一次
if (getApps().length === 0) {
  initializeApp()
}

const db = getFirestore()

/**
 * 使用者建立時觸發
 * 建立 users/{uid} 文件，初始化預設資料
 */
export const onUserCreate = functions
  .region('asia-east1')
  .auth.user()
  .onCreate(async (user) => {
    const { uid, email, displayName } = user

    // 取得等級 1 的資料
    const level1Doc = await db.collection('levels').doc('1').get()
    const level1Data = level1Doc.data()

    // 建立使用者文件
    await db
      .collection('users')
      .doc(uid)
      .set({
        // 基本資訊
        displayName: displayName || email?.split('@')[0] || '新玩家',
        avatarId: 'default',
        createdAt: FieldValue.serverTimestamp(),
        lastLoginAt: FieldValue.serverTimestamp(),

        // 等級與經驗
        level: 1,
        experience: 0,

        // 資產（初始為 0）
        coins: 0,
        totalStockValue: 0,
        totalSavings: 0,
        totalAssets: 0,

        // 保險數量
        activeInsuranceCount: 0,

        // 今日任務狀態
        dailyTaskStatus: {
          date: new Date().toISOString().split('T')[0],
          dailyQuizCompleted: false,
          variableTaskId: null,
          variableTaskCompleted: false,
          courseCompleted: false,
        },
      })

    console.log(
      `User ${uid} created with initial data. Level 1 salary: ${level1Data?.dailySalary}`
    )
  })
