/**
 * 載入單一 chapter 的內容資料。
 * 依 chapterId 的 type 後綴決定回傳結構（quiz/story/knowledge/game）。
 *
 * 多語：當 lessonKey 帶 -ja / -en 後綴時，合併對應翻譯：
 *   - quiz: question / options / explanation（answer 永遠取 zh）
 *   - story: choice.label / ending.title / ending.description（score 取 zh）
 *   - knowledge / game：影片本身由 Player 處理多語；本 hook 提供的文字欄位
 *     主要是 sectionName 標題，會優先用翻譯版
 */
import { useEffect, useState } from 'react'
import { fetchSnapshotJson, snapshotUrl } from '../lib/snapshot'
import { parseLessonKey } from '../lib/lessonKey'
import type { ChapterType, GameMeta, QuizQuestion, UnitDoc } from '../lib/types'
import type { UnitTranslationsForLang } from './useLesson'

export interface QuizContent {
  type: 'quiz'
  unitName: string
  sectionName: string
  questions: QuizQuestion[]
}

export interface StoryContent {
  type: 'story'
  unitName: string
  sectionName: string
  unitId: string
  pages: unknown // 由 Player 處理，本元件不直接渲染
  choices?: { label: string; ending: { title: string; description: string; score: number } }[]
}

export interface KnowledgeContent {
  type: 'knowledge'
  unitName: string
  sectionName: string
  unitId: string
  pages: unknown
}

export interface GameContent {
  type: 'game'
  unitName: string
  unitId: string
  gameHtmlUrl: string
  meta: GameMeta | null
}

export type ChapterContent = QuizContent | StoryContent | KnowledgeContent | GameContent

function parseChapterId(chapterId: string): { unitId: string; type: ChapterType } | null {
  const m = chapterId.match(/^(.+)-(story|knowledge|quiz|game)$/)
  if (!m) return null
  return { unitId: m[1], type: m[2] as ChapterType }
}

type RawTranslations = Partial<Record<'en' | 'ja', UnitTranslationsForLang>>

export function useChapterContent(lessonKey: string, chapterId: string) {
  const [data, setData] = useState<ChapterContent | null>(null)
  const [error, setError] = useState<Error | null>(null)

  useEffect(() => {
    let cancelled = false
    async function load() {
      try {
        const parsed = parseChapterId(chapterId)
        if (!parsed) throw new Error(`invalid chapterId: ${chapterId}`)
        const { unitId, type } = parsed
        const { snapshotKey, language } = parseLessonKey(lessonKey)
        const unit = await fetchSnapshotJson<UnitDoc>(snapshotKey, 'units', unitId, 'unit.json')

        // 取對應語言翻譯（zh 略過）
        let tr: UnitTranslationsForLang | null = null
        if (language !== 'zh') {
          const raw = await fetchSnapshotJson<RawTranslations>(
            snapshotKey,
            'units',
            unitId,
            'translations.json',
          ).catch(() => ({} as RawTranslations))
          tr = raw[language as 'ja' | 'en'] ?? null
        }

        let content: ChapterContent
        if (type === 'quiz') {
          const v = unit.components.quiz?.versions?.[0]
          if (!v) throw new Error(`unit ${unitId} 沒有 quiz`)
          const zhQuestions = v.questions.filter((q) => q.enabled !== false)
          const trQuestions = tr?.quiz?.questions ?? []
          // 翻譯保留 answer 來源於 zh，覆蓋 question / options / explanation
          const merged = zhQuestions.map((q, i) => {
            const t = trQuestions[i]
            if (!t) return q
            return {
              ...q,
              question: t.question ?? q.question,
              options: t.options ?? q.options,
              explanation: t.explanation ?? q.explanation,
            }
          })
          content = {
            type: 'quiz',
            unitName: unit.name,
            sectionName: tr?.quiz?.intro?.sectionName ?? v.intro?.sectionName ?? unit.name,
            questions: merged,
          }
        } else if (type === 'story') {
          const v = unit.components.story?.versions?.[0]
          if (!v) throw new Error(`unit ${unitId} 沒有 story`)
          // 合併 choices: ja 提供 label + ending.title/description，zh 保留 score
          const zhChoices = v.choices ?? []
          const trChoices = tr?.story?.choices ?? []
          const mergedChoices = zhChoices.map((c, i) => {
            const t = trChoices[i]
            if (!t) return c
            return {
              label: t.label ?? c.label,
              ending: {
                title: t.ending?.title ?? c.ending.title,
                description: t.ending?.description ?? c.ending.description,
                score: c.ending.score,
              },
            }
          })
          content = {
            type: 'story',
            unitName: unit.name,
            unitId,
            sectionName: tr?.story?.intro?.sectionName ?? v.intro?.sectionName ?? unit.name,
            pages: v.pages,
            choices: mergedChoices,
          }
        } else if (type === 'knowledge') {
          const v = unit.components.knowledge?.versions?.[0]
          if (!v) throw new Error(`unit ${unitId} 沒有 knowledge`)
          content = {
            type: 'knowledge',
            unitName: unit.name,
            unitId,
            sectionName: tr?.knowledge?.intro?.sectionName ?? v.intro?.sectionName ?? unit.name,
            pages: v.pages,
          }
        } else {
          // game：HTML 不翻譯（CMS publishedGames 目前是 zh snapshot），未來補上
          const meta = await fetchSnapshotJson<GameMeta>(
            snapshotKey,
            'units',
            unitId,
            'game.meta.json',
          ).catch(() => null)
          content = {
            type: 'game',
            unitName: unit.name,
            unitId,
            gameHtmlUrl: snapshotUrl(snapshotKey, 'units', unitId, 'game.html'),
            meta,
          }
        }

        if (!cancelled) setData(content)
      } catch (e) {
        if (!cancelled) setError(e as Error)
      }
    }
    load()
    return () => {
      cancelled = true
    }
  }, [lessonKey, chapterId])

  return { data, error, loading: !data && !error }
}
