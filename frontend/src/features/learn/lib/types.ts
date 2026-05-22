/**
 * 課程資料型別（對應 CMS snapshot 的 JSON 結構）
 * 同步系統正式上線後，這些型別會搬到 frontend/src/types/ 並作為 Firestore schema。
 */

export type ChapterType = 'story' | 'knowledge' | 'quiz' | 'game'

export interface LessonInfo {
  number: number
  topic: string
  status: string
}

export interface UnitDoc {
  name: string
  description: string
  order: number
  isBackup?: boolean
  components: {
    story?: { versions: StoryVersion[] }
    knowledge?: { versions: KnowledgeVersion[] }
    quiz?: { versions: QuizVersion[] }
    topic?: { versions: KnowledgeVersion[] }
    topicQuiz?: { versions: QuizVersion[] }
  }
}

export interface StoryVersion {
  intro?: { sectionType?: string; sectionName?: string; sectionTeaser?: string }
  pages: Array<{
    character?: string
    emotion?: string
    background?: string
    html?: string
    template?: string
  }>
  choices?: Array<{
    label: string
    ending: { title: string; description: string; score: number }
  }>
}

export interface KnowledgeVersion {
  intro?: { sectionType?: string; sectionName?: string; sectionTeaser?: string }
  pages: Array<{
    character?: string
    emotion?: string
    background?: string
    html?: string
    template?: string
  }>
}

export interface QuizVersion {
  intro?: { sectionType?: string; sectionName?: string; sectionTeaser?: string }
  questions: QuizQuestion[]
}

export interface QuizQuestion {
  question: string
  options: string[]
  answer: number
  explanation: string
  enabled?: boolean
  layout?: '2x2' | '1x4'
}

export interface GameMeta {
  id: string
  unitId: string
  stageId: string
  lessonId: string
  unitName: string
  scoreThresholds?: { star1: number; star2: number; star3: number }
}
