/**
 * 把 lesson 的 units 攤平成扁平的 chapter list（5.2 章節列表用）。
 * 每個 unit 依存在的 component 產生對應 chapter：
 *   - story 必有 → chapter type=story
 *   - knowledge 必有 → chapter type=knowledge
 *   - quiz 必有 → chapter type=quiz
 *   - game 存在 → chapter type=game
 *
 * Chapter order: 依 unit.order 升冪，unit 內依固定順序 story→knowledge→quiz→game
 */
import type { ChapterType } from '../lib/types'
import type { LoadedUnit } from './useLesson'

export interface ChapterItem {
  /** chapterId 格式：{unitId}-{type}，例：unit-1-1-story */
  id: string
  unitId: string
  unitName: string
  type: ChapterType
  /** 顯示在卡片上的小節標題（從 component.intro.sectionName 取，缺則 fallback unitName） */
  title: string
  /** 是否已完成（暫時全部 false，未來接 user progress） */
  completed: boolean
}

const TYPE_ORDER: ChapterType[] = ['story', 'knowledge', 'quiz', 'game']

export function buildChapters(units: LoadedUnit[]): ChapterItem[] {
  const out: ChapterItem[] = []
  for (const u of units) {
    for (const type of TYPE_ORDER) {
      // 判斷該 component 是否存在
      const comp =
        type === 'game'
          ? u.hasGame
          : u.doc.components?.[type]?.versions?.[0]
      if (!comp) continue

      // 取得 sectionName
      let title = u.doc.name
      if (type !== 'game') {
        const sectionName = u.doc.components?.[type]?.versions?.[0]?.intro?.sectionName
        if (sectionName) title = sectionName
      }

      out.push({
        id: `${u.id}-${type}`,
        unitId: u.id,
        unitName: u.doc.name,
        type,
        title,
        completed: false,
      })
    }
  }
  return out
}
