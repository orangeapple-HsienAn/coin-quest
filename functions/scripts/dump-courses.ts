/**
 * Dump coin-quest courses collection 結構
 * ----------------------------------------
 * 唯讀。列出 courses 每筆文件 + 子集合（chapters 等）的 schema 與範例。
 *
 * 用法（從 functions 目錄）：
 *   npx tsx scripts/dump-courses.ts
 */
import { initializeApp, cert } from 'firebase-admin/app'
import { getFirestore } from 'firebase-admin/firestore'
import { readFileSync, writeFileSync, mkdirSync } from 'fs'
import { resolve, dirname } from 'path'

const KEY_PATH = resolve(__dirname, '../../oa-coin-quest-firebase-adminsdk-fbsvc-9bc8452d6c.json')
const key = JSON.parse(readFileSync(KEY_PATH, 'utf-8'))

initializeApp({ credential: cert(key) })
const db = getFirestore()

const OUT = resolve(__dirname, '../../data/coin-quest-dump/courses.json')

function toPlain(obj: unknown): unknown {
  if (obj === null || obj === undefined) return obj
  if (obj instanceof Date) return obj.toISOString()
  if (typeof obj === 'object' && obj !== null && '_seconds' in obj) {
    const ts = obj as { _seconds: number; _nanoseconds: number }
    return new Date(ts._seconds * 1000 + ts._nanoseconds / 1e6).toISOString()
  }
  if (Array.isArray(obj)) return obj.map(toPlain)
  if (typeof obj === 'object') {
    const out: Record<string, unknown> = {}
    for (const [k, v] of Object.entries(obj)) out[k] = toPlain(v)
    return out
  }
  return obj
}

async function main() {
  const coursesSnap = await db.collection('courses').get()
  console.log(`\n=== courses (${coursesSnap.size} docs) ===\n`)

  const dump: Record<string, unknown> = {}

  for (const doc of coursesSnap.docs) {
    console.log(`--- ${doc.id} ---`)
    const data = toPlain(doc.data()) as Record<string, unknown>
    console.log(JSON.stringify(data, null, 2))

    // 列子集合
    const subCols = await doc.ref.listCollections()
    const subDump: Record<string, unknown> = {}
    for (const sub of subCols) {
      const subSnap = await sub.get()
      console.log(`  └── ${sub.id} (${subSnap.size} docs)`)
      const items: Record<string, unknown> = {}
      // 全 dump（chapters 估計不大）
      for (const d of subSnap.docs) {
        items[d.id] = toPlain(d.data())
      }
      subDump[sub.id] = items
      // 印第一筆當範例
      if (subSnap.size > 0) {
        const first = subSnap.docs[0]
        console.log(`     [sample ${first.id}]`)
        console.log(
          JSON.stringify(toPlain(first.data()), null, 2)
            .split('\n')
            .map((l) => `     ${l}`)
            .join('\n'),
        )
      }
    }

    dump[doc.id] = { ...data, _subcollections: subDump }
    console.log()
  }

  mkdirSync(dirname(OUT), { recursive: true })
  writeFileSync(OUT, JSON.stringify(dump, null, 2), 'utf-8')
  console.log(`\nFull dump → ${OUT}`)
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
