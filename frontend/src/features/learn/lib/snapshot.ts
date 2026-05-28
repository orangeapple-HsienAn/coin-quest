/**
 * CMS 課程資料來源層：直接讀 coin-quest Firestore（stages/.../units/...）
 * 與 coin-quest Storage（cms-mirror/...）。
 *
 * 之前 dev 走本機 data/cms-snapshot/，現已淘汰；同步機制改由
 * functions/scripts/sync-cms-lesson.ts 寫入 production。
 *
 * 對外 API（保留原名以最小化呼叫端改動）：
 *   - fetchSnapshotJson(lessonKey, ...parts)  → Firestore doc / collection
 *   - snapshotUrl(lessonKey, ...parts)         → coin-quest Storage public URL
 *   - snapshotAssetUrl(lessonKey, kind, name)  → shared 資產 Storage URL
 */
import { db } from '@/lib/firebase'
import { doc, getDoc, collection, getDocs } from 'firebase/firestore'

const STORAGE_BUCKET = 'oa-coin-quest.firebasestorage.app'
const STORAGE_BASE = `https://firebasestorage.googleapis.com/v0/b/${STORAGE_BUCKET}/o`

/** lessonKey「stage-1-lesson-1」→ { stageId, lessonId } */
export function parseLessonFolder(lessonKey: string): { stageId: string; lessonId: string } {
  const m = lessonKey.match(/^(stage-\d+)-(lesson-\d+)$/)
  if (!m) throw new Error(`invalid lessonKey: ${lessonKey}`)
  return { stageId: m[1], lessonId: m[2] }
}

/** 把 Storage path 編碼成 Firebase Hosting download URL */
function storageUrl(path: string): string {
  return `${STORAGE_BASE}/${encodeURIComponent(path)}?alt=media`
}

/**
 * 取 Storage 媒體 URL。parts 對應原本 snapshot 樹的路徑：
 *   ['units', unitId, 'game.html']        → cms-mirror/stages/{s}/lessons/{l}/units/{u}/game.html
 *   ['assets', 'backgrounds', filename]   → cms-mirror/shared/backgrounds/{filename}
 *   ['assets', 'characters', filename]    → cms-mirror/shared/characters/{filename}
 */
export function snapshotUrl(lessonKey: string, ...parts: string[]): string {
  if (parts[0] === 'assets') {
    return storageUrl(`cms-mirror/shared/${parts[1]}/${parts.slice(2).join('/')}`)
  }
  if (parts[0] === 'units') {
    const { stageId, lessonId } = parseLessonFolder(lessonKey)
    return storageUrl(`cms-mirror/stages/${stageId}/lessons/${lessonId}/${parts.join('/')}`)
  }
  throw new Error(`snapshotUrl: unsupported parts ${parts.join('/')}`)
}

/** Firestore doc fetch helper */
async function fetchDoc<T>(path: string): Promise<T> {
  const snap = await getDoc(doc(db, path))
  if (!snap.exists()) throw new Error(`Firestore doc not found: ${path}`)
  return snap.data() as T
}

/** Firestore collection fetch helper（回傳 {id: data} map，與舊 JSON 結構一致） */
async function fetchCollectionAsMap<T>(path: string): Promise<Record<string, T>> {
  const snap = await getDocs(collection(db, path))
  const out: Record<string, T> = {}
  for (const d of snap.docs) out[d.id] = d.data() as T
  return out
}

/**
 * 取 Firestore JSON。parts 對應原 snapshot 樹的檔案：
 *   ['lesson.json']                                  → stages/{s}/lessons/{l}
 *   ['templates.json']                               → shared/templates/items collection
 *   ['assets', 'backgrounds.json']                   → shared/backgrounds/items collection
 *   ['assets', 'characters.json']                    → shared/characterEmotions/items collection
 *   ['units', unitId, 'unit.json']                   → stages/.../units/{unitId} doc
 *   ['units', unitId, 'voices.json']                 → .../units/{unitId}/voices collection
 *   ['units', unitId, 'images.json']                 → .../units/{unitId}/images collection
 *   ['units', unitId, 'translations.json']           → .../units/{unitId}/translations collection
 *   ['units', unitId, 'voiceGroups.json']            → .../units/{unitId}/voiceGroups collection
 *   ['units', unitId, 'game.meta.json']              → unit doc 的 publishedGame 欄位
 */
export async function fetchSnapshotJson<T>(lessonKey: string, ...parts: string[]): Promise<T> {
  // shared/全域資源
  if (parts.length === 1 && parts[0] === 'templates.json') {
    return (await fetchCollectionAsMap(`shared/templates/items`)) as T
  }
  if (parts[0] === 'assets' && parts[1] === 'backgrounds.json') {
    return (await fetchCollectionAsMap(`shared/backgrounds/items`)) as T
  }
  if (parts[0] === 'assets' && parts[1] === 'characters.json') {
    return (await fetchCollectionAsMap(`shared/characterEmotions/items`)) as T
  }

  const { stageId, lessonId } = parseLessonFolder(lessonKey)

  if (parts.length === 1 && parts[0] === 'lesson.json') {
    return await fetchDoc<T>(`stages/${stageId}/lessons/${lessonId}`)
  }

  if (parts[0] === 'units' && parts.length === 3) {
    const unitId = parts[1]
    const file = parts[2]
    const unitBase = `stages/${stageId}/lessons/${lessonId}/units/${unitId}`

    if (file === 'unit.json') return await fetchDoc<T>(unitBase)
    if (file === 'voices.json') return (await fetchCollectionAsMap(`${unitBase}/voices`)) as T
    if (file === 'images.json') return (await fetchCollectionAsMap(`${unitBase}/images`)) as T
    if (file === 'translations.json')
      return (await fetchCollectionAsMap(`${unitBase}/translations`)) as T
    if (file === 'voiceGroups.json')
      return (await fetchCollectionAsMap(`${unitBase}/voiceGroups`)) as T
    if (file === 'gameAssets.json')
      return (await fetchCollectionAsMap(`${unitBase}/gameAssets`)) as T
    if (file === 'game.meta.json') {
      const unit = await fetchDoc<{ publishedGame?: unknown }>(unitBase)
      if (!unit.publishedGame) throw new Error(`no publishedGame in ${unitBase}`)
      return unit.publishedGame as T
    }
  }

  throw new Error(`fetchSnapshotJson: unsupported parts ${parts.join('/')}`)
}

/** shared 媒體絕對 URL（保留 API；目前無呼叫點，但 export 供未來使用） */
export function snapshotAssetUrl(
  _lessonKey: string,
  kind: 'backgrounds' | 'characters',
  name: string,
): string {
  return storageUrl(`cms-mirror/shared/${kind}/${name}`)
}
