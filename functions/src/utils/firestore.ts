import { getFirestore } from 'firebase-admin/firestore'
import { initializeApp, getApps } from 'firebase-admin/app'

// 確保 Firebase Admin 只初始化一次
if (getApps().length === 0) {
  initializeApp()
}

export const db = getFirestore()

/**
 * 取得使用者文件參考
 */
export function getUserRef(userId: string) {
  return db.collection('users').doc(userId)
}

/**
 * 取得使用者子集合參考
 */
export function getUserSubcollection(
  userId: string,
  subcollection: string
) {
  return getUserRef(userId).collection(subcollection)
}
