import { useQuery } from '@tanstack/react-query'
import { collection, doc, getDoc, getDocs, query, orderBy } from 'firebase/firestore'
import { Link, useParams } from 'react-router'
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

interface Chapter {
  id: string
  title: string
  type: 'story' | 'knowledge' | 'game' | 'quiz'
  order: number
  experienceReward: number
  coinReward: number
}

interface UserCourseProgress {
  courseId: string
  completedChapters: string[]
  lastAccessedAt: any
}

// 章節類型圖示
const CHAPTER_TYPE_CONFIG: Record<
  string,
  { icon: string; label: string }
> = {
  story: { icon: '📕', label: '小故事' },
  knowledge: { icon: '📘', label: '小知識' },
  game: { icon: '🎮', label: '小遊戲' },
  quiz: { icon: '📝', label: '小測驗' },
}

/**
 * 課程詳情頁面 — S 型蛇行路徑設計 + 吉祥物導引
 */
export function CourseDetailPage() {
  const { courseId } = useParams<{ courseId: string }>()
  const { user: authUser } = useAuth()
  const { data: user } = useUser()

  // 取得課程資料
  const { data: course, isLoading: courseLoading } = useQuery({
    queryKey: ['course', courseId],
    queryFn: async () => {
      if (!courseId) return null
      const courseDoc = await getDoc(doc(db, 'courses', courseId))
      if (!courseDoc.exists()) return null
      return { id: courseDoc.id, ...courseDoc.data() } as Course
    },
    enabled: !!courseId,
  })

  // 取得章節列表
  const { data: chapters = [], isLoading: chaptersLoading } = useQuery({
    queryKey: ['chapters', courseId],
    queryFn: async () => {
      if (!courseId) return []
      const chaptersRef = collection(db, 'courses', courseId, 'chapters')
      const q = query(chaptersRef, orderBy('order', 'asc'))
      const snapshot = await getDocs(q)
      return snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as Chapter[]
    },
    enabled: !!courseId,
  })

  // 取得使用者課程進度
  const { data: progress } = useQuery({
    queryKey: ['courseProgress', authUser?.uid, courseId],
    queryFn: async () => {
      if (!authUser?.uid || !courseId) return null
      const progressDoc = await getDoc(
        doc(db, 'users', authUser.uid, 'courseProgress', courseId)
      )
      if (!progressDoc.exists()) return null
      return {
        courseId: progressDoc.id,
        ...progressDoc.data(),
      } as UserCourseProgress
    },
    enabled: !!authUser?.uid && !!courseId,
  })

  const isChapterCompleted = (chapterId: string) => {
    return progress?.completedChapters?.includes(chapterId) ?? false
  }

  // 找出下一個未完成的章節
  const nextChapter = chapters.find((ch) => !isChapterCompleted(ch.id))

  const isLoading = courseLoading || chaptersLoading

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center bg-bg-cream">
        <div className="text-lg text-text-secondary">載入中...</div>
      </div>
    )
  }

  if (!course) {
    return (
      <div className="flex h-screen flex-col items-center justify-center bg-bg-cream">
        <p className="text-lg text-text-secondary">課程不存在</p>
        <Link to="/course" className="mt-4 text-primary hover:underline">
          返回課程列表
        </Link>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-bg-cream">
      <Header
        experience={user?.experience ?? 0}
        coins={user?.coins ?? 0}
        displayName={user?.displayName ?? '玩家'}
        backTo="/course"
      />

      <main className="mx-auto max-w-[800px] px-6 py-8">
        {/* 課程標題 */}
        <div className="mb-8 text-center">
          <h1 className="text-xl font-bold text-primary">{course.name}</h1>
          <p className="mt-2 text-sm text-text-secondary">{course.description}</p>
        </div>

        {/* S 型蛇行路徑：Grid 佈局 + SVG 連接線 */}
        <SnakePath
          chapters={chapters}
          courseId={courseId!}
          nextChapterId={nextChapter?.id ?? null}
          isChapterCompleted={isChapterCompleted}
        />

        {chapters.length === 0 && (
          <div className="py-8 text-center text-text-secondary">
            此課程尚無章節
          </div>
        )}
      </main>
    </div>
  )
}

// === S 型蛇行路徑元件 ===

// 佈局常數
const COLS = 3
const COL_WIDTH = 180   // 每欄寬度 px
const ROW_HEIGHT = 160  // 每行高度 px（圓心到圓心）
const CIRCLE_R = 36     // 圓形節點半徑
const VERT_GAP = 40     // 行間垂直連接段高度
const MASCOT_H = 32     // 吉祥物區域高度

interface SnakePathProps {
  chapters: Chapter[]
  courseId: string
  nextChapterId: string | null
  isChapterCompleted: (id: string) => boolean
}

/**
 * 計算第 i 個章節的圓心座標（相對於容器左上角）
 */
function getNodeCenter(index: number) {
  const row = Math.floor(index / COLS)
  const colInRow = index % COLS
  // 奇數行反轉方向
  const col = row % 2 === 0 ? colInRow : (COLS - 1 - colInRow)
  const x = col * COL_WIDTH + COL_WIDTH / 2
  const y = MASCOT_H + row * ROW_HEIGHT + CIRCLE_R
  return { x, y }
}

function SnakePath({ chapters, courseId, nextChapterId, isChapterCompleted }: SnakePathProps) {
  if (chapters.length === 0) return null

  const totalRows = Math.ceil(chapters.length / COLS)
  const svgWidth = COLS * COL_WIDTH
  const svgHeight = MASCOT_H + totalRows * ROW_HEIGHT + 40 // 底部留白

  // 建構 SVG path：依序連接所有節點圓心
  const pathSegments: string[] = []
  for (let i = 0; i < chapters.length; i++) {
    const { x, y } = getNodeCenter(i)
    if (i === 0) {
      pathSegments.push(`M ${x} ${y}`)
    } else {
      const prev = getNodeCenter(i - 1)
      // 同一行：水平直線
      if (Math.floor(i / COLS) === Math.floor((i - 1) / COLS)) {
        pathSegments.push(`L ${x} ${y}`)
      } else {
        // 跨行：先垂直下降，再水平移到新位置
        const midY = prev.y + VERT_GAP
        pathSegments.push(`L ${prev.x} ${midY}`)
        pathSegments.push(`L ${x} ${midY}`)
        pathSegments.push(`L ${x} ${y}`)
      }
    }
  }
  const svgPath = pathSegments.join(' ')

  return (
    <div className="relative mx-auto" style={{ width: svgWidth, height: svgHeight }}>
      {/* SVG 虛線連接路徑 */}
      <svg
        className="absolute inset-0"
        width={svgWidth}
        height={svgHeight}
        style={{ pointerEvents: 'none' }}
      >
        <path
          d={svgPath}
          fill="none"
          stroke="#D1D5DB"
          strokeWidth={2}
          strokeDasharray="8 6"
        />
      </svg>

      {/* 章節節點 */}
      {chapters.map((chapter, index) => {
        const { x, y } = getNodeCenter(index)
        const completed = isChapterCompleted(chapter.id)
        const isNext = chapter.id === nextChapterId
        const typeConfig = CHAPTER_TYPE_CONFIG[chapter.type] || {
          icon: '📄',
          label: '章節',
        }

        return (
          <div
            key={chapter.id}
            className="absolute flex flex-col items-center"
            style={{
              left: x - COL_WIDTH / 2,
              top: y - CIRCLE_R - (isNext ? MASCOT_H : 0),
              width: COL_WIDTH,
            }}
          >
            {/* 吉祥物導引 */}
            {isNext && (
              <div className="mb-1 flex items-center gap-1">
                <span className="text-xl">🦊</span>
                <span className="rounded-lg bg-primary px-2 py-1 text-xs font-medium text-white shadow-md">
                  來挑戰這個吧！
                </span>
              </div>
            )}

            <Link
              to={`/course/${courseId}/chapter/${chapter.id}`}
              className={`relative z-10 flex h-[72px] w-[72px] items-center justify-center rounded-full border-4 text-2xl shadow-sm transition-transform hover:scale-110 ${
                completed
                  ? 'border-gain-green bg-green-50'
                  : isNext
                    ? 'border-primary bg-yellow-100 ring-2 ring-primary/30'
                    : 'border-yellow-400 bg-yellow-50'
              }`}
            >
              {completed ? '✅' : typeConfig.icon}
            </Link>

            <span className="mt-1 text-center text-xs font-medium text-text-secondary">
              {typeConfig.label}
            </span>
            <span className="max-w-[140px] text-center text-xs text-text-primary line-clamp-2">
              {chapter.title}
            </span>
          </div>
        )
      })}
    </div>
  )
}
