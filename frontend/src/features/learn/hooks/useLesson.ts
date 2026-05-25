/**
 * 載入一個 lesson 的完整資料：lesson info + 所有 units + 各 unit 是否有 game。
 * 接收的 lessonKey 可帶語言 suffix（stage-1-lesson-1-ja），內部會解析。
 *
 * 當語言非 zh 時，每個 unit 額外載入 translations.json 給之後 sectionName /
 * 內容本地化使用。
 */
import { useEffect, useState } from 'react'
import { fetchSnapshotJson, snapshotUrl } from '../lib/snapshot'
import { parseLessonKey, type Language } from '../lib/lessonKey'
import type { LessonInfo, UnitDoc } from '../lib/types'

// translations.json 是 { en: {...}, ja: {...} } 結構
type RawTranslations = Partial<Record<'en' | 'ja', UnitTranslationsForLang>>

/** 單語的翻譯資料（en 或 ja 其中一個） */
export interface UnitTranslationsForLang {
  story?: {
    intro?: { sectionName?: string; sectionTeaser?: string }
    pages?: Array<{ html?: string }>
    choices?: Array<{
      label: string
      ending: { title: string; description: string }
    }>
  }
  knowledge?: {
    intro?: { sectionName?: string; sectionTeaser?: string }
    pages?: Array<{ html?: string }>
  }
  quiz?: {
    intro?: { sectionName?: string; sectionTeaser?: string }
    questions?: Array<{ question?: string; options?: string[]; explanation?: string }>
  }
}

export interface LoadedUnit {
  id: string
  doc: UnitDoc
  hasGame: boolean
  /** 該語言的翻譯（zh = null） */
  translations: UnitTranslationsForLang | null
}

export interface LoadedLesson {
  lessonKey: string // 帶 suffix（原樣，供回連結用）
  snapshotKey: string // 不帶 suffix（給 fetch 用）
  language: Language
  info: LessonInfo
  units: LoadedUnit[]
}

/** lesson 內固定的 unit ID（暫時 hardcoded，之後從 lesson 文件動態決定） */
const HARDCODED_UNIT_IDS: Record<string, string[]> = {
  'stage-1-lesson-1': ['unit-1-1', 'unit-1-2', 'unit-1-3', 'unit-1-4'],
}

async function fileExists(url: string): Promise<boolean> {
  try {
    const res = await fetch(url, { method: 'HEAD' })
    return res.ok
  } catch {
    return false
  }
}

export function useLesson(lessonKey: string) {
  const [data, setData] = useState<LoadedLesson | null>(null)
  const [error, setError] = useState<Error | null>(null)

  useEffect(() => {
    let cancelled = false
    async function load() {
      try {
        const { snapshotKey, language } = parseLessonKey(lessonKey)
        const info = await fetchSnapshotJson<LessonInfo>(snapshotKey, 'lesson.json')
        const unitIds = HARDCODED_UNIT_IDS[snapshotKey] ?? []
        const units = await Promise.all(
          unitIds.map(async (id) => {
            const doc = await fetchSnapshotJson<UnitDoc>(snapshotKey, 'units', id, 'unit.json')
            const hasGame = await fileExists(snapshotUrl(snapshotKey, 'units', id, 'game.html'))
            let translations: UnitTranslationsForLang | null = null
            if (language !== 'zh') {
              const raw = await fetchSnapshotJson<RawTranslations>(
                snapshotKey,
                'units',
                id,
                'translations.json',
              ).catch(() => ({} as RawTranslations))
              translations = raw[language as 'ja' | 'en'] ?? null
            }
            return { id, doc, hasGame, translations }
          }),
        )
        units.sort((a, b) => (a.doc.order ?? 0) - (b.doc.order ?? 0))
        if (!cancelled) setData({ lessonKey, snapshotKey, language, info, units })
      } catch (e) {
        if (!cancelled) setError(e as Error)
      }
    }
    load()
    return () => {
      cancelled = true
    }
  }, [lessonKey])

  return { data, error, loading: !data && !error }
}
