/**
 * Seed Test Users — 建立測試帳號（Firebase Auth + Firestore /users/{uid}）
 *
 * 6 個帳號：1 admin + 5 students，涵蓋各種測試情境。
 * 預設 DRY-RUN，加 --apply 才真寫入。
 *
 * 用法（從 functions/ 執行）：
 *   npx tsx scripts/seed-test-users.ts           # dry-run
 *   npx tsx scripts/seed-test-users.ts --apply   # 實際寫入
 */
import { initializeApp, cert } from 'firebase-admin/app'
import { getAuth } from 'firebase-admin/auth'
import { getFirestore, FieldValue } from 'firebase-admin/firestore'
import { readFileSync } from 'fs'
import { resolve } from 'path'

const APPLY = process.argv.includes('--apply')
const CQ_KEY = resolve(__dirname, '../../oa-coin-quest-firebase-adminsdk-fbsvc-9bc8452d6c.json')

const app = initializeApp({
  credential: cert(JSON.parse(readFileSync(CQ_KEY, 'utf-8'))),
})
const auth = getAuth(app)
const db = getFirestore(app)

// ============================================================
// 測試帳號清單
// ============================================================
interface TestUserSeed {
  email: string
  password: string
  displayName: string
  role?: 'admin'
  // 初始狀態
  level: number
  experience: number
  coins: number
  totalSavings: number
  // 備註（dry-run 顯示用）
  note: string
}

const TEST_USERS: TestUserSeed[] = [
  {
    email: 'admin@test.local',
    password: 'test1234',
    displayName: '管理員',
    role: 'admin',
    level: 5,
    experience: 9000,
    coins: 50000,
    totalSavings: 0,
    note: 'Admin 帳號（可進 /admin 後台）',
  },
  {
    email: 'student-1@test.local',
    password: 'test1234',
    displayName: '小新（新手）',
    level: 1,
    experience: 0,
    coins: 1000,
    totalSavings: 0,
    note: '完全新手 Lv.1 $1000',
  },
  {
    email: 'student-2@test.local',
    password: 'test1234',
    displayName: '小中（中等）',
    level: 3,
    experience: 3600,
    coins: 10000,
    totalSavings: 5000,
    note: '中等玩家 Lv.3 $10000 + 儲蓄 $5000',
  },
  {
    email: 'student-3@test.local',
    password: 'test1234',
    displayName: '小高（進階）',
    level: 5,
    experience: 9000,
    coins: 30000,
    totalSavings: 20000,
    note: '進階玩家 Lv.5 $30000 + 儲蓄 $20000',
  },
  {
    email: 'student-4@test.local',
    password: 'test1234',
    displayName: '小過（測續保）',
    level: 2,
    experience: 1600,
    coins: 5000,
    totalSavings: 0,
    note: 'Lv.2 用於測試保險過期 / 續保流程（保險需登入後手動建）',
  },
  {
    email: 'student-5@test.local',
    password: 'test1234',
    displayName: '小負（負餘額）',
    level: 1,
    experience: 0,
    coins: -2000,
    totalSavings: 0,
    note: '負餘額測試（命運卡可導致負現金）',
  },
]

// ============================================================
// 主流程
// ============================================================
async function seedUser(seed: TestUserSeed) {
  // 1. Auth：先查、不存在再建
  let uid: string
  try {
    const existing = await auth.getUserByEmail(seed.email)
    uid = existing.uid
    console.log(`  · ${seed.email} 已存在 (uid=${uid})`)
    if (APPLY) {
      // 重設密碼確保跟 seed 一致（可能被改過）
      await auth.updateUser(uid, { password: seed.password, displayName: seed.displayName })
    }
  } catch (err) {
    const code = (err as { code?: string }).code
    if (code !== 'auth/user-not-found') throw err
    if (APPLY) {
      const created = await auth.createUser({
        email: seed.email,
        password: seed.password,
        displayName: seed.displayName,
        emailVerified: true,
      })
      uid = created.uid
      console.log(`  ✓ ${seed.email} 已建立 (uid=${uid})`)
    } else {
      uid = 'WOULD-CREATE'
      console.log(`  ✓ ${seed.email} (DRY-RUN 會建立)`)
    }
  }

  // 2. Firestore /users/{uid}
  const today = new Date().toISOString().split('T')[0]
  const userDoc = {
    displayName: seed.displayName,
    avatarId: 'default',
    createdAt: FieldValue.serverTimestamp(),
    lastLoginAt: FieldValue.serverTimestamp(),
    level: seed.level,
    experience: seed.experience,
    coins: seed.coins,
    totalStockValue: 0,
    totalSavings: seed.totalSavings,
    totalAssets: seed.coins + seed.totalSavings,
    activeInsuranceCount: 0,
    dailyTaskStatus: {
      date: today,
      dailyQuizCompleted: false,
      variableTaskId: null,
      variableTaskCompleted: false,
      courseCompleted: false,
    },
    isTestAccount: true, // 標記為測試帳號，方便之後清理 / 排除排行榜
    ...(seed.role ? { role: seed.role } : {}),
  }

  if (APPLY) {
    await db.collection('users').doc(uid).set(userDoc, { merge: true })
    console.log(`    └─ /users/${uid} 已寫入：${seed.note}`)
  } else {
    console.log(`    └─ /users/{uid} 會寫入：Lv.${seed.level} $${seed.coins} 存款 $${seed.totalSavings}`)
  }
}

async function main() {
  console.log(`=== Seed Test Users ${APPLY ? '(APPLY)' : '(DRY-RUN)'} ===\n`)
  console.log(`即將處理 ${TEST_USERS.length} 個帳號：\n`)

  for (const user of TEST_USERS) {
    console.log(`[${user.email}] ${user.note}`)
    await seedUser(user)
    console.log('')
  }

  console.log('=== 完成 ===')
  if (!APPLY) {
    console.log('這是 DRY-RUN。加 --apply 才真寫入。')
  } else {
    console.log('所有測試帳號密碼統一為：test1234')
  }
  process.exit(0)
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
