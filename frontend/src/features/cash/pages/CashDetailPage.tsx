import { useQuery } from '@tanstack/react-query'
import { collection, query, orderBy, getDocs, limit } from 'firebase/firestore'
import { db } from '@/lib/firebase'
import { useAuth } from '@/hooks/useAuth'
import { useUser } from '@/hooks/useUser'
import { Header } from '@/components/layout/Header'
import { formatCoin } from '@/lib/utils'
import { tUI } from '@/lib/uiStrings'
import type { CashTransaction } from '@/types'

// 類別顯示名稱對照表
const CATEGORY_LABELS: Record<string, string> = {
  salary: '收入',
  task_reward: '收入',
  quiz_reward: '收入',
  course_reward: '收入',
  stock_buy: '股票',
  stock_sell: '股票',
  stock_dividend: '股票',
  savings_deposit: '儲蓄',
  savings_withdraw: '儲蓄',
  savings_interest: '儲蓄',
  insurance_buy: '保險',
  insurance_claim: '保險',
  risk_card_loss: '消費',
}

/**
 * 可用現金明細頁面
 */
export function CashDetailPage() {
  const { user: authUser } = useAuth()
  const { data: user } = useUser()

  // 取得現金交易紀錄
  const { data: transactions = [], isLoading } = useQuery({
    queryKey: ['cashTransactions', authUser?.uid],
    queryFn: async () => {
      if (!authUser?.uid) return []

      const transactionsRef = collection(db, 'users', authUser.uid, 'cashTransactions')
      const q = query(transactionsRef, orderBy('createdAt', 'desc'), limit(50))
      const snapshot = await getDocs(q)

      return snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as (CashTransaction & { id: string })[]
    },
    enabled: !!authUser?.uid,
  })

  // 格式化日期
  const formatDate = (timestamp: any) => {
    if (!timestamp) return ''
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp)
    return date.toLocaleDateString('zh-TW', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    })
  }

  return (
    <div className="min-h-screen bg-bg-cream">
      <Header
        experience={user?.experience ?? 0}
        coins={user?.coins ?? 0}
        displayName={user?.displayName ?? tUI('叩叮')}
        backTo="/"
      />

      <main className="mx-auto max-w-[800px] px-6 py-8">
        {/* 標題 */}
        <h1 className="mb-6 text-center text-xl font-bold text-primary">
          {tUI('⭐ 可用現金明細 ⭐')}
        </h1>

        {/* 交易紀錄表格 */}
        <div className="overflow-hidden rounded-[16px] border border-[#F0E6D8] bg-white shadow-[0_2px_8px_rgba(0,0,0,0.08)]">
          {/* 表頭 */}
          <div className="grid grid-cols-4 bg-cash-green px-4 py-3 text-sm font-medium text-white">
            <div>{tUI('類別')}</div>
            <div className="text-right">{tUI('金額')}</div>
            <div className="text-center">{tUI('備註')}</div>
            <div className="text-right">{tUI('時間')}</div>
          </div>

          {/* 表格內容 */}
          {isLoading ? (
            <div className="px-4 py-8 text-center text-text-secondary">{tUI('載入中...')}</div>
          ) : transactions.length === 0 ? (
            <div className="px-4 py-8 text-center text-text-secondary">{tUI('尚無交易紀錄')}</div>
          ) : (
            <div className="divide-y divide-[#F0E6D8]">
              {transactions.map((tx) => {
                const label = tUI(CATEGORY_LABELS[tx.category] || '其他')
                // 類別文字顏色：流入綠色、流出紅色
                const categoryColor = tx.amount >= 0 ? 'text-gain-green' : 'text-loss-red'

                return (
                  <div
                    key={tx.id}
                    className="grid grid-cols-4 items-center px-4 py-3 text-sm"
                  >
                    <div className={`font-medium ${categoryColor}`}>
                      {label}
                    </div>
                    <div
                      className={`text-right font-mono-number ${
                        tx.amount >= 0 ? 'text-gain-green' : 'text-loss-red'
                      }`}
                    >
                      {tx.amount >= 0 ? '+' : ''}
                      {formatCoin(tx.amount)}
                    </div>
                    <div className="text-center text-text-secondary">{tx.note}</div>
                    <div className="text-right text-text-tertiary">
                      {formatDate(tx.createdAt)}
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </main>
    </div>
  )
}
