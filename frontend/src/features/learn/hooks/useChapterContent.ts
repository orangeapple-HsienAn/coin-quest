/**
 * 載入單一 chapter 的內容資料。
 * 依 chapterId 的 type 後綴決定回傳結構（quiz/story/knowledge/game）。
 */
import { useEffect, useState } from 'react'
import { fetchSnapshotJson, snapshotUrl } from '../lib/snapshot'
import type { ChapterType, GameMeta, QuizQuestion, UnitDoc } from '../lib/types'

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
  /** 影片 Player 用的 raw pages（Phase 5/7 接 Remotion 時用） */
  pages: UnitDoc['components']['story'] extends infer S ? S extends { versions: infer V } ? V extends Array<infer X> ? X extends { pages: infer P } ? P : never : never : never : never
  choices?: { label: string; ending: { title: string; description: string; score: number } }[]
}

export interface KnowledgeContent {
  type: 'knowledge'
  unitName: string
  sectionName: string
  unitId: string
  pages: UnitDoc['components']['knowledge'] extends infer S ? S extends { versions: infer V } ? V extends Array<infer X> ? X extends { pages: infer P } ? P : never : never : never : never
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
        const unit = await fetchSnapshotJson<UnitDoc>(lessonKey, 'units', unitId, 'unit.json')

        let content: ChapterContent
        if (type === 'quiz') {
          const v = unit.components.quiz?.versions?.[0]
          if (!v) throw new Error(`unit ${unitId} 沒有 quiz`)
          content = {
            type: 'quiz',
            unitName: unit.name,
            sectionName: v.intro?.sectionName ?? unit.name,
            questions: v.questions.filter((q) => q.enabled !== false),
          }
        } else if (type === 'story') {
          const v = unit.components.story?.versions?.[0]
          if (!v) throw new Error(`unit ${unitId} 沒有 story`)
          content = {
            type: 'story',
            unitName: unit.name,
            unitId,
            sectionName: v.intro?.sectionName ?? unit.name,
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            pages: v.pages as any,
            choices: v.choices,
          }
        } else if (type === 'knowledge') {
          const v = unit.components.knowledge?.versions?.[0]
          if (!v) throw new Error(`unit ${unitId} 沒有 knowledge`)
          content = {
            type: 'knowledge',
            unitName: unit.name,
            unitId,
            sectionName: v.intro?.sectionName ?? unit.name,
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            pages: v.pages as any,
          }
        } else {
          // game
          const meta = await fetchSnapshotJson<GameMeta>(lessonKey, 'units', unitId, 'game.meta.json').catch(() => null)
          content = {
            type: 'game',
            unitName: unit.name,
            unitId,
            gameHtmlUrl: snapshotUrl(lessonKey, 'units', unitId, 'game.html'),
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
