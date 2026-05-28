/**
 * Probe: 驗證 CMS publishedGames 是否已有 htmlByLang / scoreThresholds / scoreCoinRewards 結構
 * 純讀，不寫入。
 *
 * 用法（從 functions/ 執行）:
 *   npx tsx scripts/probe-cms-game.ts
 */
import { initializeApp, cert } from 'firebase-admin/app'
import { getFirestore } from 'firebase-admin/firestore'
import { readFileSync } from 'fs'
import { resolve } from 'path'

const CMS_KEY = resolve(__dirname, '../../oafq-cms-1313-4c71212d9a8b.json')

const app = initializeApp({
  credential: cert(JSON.parse(readFileSync(CMS_KEY, 'utf-8'))),
})
const db = getFirestore(app)

async function main() {
  console.log('=== CMS publishedGames probe ===\n')

  // 抓 active publishedGames，前 3 筆
  // 抓全部 active publishedGames，統計多語完成率
  const snap = await db.collection('publishedGames').where('active', '==', true).get()
  console.log(`Found ${snap.size} active publishedGames\n`)

  const withMulti: string[] = []
  const withoutMulti: string[] = []

  for (const doc of snap.docs) {
    const data = doc.data()
    const hasMulti =
      data.htmlByLang &&
      typeof data.htmlByLang === 'object' &&
      data.htmlByLang.zh &&
      data.htmlByLang.ja &&
      data.htmlByLang.en
    const label = `${doc.id} (stage=${data.stageId} lesson=${data.lessonId} unit=${data.unitId})`
    if (hasMulti) withMulti.push(label)
    else withoutMulti.push(label)
  }

  console.log(`✅ 已升級多語 (${withMulti.length}):`)
  withMulti.forEach((l) => console.log('  ' + l))
  console.log(`\n❌ 仍是舊單語 (${withoutMulti.length}):`)
  withoutMulti.forEach((l) => console.log('  ' + l))

  process.exit(0)
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
