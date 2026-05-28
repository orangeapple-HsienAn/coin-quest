/**
 * 設定 coin-quest Storage bucket 的 CORS 規則。
 * Remotion 的 @remotion/gif / @remotion/media-utils 透過 fetch() 抓檔解碼，
 * 需要 CORS header 才能跨來源讀取（Hosting domain → firebasestorage.googleapis.com）。
 *
 * 用法：
 *   npx tsx scripts/set-cors.ts
 */
import { initializeApp, cert } from 'firebase-admin/app'
import { getStorage } from 'firebase-admin/storage'
import { readFileSync } from 'fs'
import { resolve } from 'path'

const key = JSON.parse(
  readFileSync(resolve(__dirname, '../../oa-coin-quest-firebase-adminsdk-fbsvc-9bc8452d6c.json'), 'utf-8'),
)
initializeApp({ credential: cert(key), storageBucket: 'oa-coin-quest.firebasestorage.app' })
const bucket = getStorage().bucket()

const cors = [
  {
    origin: ['*'], // 課程素材本來就公開唯讀，允許任何 origin 抓
    method: ['GET', 'HEAD'],
    maxAgeSeconds: 3600,
    responseHeader: ['Content-Type', 'Content-Length', 'Cache-Control', 'Content-Range', 'Accept-Ranges'],
  },
]

async function main() {
  console.log(`Setting CORS on gs://${bucket.name}...`)
  await bucket.setCorsConfiguration(cors)
  const [meta] = await bucket.getMetadata()
  console.log('Current CORS:', JSON.stringify(meta.cors, null, 2))
  console.log('Done.')
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
