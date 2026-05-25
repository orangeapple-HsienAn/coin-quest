/**
 * 課程首頁（5.1）— 主題圓形圖示
 * 目前只有 lesson-1（中 / 日文版）；之後從 Firestore 動態列出
 */
import { Link } from 'react-router'
import { Header } from '@/components/layout/Header'
import { useUser } from '@/hooks/useUser'
import { useLesson } from '../hooks/useLesson'

interface CourseEntry {
  lessonKey: string
  title: string
  emoji: string
}

// 目前 hard-coded 顯示這幾個課程入口；之後改為從 Firestore 動態取
const COURSE_ENTRIES: CourseEntry[] = [
  { lessonKey: 'stage-1-lesson-1', title: '支出與公益', emoji: '💰' },
  { lessonKey: 'stage-1-lesson-1-ja', title: '支出と公益', emoji: '🇯🇵' },
]

export function CourseListPage() {
  const { data: user } = useUser()
  // 預先讀第一個課程確認 snapshot 可用（loading 顯示用）
  const { loading, error } = useLesson(COURSE_ENTRIES[0].lessonKey)

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
        {!loading && !error && (
          <div className="grid grid-cols-3 gap-6 sm:grid-cols-4">
            {COURSE_ENTRIES.map((c) => (
              <Link
                key={c.lessonKey}
                to={`/course/${c.lessonKey}`}
                className="flex flex-col items-center gap-3 rounded-2xl bg-white p-6 shadow transition hover:scale-105"
              >
                <div className="flex h-24 w-24 items-center justify-center rounded-full bg-primary/20 text-4xl">
                  {c.emoji}
                </div>
                <span className="text-center font-medium">{c.title}</span>
              </Link>
            ))}
          </div>
        )}
      </main>
    </div>
  )
}
