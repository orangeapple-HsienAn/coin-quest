/**
 * 把 CMS 原始 Storage URL 轉成本機 snapshot 路徑（dev）。
 *
 * snapshot 路徑規則（與 functions/scripts/snapshot-cms-lesson.ts 對齊）：
 *   - units/{unitId}/images/cropped/page_{N}.png → /cms-snapshot/{lessonKey}/units/{unitId}/images/page_{N}.png
 *   - units/{unitId}/voices/{lang}/{section}_{N}.wav → /cms-snapshot/{lessonKey}/units/{unitId}/voices/{lang}_{section}_{N}.wav
 *   - assets/backgrounds/{name} → /cms-snapshot/{lessonKey}/assets/backgrounds/{name}
 *   - assets/characters/{name} → /cms-snapshot/{lessonKey}/assets/characters/{name}
 *
 * 注意：lessonKey 透過 setSnapshotLessonKey() 設定（影片開播前由父層呼叫一次）。
 * 之後接 production Storage 時，這個函式只需改成回傳 coin-quest Storage URL。
 */

// 由父層在切到某 lesson 時設定
let currentLessonKey: string | null = null

export function setSnapshotLessonKey(key: string | null) {
  currentLessonKey = key
}

function extractStoragePath(url: string): string | null {
  const m1 = url.match(/\/o\/([^?]+)/)
  if (m1) {
    try {
      return decodeURIComponent(m1[1])
    } catch {
      return null
    }
  }
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

/** 把 CMS Storage path → snapshot 內的本機路徑 */
function mapStoragePathToSnapshot(path: string, lessonKey: string): string | null {
  // images: units/{u}/images/cropped/{file}  → 取 cropped 後的 file 名
  const imgMatch = path.match(/^units\/([^/]+)\/images\/cropped\/(.+)$/)
  if (imgMatch) {
    return `/cms-snapshot/${lessonKey}/units/${imgMatch[1]}/images/${imgMatch[2]}`
  }
  // voices: units/{u}/voices/{lang}/{file} → snapshot 把 lang 與 file 合成一個檔名
  const voiceMatch = path.match(/^units\/([^/]+)\/voices\/([^/]+)\/(.+)$/)
  if (voiceMatch) {
    return `/cms-snapshot/${lessonKey}/units/${voiceMatch[1]}/voices/${voiceMatch[2]}_${voiceMatch[3]}`
  }
  // backgrounds
  const bgMatch = path.match(/^assets\/backgrounds\/(.+)$/)
  if (bgMatch) return `/cms-snapshot/${lessonKey}/assets/backgrounds/${bgMatch[1]}`
  // characters
  const charMatch = path.match(/^assets\/characters\/(.+)$/)
  if (charMatch) return `/cms-snapshot/${lessonKey}/assets/characters/${charMatch[1]}`
  return null
}

export function proxifyStorageUrl(url?: string | null): string | undefined {
  if (!url) return undefined
  if (!/^https?:\/\//i.test(url)) return url
  if (!currentLessonKey) return url
  const path = extractStoragePath(url)
  if (!path) return url
  const mapped = mapStoragePathToSnapshot(path, currentLessonKey)
  return mapped ?? url
}
