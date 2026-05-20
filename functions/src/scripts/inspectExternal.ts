/**
 * 探測對方 Firestore 的資料結構
 * 執行：cd functions && npx tsx src/scripts/inspectExternal.ts
 *
 * 用途：列出所有 collection、每個 collection 的範例 document
 *      讓我們知道對方資料長什麼樣，才能寫對應的同步腳本
 */
import { initializeApp, cert } from 'firebase-admin/app'
import { getFirestore } from 'firebase-admin/firestore'
import * as path from 'path'

// 對方專案的 service account 金鑰（放在專案根目錄）
const serviceAccountPath = path.resolve(
  __dirname,
  '../../../oafq-cms-1313-4c71212d9a8b.json'
)
// eslint-disable-next-line @typescript-eslint/no-var-requires
const serviceAccount = require(serviceAccountPath)

initializeApp({ credential: cert(serviceAccount) })
const db = getFirestore()

async function main() {
  console.log('\n=== 連線資訊 ===')
  console.log('Project ID:', serviceAccount.project_id)
  console.log('Client email:', serviceAccount.client_email)

  console.log('\n=== 列出所有根目錄 collection ===')
  const collections = await db.listCollections()
  if (collections.length === 0) {
    console.log('（無 collection，資料庫可能是空的）')
    return
  }
  console.log(collections.map((c) => c.id))

  for (const col of collections) {
    console.log(`\n=== Collection: "${col.id}" ===`)
    const snap = await col.limit(3).get()
    console.log(`  總筆數（前 3 筆預覽）: ${snap.size}`)

    for (const docSnap of snap.docs) {
      console.log(`\n  --- Document ID: ${docSnap.id} ---`)
      console.log(JSON.stringify(docSnap.data(), null, 2))

      // 列出該 doc 底下的 sub-collections
      const subCols = await docSnap.ref.listCollections()
      if (subCols.length > 0) {
        console.log(`  Sub-collections: ${subCols.map((s) => s.id).join(', ')}`)
        for (const sub of subCols) {
          const subSnap = await sub.limit(2).get()
          for (const subDoc of subSnap.docs) {
            console.log(`\n    >> ${sub.id}/${subDoc.id}`)
            console.log(JSON.stringify(subDoc.data(), null, 2))
          }
        }
      }
    }
  }
}

main()
  .then(() => process.exit(0))
  .catch((e) => {
    console.error('錯誤:', e)
    process.exit(1)
  })
