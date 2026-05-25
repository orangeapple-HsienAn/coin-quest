/**
 * 章節頁面（5.3 ~ 5.6）— 依 chapter type 分派到 4 種 view
 *
 * chapterId 格式：{unitId}-{type}（例：unit-1-1-story）
 * 目前只實作 quiz；其他類型為 placeholder（步驟 4~7 補上）
 */
import { useNavigate, useParams } from 'react-router'
import { Header } from '@/components/layout/Header'
import { useUser } from '@/hooks/useUser'
import { useChapterContent } from '../hooks/useChapterContent'
import { QuizView } from '../views/QuizView'
import { GameView } from '../views/GameView'
import { KnowledgeView } from '../views/KnowledgeView'
import { StoryView } from '../views/StoryView'
import { completeChapter } from '../lib/completeChapter'
import { parseLessonKey } from '../lib/lessonKey'
import { getChapterTypeLabel, getUnitNameI18n } from '../lib/gameTranslations'

export function ChapterPage() {
  const { courseId, chapterId } = useParams<{ courseId: string; chapterId: string }>()
  const navigate = useNavigate()
  const { data: user } = useUser()
  const { data: content, loading, error } = useChapterContent(courseId ?? '', chapterId ?? '')
  const { language } = parseLessonKey(courseId ?? '')

  const backToCourse = `/course/${courseId}`
  const handleNext = () => navigate(backToCourse)

  const handleComplete = async (params: { experienceReward: number; coinReward: number }) => {
    // 留窗口給日後接學生資料系統，現在發出即可
    if (!courseId || !chapterId) return
    await completeChapter({
      courseId,
      chapterId,
      experienceReward: params.experienceReward,
      coinReward: params.coinReward,
    })
  }

  return (
    <div className="min-h-screen bg-background">
      <Header
        experience={user?.experience ?? 0}
        coins={user?.coins ?? 0}
        backTo={backToCourse}
      />
      <main className="mx-auto max-w-[1200px] px-6 py-8">
        {loading && <p>載入中...</p>}
        {error && <p className="text-red-500">載入失敗：{error.message}</p>}
        {content && (
          <>
            <h1 className="mb-6 text-center text-xl font-bold">
              {getChapterTypeLabel(content.type, language)} ·{' '}
              {content.type === 'game'
                ? getUnitNameI18n(content.unitId, content.unitName, language)
                : content.sectionName}
            </h1>

            {content.type === 'quiz' && (
              <QuizView
                content={content}
                language={language}
                onComplete={handleComplete}
                onNext={handleNext}
              />
            )}

            {content.type === 'game' && (
              <GameView
                content={content}
                language={language}
                onComplete={handleComplete}
                onNext={handleNext}
              />
            )}

            {content.type === 'knowledge' && courseId && (
              <KnowledgeView
                lessonKey={courseId}
                content={content}
                language={language}
                onComplete={handleComplete}
                onNext={handleNext}
                onBackToTopic={handleNext}
              />
            )}

            {content.type === 'story' && courseId && (
              <StoryView
                lessonKey={courseId}
                content={content}
                language={language}
                onComplete={handleComplete}
                onNext={handleNext}
                onBackToTopic={handleNext}
              />
            )}
          </>
        )}
      </main>
    </div>
  )
}
