import { useQuery } from '@tanstack/react-query'
import { collection, getDocs, query, orderBy } from 'firebase/firestore'
import { Link } from 'react-router'
import { db } from '@/lib/firebase'
import { useAuth } from '@/hooks/useAuth'
import { useUser } from '@/hooks/useUser'
import { Header } from '@/components/layout/Header'

interface Course {
  id: string
  name: string
  description: string
  iconUrl: string
  order: number
  isActive: boolean
  unlockLevel: number
  chapterCount: number
}

interface UserCourseProgress {
  courseId: string
  completedChapters: string[]
  lastAccessedAt: any
}

/**
 * 課程列表頁面 — 主題圓形圖示排列，含解鎖/待解鎖機制
 */
export function CourseListPage() {
  const { user: authUser } = useAuth()
  const { data: user } = useUser()
  const userLevel = user?.level ?? 1

  // 取得所有課程
  const { data: courses = [], isLoading: coursesLoading } = useQuery({
    queryKey: ['courses'],
    queryFn: async () => {
      const coursesRef = collection(db, 'courses')
      const q = query(coursesRef, orderBy('order', 'asc'))
      const snapshot = await getDocs(q)
      return snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as Course[]
    },
  })

  // 取得使用者課程進度
  const { data: progress = [] } = useQuery({
    queryKey: ['courseProgress', authUser?.uid],
    queryFn: async () => {
      if (!authUser?.uid) return []
      const progressRef = collection(db, 'users', authUser.uid, 'courseProgress')
      const snapshot = await getDocs(progressRef)
      return snapshot.docs.map((doc) => ({
        courseId: doc.id,
        ...doc.data(),
      })) as UserCourseProgress[]
    },
    enabled: !!authUser?.uid,
  })

  // 取得課程進度
  const getCourseProgress = (courseId: string) => {
    return progress.find((p) => p.courseId === courseId)
  }

  // 檢查課程是否解鎖
  const isCourseUnlocked = (course: Course) => {
    return userLevel >= course.unlockLevel
  }

  // 計算完成百分比
  const getCompletionPercent = (course: Course) => {
    const courseProgress = getCourseProgress(course.id)
    if (!courseProgress || course.chapterCount === 0) return 0
    return Math.round(
      (courseProgress.completedChapters.length / course.chapterCount) * 100
    )
  }

  return (
    <div className="min-h-screen bg-bg-cream">
      <Header
        experience={user?.experience ?? 0}
        coins={user?.coins ?? 0}
        displayName={user?.displayName ?? '玩家'}
        backTo="/"
      />

      <main className="mx-auto max-w-[800px] px-6 py-8">
        <h1 className="mb-8 text-center text-xl font-bold text-primary">
          學習課程
        </h1>

        {coursesLoading ? (
          <div className="py-8 text-center text-text-secondary">載入中...</div>
        ) : courses.length === 0 ? (
          <div className="py-8 text-center text-text-secondary">尚無課程</div>
        ) : (
          /* 圓形圖示網格 */
          <div className="flex flex-wrap justify-center gap-8">
            {courses.map((course) => {
              const unlocked = isCourseUnlocked(course)
              const completionPercent = getCompletionPercent(course)
              const isCompleted = completionPercent === 100

              return (
                <div key={course.id} className="flex w-28 flex-col items-center gap-2">
                  {unlocked ? (
                    <Link to={`/course/${course.id}`} className="flex flex-col items-center gap-2">
                      {/* 已解鎖：彩色圓形圖示 */}
                      <div
                        className={`flex h-20 w-20 items-center justify-center rounded-full border-4 text-3xl shadow-md transition-transform hover:scale-105 ${
                          isCompleted
                            ? 'border-gain-green bg-gain-green/20'
                            : 'border-primary bg-primary/10'
                        }`}
                      >
                        {course.iconUrl}
                      </div>
                      <span className="text-center text-sm font-bold text-text-primary">
                        {course.name}
                      </span>
                      {/* 進度指示 */}
                      {isCompleted ? (
                        <span className="text-xs text-gain-green">已完成</span>
                      ) : completionPercent > 0 ? (
                        <span className="text-xs text-primary">{completionPercent}%</span>
                      ) : (
                        <span className="text-xs text-text-tertiary">開始學習</span>
                      )}
                    </Link>
                  ) : (
                    <>
                      {/* 待解鎖：灰色圓形 + 鎖頭 */}
                      <div className="flex h-20 w-20 items-center justify-center rounded-full border-4 border-gray-300 bg-gray-100 text-3xl opacity-60">
                        🔒
                      </div>
                      <span className="text-center text-sm font-medium text-text-tertiary">
                        {course.name}
                      </span>
                      <span className="text-xs text-text-tertiary">
                        Lv.{course.unlockLevel} 解鎖
                      </span>
                    </>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </main>
    </div>
  )
}
