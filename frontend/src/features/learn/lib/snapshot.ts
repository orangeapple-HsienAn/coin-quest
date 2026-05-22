/**
 * 讀取本機 CMS snapshot（data/cms-snapshot/）的 helper。
 * Vite dev server 透過 plugin 把 ../data/cms-snapshot/ 掛在 /cms-snapshot 路徑。
 *
 * 之後接 Firestore 同步時，這個檔案的介面不變，只要改實作即可。
 */

const SNAPSHOT_BASE = '/cms-snapshot'

/** 取得 snapshot 內某檔案的 URL（給 <img>/<audio>/<iframe> 用） */
export function snapshotUrl(lessonKey: string, ...parts: string[]): string {
  return [SNAPSHOT_BASE, lessonKey, ...parts].join('/')
}

/** Fetch snapshot 內的 JSON */
export async function fetchSnapshotJson<T>(lessonKey: string, ...parts: string[]): Promise<T> {
  const url = snapshotUrl(lessonKey, ...parts)
  const res = await fetch(url)
  if (!res.ok) throw new Error(`snapshot fetch failed: ${url}`)
  return res.json() as Promise<T>
}

/** 取得 snapshot 內某媒體檔案的絕對 URL（給 fetch / Image src 用） */
export function snapshotAssetUrl(lessonKey: string, kind: 'backgrounds' | 'characters', name: string): string {
  return snapshotUrl(lessonKey, 'assets', kind, name)
}
