/**
 * Sync CMS Lesson → coin-quest Firestore + Storage
 * --------------------------------------------------
 * 從 CMS (oafq-cms-1313) 把指定 stage/lesson 完整同步到 coin-quest:
 *   - Firestore: stages/{stageId}/lessons/{lessonId}/units/{unitId} (+ 子集合)
 *                shared/{templates,backgrounds,characterEmotions}/{id}
 *   - Storage:   cms-mirror/stages/{stageId}/lessons/{lessonId}/units/{unitId}/{images,voices}/...
 *                cms-mirror/shared/{backgrounds,characters}/...
 *
 * 增量機制：每一層（stage / lesson / unit）算 sha256 hash 存到 `sourceVersion`。
 * 同 hash → 整層跳過。Storage 檔案另比對 md5。
 *
 * 預設 DRY-RUN。加 --apply 才真寫。
 *
 * 用法（從 functions/ 執行）：
 *   npx tsx scripts/sync-cms-lesson.ts stage-1 lesson-1            # dry-run
 *   npx tsx scripts/sync-cms-lesson.ts stage-1 lesson-1 --apply    # 實際寫入
 */
import { initializeApp, cert, App } from 'firebase-admin/app'
import { getFirestore, Firestore, FieldValue } from 'firebase-admin/firestore'
import { getStorage, Storage } from 'firebase-admin/storage'
import { readFileSync } from 'fs'
import { resolve } from 'path'
import { createHash } from 'crypto'

// ============================================================
// CLI 參數
// ============================================================
const args = process.argv.slice(2)
const APPLY = args.includes('--apply')
const [stageId, lessonId] = args.filter((a) => !a.startsWith('--'))
if (!stageId || !lessonId) {
  console.error('Usage: sync-cms-lesson.ts <stageId> <lessonId> [--apply]')
  process.exit(1)
}

// ============================================================
// 兩個 Admin SDK app（CMS 唯讀；coin-quest 讀寫）
// ============================================================
const CMS_KEY = resolve(__dirname, '../../oafq-cms-1313-4c71212d9a8b.json')
const CQ_KEY = resolve(__dirname, '../../oa-coin-quest-firebase-adminsdk-fbsvc-9bc8452d6c.json')

const cmsApp: App = initializeApp(
  {
    credential: cert(JSON.parse(readFileSync(CMS_KEY, 'utf-8'))),
    storageBucket: 'oafq-cms-1313.firebasestorage.app',
  },
  'cms',
)
const cqApp: App = initializeApp(
  {
    credential: cert(JSON.parse(readFileSync(CQ_KEY, 'utf-8'))),
    storageBucket: 'oa-coin-quest.firebasestorage.app',
  },
  'coin-quest',
)

const cmsDb: Firestore = getFirestore(cmsApp)
const cmsBucket = getStorage(cmsApp).bucket()
const cqDb: Firestore = getFirestore(cqApp)
const cqBucket = getStorage(cqApp).bucket()

// ============================================================
// 工具
// ============================================================
/** Firestore Timestamp → ISO string */
function toPlain(obj: unknown): unknown {
  if (obj === null || obj === undefined) return obj
  if (obj instanceof Date) return obj.toISOString()
  if (typeof obj === 'object' && obj !== null) {
    // Firestore Timestamp (admin SDK)
    if ('toDate' in obj && typeof (obj as { toDate: () => Date }).toDate === 'function') {
      return (obj as { toDate: () => Date }).toDate().toISOString()
    }
    if ('_seconds' in obj) {
      const ts = obj as { _seconds: number; _nanoseconds: number }
      return new Date(ts._seconds * 1000 + ts._nanoseconds / 1e6).toISOString()
    }
  }
  if (Array.isArray(obj)) return obj.map(toPlain)
  if (typeof obj === 'object') {
    const out: Record<string, unknown> = {}
    for (const [k, v] of Object.entries(obj as Record<string, unknown>)) out[k] = toPlain(v)
    return out
  }
  return obj
}

/** Stable JSON stringify（key 排序） */
function stableStringify(value: unknown): string {
  if (value === null || typeof value !== 'object') return JSON.stringify(value)
  if (Array.isArray(value)) return '[' + value.map(stableStringify).join(',') + ']'
  const keys = Object.keys(value as Record<string, unknown>).sort()
  return (
    '{' +
    keys.map((k) => JSON.stringify(k) + ':' + stableStringify((value as Record<string, unknown>)[k])).join(',') +
    '}'
  )
}

function sha256(s: string): string {
  return createHash('sha256').update(s).digest('hex')
}

/** 從 Firebase Storage URL 抽出 bucket path */
function extractStoragePath(url: string): string | null {
  const m1 = url.match(/\/v0\/b\/[^/]+\/o\/([^?]+)/)
  if (m1) return decodeURIComponent(m1[1])
  const m2 = url.match(/storage\.googleapis\.com\/[^/]+\/(.+?)(\?|$)/)
  if (m2) return decodeURIComponent(m2[1])
  return null
}

// ============================================================
// 計數器
// ============================================================
const stats = {
  unitsScanned: 0,
  unitsWritten: 0,
  unitsSkipped: 0,
  filesUploaded: 0,
  filesSkipped: 0,
  sharedWritten: 0,
  sharedSkipped: 0,
}

// ============================================================
// Storage 上傳（含 md5 比對）
// ============================================================
async function copyStorageFile(srcPath: string, dstPath: string): Promise<void> {
  let srcMeta
  try {
    ;[srcMeta] = await cmsBucket.file(srcPath).getMetadata()
  } catch (e) {
    console.error(`  ✗ source not found: ${srcPath}`)
    return
  }
  const srcMd5 = srcMeta.md5Hash

  // 比對目的端
  try {
    const [dstMeta] = await cqBucket.file(dstPath).getMetadata()
    if (dstMeta.md5Hash === srcMd5) {
      stats.filesSkipped++
      return
    }
  } catch {
    // 目的不存在
  }

  if (!APPLY) {
    console.log(`  [dry] upload  ${dstPath}`)
    stats.filesUploaded++
    return
  }

  // 下載到 buffer 再上傳（跨專案不能直接 copy）
  const [buf] = await cmsBucket.file(srcPath).download()
  await cqBucket.file(dstPath).save(buf, {
    contentType: srcMeta.contentType || 'application/octet-stream',
    metadata: { cacheControl: 'public, max-age=31536000' },
  })
  stats.filesUploaded++
  console.log(`  ↑ ${dstPath}`)
}

async function uploadHtmlString(dstPath: string, html: string): Promise<void> {
  const md5 = createHash('md5').update(html).digest('base64')
  try {
    const [dstMeta] = await cqBucket.file(dstPath).getMetadata()
    if (dstMeta.md5Hash === md5) {
      stats.filesSkipped++
      return
    }
  } catch {
    // 不存在
  }
  if (!APPLY) {
    console.log(`  [dry] upload  ${dstPath}`)
    stats.filesUploaded++
    return
  }
  await cqBucket.file(dstPath).save(html, {
    contentType: 'text/html; charset=utf-8',
    metadata: { cacheControl: 'public, max-age=3600' },
  })
  stats.filesUploaded++
  console.log(`  ↑ ${dstPath}`)
}

// ============================================================
// Firestore 寫入 helper
// ============================================================
async function writeDoc(path: string, data: Record<string, unknown>): Promise<void> {
  if (!APPLY) {
    console.log(`  [dry] write   ${path}`)
    return
  }
  await cqDb.doc(path).set({ ...data, syncedAt: FieldValue.serverTimestamp() }, { merge: true })
  console.log(`  ✓ ${path}`)
}

// ============================================================
// 一個 unit 的同步
// ============================================================
interface UnitSyncResult {
  unitId: string
  hash: string
  changed: boolean
  usedBackgrounds: Set<string>
  usedCharacters: Set<string>
}

async function syncUnit(unitDoc: FirebaseFirestore.QueryDocumentSnapshot): Promise<UnitSyncResult> {
  const unitId = unitDoc.id
  stats.unitsScanned++

  const unitData = toPlain(unitDoc.data()) as Record<string, unknown>

  // 抓所有子集合
  const subCols = await unitDoc.ref.listCollections()
  const subData: Record<string, Record<string, unknown>> = {}
  for (const sub of subCols) {
    const snap = await sub.get()
    const items: Record<string, unknown> = {}
    for (const d of snap.docs) items[d.id] = toPlain(d.data())
    subData[sub.id] = items
  }

  // publishedGame: active 的最新一份
  const gamesSnap = await cmsDb.collection('publishedGames').where('unitId', '==', unitId).get()
  const activeGames = gamesSnap.docs
    .filter((d) => (d.data() as { active?: boolean }).active === true)
    .sort((a, b) => {
      const at = (a.data() as { publishedAt?: { _seconds?: number } }).publishedAt?._seconds ?? 0
      const bt = (b.data() as { publishedAt?: { _seconds?: number } }).publishedAt?._seconds ?? 0
      return bt - at
    })
  let gameMeta: Record<string, unknown> | null = null
  let gameHtml: string | null = null
  if (activeGames.length > 0) {
    const g = activeGames[0]
    const d = toPlain(g.data()) as Record<string, unknown> & { html?: string }
    gameHtml = (d.html as string) || null
    const { html: _h, ...meta } = d
    gameMeta = { id: g.id, ...meta }
  }

  // 算 hash：把 unitData + subData + gameMeta + gameHtml-md5 一起雜湊
  const hashPayload = {
    unit: unitData,
    sub: subData,
    gameMeta,
    gameHtmlMd5: gameHtml ? createHash('md5').update(gameHtml).digest('hex') : null,
  }
  const hash = sha256(stableStringify(hashPayload))

  // 比對 coin-quest 端
  const cqUnitRef = cqDb.doc(`stages/${stageId}/lessons/${lessonId}/units/${unitId}`)
  const existing = await cqUnitRef.get()
  const existingHash = existing.exists ? (existing.data()?.sourceVersion as string | undefined) : undefined

  const usedBackgrounds = new Set<string>()
  const usedCharacters = new Set<string>()

  // 收集背景與角色（不論是否 changed 都要收，給上層 shared 同步用）
  const components = (unitData.components as Record<string, unknown>) || {}
  for (const compName of ['story', 'knowledge', 'topic']) {
    const comp = components[compName] as
      | { versions?: Array<{ pages?: Array<{ background?: string; bg?: string; character?: string; emotion?: string }> }> }
      | undefined
    for (const ver of comp?.versions || []) {
      for (const page of ver.pages || []) {
        const bg = page.background || page.bg
        if (bg) usedBackgrounds.add(bg)
        if (page.character) usedCharacters.add(`${page.character}_${page.emotion || '講話'}`)
      }
    }
  }

  if (existingHash === hash) {
    console.log(`  · unit ${unitId} unchanged (${hash.slice(0, 8)})`)
    stats.unitsSkipped++
    return { unitId, hash, changed: false, usedBackgrounds, usedCharacters }
  }

  console.log(`\n→ unit ${unitId} ${existingHash ? 'CHANGED' : 'NEW'} (${hash.slice(0, 8)})`)
  stats.unitsWritten++

  // 寫 unit doc（hash + 主資料 + publishedGame meta inline）
  await writeDoc(`stages/${stageId}/lessons/${lessonId}/units/${unitId}`, {
    ...unitData,
    publishedGame: gameMeta,
    sourceVersion: hash,
  })

  // 寫子集合（images, voices, translations, voiceGroups, gameAssets）
  for (const [subName, items] of Object.entries(subData)) {
    for (const [id, data] of Object.entries(items)) {
      await writeDoc(
        `stages/${stageId}/lessons/${lessonId}/units/${unitId}/${subName}/${id}`,
        data as Record<string, unknown>,
      )
    }
  }

  // 上傳 unit 對應 Storage（images / voices / game.html）
  const unitStorageBase = `cms-mirror/stages/${stageId}/lessons/${lessonId}/units/${unitId}`

  const images = subData.images || {}
  for (const [id, data] of Object.entries(images)) {
    const d = data as Record<string, string>
    const url = d.croppedImageUrl || d.gridImageUrl
    if (!url) continue
    const path = extractStoragePath(url)
    if (!path) continue
    const ext = path.split('.').pop() || 'png'
    await copyStorageFile(path, `${unitStorageBase}/images/${id}.${ext}`)
  }

  const voices = subData.voices || {}
  for (const [id, data] of Object.entries(voices)) {
    const d = data as Record<string, string>
    const url = d.audioUrl
    if (!url) continue
    const path = extractStoragePath(url)
    if (!path) continue
    const ext = path.split('.').pop() || 'wav'
    await copyStorageFile(path, `${unitStorageBase}/voices/${id}.${ext}`)
  }

  if (gameHtml) {
    await uploadHtmlString(`${unitStorageBase}/game.html`, gameHtml)
  }

  return { unitId, hash, changed: true, usedBackgrounds, usedCharacters }
}

// ============================================================
// shared/{templates,backgrounds,characterEmotions} 同步
// ============================================================
async function syncShared(usedBackgrounds: Set<string>, usedCharacters: Set<string>): Promise<void> {
  console.log(`\n=== shared ===`)

  // templates 全抓
  const tplSnap = await cmsDb.collection('templates').get()
  for (const d of tplSnap.docs) {
    const data = toPlain(d.data()) as Record<string, unknown>
    const hash = sha256(stableStringify(data))
    const existing = await cqDb.doc(`shared/templates/items/${d.id}`).get()
    if (existing.exists && existing.data()?.sourceVersion === hash) {
      stats.sharedSkipped++
      continue
    }
    await writeDoc(`shared/templates/items/${d.id}`, { ...data, sourceVersion: hash })
    stats.sharedWritten++
  }

  // backgrounds（依使用記錄）
  const bgSnap = await cmsDb.collection('backgrounds').get()
  for (const d of bgSnap.docs) {
    const data = toPlain(d.data()) as Record<string, unknown> & { name?: string; storagePath?: string }
    // 只同步有用到的（usedBackgrounds 為空時全同步）
    if (usedBackgrounds.size > 0 && data.name && !usedBackgrounds.has(data.name)) continue

    const hash = sha256(stableStringify(data))
    const existing = await cqDb.doc(`shared/backgrounds/items/${d.id}`).get()
    if (!existing.exists || existing.data()?.sourceVersion !== hash) {
      await writeDoc(`shared/backgrounds/items/${d.id}`, { ...data, sourceVersion: hash })
      stats.sharedWritten++
    } else {
      stats.sharedSkipped++
    }

    if (data.storagePath) {
      const ext = data.storagePath.split('.').pop() || 'jpg'
      await copyStorageFile(data.storagePath, `cms-mirror/shared/backgrounds/${data.name || d.id}.${ext}`)
    }
  }

  // characterEmotions 全抓（量小）
  const charSnap = await cmsDb.collection('characterEmotions').get()
  for (const d of charSnap.docs) {
    const data = toPlain(d.data()) as Record<string, unknown> & { storagePath?: string }
    const hash = sha256(stableStringify(data))
    const existing = await cqDb.doc(`shared/characterEmotions/items/${d.id}`).get()
    if (!existing.exists || existing.data()?.sourceVersion !== hash) {
      await writeDoc(`shared/characterEmotions/items/${d.id}`, { ...data, sourceVersion: hash })
      stats.sharedWritten++
    } else {
      stats.sharedSkipped++
    }
    if (data.storagePath) {
      const ext = data.storagePath.split('.').pop() || 'gif'
      await copyStorageFile(data.storagePath, `cms-mirror/shared/characters/${d.id}.${ext}`)
    }
  }
}

// ============================================================
// 主流程
// ============================================================
async function main(): Promise<void> {
  console.log(`\n=== Sync ${stageId}/${lessonId} ===`)
  console.log(`Mode: ${APPLY ? 'APPLY (will write)' : 'DRY-RUN (no writes)'}`)
  console.log()

  // 1. CMS lesson
  const cmsLessonRef = cmsDb.collection('stages').doc(stageId).collection('lessons').doc(lessonId)
  const cmsLessonSnap = await cmsLessonRef.get()
  if (!cmsLessonSnap.exists) throw new Error(`CMS lesson not found: ${stageId}/${lessonId}`)
  const lessonData = toPlain(cmsLessonSnap.data()) as Record<string, unknown>

  // 2. CMS stage（順便同步）
  const cmsStageRef = cmsDb.collection('stages').doc(stageId)
  const cmsStageSnap = await cmsStageRef.get()
  const stageData = cmsStageSnap.exists ? (toPlain(cmsStageSnap.data()) as Record<string, unknown>) : {}

  // 3. 同步所有 units
  const unitsSnap = await cmsLessonRef.collection('units').get()
  console.log(`Found ${unitsSnap.size} units`)

  const unitResults: UnitSyncResult[] = []
  const allBackgrounds = new Set<string>()
  const allCharacters = new Set<string>()
  for (const unitDoc of unitsSnap.docs) {
    const r = await syncUnit(unitDoc)
    unitResults.push(r)
    r.usedBackgrounds.forEach((x) => allBackgrounds.add(x))
    r.usedCharacters.forEach((x) => allCharacters.add(x))
  }

  // 4. Lesson hash（含所有 unit hash + lesson 本體）
  const lessonHashPayload = {
    lesson: lessonData,
    units: unitResults.map((r) => ({ id: r.unitId, hash: r.hash })).sort((a, b) => a.id.localeCompare(b.id)),
  }
  const lessonHash = sha256(stableStringify(lessonHashPayload))

  console.log(`\n=== lesson ${lessonId} (${lessonHash.slice(0, 8)}) ===`)
  await writeDoc(`stages/${stageId}/lessons/${lessonId}`, {
    ...lessonData,
    unitCount: unitsSnap.size,
    sourceVersion: lessonHash,
  })

  // 5. Stage doc
  console.log(`\n=== stage ${stageId} ===`)
  await writeDoc(`stages/${stageId}`, {
    ...stageData,
    // 注意：stage 層 hash 需要所有 lessons 才算得準，先只標 lessonSyncedAt
    [`lessonVersions.${lessonId}`]: lessonHash,
  })

  // 6. shared
  await syncShared(allBackgrounds, allCharacters)

  // 7. 統計
  console.log(`\n=== Done (${APPLY ? 'APPLIED' : 'DRY-RUN'}) ===`)
  console.log(`  units:   scanned=${stats.unitsScanned}  written=${stats.unitsWritten}  skipped=${stats.unitsSkipped}`)
  console.log(`  shared:  written=${stats.sharedWritten}  skipped=${stats.sharedSkipped}`)
  console.log(`  files:   uploaded=${stats.filesUploaded}  skipped=${stats.filesSkipped}`)
  if (!APPLY) console.log(`\n(Re-run with --apply to actually write.)`)
}

main().catch((e) => {
  console.error('\nFAILED:', e)
  process.exit(1)
})
