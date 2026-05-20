import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { collection, getDocs } from 'firebase/firestore'
import { httpsCallable } from 'firebase/functions'
import { db, functions } from '@/lib/firebase'
import { useAuth } from '@/hooks/useAuth'
import { useUser } from '@/hooks/useUser'
import { Header } from '@/components/layout/Header'
import { formatCoin } from '@/lib/utils'
import type { InsuranceProduct, UserInsurance } from '@/types'

/**
 * 保險頁面
 */
export function InsurancePage() {
  const { user: authUser } = useAuth()
  const { data: user } = useUser()
  const queryClient = useQueryClient()

  // 取得所有保險產品
  const { data: products = [] } = useQuery({
    queryKey: ['insuranceProducts'],
    queryFn: async () => {
      const productsRef = collection(db, 'insuranceProducts')
      const snapshot = await getDocs(productsRef)
      const docs = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as (InsuranceProduct & { id: string })[]
      return docs.sort((a, b) => (a.order || 0) - (b.order || 0))
    },
  })

  // 取得使用者持有的保險
  const { data: userInsurances = [] } = useQuery({
    queryKey: ['userInsurances', authUser?.uid],
    queryFn: async () => {
      if (!authUser?.uid) return []
      const insurancesRef = collection(db, 'users', authUser.uid, 'insurances')
      const snapshot = await getDocs(insurancesRef)
      return snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as (UserInsurance & { id: string })[]
    },
    enabled: !!authUser?.uid,
  })

  // 購買保險 mutation
  const buyMutation = useMutation({
    mutationFn: async (insuranceProductId: string) => {
      const buyFn = httpsCallable<
        { insuranceProductId: string },
        { success: boolean }
      >(functions, 'buyInsurance')
      const result = await buyFn({ insuranceProductId })
      return result.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user'] })
      queryClient.invalidateQueries({ queryKey: ['userInsurances'] })
    },
  })

  // 取得使用者持有的特定保險
  const getUserInsurance = (productId: string) => {
    return userInsurances.find((ins) => ins.id === productId)
  }

  // 檢查保險是否有效
  const isInsuranceActive = (userInsurance: UserInsurance | undefined) => {
    if (!userInsurance) return false
    if (userInsurance.status !== 'active') return false
    const expiresAt = userInsurance.expiresAt
    const expiresDate = expiresAt && 'toDate' in expiresAt ? expiresAt.toDate() : new Date(expiresAt as any)
    return expiresDate > new Date()
  }

  // 計算精確剩餘時間（天、時、分）
  const getRemainingTime = (userInsurance: UserInsurance) => {
    const expiresAt = userInsurance.expiresAt
    const expiresDate = expiresAt && 'toDate' in expiresAt ? expiresAt.toDate() : new Date(expiresAt as any)
    const now = new Date()
    const diff = Math.max(0, expiresDate.getTime() - now.getTime())
    const days = Math.floor(diff / (1000 * 60 * 60 * 24))
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60))
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60))
    return { days, hours, minutes, totalDays: Math.ceil(diff / (1000 * 60 * 60 * 24)) }
  }

  // 計算進度條百分比
  const getProgressPercent = (userInsurance: UserInsurance, product: InsuranceProduct) => {
    const { totalDays } = getRemainingTime(userInsurance)
    return Math.min(100, (totalDays / product.durationDays) * 100)
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
        {/* 標題 */}
        <h1 className="mb-6 text-center text-xl font-bold text-primary">
          🛡️ 保險中心 🛡️
        </h1>

        {/* 說明文字 */}
        <div className="mb-6 rounded-[12px] bg-teal/10 px-4 py-3">
          <p className="text-sm text-teal">
            購買保險可以在遭遇風險事件時獲得理賠，降低損失！
          </p>
        </div>

        {/* 保險列表（網格排列） */}
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          {products.map((product) => {
            const userInsurance = getUserInsurance(product.id)
            const isActive = isInsuranceActive(userInsurance)
            const canBuy = (user?.coins || 0) >= product.premium

            return (
              <div
                key={product.id}
                className="overflow-hidden rounded-[16px] border border-[#F0E6D8] bg-white shadow-[0_2px_8px_rgba(0,0,0,0.08)]"
              >
                <div className="p-5">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h3 className="text-lg font-bold text-text-primary">
                        {product.name}
                      </h3>
                      <p className="mt-1 text-sm text-text-secondary">
                        {product.description}
                      </p>

                      <div className="mt-3 flex flex-wrap gap-4 text-sm">
                        <div>
                          <span className="text-text-tertiary">理賠金額：</span>
                          <span className="font-mono-number font-medium text-gain-green">
                            ${formatCoin(product.claimAmount)}
                          </span>
                        </div>
                        <div>
                          <span className="text-text-tertiary">效期：</span>
                          <span className="font-medium text-text-primary">
                            {product.durationDays} 天
                          </span>
                        </div>
                        <div>
                          <span className="text-text-tertiary">費用：</span>
                          <span className="font-mono-number font-medium text-invest-orange">
                            ${formatCoin(product.premium)}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="ml-4">
                      {isActive ? (
                        <div className="rounded-full bg-teal/10 px-4 py-2 text-sm font-medium text-teal">
                          享有保障
                        </div>
                      ) : userInsurance && !isActive ? (
                        <div className="rounded-full bg-orange-100 px-4 py-2 text-sm font-medium text-orange-600">
                          已過期
                        </div>
                      ) : null}
                    </div>
                  </div>

                  {/* 保障中：進度條 + 精確倒數 */}
                  {userInsurance && isActive && (() => {
                    const { days, hours, minutes } = getRemainingTime(userInsurance)
                    return (
                      <div className="mt-4">
                        <div className="flex items-center justify-between text-xs text-text-tertiary">
                          <span>剩餘效期</span>
                          <span>{days}天 {hours}時 {minutes}分</span>
                        </div>
                        <div className="mt-1 h-2 overflow-hidden rounded-full bg-gray-200">
                          <div
                            className="h-full rounded-full bg-teal transition-all"
                            style={{
                              width: `${getProgressPercent(userInsurance, product)}%`,
                            }}
                          />
                        </div>
                      </div>
                    )
                  })()}

                  {/* 已過期：顯示保險效力已終止 */}
                  {userInsurance && !isActive && (
                    <div className="mt-4">
                      <p className="text-center text-sm text-orange-600">保險效力已終止</p>
                    </div>
                  )}

                  {/* 操作按鈕 */}
                  <div className="mt-4">
                    {isActive ? (
                      <button
                        disabled
                        className="w-full rounded-[8px] bg-teal/20 py-2.5 text-sm font-medium text-teal"
                      >
                        享有保障
                      </button>
                    ) : userInsurance && !isActive ? (
                      <button
                        onClick={() => buyMutation.mutate(product.id)}
                        disabled={buyMutation.isPending || !canBuy}
                        className="w-full rounded-[8px] bg-orange-500 py-2.5 text-sm font-medium text-white transition-colors hover:bg-orange-600 disabled:opacity-50"
                      >
                        {buyMutation.isPending ? '處理中...' : `立即續保 $${formatCoin(product.premium)}`}
                      </button>
                    ) : (
                      <button
                        onClick={() => buyMutation.mutate(product.id)}
                        disabled={buyMutation.isPending || !canBuy}
                        className="w-full rounded-[8px] bg-teal py-2.5 text-sm font-medium text-white transition-colors hover:bg-teal/90 disabled:opacity-50"
                      >
                        {buyMutation.isPending ? '處理中...' : '購買保險'}
                      </button>
                    )}
                  </div>
                </div>
              </div>
            )
          })}

          {products.length === 0 && (
            <div className="py-8 text-center text-text-secondary">
              尚無保險產品
            </div>
          )}
        </div>
      </main>
    </div>
  )
}
