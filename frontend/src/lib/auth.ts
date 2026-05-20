import {
  signInWithEmailAndPassword,
  signInAnonymously as firebaseSignInAnonymously,
  createUserWithEmailAndPassword,
  signOut as firebaseSignOut,
  updateProfile,
} from 'firebase/auth'
import { auth } from './firebase'

/**
 * 使用 Email/Password 登入
 */
export async function signIn(email: string, password: string) {
  const result = await signInWithEmailAndPassword(auth, email, password)
  return result.user
}

/**
 * 使用 Email/Password 註冊
 */
export async function signUp(email: string, password: string, displayName: string) {
  const result = await createUserWithEmailAndPassword(auth, email, password)

  // 更新使用者顯示名稱
  await updateProfile(result.user, { displayName })

  return result.user
}

/**
 * 匿名登入
 */
export async function signInAnonymously() {
  const result = await firebaseSignInAnonymously(auth)
  return result.user
}

/**
 * 登出
 */
export async function signOut() {
  await firebaseSignOut(auth)
}
