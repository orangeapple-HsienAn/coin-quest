/**
 * lessonKey 編碼語言：
 *   stage-1-lesson-1      → zh (預設)
 *   stage-1-lesson-1-ja   → ja
 *   stage-1-lesson-1-en   → en
 *
 * 之後接 Firestore 同步時，會把 language 改成獨立欄位、URL 用 ?lang= 帶。
 * 現階段為 demo 用 suffix 編碼最簡單，前端內部統一走 parseLessonKey 解析。
 */
export type Language = 'zh' | 'ja' | 'en'

const NON_ZH_SUFFIXES: ('ja' | 'en')[] = ['ja', 'en']

export function parseLessonKey(key: string): { snapshotKey: string; language: Language } {
  for (const lang of NON_ZH_SUFFIXES) {
    if (key.endsWith(`-${lang}`)) {
      return { snapshotKey: key.slice(0, -(lang.length + 1)), language: lang }
    }
  }
  return { snapshotKey: key, language: 'zh' }
}

export function makeLessonKey(snapshotKey: string, language: Language): string {
  return language === 'zh' ? snapshotKey : `${snapshotKey}-${language}`
}
