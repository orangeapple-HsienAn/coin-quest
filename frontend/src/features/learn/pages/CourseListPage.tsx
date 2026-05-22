/**
 * 課程首頁（5.1）— 主題圓形圖示
 * 目前只有 lesson-1，之後從 Firestore 動態列出
 */
import { Link } from 'react-router'
import { Header } from '@/components/layout/Header'
import { useUser } from '@/hooks/useUser'
import { useLesson } from '../hooks/useLesson'

const LESSON_KEY = 'stage-1-lesson-1'

export function CourseListPage() {
  const { data: user } = useUser()
  const { data, loading, error } = useLesson(LESSON_KEY)

  return (
    <div className="min-h-screen bg-background">
      <Header
        experience={user?.experience ?? 0}
        coins={user?.coins ?? 0}
        backTo="/"
      />
      <main className="mx-auto max-w-[1200px] px-6 py-10">
        <h1 className="mb-8 text-2xl font-bold">課程主題</h1>
        {loading && <p>載入中...</p>}
        {error && <p className="text-red-500">載入失敗：{error.message}</p>}
        {data && (
          <div className="grid grid-cols-3 gap-6 sm:grid-cols-4">
            <Link
              to={`/course/${LESSON_KEY}`}
              className="flex flex-col items-center gap-3 rounded-2xl bg-white p-6 shadow transition hover:scale-105"
            >
              <div className="flex h-24 w-24 items-center justify-center rounded-full bg-primary/20 text-4xl">
                💰
              </div>
              <span className="font-medium">{data.info.topic}</span>
            </Link>
          </div>
        )}
      </main>
    </div>
  )
}
