import * as functions from 'firebase-functions/v1'
import { getFirestore, FieldValue, Timestamp } from 'firebase-admin/firestore'
import { initializeApp, getApps } from 'firebase-admin/app'

if (getApps().length === 0) {
  initializeApp()
}

const db = getFirestore()

interface BuyInsuranceRequest {
  insuranceProductId: string
}

/**
 * 購買保險 API
 */
export const buyInsurance = functions
  .region('asia-east1')
  .https.onCall(async (data: BuyInsuranceRequest, context) => {
    if (!context.auth) {
      throw new functions.https.HttpsError('unauthenticated', '請先登入')
    }

    const { insuranceProductId } = data
    if (!insuranceProductId) {
      throw new functions.https.HttpsError('invalid-argument', '請選擇保險')
    }

    const userId = context.auth.uid
    const userRef = db.collection('users').doc(userId)
    const productRef = db.collection('insuranceProducts').doc(insuranceProductId)
    const userInsuranceRef = userRef.collection('insurances').doc(insuranceProductId)

    await db.runTransaction(async (transaction) => {
      const [userDoc, productDoc, existingInsurance] = await Promise.all([
        transaction.get(userRef),
        transaction.get(productRef),
        transaction.get(userInsuranceRef),
      ])

      if (!userDoc.exists) {
        throw new functions.https.HttpsError('not-found', '用戶不存在')
      }
      if (!productDoc.exists) {
        throw new functions.https.HttpsError('not-found', '保險不存在')
      }

      // 檢查是否已持有有效保險
      if (existingInsurance.exists) {
        const insuranceData = existingInsurance.data()!
        if (insuranceData.status === 'active') {
          const expiresAt = insuranceData.expiresAt as Timestamp
          if (expiresAt.toDate() > new Date()) {
            throw new functions.https.HttpsError(
              'failed-precondition',
              '已持有此保險，尚未過期'
            )
          }
        }
      }

      const userData = userDoc.data()!
      const productData = productDoc.data()!

      if ((userData.coins || 0) < productData.premium) {
        throw new functions.https.HttpsError('failed-precondition', '餘額不足')
      }

      const newCoins = (userData.coins || 0) - productData.premium
      const now = new Date()
      const expiresAt = new Date(
        now.getTime() + productData.durationDays * 24 * 60 * 60 * 1000
      )

      // 計算新的活躍保險數量
      const insurancesSnapshot = await transaction.get(userRef.collection('insurances'))
      let activeCount = 0
      insurancesSnapshot.docs.forEach((doc) => {
        const data = doc.data()
        if (data.status === 'active') {
          const expAt = data.expiresAt as Timestamp
          if (expAt.toDate() > now) {
            if (doc.id !== insuranceProductId) {
              activeCount++
            }
          }
        }
      })
      activeCount++ // 加上新購買的保險

      // 更新用戶資料
      transaction.update(userRef, {
        coins: newCoins,
        totalAssets:
          newCoins + (userData.totalStockValue || 0) + (userData.totalSavings || 0),
        activeInsuranceCount: activeCount,
      })

      // 建立或更新保險紀錄
      transaction.set(userInsuranceRef, {
        insuranceProductId: insuranceProductId,
        insuranceName: productData.name,
        purchasedAt: FieldValue.serverTimestamp(),
        expiresAt: Timestamp.fromDate(expiresAt),
        premium: productData.premium,
        claimAmount: productData.claimAmount,
        status: 'active',
      })

      // 建立現金交易紀錄
      transaction.set(userRef.collection('cashTransactions').doc(), {
        type: 'expense',
        category: 'insurance_buy',
        amount: -productData.premium,
        balance: newCoins,
        note: `購買 ${productData.name}`,
        relatedId: insuranceProductId,
        createdAt: FieldValue.serverTimestamp(),
      })
    })

    return { success: true }
  })
