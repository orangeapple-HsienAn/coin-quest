/**
 * 把 lesson 的 units 攤平成扁平 chapter list（5.2 章節列表用）。
 * 多語：當 unit.translations（已是目標語言）存在時，sectionName 改用翻譯版。
 */
import type { ChapterType } from '../lib/types'
import type { LoadedUnit } from './useLesson'
import type { Language } from '../lib/lessonKey'
import { getUnitNameI18n } from '../lib/gameTranslations'

export interface ChapterItem {
  /** chapterId 格式：{unitId}-{type}，例：unit-1-1-story */
  id: string
  unitId: string
  unitName: string
  type: ChapterType
  /** 顯示在卡片上的小節標題 */
  title: string
  /** 是否已完成 */
  completed: boolean
  /** CMS intro.sectionTeaser；吉祥物提示泡泡用 */
  teaser?: string
}

const TYPE_ORDER: ChapterType[] = ['story', 'knowledge', 'quiz', 'game']

export function buildChapters(
  units: LoadedUnit[],
  language: Language = 'zh',
  completedSet: Set<string> = new Set(),
): ChapterItem[] {
  const out: ChapterItem[] = []
  for (const u of units) {
    for (const type of TYPE_ORDER) {
      const exists =
        type === 'game' ? u.hasGame : Boolean(u.doc.components?.[type]?.versions?.[0])
      if (!exists) continue

      // 標題決定規則：
      //   - story/knowledge/quiz：優先用 translations 的 sectionName、缺則 zh sectionName、再缺用 unit.name
      //   - game：CMS translations 沒 game section，改用 UNIT_NAME_JA 對照表
      let title: string
      let teaser: string | undefined
      if (type === 'game') {
        title = getUnitNameI18n(u.id, u.doc.name, language)
        // game 沒有 intro/teaser；提示語留空走前端 hardcoded fallback
      } else {
        const zhIntro = u.doc.components?.[type]?.versions?.[0]?.intro
        const trIntro = u.translations?.[type]?.intro
        title = trIntro?.sectionName || zhIntro?.sectionName || u.doc.name
        teaser = trIntro?.sectionTeaser || zhIntro?.sectionTeaser
      }

      const chapterId = `${u.id}-${type}`
      out.push({
        id: chapterId,
        unitId: u.id,
        unitName: u.doc.name,
        type,
        title,
        completed: completedSet.has(chapterId),
        teaser,
      })
    }
  }
  return out
}
