/**
 * Cleanup Anonymous Users — 清除匿名 Firebase Auth user + 對應 Firestore doc
 *
 * 過濾邏輯：providerData 為空 + 沒有 email 的就是匿名用戶。
 * 有 email 的（包含我們的測試帳號）不會動到。
 *
 * 預設 DRY-RUN，加 --apply 才真刪除。
 *
 * 用法（從 functions/ 執行）：
 *   npx tsx scripts/cleanup-anonymous-users.ts           # dry-run
 *   npx tsx scripts/cleanup-anonymous-users.ts --apply   # 實際刪除
 */
import { initializeApp, cert } from 'firebase-admin/app'
import { getAuth, UserRecord } from 'firebase-admin/auth'
import { getFirestore } from 'firebase-admin/firestore'
import { readFileSync } from 'fs'
import { resolve } from 'path'

const APPLY = process.argv.includes('--apply')
const CQ_KEY = resolve(__dirname, '../../oa-coin-quest-firebase-adminsdk-fbsvc-9bc8452d6c.json')

const app = initializeApp({
  credential: cert(JSON.parse(readFileSync(CQ_KEY, 'utf-8'))),
})
const auth = getAuth(app)
const db = getFirestore(app)

function isAnonymous(u: UserRecord): boolean {
  // 匿名用戶：沒 email、沒 provider 連結
  return !u.email && (u.providerData?.length ?? 0) === 0
}

async function main() {
  console.log(`=== Cleanup Anonymous Users ${APPLY ? '(APPLY)' : '(DRY-RUN)'} ===\n`)

  // 1. 列出所有 Auth user
  const allUsers: UserRecord[] = []
  let pageToken: string | undefined
  do {
    const res = await auth.listUsers(1000, pageToken)
    allUsers.push(...res.users)
    pageToken = res.pageToken
  } while (pageToken)

  console.log(`Auth 總用戶數：${allUsers.length}`)

  // 2. 分類
  const anonymous = allUsers.filter(isAnonymous)
  const withEmail = allUsers.filter((u) => !isAnonymous(u))

  console.log(`保留（有 email / provider）：${withEmail.length}`)
  withEmail.forEach((u) => console.log(`  ✓ ${u.email || '(無 email)'} (uid=${u.uid.slice(0, 8)}...)`))

  console.log(`\n將刪除（匿名）：${anonymous.length}`)
  if (anonymous.length === 0) {
    console.log('沒有匿名用戶要清理。')
    process.exit(0)
  }

  // 預覽前 10 個 uid
  anonymous.slice(0, 10).forEach((u) => console.log(`  ✗ ${u.uid.slice(0, 8)}... (建立於 ${u.metadata.creationTime})`))
  if (anonymous.length > 10) console.log(`  ... 還有 ${anonymous.length - 10} 個`)

  if (!APPLY) {
    console.log('\n這是 DRY-RUN。加 --apply 才真刪除。')
    process.exit(0)
  }

  // 3. 實際刪除：Auth user + Firestore /users/{uid} doc
  console.log('\n開始刪除...')
  let authDeleted = 0
  let docDeleted = 0
  let errors = 0

  for (const u of anonymous) {
    try {
      // 先刪 Firestore doc（如果存在）
      const docRef = db.collection('users').doc(u.uid)
      const snap = await docRef.get()
      if (snap.exists) {
        await docRef.delete()
        docDeleted++
      }
      // 再刪 Auth user
      await auth.deleteUser(u.uid)
      authDeleted++
    } catch (err) {
      errors++
      console.error(`  ✗ 刪除 ${u.uid.slice(0, 8)}... 失敗：${(err as Error).message}`)
    }
  }

  console.log('\n=== 完成 ===')
  console.log(`Auth user 刪除：${authDeleted}`)
  console.log(`Firestore /users 文件刪除：${docDeleted}`)
  console.log(`錯誤：${errors}`)
  process.exit(0)
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
