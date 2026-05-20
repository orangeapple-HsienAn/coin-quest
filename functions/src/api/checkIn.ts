import * as functions from 'firebase-functions/v1'
import { getFirestore, FieldValue } from 'firebase-admin/firestore'
import { initializeApp, getApps } from 'firebase-admin/app'

if (getApps().length === 0) {
  initializeApp()
}

const db = getFirestore()

interface CheckInRequest {
  useInsurance?: boolean
}

/**
 * 每日簽到 API
 * - 領取當日薪水
 * - 抽取命運卡（risk / neutral / reward 三種類型）
 * - risk 類型可選擇使用保險理賠
 */
export const checkIn = functions
  .region('asia-east1')
  .https.onCall(async (data: CheckInRequest, context) => {
    // 驗證登入狀態
    if (!context.auth) {
      throw new functions.https.HttpsError('unauthenticated', '請先登入')
    }

    const userId = context.auth.uid
    const today = new Date().toISOString().split('T')[0]

    // 取得用戶資料
    const userRef = db.collection('users').doc(userId)
    const userDoc = await userRef.get()

    if (!userDoc.exists) {
      throw new functions.https.HttpsError('not-found', '用戶不存在')
    }

    const userData = userDoc.data()!

    // 檢查今日是否已簽到
    const checkInRef = userRef.collection('checkIns').doc(today)
    const checkInDoc = await checkInRef.get()

    if (checkInDoc.exists) {
      throw new functions.https.HttpsError('already-exists', '今日已簽到')
    }

    // 取得用戶等級資訊
    const levelDoc = await db.collection('levels').doc(String(userData.level)).get()
    const levelData = levelDoc.data()
    const dailySalary = levelData?.dailySalary ?? 1000

    // 隨機抽取命運卡
    const fateCardsSnapshot = await db
      .collection('fateCards')
      .where('isActive', '==', true)
      .get()

    let fateCard: any = null
    if (!fateCardsSnapshot.empty) {
      // 根據權重隨機抽取
      const fateCards = fateCardsSnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }))
      const totalWeight = fateCards.reduce((sum, card: any) => sum + (card.weight || 1), 0)
      let random = Math.random() * totalWeight

      for (const card of fateCards as any[]) {
        random -= card.weight || 1
        if (random <= 0) {
          fateCard = card
          break
        }
      }
    }

    // 計算金幣變化
    let coinsChange = dailySalary
    let usedInsurance = false
    let claimAmount = 0
    const cardType = fateCard?.type ?? 'neutral'

    if (fateCard) {
      if (cardType === 'risk') {
        // 風險卡：檢查是否有對應保險
        const insuranceSnapshot = await userRef
          .collection('insurances')
          .where('status', '==', 'active')
          .get()

        const hasInsurance = insuranceSnapshot.docs.some((doc) => {
          const insurance = doc.data()
          return insurance.fateCardCategory === fateCard.category
        })

        if (data.useInsurance && hasInsurance) {
          usedInsurance = true
          const insuranceDoc = insuranceSnapshot.docs.find((doc) => {
            const insurance = doc.data()
            return insurance.fateCardCategory === fateCard.category
          })
          claimAmount = insuranceDoc?.data()?.claimAmount ?? 0
          coinsChange += claimAmount
        } else {
          // 扣除風險卡損失（允許餘額為負值）
          coinsChange -= fateCard.coinLoss
        }
      } else if (cardType === 'reward') {
        // 正面獎勵卡：獲得金幣
        coinsChange += fateCard.coinGain
      }
      // neutral 類型：不影響金幣
    }

    // 使用 transaction 更新資料
    await db.runTransaction(async (transaction) => {
      // 建立簽到紀錄
      transaction.set(checkInRef, {
        date: today,
        checkedInAt: FieldValue.serverTimestamp(),
        salaryReceived: dailySalary,
        levelAtCheckIn: userData.level,
        fateCard: fateCard
          ? {
              cardId: fateCard.id,
              type: cardType,
              title: fateCard.title,
              description: fateCard.description,
              coinLoss: fateCard.coinLoss || 0,
              coinGain: fateCard.coinGain || 0,
              insuranceProductId: fateCard.insuranceProductId || null,
              usedInsurance,
              claimAmount,
            }
          : null,
      })

      // 更新用戶金幣（允許負值）
      const newCoins = (userData.coins || 0) + coinsChange
      transaction.update(userRef, {
        coins: newCoins,
        totalAssets: newCoins + (userData.totalStockValue || 0) + (userData.totalSavings || 0),
        lastLoginAt: FieldValue.serverTimestamp(),
      })

      // 建立現金交易紀錄 - 薪水
      transaction.set(userRef.collection('cashTransactions').doc(), {
        type: 'income',
        category: 'salary',
        amount: dailySalary,
        balance: newCoins,
        note: `等級 ${userData.level} 日薪`,
        relatedId: null,
        createdAt: FieldValue.serverTimestamp(),
      })

      // 風險卡損失紀錄
      if (fateCard && cardType === 'risk' && !usedInsurance) {
        transaction.set(userRef.collection('cashTransactions').doc(), {
          type: 'expense',
          category: 'risk_card_loss',
          amount: -fateCard.coinLoss,
          balance: newCoins,
          note: fateCard.title,
          relatedId: fateCard.id,
          createdAt: FieldValue.serverTimestamp(),
        })
      }

      // 正面獎勵紀錄
      if (fateCard && cardType === 'reward') {
        transaction.set(userRef.collection('cashTransactions').doc(), {
          type: 'income',
          category: 'task_reward',
          amount: fateCard.coinGain,
          balance: newCoins,
          note: fateCard.title,
          relatedId: fateCard.id,
          createdAt: FieldValue.serverTimestamp(),
        })
      }

      // 保險理賠紀錄
      if (usedInsurance && claimAmount > 0) {
        transaction.set(userRef.collection('cashTransactions').doc(), {
          type: 'income',
          category: 'insurance_claim',
          amount: claimAmount,
          balance: newCoins,
          note: `${fateCard.title} 保險理賠`,
          relatedId: fateCard.id,
          createdAt: FieldValue.serverTimestamp(),
        })
      }
    })

    return {
      success: true,
      salary: dailySalary,
      fateCard: fateCard
        ? {
            type: cardType,
            title: fateCard.title,
            description: fateCard.description,
            coinLoss: fateCard.coinLoss || 0,
            coinGain: fateCard.coinGain || 0,
            hasInsurance: usedInsurance,
            claimAmount,
          }
        : null,
    }
  })
