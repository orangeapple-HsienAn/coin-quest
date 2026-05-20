/**
 * 股票 seed 資料（台灣50成分股 + ETF + 加權指數）
 * 執行方式：npm run seed:stocks (在 functions 目錄下)
 */
import { initializeApp, applicationDefault } from 'firebase-admin/app'
import { getFirestore, FieldValue } from 'firebase-admin/firestore'

initializeApp({ credential: applicationDefault(), projectId: 'oa-coin-quest' })
const db = getFirestore()

// 台灣50成分股
const tw50Stocks = [
  { symbol: '2330', name: '台積電', currentPrice: 1915 },
  { symbol: '2317', name: '鴻海', currentPrice: 227 },
  { symbol: '2454', name: '聯發科', currentPrice: 1855 },
  { symbol: '2308', name: '台達電', currentPrice: 1260 },
  { symbol: '2891', name: '中信金', currentPrice: 52.2 },
  { symbol: '3711', name: '日月光投控', currentPrice: 354.5 },
  { symbol: '2881', name: '富邦金', currentPrice: 95.2 },
  { symbol: '2382', name: '廣達', currentPrice: 286 },
  { symbol: '2882', name: '國泰金', currentPrice: 78.8 },
  { symbol: '2345', name: '智邦', currentPrice: 1450 },
  { symbol: '2303', name: '聯電', currentPrice: 62.8 },
  { symbol: '2884', name: '玉山金', currentPrice: 34.15 },
  { symbol: '2412', name: '中華電', currentPrice: 133 },
  { symbol: '3017', name: '奇鋐', currentPrice: 1605 },
  { symbol: '2886', name: '兆豐金', currentPrice: 40.05 },
  { symbol: '6669', name: '緯穎', currentPrice: 3740 },
  { symbol: '2383', name: '台光電', currentPrice: 2195 },
  { symbol: '3231', name: '緯創', currentPrice: 131.5 },
  { symbol: '2887', name: '台新新光金', currentPrice: 24 },
  { symbol: '2885', name: '元大金', currentPrice: 44.75 },
  { symbol: '1216', name: '統一', currentPrice: 73.4 },
  { symbol: '2357', name: '華碩', currentPrice: 523 },
  { symbol: '2327', name: '國巨', currentPrice: 256 },
  { symbol: '2890', name: '永豐金', currentPrice: 31.1 },
  { symbol: '2892', name: '第一金', currentPrice: 29.45 },
  { symbol: '2301', name: '光寶科', currentPrice: 179.5 },
  { symbol: '1303', name: '南亞', currentPrice: 78.8 },
  { symbol: '2360', name: '致茂', currentPrice: 1050 },
  { symbol: '2880', name: '華南金', currentPrice: 34.6 },
  { symbol: '3661', name: '世芯-KY', currentPrice: 3380 },
  { symbol: '3665', name: '貿聯-KY', currentPrice: 1365 },
  { symbol: '2883', name: '凱基金', currentPrice: 19.25 },
  { symbol: '5880', name: '合庫金', currentPrice: 23.9 },
  { symbol: '2379', name: '瑞昱', currentPrice: 476 },
  { symbol: '3008', name: '大立光', currentPrice: 2290 },
  { symbol: '3653', name: '健策', currentPrice: 3205 },
  { symbol: '2002', name: '中鋼', currentPrice: 20.9 },
  { symbol: '2408', name: '南亞科', currentPrice: 278 },
  { symbol: '3034', name: '聯詠', currentPrice: 375 },
  { symbol: '2059', name: '川湖', currentPrice: 3030 },
  { symbol: '2603', name: '長榮', currentPrice: 186 },
  { symbol: '1301', name: '台塑', currentPrice: 46.5 },
  { symbol: '2207', name: '和泰車', currentPrice: 549 },
  { symbol: '6919', name: '康霈', currentPrice: 160 },
  { symbol: '3045', name: '台灣大', currentPrice: 106.5 },
  { symbol: '4904', name: '遠傳', currentPrice: 91.9 },
  { symbol: '2395', name: '研華', currentPrice: 305 },
  { symbol: '2912', name: '統一超', currentPrice: 223 },
  { symbol: '2615', name: '萬海', currentPrice: 75 },
  { symbol: '6505', name: '台塑化', currentPrice: 49.75 },
]

// 台灣掛牌 ETF
const etfs = [
  { symbol: '0050', name: '元大台灣50', currentPrice: 195 },
  { symbol: '0056', name: '元大高股息', currentPrice: 37 },
  { symbol: '00878', name: '國泰永續高股息', currentPrice: 23 },
  { symbol: '00646', name: '元大S&P500', currentPrice: 65 },
  { symbol: '00661', name: '元大日經225', currentPrice: 32 },
  { symbol: '00662', name: '富邦NASDAQ', currentPrice: 75 },
]

async function seed() {
  const batch = db.batch()

  // 加權指數（僅供參考，不可交易）
  const taiexRef = db.collection('stocks').doc('TW-TAIEX')
  batch.set(taiexRef, {
    symbol: 'TAIEX',
    name: '加權指數',
    country: 'TW',
    currentPrice: 25000,
    previousClose: 25000,
    change: 0,
    changePercent: 0,
    isIndex: true,
    isActive: true,
    updatedAt: FieldValue.serverTimestamp(),
  })

  // 台灣50成分股
  for (const stock of tw50Stocks) {
    const ref = db.collection('stocks').doc(`TW-${stock.symbol}`)
    batch.set(ref, {
      symbol: stock.symbol,
      name: stock.name,
      country: 'TW',
      currentPrice: stock.currentPrice,
      previousClose: stock.currentPrice,
      change: 0,
      changePercent: 0,
      isIndex: false,
      isActive: true,
      updatedAt: FieldValue.serverTimestamp(),
    })
  }

  // ETF
  for (const etf of etfs) {
    const ref = db.collection('stocks').doc(`TW-${etf.symbol}`)
    batch.set(ref, {
      symbol: etf.symbol,
      name: etf.name,
      country: 'TW',
      currentPrice: etf.currentPrice,
      previousClose: etf.currentPrice,
      change: 0,
      changePercent: 0,
      isIndex: false,
      isActive: true,
      updatedAt: FieldValue.serverTimestamp(),
    })
  }

  await batch.commit()
  console.log(`✓ 加權指數 (TW-TAIEX)`)
  console.log(`✓ 台灣50成分股 ${tw50Stocks.length} 檔`)
  console.log(`✓ ETF ${etfs.length} 檔`)
  console.log(`股票 seed 完成，共 ${1 + tw50Stocks.length + etfs.length} 筆`)
}

seed()
