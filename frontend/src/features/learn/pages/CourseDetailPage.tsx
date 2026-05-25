/**
 * 章節單元列表（5.2）— S 型蛇行路徑、4 節點/行
 * 一個 lesson 內所有 units 的所有 chapters 被攤平成一條線
 */
import { useParams } from 'react-router'
import { Header } from '@/components/layout/Header'
import { useUser } from '@/hooks/useUser'
import { useLesson } from '../hooks/useLesson'
import { buildChapters } from '../hooks/useChapters'
import { SerpentinePath } from '../components/SerpentinePath'

export function CourseDetailPage() {
  const { courseId } = useParams<{ courseId: string }>()
  const { data: user } = useUser()
  const { data, loading, error } = useLesson(courseId ?? '')

  const chapters = data ? buildChapters(data.units, data.language) : []

  return (
    <div className="min-h-screen bg-background">
      <Header
        experience={user?.experience ?? 0}
        coins={user?.coins ?? 0}
        backTo="/course"
      />
      <main className="mx-auto max-w-[1200px] px-6 py-10">
        {loading && <p>載入中...</p>}
        {error && <p className="text-red-500">載入失敗：{error.message}</p>}
        {data && (
          <>
            <h1 className="mb-8 text-center text-2xl font-bold">{data.info.topic}</h1>
            <SerpentinePath
              chapters={chapters}
              hrefFor={(c) => `/course/${courseId}/chapter/${c.id}`}
              language={data.language}
            />
          </>
        )}
      </main>
    </div>
  )
}
