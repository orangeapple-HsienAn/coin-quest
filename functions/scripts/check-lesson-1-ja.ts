import { initializeApp, cert } from 'firebase-admin/app'
import { getFirestore } from 'firebase-admin/firestore'
import { readFileSync } from 'fs'
import { resolve } from 'path'
initializeApp({ credential: cert(JSON.parse(readFileSync(resolve(__dirname, '../../oa-coin-quest-firebase-adminsdk-fbsvc-9bc8452d6c.json'), 'utf-8'))) })
const db = getFirestore()
async function main() {
  // 試 stages/stage-1/lessons/lesson-1/units
  const unitsSnap = await db.collection('stages/stage-1/lessons/lesson-1/units').get()
  console.log(`units: ${unitsSnap.size}`)
  for (const u of unitsSnap.docs) {
    const data = u.data()
    const components = data.components ?? {}
    const types = ['story', 'knowledge', 'quiz', 'game'].filter((t) => components[t]?.versions?.[0])
    console.log(`  ${u.id}: types=[${types.join(',')}]`)
  }
}
main().catch((e) => { console.error(e); process.exit(1) })
