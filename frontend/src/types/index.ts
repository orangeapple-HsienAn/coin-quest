import type { Timestamp } from 'firebase/firestore'

/** 使用者資料 */
export interface User {
  displayName: string
  avatarId: string
  role?: string                 // 角色（'admin' 可訪問後台）
  createdAt: Timestamp
  lastLoginAt: Timestamp
  level: number
  experience: number
  coins: number
  totalStockValue: number
  totalSavings: number
  totalAssets: number
  realizedPnL: number
  activeInsuranceCount: number
  dailyTaskStatus: {
    date: string
    dailyQuizCompleted: boolean
    variableTaskId: string | null
    variableTaskCompleted: boolean
    courseCompleted: boolean
  }
}

/** 簽到紀錄 */
export interface CheckIn {
  date: string
  checkedInAt: Timestamp
  salaryReceived: number
  levelAtCheckIn: number
  fateCard: {
    cardId: string
    type: 'risk' | 'neutral' | 'reward'
    title: string
    description: string
    coinLoss: number
    coinGain: number
    insuranceProductId: string | null
    usedInsurance: boolean
    claimAmount: number
  } | null
}

/** 現金交易類別 */
export type CashTransactionCategory =
  | 'salary'
  | 'task_reward'
  | 'quiz_reward'
  | 'course_reward'
  | 'stock_buy'
  | 'stock_sell'
  | 'stock_dividend'
  | 'savings_deposit'
  | 'savings_withdraw'
  | 'savings_interest'
  | 'insurance_buy'
  | 'insurance_claim'
  | 'risk_card_loss'

/** 現金交易紀錄 */
export interface CashTransaction {
  type: 'income' | 'expense'
  category: CashTransactionCategory
  amount: number
  balance: number
  note: string
  relatedId: string | null
  createdAt: Timestamp
}

/** 股票持倉 */
export interface StockHolding {
  stockId: string
  stockName: string
  quantity: number
  averageCost: number
  currentPrice: number
  updatedAt: Timestamp
}

/** 股票定義 */
export interface Stock {
  symbol: string
  name: string
  country: string
  currentPrice: number
  previousClose: number
  change: number
  changePercent: number
  isIndex: boolean
  isActive: boolean
  updatedAt: Timestamp
  priceHistory?: Record<string, number>  // 歷史收盤價 { 'YYYY-MM-DD': closePrice }
}

/** config/currentStockPrices 聚合文件中的單筆股票 */
export interface StockPriceEntry {
  name: string
  symbol: string
  price: number
  prevClose: number
  change: number
  changePercent: number
  isIndex: boolean
}

/** config/currentStockPrices 聚合文件 */
export interface CurrentStockPrices {
  stocks: Record<string, StockPriceEntry>
  updatedAt: Timestamp
}

/** 股票交易紀錄 */
export interface StockTransaction {
  stockId: string
  stockName: string
  type: 'buy' | 'sell'
  quantity: number
  price: number
  totalAmount: number
  realizedPnL: number | null  // 僅 sell 時有值
  createdAt: Timestamp
}

/** 儲蓄交易紀錄 */
export interface SavingsTransaction {
  type: 'deposit' | 'withdraw' | 'interest'
  amount: number
  balance: number
  note: string
  createdAt: Timestamp
}

/** 使用者持有的保險 */
export interface UserInsurance {
  insuranceProductId: string
  insuranceName: string
  purchasedAt: Timestamp
  expiresAt: Timestamp
  premium: number
  claimAmount: number
  status: 'active' | 'expired'
}

/** 保險產品定義 */
export interface InsuranceProduct {
  name: string
  description: string
  iconUrl: string
  claimAmount: number
  premium: number
  durationDays: number
  fateCardCategory: string
  isActive: boolean
  order: number
}

/** 等級定義 */
export interface Level {
  level: number
  name: string
  dailySalary: number
  experienceRequired: number
  badgeUrl: string
}

/** 命運卡定義 */
export interface FateCard {
  type: 'risk' | 'neutral' | 'reward'
  title: string
  description: string
  imageUrl: string
  coinLoss: number
  coinGain: number
  category: string
  weight: number
  isActive: boolean
}
