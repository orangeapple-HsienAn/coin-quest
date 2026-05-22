/**
 * CMS Lesson Snapshot
 * --------------------
 * 將 CMS (oafq-cms-1313) 一個 lesson 完整資料 + 媒體下載到本機 data/cms-snapshot/。
 * CMS 唯讀，永不寫入。
 *
 * 用法（從 functions 目錄執行）：
 *   npx tsx scripts/snapshot-cms-lesson.ts stage-1 lesson-1
 */
import { initializeApp, cert } from 'firebase-admin/app'
import { getFirestore } from 'firebase-admin/firestore'
import { getStorage } from 'firebase-admin/storage'
import { mkdir, writeFile, stat } from 'fs/promises'
import { dirname, join, resolve } from 'path'
import { readFileSync } from 'fs'

// === 初始化 CMS Admin SDK ===
const KEY_PATH = resolve(__dirname, '../../oafq-cms-1313-4c71212d9a8b.json')
const key = JSON.parse(readFileSync(KEY_PATH, 'utf-8'))
const app = initializeApp({
  credential: cert(key),
  storageBucket: 'oafq-cms-1313.firebasestorage.app',
})
const db = getFirestore(app)
const bucket = getStorage(app).bucket()

// === 輸出根目錄 ===
const [stageId, lessonId] = process.argv.slice(2)
if (!stageId || !lessonId) {
  console.error('Usage: snapshot-cms-lesson.ts <stageId> <lessonId>')
  process.exit(1)
}
const OUT_ROOT = resolve(__dirname, '../../data/cms-snapshot', `${stageId}-${lessonId}`)
const ASSETS_ROOT = join(OUT_ROOT, 'assets')

// === 工具 ===
async function ensureDir(p: string) {
  await mkdir(dirname(p), { recursive: true })
}

async function writeJson(path: string, data: unknown) {
  await ensureDir(path)
  await writeFile(path, JSON.stringify(data, null, 2), 'utf-8')
}

/** 從 Firebase Storage URL 抽出 bucket path（支援兩種 URL 格式） */
function extractStoragePath(url: string): string | null {
  // https://firebasestorage.googleapis.com/v0/b/{bucket}/o/{ENCODED_PATH}?alt=media&token=...
  const m1 = url.match(/\/v0\/b\/[^/]+\/o\/([^?]+)/)
  if (m1) return decodeURIComponent(m1[1])
  // https://storage.googleapis.com/{bucket}/{path}
  const m2 = url.match(/storage\.googleapis\.com\/[^/]+\/(.+?)(\?|$)/)
  if (m2) return decodeURIComponent(m2[1])
  return null
}

const downloaded = new Set<string>()
let dlCount = 0
let dlSkipped = 0

/** 下載 Storage 檔案到本機；若本機已有同 size 檔案則跳過 */
async function downloadFile(storagePath: string, localPath: string) {
  if (downloaded.has(localPath)) return
  downloaded.add(localPath)

  try {
    const [meta] = await bucket.file(storagePath).getMetadata()
    const remoteSize = Number(meta.size)
    try {
      const local = await stat(localPath)
      if (local.size === remoteSize) {
        dlSkipped++
        return
      }
    } catch {
      /* not exists */
    }
    await ensureDir(localPath)
    await bucket.file(storagePath).download({ destination: localPath })
    dlCount++
    process.stdout.write(`  ↓ ${storagePath} → ${localPath.replace(OUT_ROOT, '')}\n`)
  } catch (e) {
    console.error(`  ✗ failed: ${storagePath}`, (e as Error).message)
  }
}

/** 將 Firestore Timestamp 等型別轉成可序列化 JSON */
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

// === 主流程 ===
async function main() {
  console.log(`\n=== Snapshotting CMS ${stageId}/${lessonId} ===`)
  console.log(`Output: ${OUT_ROOT}\n`)

  // 1. Lesson 文件
  const lessonRef = db.collection('stages').doc(stageId).collection('lessons').doc(lessonId)
  const lessonSnap = await lessonRef.get()
  if (!lessonSnap.exists) throw new Error(`lesson not found: ${stageId}/${lessonId}`)
  await writeJson(join(OUT_ROOT, 'lesson.json'), toPlain(lessonSnap.data()))
  console.log(`✓ lesson.json`)

  // 2. Units + 子集合
  const unitsSnap = await lessonRef.collection('units').get()
  console.log(`\nFound ${unitsSnap.size} units`)

  const usedBackgroundNames = new Set<string>()
  const usedCharacters = new Set<string>() // `${character}_${emotion}`

  for (const unitDoc of unitsSnap.docs) {
    const unitId = unitDoc.id
    const unitData = toPlain(unitDoc.data()) as Record<string, unknown>
    const unitDir = join(OUT_ROOT, 'units', unitId)
    console.log(`\n— unit ${unitId}`)

    // 2a. unit.json
    await writeJson(join(unitDir, 'unit.json'), unitData)

    // 2b. 子集合（images, voices, voiceGroups, translations, gameAssets）
    const subCols = await unitDoc.ref.listCollections()
    for (const sub of subCols) {
      const snap = await sub.get()
      const items: Record<string, unknown> = {}
      for (const d of snap.docs) items[d.id] = toPlain(d.data())
      await writeJson(join(unitDir, `${sub.id}.json`), items)
    }

    // 2c. 下載每頁圖片（從 images 子集合的 croppedImageUrl）
    const imagesSnap = await unitDoc.ref.collection('images').get()
    for (const img of imagesSnap.docs) {
      const data = img.data() as Record<string, string>
      const url = data.croppedImageUrl || data.gridImageUrl
      if (!url) continue
      const path = extractStoragePath(url)
      if (!path) continue
      const ext = path.split('.').pop() || 'png'
      await downloadFile(path, join(unitDir, 'images', `${img.id}.${ext}`))
    }

    // 2d. 下載每段 voice
    const voicesSnap = await unitDoc.ref.collection('voices').get()
    for (const v of voicesSnap.docs) {
      const data = v.data() as Record<string, string>
      const url = data.audioUrl
      if (!url) continue
      const path = extractStoragePath(url)
      if (!path) continue
      const ext = path.split('.').pop() || 'wav'
      await downloadFile(path, join(unitDir, 'voices', `${v.id}.${ext}`))
    }

    // 2e. 蒐集背景名稱（從 components.{story,knowledge,topic}.versions[*].pages[*].background）
    const components = (unitData.components as Record<string, unknown>) || {}
    for (const compName of ['story', 'knowledge', 'topic']) {
      const comp = components[compName] as { versions?: Array<{ pages?: Array<{ background?: string; bg?: string }> }> } | undefined
      const versions = comp?.versions || []
      for (const ver of versions) {
        for (const page of ver.pages || []) {
          const bg = page.background || page.bg
          if (bg) usedBackgroundNames.add(bg)
        }
      }
    }

    // 2f. 蒐集角色 GIF（從 pages[*].character + pages[*].emotion；先粗抓所有有出現的）
    for (const compName of ['story', 'knowledge', 'topic']) {
      const comp = components[compName] as { versions?: Array<{ pages?: Array<{ character?: string; emotion?: string }> }> } | undefined
      const versions = comp?.versions || []
      for (const ver of versions) {
        for (const page of ver.pages || []) {
          if (page.character) {
            // 通常會搭配講話/思考等 emotion；先把所有可能的都記下，下載時再 match
            usedCharacters.add(`${page.character}_${page.emotion || '講話'}`)
          }
        }
      }
    }

    // 2g. 對應的 publishedGame（取最新 active 的一份）
    // 用單一 where 查詢避開複合 index 需求，回來後自己排序篩選
    const gamesSnap = await db.collection('publishedGames').where('unitId', '==', unitId).get()
    const activeGames = gamesSnap.docs
      .filter((d) => (d.data() as { active?: boolean }).active === true)
      .sort((a, b) => {
        const at = (a.data() as { publishedAt?: { _seconds?: number } }).publishedAt?._seconds ?? 0
        const bt = (b.data() as { publishedAt?: { _seconds?: number } }).publishedAt?._seconds ?? 0
        return bt - at
      })
    if (activeGames.length > 0) {
      const game = activeGames[0]
      const gameData = game.data() as { html?: string }
      const { html, ...meta } = gameData
      await writeJson(join(unitDir, 'game.meta.json'), { id: game.id, ...toPlain(meta) })
      if (html) {
        await ensureDir(join(unitDir, 'game.html'))
        await writeFile(join(unitDir, 'game.html'), html, 'utf-8')
      }
      console.log(`  ✓ game ${game.id}`)
    }
  }

  // 3. Templates（全部抓，因為小）
  console.log(`\n— templates`)
  const tplSnap = await db.collection('templates').get()
  const templates: Record<string, unknown> = {}
  for (const d of tplSnap.docs) templates[d.id] = toPlain(d.data())
  await writeJson(join(OUT_ROOT, 'templates.json'), templates)
  console.log(`  ✓ ${tplSnap.size} templates`)

  // 4. Backgrounds（依使用記錄下載）
  console.log(`\n— backgrounds (${usedBackgroundNames.size} referenced)`)
  const bgSnap = await db.collection('backgrounds').get()
  const bgIndex: Record<string, unknown> = {}
  for (const d of bgSnap.docs) {
    const data = d.data() as Record<string, string>
    bgIndex[d.id] = toPlain(data)
    if (usedBackgroundNames.has(data.name) || usedBackgroundNames.size === 0) {
      if (data.storagePath) {
        const ext = data.storagePath.split('.').pop() || 'jpg'
        await downloadFile(data.storagePath, join(ASSETS_ROOT, 'backgrounds', `${data.name}.${ext}`))
      }
    }
  }
  await writeJson(join(ASSETS_ROOT, 'backgrounds.json'), bgIndex)

  // 5. CharacterEmotions（全抓，數量小且共用）
  console.log(`\n— characterEmotions`)
  const charSnap = await db.collection('characterEmotions').get()
  const charIndex: Record<string, unknown> = {}
  for (const d of charSnap.docs) {
    const data = d.data() as Record<string, string>
    charIndex[d.id] = toPlain(data)
    if (data.storagePath) {
      const ext = data.storagePath.split('.').pop() || 'gif'
      await downloadFile(data.storagePath, join(ASSETS_ROOT, 'characters', `${d.id}.${ext}`))
    }
  }
  await writeJson(join(ASSETS_ROOT, 'characters.json'), charIndex)

  console.log(`\n=== Done ===`)
  console.log(`  downloaded: ${dlCount}`)
  console.log(`  skipped (already exists): ${dlSkipped}`)
  console.log(`  output: ${OUT_ROOT}`)
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
