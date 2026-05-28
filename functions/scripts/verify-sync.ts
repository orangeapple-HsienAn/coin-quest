/**
 * 驗證 sync 結果：列出 coin-quest 端的 stages/* 與 Storage cms-mirror/ 概況
 */
import { initializeApp, cert } from 'firebase-admin/app'
import { getFirestore } from 'firebase-admin/firestore'
import { getStorage } from 'firebase-admin/storage'
import { readFileSync } from 'fs'
import { resolve } from 'path'

const key = JSON.parse(
  readFileSync(resolve(__dirname, '../../oa-coin-quest-firebase-adminsdk-fbsvc-9bc8452d6c.json'), 'utf-8'),
)
initializeApp({ credential: cert(key), storageBucket: 'oa-coin-quest.firebasestorage.app' })
const db = getFirestore()
const bucket = getStorage().bucket()

async function main() {
  console.log('\n=== Firestore ===')
  // stages
  const stages = await db.collection('stages').get()
  for (const s of stages.docs) {
    console.log(`\nstages/${s.id}`)
    console.log(`  data:`, JSON.stringify(s.data(), null, 2).split('\n').slice(0, 8).join('\n'))
    const lessons = await s.ref.collection('lessons').get()
    for (const l of lessons.docs) {
      console.log(`  └── lessons/${l.id}  sourceVersion=${(l.data().sourceVersion as string)?.slice(0, 8)}`)
      const units = await l.ref.collection('units').get()
      for (const u of units.docs) {
        const subs = await u.ref.listCollections()
        const subInfo = await Promise.all(
          subs.map(async (c) => `${c.id}=${(await c.count().get()).data().count}`),
        )
        console.log(`      └── units/${u.id}  [${subInfo.join(', ')}]`)
      }
    }
  }

  // shared
  console.log('\n=== shared ===')
  const sharedCols = ['templates', 'backgrounds', 'characterEmotions']
  for (const name of sharedCols) {
    const c = await db.collection(`shared/${name}/items`).count().get()
    console.log(`  shared/${name}/items: ${c.data().count} docs`)
  }

  // Storage
  console.log('\n=== Storage cms-mirror/ ===')
  const [files] = await bucket.getFiles({ prefix: 'cms-mirror/' })
  const byDir: Record<string, number> = {}
  let totalBytes = 0
  for (const f of files) {
    const dir = f.name.split('/').slice(0, -1).join('/')
    byDir[dir] = (byDir[dir] || 0) + 1
    const [m] = await Promise.resolve([f.metadata])
    totalBytes += Number(m.size || 0)
  }
  for (const [d, n] of Object.entries(byDir).sort()) console.log(`  ${d}/  ${n} files`)
  console.log(`\nTotal: ${files.length} files, ${(totalBytes / 1024 / 1024).toFixed(2)} MB`)
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
