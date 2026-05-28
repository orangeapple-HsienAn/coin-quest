/**
 * 把 CMS 原始 Storage URL（embedded 在 unit doc 的 croppedImageUrl / audioUrl 等欄位）
 * 轉成 coin-quest Storage（cms-mirror/...）的 public download URL。
 *
 * 對應 mirror 路徑（與 functions/scripts/sync-cms-lesson.ts 對齊）：
 *   units/{u}/images/{cropped|grid}/{file}   → cms-mirror/stages/{s}/lessons/{l}/units/{u}/images/{file}
 *   units/{u}/voices/{lang}/{section}_{N}.x  → cms-mirror/.../units/{u}/voices/{lang}_{section}_{N}.x
 *   assets/backgrounds/{file}                → cms-mirror/shared/backgrounds/{file}
 *   assets/characters/{file}                 → cms-mirror/shared/characters/{file}
 *
 * lessonKey 由父層在切到某 lesson 時透過 setSnapshotLessonKey() 設定。
 */
import { parseLessonFolder } from '../snapshot'

const STORAGE_BUCKET = 'oa-coin-quest.firebasestorage.app'
const STORAGE_BASE = `https://firebasestorage.googleapis.com/v0/b/${STORAGE_BUCKET}/o`

let currentLessonKey: string | null = null

export function setSnapshotLessonKey(key: string | null) {
  currentLessonKey = key
}

/** 從 Firebase Storage URL 抽出 bucket-relative path */
function extractStoragePath(url: string): string | null {
  // Firebase tokenized: /v0/b/{bucket}/o/{ENCODED_PATH}?alt=media&token=...
  const m1 = url.match(/\/o\/([^?]+)/)
  if (m1) {
    try {
      return decodeURIComponent(m1[1])
    } catch {
      return null
    }
  }
  // Plain: https://storage.googleapis.com/{bucket}/{path}
  const m2 = url.match(/^https?:\/\/storage\.googleapis\.com\/[^/]+\/([^?]+)/i)
  if (m2) {
    try {
      return decodeURIComponent(m2[1])
    } catch {
      return null
    }
  }
  return null
}

function buildCoinQuestUrl(mirrorPath: string): string {
  return `${STORAGE_BASE}/${encodeURIComponent(mirrorPath)}?alt=media`
}

/** CMS Storage path → coin-quest cms-mirror path */
function mapCmsPathToMirror(path: string, lessonKey: string): string | null {
  // images: units/{u}/images/cropped|grid/{file}
  const imgMatch = path.match(/^units\/([^/]+)\/images\/(?:cropped|grid)\/(.+)$/)
  if (imgMatch) {
    const { stageId, lessonId } = parseLessonFolder(lessonKey)
    return `cms-mirror/stages/${stageId}/lessons/${lessonId}/units/${imgMatch[1]}/images/${imgMatch[2]}`
  }
  // voices: units/{u}/voices/{lang}/{section}_{N}.{ext}
  // sync 把 {lang} 與 {file} 合成檔名（zh_story_0.wav）
  const voiceMatch = path.match(/^units\/([^/]+)\/voices\/([^/]+)\/(.+)$/)
  if (voiceMatch) {
    const { stageId, lessonId } = parseLessonFolder(lessonKey)
    return `cms-mirror/stages/${stageId}/lessons/${lessonId}/units/${voiceMatch[1]}/voices/${voiceMatch[2]}_${voiceMatch[3]}`
  }
  // backgrounds
  const bgMatch = path.match(/^assets\/backgrounds\/(.+)$/)
  if (bgMatch) return `cms-mirror/shared/backgrounds/${bgMatch[1]}`
  // characters
  const charMatch = path.match(/^assets\/characters\/(.+)$/)
  if (charMatch) return `cms-mirror/shared/characters/${charMatch[1]}`
  return null
}

export function proxifyStorageUrl(url?: string | null): string | undefined {
  if (!url) return undefined
  if (!/^https?:\/\//i.test(url)) return url
  if (!currentLessonKey) return url
  const path = extractStoragePath(url)
  if (!path) return url
  const mapped = mapCmsPathToMirror(path, currentLessonKey)
  return mapped ? buildCoinQuestUrl(mapped) : url
}
