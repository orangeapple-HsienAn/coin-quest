/**
 * Debug：列出所有匿名用戶的 courseProgress。
 */
import { initializeApp, cert } from 'firebase-admin/app'
import { getAuth } from 'firebase-admin/auth'
import { getFirestore } from 'firebase-admin/firestore'
import { readFileSync } from 'fs'
import { resolve } from 'path'

const KEY_PATH = resolve(__dirname, '../../oa-coin-quest-firebase-adminsdk-fbsvc-9bc8452d6c.json')
initializeApp({ credential: cert(JSON.parse(readFileSync(KEY_PATH, 'utf-8'))) })
const db = getFirestore()
const auth = getAuth()

async function main() {
  const anonUids: string[] = []
  let pageToken: string | undefined
  do {
    const page = await auth.listUsers(1000, pageToken)
    for (const u of page.users) if (u.providerData.length === 0) anonUids.push(u.uid)
    pageToken = page.pageToken
  } while (pageToken)

  for (const uid of anonUids) {
    const progressSnap = await db.collection(`users/${uid}/courseProgress`).get()
    if (progressSnap.empty) continue
    console.log(`\nuid=${uid}`)
    for (const d of progressSnap.docs) {
      console.log(`  ${d.id}: ${JSON.stringify(d.data().completedChapters)}`)
    }
  }
}
main().catch((e) => { console.error(e); process.exit(1) })
