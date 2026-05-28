import { BrowserRouter, Routes, Route, Navigate } from 'react-router'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { useAuth } from '@/hooks/useAuth'
import { useUser } from '@/hooks/useUser'
import { LoginPage } from '@/features/auth/pages/LoginPage'
import { RegisterPage } from '@/features/auth/pages/RegisterPage'
import { HomePage } from '@/features/home/pages/HomePage'
import { CheckInPage } from '@/features/check-in/pages/CheckInPage'
import { CashDetailPage } from '@/features/cash/pages/CashDetailPage'
import { SavingsPage } from '@/features/savings/pages/SavingsPage'
import { StockPage } from '@/features/stock/pages/StockPage'
import { InsurancePage } from '@/features/insurance/pages/InsurancePage'
import { RankingPage } from '@/features/ranking/pages/RankingPage'
import { CourseListPage } from '@/features/learn/pages/CourseListPage'
import { CourseDetailPage } from '@/features/learn/pages/CourseDetailPage'
import { ChapterPage } from '@/features/learn/pages/ChapterPage'
import { AdminDashboardPage } from '@/features/admin/pages/AdminDashboardPage'
import { AdminCollectionPage } from '@/features/admin/pages/AdminCollectionPage'
import { AdminChaptersPage } from '@/features/admin/pages/AdminChaptersPage'
import { tUI } from '@/lib/uiStrings'

// 建立 QueryClient 實例
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 分鐘
      retry: 1,
    },
  },
})

/** 需要認證的路由包裝元件 */
function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, loading } = useAuth()

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-bg-cream">
        <div className="text-lg text-text-secondary">{tUI('載入中...')}</div>
      </div>
    )
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />
  }

  return <>{children}</>
}

/** Admin 路由包裝元件（檢查 role === 'admin'） */
function AdminRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, loading } = useAuth()
  const { data: user, isLoading: userLoading } = useUser()

  if (loading || userLoading) {
    return (
      <div className="flex h-screen items-center justify-center bg-bg-cream">
        <div className="text-lg text-text-secondary">{tUI('載入中...')}</div>
      </div>
    )
  }

  if (!isAuthenticated || user?.role !== 'admin') {
    return <Navigate to="/" replace />
  }

  return <>{children}</>
}

/** 訪客路由包裝元件（已登入用戶導向首頁） */
function GuestRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, loading } = useAuth()

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-bg-cream">
        <div className="text-lg text-text-secondary">{tUI('載入中...')}</div>
      </div>
    )
  }

  if (isAuthenticated) {
    return <Navigate to="/" replace />
  }

  return <>{children}</>
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <Routes>
          {/* 訪客路由（已登入會導向首頁） */}
          <Route
            path="/login"
            element={
              <GuestRoute>
                <LoginPage />
              </GuestRoute>
            }
          />
          <Route
            path="/register"
            element={
              <GuestRoute>
                <RegisterPage />
              </GuestRoute>
            }
          />

          {/* 需要認證的路由 */}
          <Route
            path="/"
            element={
              <ProtectedRoute>
                <HomePage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/check-in"
            element={
              <ProtectedRoute>
                <CheckInPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/cash"
            element={
              <ProtectedRoute>
                <CashDetailPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/savings"
            element={
              <ProtectedRoute>
                <SavingsPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/stock"
            element={
              <ProtectedRoute>
                <StockPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/insurance"
            element={
              <ProtectedRoute>
                <InsurancePage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/ranking"
            element={
              <ProtectedRoute>
                <RankingPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/course"
            element={
              <ProtectedRoute>
                <CourseListPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/course/:courseId"
            element={
              <ProtectedRoute>
                <CourseDetailPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/course/:courseId/chapter/:chapterId"
            element={
              <ProtectedRoute>
                <ChapterPage />
              </ProtectedRoute>
            }
          />

          {/* Admin 後台路由 */}
          <Route
            path="/admin"
            element={
              <AdminRoute>
                <AdminDashboardPage />
              </AdminRoute>
            }
          />
          <Route
            path="/admin/courses/:courseId/chapters"
            element={
              <AdminRoute>
                <AdminChaptersPage />
              </AdminRoute>
            }
          />
          <Route
            path="/admin/:collection"
            element={
              <AdminRoute>
                <AdminCollectionPage />
              </AdminRoute>
            }
          />

          {/* 未匹配路由導向首頁 */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </QueryClientProvider>
  )
}

export default App
