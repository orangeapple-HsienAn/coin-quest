/**
 * Demo 一次性：把所有匿名用戶的 coins 補到至少 200，並重算 totalAssets。
 *
 * 用法（從 functions 目錄）：
 *   npx tsx scripts/topup-anonymous.ts
 */
import { initializeApp, cert } from 'firebase-admin/app'
import { getAuth } from 'firebase-admin/auth'
import { getFirestore } from 'firebase-admin/firestore'
import { readFileSync } from 'fs'
import { resolve } from 'path'

const KEY_PATH = resolve(__dirname, '../../oa-coin-quest-firebase-adminsdk-fbsvc-9bc8452d6c.json')
const key = JSON.parse(readFileSync(KEY_PATH, 'utf-8'))

initializeApp({ credential: cert(key) })
const db = getFirestore()
const auth = getAuth()

const TARGET = 200

async function main() {
  const anonUids: string[] = []
  let pageToken: string | undefined
  do {
    const page = await auth.listUsers(1000, pageToken)
    for (const u of page.users) {
      // 匿名用戶：沒有任何 providerData
      if (u.providerData.length === 0) anonUids.push(u.uid)
    }
    pageToken = page.pageToken
  } while (pageToken)

  console.log(`找到 ${anonUids.length} 個匿名用戶`)

  let updated = 0
  for (const uid of anonUids) {
    const ref = db.doc(`users/${uid}`)
    const snap = await ref.get()
    if (!snap.exists) {
      console.log(`  skip ${uid}（無 user doc）`)
      continue
    }
    const data = snap.data() as { coins?: number; totalStockValue?: number; totalSavings?: number }
    const coins = data.coins ?? 0
    if (coins >= TARGET) {
      console.log(`  skip ${uid}（已有 ${coins}）`)
      continue
    }
    const newCoins = TARGET
    const totalAssets = newCoins + (data.totalStockValue ?? 0) + (data.totalSavings ?? 0)
    await ref.update({ coins: newCoins, totalAssets })
    console.log(`  ✓ ${uid}: ${coins} → ${newCoins}`)
    updated++
  }
  console.log(`完成，更新了 ${updated} 個用戶`)
}

main().catch((e) => { console.error(e); process.exit(1) })
