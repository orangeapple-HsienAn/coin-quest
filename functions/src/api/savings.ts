import * as functions from 'firebase-functions/v1'
import { getFirestore, FieldValue } from 'firebase-admin/firestore'
import { initializeApp, getApps } from 'firebase-admin/app'

if (getApps().length === 0) {
  initializeApp()
}

const db = getFirestore()

interface SavingsRequest {
  amount: number
}

/**
 * 存款 API
 */
export const deposit = functions
  .region('asia-east1')
  .https.onCall(async (data: SavingsRequest, context) => {
    if (!context.auth) {
      throw new functions.https.HttpsError('unauthenticated', '請先登入')
    }

    const { amount } = data
    if (!amount || amount <= 0) {
      throw new functions.https.HttpsError('invalid-argument', '金額必須大於 0')
    }

    const userId = context.auth.uid
    const userRef = db.collection('users').doc(userId)

    await db.runTransaction(async (transaction) => {
      const userDoc = await transaction.get(userRef)
      if (!userDoc.exists) {
        throw new functions.https.HttpsError('not-found', '用戶不存在')
      }

      const userData = userDoc.data()!
      if ((userData.coins || 0) < amount) {
        throw new functions.https.HttpsError('failed-precondition', '餘額不足')
      }

      const newCoins = (userData.coins || 0) - amount
      const newSavings = (userData.totalSavings || 0) + amount

      // 更新用戶資料
      transaction.update(userRef, {
        coins: newCoins,
        totalSavings: newSavings,
        totalAssets: newCoins + (userData.totalStockValue || 0) + newSavings,
      })

      // 建立儲蓄交易紀錄
      transaction.set(userRef.collection('savingsTransactions').doc(), {
        type: 'deposit',
        amount: amount,
        balance: newSavings,
        note: '',
        createdAt: FieldValue.serverTimestamp(),
      })

      // 建立現金交易紀錄
      transaction.set(userRef.collection('cashTransactions').doc(), {
        type: 'expense',
        category: 'savings_deposit',
        amount: -amount,
        balance: newCoins,
        note: '存入銀行',
        relatedId: null,
        createdAt: FieldValue.serverTimestamp(),
      })
    })

    return { success: true }
  })

/**
 * 提款 API
 */
export const withdraw = functions
  .region('asia-east1')
  .https.onCall(async (data: SavingsRequest, context) => {
    if (!context.auth) {
      throw new functions.https.HttpsError('unauthenticated', '請先登入')
    }

    const { amount } = data
    if (!amount || amount <= 0) {
      throw new functions.https.HttpsError('invalid-argument', '金額必須大於 0')
    }

    const userId = context.auth.uid
    const userRef = db.collection('users').doc(userId)

    await db.runTransaction(async (transaction) => {
      const userDoc = await transaction.get(userRef)
      if (!userDoc.exists) {
        throw new functions.https.HttpsError('not-found', '用戶不存在')
      }

      const userData = userDoc.data()!
      if ((userData.totalSavings || 0) < amount) {
        throw new functions.https.HttpsError('failed-precondition', '儲蓄餘額不足')
      }

      const newCoins = (userData.coins || 0) + amount
      const newSavings = (userData.totalSavings || 0) - amount

      // 更新用戶資料
      transaction.update(userRef, {
        coins: newCoins,
        totalSavings: newSavings,
        totalAssets: newCoins + (userData.totalStockValue || 0) + newSavings,
      })

      // 建立儲蓄交易紀錄
      transaction.set(userRef.collection('savingsTransactions').doc(), {
        type: 'withdraw',
        amount: amount,
        balance: newSavings,
        note: '',
        createdAt: FieldValue.serverTimestamp(),
      })

      // 建立現金交易紀錄
      transaction.set(userRef.collection('cashTransactions').doc(), {
        type: 'income',
        category: 'savings_withdraw',
        amount: amount,
        balance: newCoins,
        note: '從儲蓄提款',
        relatedId: null,
        createdAt: FieldValue.serverTimestamp(),
      })
    })

    return { success: true }
  })
