/**
 * Coin-Quest Firestore 連線測試 + collection 盤點
 * ----------------------------------------------
 * 只讀不寫。確認 service account 可正常連線並列出現有 collection 與筆數。
 *
 * 用法（從 functions 目錄執行）：
 *   npx tsx scripts/probe-coin-quest.ts
 */
import { initializeApp, cert } from 'firebase-admin/app'
import { getFirestore } from 'firebase-admin/firestore'
import { getStorage } from 'firebase-admin/storage'
import { readFileSync } from 'fs'
import { resolve } from 'path'

const KEY_PATH = resolve(__dirname, '../../oa-coin-quest-firebase-adminsdk-fbsvc-9bc8452d6c.json')
const key = JSON.parse(readFileSync(KEY_PATH, 'utf-8'))

const app = initializeApp({
  credential: cert(key),
  storageBucket: `${key.project_id}.firebasestorage.app`,
})

const db = getFirestore(app)
const bucket = getStorage(app).bucket()

async function main() {
  console.log(`\n=== Coin-Quest Probe ===`)
  console.log(`Project: ${key.project_id}`)
  console.log(`Bucket:  ${bucket.name}\n`)

  // 1. 列出 root collections
  const cols = await db.listCollections()
  console.log(`Root collections (${cols.length}):`)
  for (const c of cols) {
    const snap = await c.count().get()
    console.log(`  - ${c.id.padEnd(28)} ${snap.data().count} docs`)
  }

  // 2. Storage 根目錄前 20 個物件
  console.log(`\nStorage (first 20 objects):`)
  const [files] = await bucket.getFiles({ maxResults: 20 })
  if (files.length === 0) {
    console.log('  (empty)')
  } else {
    for (const f of files) {
      console.log(`  - ${f.name}`)
    }
  }

  console.log(`\n=== OK ===`)
}

main().catch((e) => {
  console.error('FAILED:', e)
  process.exit(1)
})
