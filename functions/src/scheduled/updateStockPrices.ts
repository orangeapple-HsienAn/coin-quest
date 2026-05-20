/**
 * 每日更新股票價格（從 TWSE 台灣證券交易所 API 抓取收盤價）
 * 排程：每日 15:00 台灣時間（台股 13:30 收盤後）
 * 假日/休市日 API 無資料則跳過不更新
 */
import { onSchedule } from 'firebase-functions/v2/scheduler'
import { getFirestore, FieldValue } from 'firebase-admin/firestore'
import { initializeApp, getApps } from 'firebase-admin/app'

if (getApps().length === 0) {
  initializeApp()
}

const db = getFirestore()

// TWSE API：全市場當日收盤價
const TWSE_STOCK_API = 'https://www.twse.com.tw/exchangeReport/STOCK_DAY_ALL?response=json'
// TWSE OpenAPI：加權指數
const TWSE_INDEX_API = 'https://openapi.twse.com.tw/v1/exchangeReport/MI_INDEX'

// 需要追蹤的股票代號（不含 TAIEX）
const TRACKED_SYMBOLS = [
  '2330','2317','2454','2308','2891','3711','2881','2382','2882','2345',
  '2303','2884','2412','3017','2886','6669','2383','3231','2887','2885',
  '1216','2357','2327','2890','2892','2301','1303','2360','2880','3661',
  '3665','2883','5880','2379','3008','3653','2002','2408','3034','2059',
  '2603','1301','2207','6919','3045','4904','2395','2912','2615','6505',
  '0050','0056','00878','00646','00661','00662',
]

/** 解析 TWSE 數字字串（移除逗號） */
function parseNumber(str: string): number {
  return parseFloat(str.replace(/,/g, ''))
}

/** 解析漲跌價差（含正負號，如 "+1.70" 或 "-0.30" 或 "X0.00"） */
function parseChange(str: string): number {
  const cleaned = str.replace(/[^0-9.\-+]/g, '')
  return parseFloat(cleaned) || 0
}

interface StockPrice {
  symbol: string
  name: string
  close: number
  change: number
}

/** 從 TWSE API 抓取所有股票當日收盤價 */
async function fetchTWSEPrices(): Promise<StockPrice[]> {
  const res = await fetch(TWSE_STOCK_API)
  const json = await res.json()

  if (json.stat !== 'OK' || !json.data) {
    return []
  }

  const results: StockPrice[] = []
  const symbolSet = new Set(TRACKED_SYMBOLS)

  for (const row of json.data) {
    const symbol = row[0]?.trim()
    if (!symbolSet.has(symbol)) continue

    results.push({
      symbol,
      name: row[1]?.trim(),
      close: parseNumber(row[7]),     // 收盤價
      change: parseChange(row[8]),    // 漲跌價差
    })
  }

  return results
}

/** 從 TWSE OpenAPI 抓取加權指數 */
async function fetchTAIEX(): Promise<{ close: number; change: number } | null> {
  const res = await fetch(TWSE_INDEX_API)
  const json = await res.json()

  // 找到「發行量加權股價指數」
  const taiex = json.find((item: Record<string, string>) =>
    item['指數']?.includes('發行量加權股價指數')
  )
  if (!taiex) return null

  const close = parseNumber(taiex['收盤指數'])
  const changePoints = parseFloat(taiex['漲跌點數']) || 0
  // 漲跌方向
  const direction = taiex['漲跌'] === '-' ? -1 : 1

  return { close, change: direction * changePoints }
}

/**
 * Scheduled function：每日 15:00 台灣時間更新股價
 */
export const updateStockPrices = onSchedule(
  {
    schedule: '0 15 * * 1-5',  // 週一到週五 15:00
    timeZone: 'Asia/Taipei',
    region: 'asia-east1',
  },
  async () => {
    console.log('開始更新股票價格...')

    // 1. 抓取 TWSE 資料
    const [stockPrices, taiexData] = await Promise.all([
      fetchTWSEPrices(),
      fetchTAIEX(),
    ])

    // 若無資料（假日/休市），跳過
    if (stockPrices.length === 0) {
      console.log('TWSE API 無資料（可能為假日/休市），跳過更新')
      return
    }

    const today = new Date().toISOString().split('T')[0] // YYYY-MM-DD
    console.log(`取得 ${stockPrices.length} 筆股票資料，日期：${today}`)

    // 2. 先讀取所有 stocks 文件取得 previousClose
    const stocksSnapshot = await db.collection('stocks').get()
    const existingStocks = new Map<string, { currentPrice: number }>()
    stocksSnapshot.docs.forEach(doc => {
      existingStocks.set(doc.id, { currentPrice: doc.data().currentPrice })
    })

    // 3. 準備聚合文件資料 + 批次更新個股
    const aggregation: Record<string, {
      name: string
      symbol: string
      price: number
      prevClose: number
      change: number
      changePercent: number
      isIndex: boolean
    }> = {}

    // Firestore batch 上限 500，57 筆 + 1 聚合文件綽綽有餘
    const batch = db.batch()

    for (const stock of stockPrices) {
      const docId = `TW-${stock.symbol}`
      const existing = existingStocks.get(docId)
      const prevClose = existing?.currentPrice ?? stock.close
      const changePercent = prevClose > 0
        ? (stock.change / prevClose) * 100
        : 0

      // 更新個股文件
      const stockRef = db.collection('stocks').doc(docId)
      batch.update(stockRef, {
        currentPrice: stock.close,
        previousClose: prevClose,
        change: stock.change,
        changePercent: Math.round(changePercent * 100) / 100,
        updatedAt: FieldValue.serverTimestamp(),
        [`priceHistory.${today}`]: stock.close,
      })

      // 準備聚合資料
      aggregation[docId] = {
        name: stock.name,
        symbol: stock.symbol,
        price: stock.close,
        prevClose,
        change: stock.change,
        changePercent: Math.round(changePercent * 100) / 100,
        isIndex: false,
      }
    }

    // 4. 更新 TAIEX 加權指數
    if (taiexData) {
      const docId = 'TW-TAIEX'
      const existing = existingStocks.get(docId)
      const prevClose = existing?.currentPrice ?? taiexData.close
      const changePercent = prevClose > 0
        ? (taiexData.change / prevClose) * 100
        : 0

      const taiexRef = db.collection('stocks').doc(docId)
      batch.update(taiexRef, {
        currentPrice: taiexData.close,
        previousClose: prevClose,
        change: taiexData.change,
        changePercent: Math.round(changePercent * 100) / 100,
        updatedAt: FieldValue.serverTimestamp(),
        [`priceHistory.${today}`]: taiexData.close,
      })

      aggregation[docId] = {
        name: '加權指數',
        symbol: 'TAIEX',
        price: taiexData.close,
        prevClose,
        change: taiexData.change,
        changePercent: Math.round(changePercent * 100) / 100,
        isIndex: true,
      }
    }

    // 5. 寫入聚合文件 config/currentStockPrices
    const configRef = db.collection('config').doc('currentStockPrices')
    batch.set(configRef, {
      stocks: aggregation,
      updatedAt: FieldValue.serverTimestamp(),
    })

    await batch.commit()
    console.log(`股票價格更新完成：${stockPrices.length} 筆股票 + TAIEX`)
  }
)
