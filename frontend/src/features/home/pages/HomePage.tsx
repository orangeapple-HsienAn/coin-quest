import { Header } from '@/components/layout/Header'
import { DailyTasks } from '../components/DailyTasks'
import { CheckInButton } from '../components/CheckInButton'
import { CourseEntryButton } from '../components/CourseEntryButton'
import { AssetOverview } from '../components/AssetOverview'
import { useUser } from '@/hooks/useUser'

/**
 * 首頁
 */
export function HomePage() {
  const { data: user, isLoading } = useUser()

  // 檢查今日是否已簽到
  const today = new Date().toISOString().split('T')[0]
  const hasCheckedIn = user?.dailyTaskStatus?.date === today

  // 今日任務資料（含跳轉路徑）
  const dailyTasks = [
    {
      id: 'daily_quiz',
      name: '每日測驗',
      reward: 200,
      completed: user?.dailyTaskStatus?.dailyQuizCompleted ?? false,
      linkTo: '/course',
    },
    {
      id: 'variable_task',
      name: '變動任務',
      reward: 300,
      completed: user?.dailyTaskStatus?.variableTaskCompleted ?? false,
      linkTo: '/stock',
    },
    {
      id: 'course',
      name: '完成一個課程',
      reward: 3000,
      completed: user?.dailyTaskStatus?.courseCompleted ?? false,
      linkTo: '/course',
    },
  ]

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="text-lg text-text-secondary">載入中...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen">
      <Header
        experience={user?.experience ?? 0}
        coins={user?.coins ?? 0}
        displayName={user?.displayName ?? '叩叮'}
      />

      <main className="mx-auto max-w-[1200px] px-6 py-8">
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          {/* 左側區塊 */}
          <div className="space-y-4">
            <DailyTasks tasks={dailyTasks} />
            <CheckInButton dailySalary={1000} hasCheckedIn={hasCheckedIn} />
            <CourseEntryButton />
          </div>

          {/* 右側區塊 */}
          <div>
            <AssetOverview
              totalAssets={user?.totalAssets ?? 0}
              rank={1}
              cash={user?.coins ?? 0}
              investment={user?.totalStockValue ?? 0}
              savings={user?.totalSavings ?? 0}
              insuranceCount={user?.activeInsuranceCount ?? 0}
            />
          </div>
        </div>
      </main>
    </div>
  )
}
