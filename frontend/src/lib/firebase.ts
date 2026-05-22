import { initializeApp } from 'firebase/app'
import { getAuth, connectAuthEmulator } from 'firebase/auth'
import { getFirestore, connectFirestoreEmulator } from 'firebase/firestore'
import { getFunctions, connectFunctionsEmulator } from 'firebase/functions'
import { getStorage, connectStorageEmulator } from 'firebase/storage'

// Firebase 配置
const firebaseConfig = {
  apiKey: 'AIzaSyDAfNMbJjauoRKcfgi7hN_VrvbZh_A3vPM',
  authDomain: 'oa-coin-quest.firebaseapp.com',
  projectId: 'oa-coin-quest',
  storageBucket: 'oa-coin-quest.firebasestorage.app',
  messagingSenderId: '727018135378',
  appId: '1:727018135378:web:40bc2d83440b09478be48b',
  measurementId: 'G-ZC6DV9RCQ8',
}

// 初始化 Firebase
const app = initializeApp(firebaseConfig)

// 初始化服務
export const auth = getAuth(app)
export const db = getFirestore(app)
export const functions = getFunctions(app, 'asia-east1')
export const storage = getStorage(app)

// 開發環境連接 Emulator
// TODO: 暫時關閉 Emulator 連線、直接連 production（因為本機尚未裝 Java/Emulator）。
//       課程同步系統上線、Emulator 環境補齊後請把下方 if 區塊恢復。
const USE_EMULATOR = false
if (import.meta.env.DEV && USE_EMULATOR) {
  console.log('🔧 開發模式：連接 Firebase Emulators...')
  console.log('   請確認已執行 npm run emulators')
  connectAuthEmulator(auth, 'http://localhost:9099', { disableWarnings: true })
  connectFirestoreEmulator(db, 'localhost', 8080)
  connectFunctionsEmulator(functions, 'localhost', 5001)
  connectStorageEmulator(storage, 'localhost', 9199)
} else if (import.meta.env.DEV) {
  console.warn('⚠️ DEV 模式直接連 production Firebase（emulator 已暫時停用）')
}

export default app
