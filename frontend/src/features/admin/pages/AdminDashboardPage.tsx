import { Link } from 'react-router'
import { useQuery } from '@tanstack/react-query'
import { collection, getCountFromServer } from 'firebase/firestore'
import { db } from '@/lib/firebase'
import { COLLECTIONS } from '../config'

/**
 * Admin 後台首頁 — 顯示各 collection 卡片連結
 */
export function AdminDashboardPage() {
  // 取得各 collection 文件數量
  const { data: counts = {} } = useQuery({
    queryKey: ['admin', 'counts'],
    queryFn: async () => {
      const result: Record<string, number> = {}
      for (const [key, config] of Object.entries(COLLECTIONS)) {
        const snapshot = await getCountFromServer(collection(db, config.path))
        result[key] = snapshot.data().count
      }
      return result
    },
  })

  return (
    <div className="min-h-screen bg-gray-50">
      {/* 頂部導覽 */}
      <header className="border-b bg-white px-6 py-4">
        <div className="mx-auto flex max-w-[1200px] items-center justify-between">
          <h1 className="text-xl font-bold text-gray-800">Admin 後台管理</h1>
          <Link to="/" className="text-sm text-blue-600 hover:underline">
            返回前台
          </Link>
        </div>
      </header>

      <main className="mx-auto max-w-[1200px] px-6 py-8">
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
          {Object.entries(COLLECTIONS).map(([key, config]) => (
            <Link
              key={key}
              to={`/admin/${key}`}
              className="flex items-center gap-4 rounded-lg border bg-white p-5 shadow-sm transition-shadow hover:shadow-md"
            >
              <span className="text-3xl">{config.icon}</span>
              <div>
                <div className="font-semibold text-gray-800">{config.label}</div>
                <div className="text-sm text-gray-500">
                  {counts[key] !== undefined ? `${counts[key]} 筆` : '載入中...'}
                </div>
              </div>
            </Link>
          ))}
        </div>
      </main>
    </div>
  )
}
