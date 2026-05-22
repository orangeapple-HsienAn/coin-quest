import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { collection, query, orderBy, getDocs, limit, doc, getDoc } from 'firebase/firestore'
import { httpsCallable } from 'firebase/functions'
import { db, functions } from '@/lib/firebase'
import { useAuth } from '@/hooks/useAuth'
import { useUser } from '@/hooks/useUser'
import { Header } from '@/components/layout/Header'
import { CoinIcon } from '@/components/icons/CoinIcon'
import { formatCoin } from '@/lib/utils'
import type { SavingsTransaction } from '@/types'

/**
 * 銀行儲蓄頁面
 */
export function SavingsPage() {
  const { user: authUser } = useAuth()
  const { data: user } = useUser()
  const queryClient = useQueryClient()

  const [showDepositModal, setShowDepositModal] = useState(false)
  const [showWithdrawModal, setShowWithdrawModal] = useState(false)
  const [amount, setAmount] = useState('')

  // 取得系統設定（銀行利率）
  const { data: config } = useQuery({
    queryKey: ['config'],
    queryFn: async () => {
      const configDoc = await getDoc(doc(db, 'config', 'system'))
      return configDoc.exists()
        ? configDoc.data()
        : { bankInterestRate: 0.0073 }
    },
  })

  // 取得儲蓄交易紀錄
  const { data: transactions = [], isLoading } = useQuery({
    queryKey: ['savingsTransactions', authUser?.uid],
    queryFn: async () => {
      if (!authUser?.uid) return []

      const transactionsRef = collection(db, 'users', authUser.uid, 'savingsTransactions')
      const q = query(transactionsRef, orderBy('createdAt', 'desc'), limit(50))
      const snapshot = await getDocs(q)

      return snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as (SavingsTransaction & { id: string })[]
    },
    enabled: !!authUser?.uid,
  })

  // 存款 mutation
  const depositMutation = useMutation({
    mutationFn: async (depositAmount: number) => {
      const depositFn = httpsCallable<{ amount: number }, { success: boolean }>(
        functions,
        'deposit'
      )
      const result = await depositFn({ amount: depositAmount })
      return result.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user'] })
      queryClient.invalidateQueries({ queryKey: ['savingsTransactions'] })
      setShowDepositModal(false)
      setAmount('')
    },
  })

  // 提款 mutation
  const withdrawMutation = useMutation({
    mutationFn: async (withdrawAmount: number) => {
      const withdrawFn = httpsCallable<{ amount: number }, { success: boolean }>(
        functions,
        'withdraw'
      )
      const result = await withdrawFn({ amount: withdrawAmount })
      return result.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user'] })
      queryClient.invalidateQueries({ queryKey: ['savingsTransactions'] })
      setShowWithdrawModal(false)
      setAmount('')
    },
  })

  const handleDeposit = () => {
    const depositAmount = parseInt(amount)
    if (depositAmount > 0 && depositAmount <= (user?.coins ?? 0)) {
      depositMutation.mutate(depositAmount)
    }
  }

  const handleWithdraw = () => {
    const withdrawAmount = parseInt(amount)
    if (withdrawAmount > 0 && withdrawAmount <= (user?.totalSavings ?? 0)) {
      withdrawMutation.mutate(withdrawAmount)
    }
  }

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

  const interestRate = ((config?.bankInterestRate ?? 0.0073) * 100).toFixed(2)

  return (
    <div className="min-h-screen bg-bg-cream">
      <Header
        experience={user?.experience ?? 0}
        coins={user?.coins ?? 0}
        displayName={user?.displayName ?? '叩叮'}
        backTo="/"
      />

      <main className="mx-auto max-w-[1000px] px-6 py-8">
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          {/* 左側：儲蓄資訊與操作 */}
          <div className="space-y-4">
            {/* 儲蓄總額 */}
            <div className="rounded-[16px] border border-[#F0E6D8] bg-white p-5 shadow-[0_2px_8px_rgba(0,0,0,0.08)]">
              <p className="text-sm text-text-secondary">儲蓄總額</p>
              <p className="font-mono-number text-3xl font-bold text-text-primary">
                ${formatCoin(user?.totalSavings ?? 0)}
              </p>
            </div>

            {/* 利率資訊（hover 顯示計算規則） */}
            <div className="group relative flex items-center gap-2 rounded-[12px] bg-coral px-4 py-3">
              <span>⏰</span>
              <span className="text-sm font-medium text-white">
                目前銀行利率為 {interestRate}%！
              </span>
              {/* Tooltip */}
              <div className="pointer-events-none absolute left-0 top-full z-10 mt-2 w-full rounded-[8px] bg-gray-800 px-4 py-3 text-xs text-white opacity-0 shadow-lg transition-opacity group-hover:opacity-100">
                <p className="font-medium">利息計算規則</p>
                <p className="mt-1">每月結算一次，利息 = 儲蓄餘額 × 年利率 ÷ 12</p>
              </div>
            </div>

            {/* 存款/提款按鈕 */}
            <div className="grid grid-cols-2 gap-4">
              <button
                onClick={() => setShowDepositModal(true)}
                className="flex flex-col items-center gap-2 rounded-[16px] border border-[#F0E6D8] bg-white p-6 shadow-[0_2px_8px_rgba(0,0,0,0.08)] transition-shadow hover:shadow-[0_4px_16px_rgba(0,0,0,0.12)]"
              >
                <span className="text-4xl">💵</span>
                <span className="font-medium text-text-primary">存款</span>
              </button>

              <button
                onClick={() => setShowWithdrawModal(true)}
                className="flex flex-col items-center gap-2 rounded-[16px] border border-[#F0E6D8] bg-white p-6 shadow-[0_2px_8px_rgba(0,0,0,0.08)] transition-shadow hover:shadow-[0_4px_16px_rgba(0,0,0,0.12)]"
              >
                <span className="text-4xl">💸</span>
                <span className="font-medium text-text-primary">提款</span>
              </button>
            </div>
          </div>

          {/* 右側：交易紀錄 */}
          <div className="overflow-hidden rounded-[16px] border border-[#F0E6D8] bg-white shadow-[0_2px_8px_rgba(0,0,0,0.08)]">
            {/* 表頭 */}
            <div className="grid grid-cols-4 bg-savings-pink px-4 py-3 text-sm font-medium text-white">
              <div>類別</div>
              <div className="text-right">金額</div>
              <div className="text-center">備註</div>
              <div className="text-right">時間</div>
            </div>

            {/* 表格內容 */}
            {isLoading ? (
              <div className="px-4 py-8 text-center text-text-secondary">載入中...</div>
            ) : transactions.length === 0 ? (
              <div className="px-4 py-8 text-center text-text-secondary">尚無交易紀錄</div>
            ) : (
              <div className="max-h-[400px] divide-y divide-[#F0E6D8] overflow-y-auto">
                {transactions.map((tx) => (
                  <div
                    key={tx.id}
                    className="grid grid-cols-4 items-center px-4 py-3 text-sm"
                  >
                    <div
                      className={`font-medium ${
                        tx.type === 'withdraw' ? 'text-loss-red' : 'text-gain-green'
                      }`}
                    >
                      {tx.type === 'deposit' ? '存入' : tx.type === 'withdraw' ? '轉出' : '存入'}
                    </div>
                    <div
                      className={`text-right font-mono-number ${
                        tx.type === 'withdraw' ? 'text-loss-red' : 'text-gain-green'
                      }`}
                    >
                      {tx.type === 'withdraw' ? '-' : ''}
                      {formatCoin(tx.amount)}
                    </div>
                    <div className="text-center text-text-secondary">{tx.note || '-'}</div>
                    <div className="text-right text-text-tertiary">
                      {formatDate(tx.createdAt)}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </main>

      {/* 存款彈窗 */}
      {showDepositModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="mx-4 w-full max-w-sm rounded-[20px] bg-white p-6 shadow-[0_8px_32px_rgba(0,0,0,0.16)]">
            <h2 className="mb-4 flex items-center gap-2 text-lg font-bold text-teal">
              <span>💵</span> 存款
            </h2>
            <p className="mb-2 flex items-center gap-1 text-sm text-text-secondary">
              可用現金：<CoinIcon size={14} /> {formatCoin(user?.coins ?? 0)}
            </p>
            {/* 金額輸入：支援 $100 單位增減 */}
            <div className="mb-4 flex items-center gap-2">
              <button
                onClick={() => setAmount(String(Math.max(0, (parseInt(amount) || 0) - 100)))}
                className="flex h-10 w-10 items-center justify-center rounded-[8px] border border-gray-300 text-lg font-bold text-text-primary hover:bg-gray-50"
              >
                −
              </button>
              <input
                type="number"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="$0"
                className="w-full flex-1 rounded-[8px] border border-gray-300 px-4 py-2.5 text-center text-text-primary focus:border-teal focus:outline-none focus:ring-1 focus:ring-teal"
              />
              <button
                onClick={() => setAmount(String((parseInt(amount) || 0) + 100))}
                className="flex h-10 w-10 items-center justify-center rounded-[8px] border border-gray-300 text-lg font-bold text-text-primary hover:bg-gray-50"
              >
                +
              </button>
            </div>
            <p className="mb-4 text-center text-xs text-text-tertiary">
              目前儲蓄餘額：${formatCoin(user?.totalSavings ?? 0)}
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => { setShowDepositModal(false); setAmount('') }}
                className="flex-1 rounded-[8px] border border-gray-300 py-3 font-medium text-text-secondary"
              >
                取消
              </button>
              <button
                onClick={handleDeposit}
                disabled={depositMutation.isPending || !amount || parseInt(amount) <= 0}
                className="flex-1 rounded-[8px] bg-teal py-3 font-medium text-white disabled:opacity-50"
              >
                {depositMutation.isPending ? '處理中...' : '確認存入'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 提款彈窗 */}
      {showWithdrawModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="mx-4 w-full max-w-sm rounded-[20px] bg-white p-6 shadow-[0_8px_32px_rgba(0,0,0,0.16)]">
            <h2 className="mb-4 flex items-center gap-2 text-lg font-bold text-coral">
              <span>💸</span> 提款
            </h2>
            <p className="mb-2 flex items-center gap-1 text-sm text-text-secondary">
              儲蓄餘額：<CoinIcon size={14} /> {formatCoin(user?.totalSavings ?? 0)}
            </p>
            {/* 金額輸入：支援 $100 單位增減 */}
            <div className="mb-4 flex items-center gap-2">
              <button
                onClick={() => setAmount(String(Math.max(0, (parseInt(amount) || 0) - 100)))}
                className="flex h-10 w-10 items-center justify-center rounded-[8px] border border-gray-300 text-lg font-bold text-text-primary hover:bg-gray-50"
              >
                −
              </button>
              <input
                type="number"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="$0"
                className="w-full flex-1 rounded-[8px] border border-gray-300 px-4 py-2.5 text-center text-text-primary focus:border-coral focus:outline-none focus:ring-1 focus:ring-coral"
              />
              <button
                onClick={() => setAmount(String((parseInt(amount) || 0) + 100))}
                className="flex h-10 w-10 items-center justify-center rounded-[8px] border border-gray-300 text-lg font-bold text-text-primary hover:bg-gray-50"
              >
                +
              </button>
            </div>
            <p className="mb-4 text-center text-xs text-text-tertiary">
              目前儲蓄餘額：${formatCoin(user?.totalSavings ?? 0)}
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => { setShowWithdrawModal(false); setAmount('') }}
                className="flex-1 rounded-[8px] border border-gray-300 py-3 font-medium text-text-secondary"
              >
                取消
              </button>
              <button
                onClick={handleWithdraw}
                disabled={withdrawMutation.isPending || !amount || parseInt(amount) <= 0}
                className="flex-1 rounded-[8px] bg-coral py-3 font-medium text-white disabled:opacity-50"
              >
                {withdrawMutation.isPending ? '處理中...' : '確認提款'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
