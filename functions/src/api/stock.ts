import * as functions from 'firebase-functions/v1'
import { getFirestore, FieldValue } from 'firebase-admin/firestore'
import { initializeApp, getApps } from 'firebase-admin/app'

if (getApps().length === 0) {
  initializeApp()
}

const db = getFirestore()

/** 檢查是否在交易時段（台灣時間 16:00-21:00） */
function assertTradingHours() {
  const now = new Date()
  const taiwanHour = (now.getUTCHours() + 8) % 24
  if (taiwanHour < 16 || taiwanHour >= 21) {
    throw new functions.https.HttpsError(
      'failed-precondition',
      '目前非交易時段，交易時間為 16:00-21:00'
    )
  }
}

interface BuyStockRequest {
  stockId: string
  quantity: number
}

interface SellStockRequest {
  stockId: string
  quantity: number
}

/**
 * 買進股票 API
 */
export const buyStock = functions
  .region('asia-east1')
  .https.onCall(async (data: BuyStockRequest, context) => {
    if (!context.auth) {
      throw new functions.https.HttpsError('unauthenticated', '請先登入')
    }

    const { stockId, quantity } = data
    if (!stockId || !quantity || quantity <= 0) {
      throw new functions.https.HttpsError('invalid-argument', '參數錯誤')
    }

    // 交易時段限制：台灣時間 16:00-21:00
    assertTradingHours()

    const userId = context.auth.uid
    const userRef = db.collection('users').doc(userId)
    const stockRef = db.collection('stocks').doc(stockId)
    const holdingRef = userRef.collection('stockHoldings').doc(stockId)

    await db.runTransaction(async (transaction) => {
      const [userDoc, stockDoc, holdingDoc] = await Promise.all([
        transaction.get(userRef),
        transaction.get(stockRef),
        transaction.get(holdingRef),
      ])

      if (!userDoc.exists) {
        throw new functions.https.HttpsError('not-found', '用戶不存在')
      }
      if (!stockDoc.exists) {
        throw new functions.https.HttpsError('not-found', '股票不存在')
      }

      const userData = userDoc.data()!
      const stockData = stockDoc.data()!
      const currentPrice = stockData.currentPrice
      const totalCost = currentPrice * quantity

      if ((userData.coins || 0) < totalCost) {
        throw new functions.https.HttpsError('failed-precondition', '餘額不足')
      }

      const newCoins = (userData.coins || 0) - totalCost

      // 計算新持倉
      let newQuantity = quantity
      let newAverageCost = currentPrice
      if (holdingDoc.exists) {
        const holdingData = holdingDoc.data()!
        const oldQuantity = holdingData.quantity || 0
        const oldAverageCost = holdingData.averageCost || 0
        newQuantity = oldQuantity + quantity
        // 計算加權平均成本
        newAverageCost =
          (oldQuantity * oldAverageCost + quantity * currentPrice) / newQuantity
      }

      const newStockValue = newQuantity * currentPrice

      // 計算用戶總股票市值（需要更新）
      const holdingsSnapshot = await transaction.get(
        userRef.collection('stockHoldings')
      )
      let totalStockValue = 0
      holdingsSnapshot.docs.forEach((doc) => {
        if (doc.id === stockId) {
          totalStockValue += newStockValue
        } else {
          // 需要取得該股票當前價格
          totalStockValue += doc.data().quantity * doc.data().currentPrice
        }
      })
      if (!holdingDoc.exists) {
        totalStockValue += newStockValue
      }

      // 更新用戶資料
      transaction.update(userRef, {
        coins: newCoins,
        totalStockValue: totalStockValue,
        totalAssets: newCoins + totalStockValue + (userData.totalSavings || 0),
      })

      // 更新或建立持倉
      transaction.set(holdingRef, {
        stockId: stockId,
        stockName: stockData.name,
        quantity: newQuantity,
        averageCost: newAverageCost,
        currentPrice: currentPrice,
        updatedAt: FieldValue.serverTimestamp(),
      })

      // 建立股票交易紀錄
      transaction.set(userRef.collection('stockTransactions').doc(), {
        type: 'buy',
        stockId: stockId,
        stockName: stockData.name,
        quantity: quantity,
        price: currentPrice,
        totalAmount: totalCost,
        createdAt: FieldValue.serverTimestamp(),
      })

      // 建立現金交易紀錄
      transaction.set(userRef.collection('cashTransactions').doc(), {
        type: 'expense',
        category: 'stock_buy',
        amount: -totalCost,
        balance: newCoins,
        note: `買進 ${stockData.name} ${quantity} 股`,
        relatedId: stockId,
        createdAt: FieldValue.serverTimestamp(),
      })
    })

    return { success: true }
  })

/**
 * 賣出股票 API
 */
export const sellStock = functions
  .region('asia-east1')
  .https.onCall(async (data: SellStockRequest, context) => {
    if (!context.auth) {
      throw new functions.https.HttpsError('unauthenticated', '請先登入')
    }

    const { stockId, quantity } = data
    if (!stockId || !quantity || quantity <= 0) {
      throw new functions.https.HttpsError('invalid-argument', '參數錯誤')
    }

    // 交易時段限制：台灣時間 16:00-21:00
    assertTradingHours()

    const userId = context.auth.uid
    const userRef = db.collection('users').doc(userId)
    const stockRef = db.collection('stocks').doc(stockId)
    const holdingRef = userRef.collection('stockHoldings').doc(stockId)

    let realizedPnL = 0

    await db.runTransaction(async (transaction) => {
      const [userDoc, stockDoc, holdingDoc] = await Promise.all([
        transaction.get(userRef),
        transaction.get(stockRef),
        transaction.get(holdingRef),
      ])

      if (!userDoc.exists) {
        throw new functions.https.HttpsError('not-found', '用戶不存在')
      }
      if (!stockDoc.exists) {
        throw new functions.https.HttpsError('not-found', '股票不存在')
      }
      if (!holdingDoc.exists) {
        throw new functions.https.HttpsError('failed-precondition', '未持有此股票')
      }

      const userData = userDoc.data()!
      const stockData = stockDoc.data()!
      const holdingData = holdingDoc.data()!

      if ((holdingData.quantity || 0) < quantity) {
        throw new functions.https.HttpsError('failed-precondition', '持倉不足')
      }

      const currentPrice = stockData.currentPrice
      const totalRevenue = currentPrice * quantity
      const averageCost = holdingData.averageCost || 0

      // 計算已實現損益
      realizedPnL = (currentPrice - averageCost) * quantity

      const newCoins = (userData.coins || 0) + totalRevenue
      const newQuantity = (holdingData.quantity || 0) - quantity

      // 計算新股票市值
      let totalStockValue = 0
      const holdingsSnapshot = await transaction.get(
        userRef.collection('stockHoldings')
      )
      holdingsSnapshot.docs.forEach((doc) => {
        if (doc.id === stockId) {
          if (newQuantity > 0) {
            totalStockValue += newQuantity * currentPrice
          }
        } else {
          totalStockValue += doc.data().quantity * doc.data().currentPrice
        }
      })

      // 更新用戶資料
      transaction.update(userRef, {
        coins: newCoins,
        totalStockValue: totalStockValue,
        totalAssets: newCoins + totalStockValue + (userData.totalSavings || 0),
        realizedPnL: (userData.realizedPnL || 0) + realizedPnL,
      })

      // 更新或刪除持倉
      if (newQuantity > 0) {
        transaction.update(holdingRef, {
          quantity: newQuantity,
          currentPrice: currentPrice,
          updatedAt: FieldValue.serverTimestamp(),
        })
      } else {
        transaction.delete(holdingRef)
      }

      // 建立股票交易紀錄
      transaction.set(userRef.collection('stockTransactions').doc(), {
        type: 'sell',
        stockId: stockId,
        stockName: stockData.name,
        quantity: quantity,
        price: currentPrice,
        totalAmount: totalRevenue,
        realizedPnL: realizedPnL,
        createdAt: FieldValue.serverTimestamp(),
      })

      // 建立現金交易紀錄
      transaction.set(userRef.collection('cashTransactions').doc(), {
        type: 'income',
        category: 'stock_sell',
        amount: totalRevenue,
        balance: newCoins,
        note: `賣出 ${stockData.name} ${quantity} 股`,
        relatedId: stockId,
        createdAt: FieldValue.serverTimestamp(),
      })
    })

    return { success: true, realizedPnL }
  })
