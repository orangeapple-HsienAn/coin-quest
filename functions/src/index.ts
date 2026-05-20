/**
 * Cloud Functions 進入點
 * 匯出所有 functions
 */

// Auth 觸發
export { onUserCreate } from './auth/onUserCreate.js'

// API endpoints
export { checkIn } from './api/checkIn.js'
export { deposit, withdraw } from './api/savings.js'
export { buyStock, sellStock } from './api/stock.js'
export { buyInsurance } from './api/insurance.js'
export { completeChapter } from './api/course.js'
// export * from './api/task.js'

// Scheduled functions
export { updateStockPrices } from './scheduled/updateStockPrices.js'
// export * from './scheduled/resetDailyTasks.js'
// export * from './scheduled/calculateInterest.js'
// export * from './scheduled/expireInsurances.js'

// Callable functions (待實作)
// export * from './callable/getLeaderboard.js'
// export * from './callable/getUserAssetSummary.js'
