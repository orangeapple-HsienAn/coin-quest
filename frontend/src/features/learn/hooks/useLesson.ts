/**
 * 載入一個 lesson 的完整資料（lesson info + 所有 units + 各 unit 是否有 game）。
 * 目前直接從本機 snapshot 讀；之後改成讀 coin-quest Firestore。
 */
import { useEffect, useState } from 'react'
import { fetchSnapshotJson, snapshotUrl } from '../lib/snapshot'
import type { LessonInfo, UnitDoc } from '../lib/types'

export interface LoadedUnit {
  id: string
  doc: UnitDoc
  hasGame: boolean
}

export interface LoadedLesson {
  lessonKey: string // e.g. "stage-1-lesson-1"
  info: LessonInfo
  units: LoadedUnit[]
}

/** lesson-1 內固定的 4 個 unit ID（暫時 hardcoded，之後從 lesson 文件動態決定） */
const HARDCODED_UNIT_IDS: Record<string, string[]> = {
  'stage-1-lesson-1': ['unit-1-1', 'unit-1-2', 'unit-1-3', 'unit-1-4'],
}

/** 用 HEAD 檢查 snapshot 內某檔案是否存在 */
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
        const info = await fetchSnapshotJson<LessonInfo>(lessonKey, 'lesson.json')
        const unitIds = HARDCODED_UNIT_IDS[lessonKey] ?? []
        const units = await Promise.all(
          unitIds.map(async (id) => {
            const doc = await fetchSnapshotJson<UnitDoc>(lessonKey, 'units', id, 'unit.json')
            const hasGame = await fileExists(snapshotUrl(lessonKey, 'units', id, 'game.html'))
            return { id, doc, hasGame }
          }),
        )
        units.sort((a, b) => (a.doc.order ?? 0) - (b.doc.order ?? 0))
        if (!cancelled) setData({ lessonKey, info, units })
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
