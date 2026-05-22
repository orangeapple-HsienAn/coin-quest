import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { collection, query, getDocs, doc, getDoc } from 'firebase/firestore'
import { httpsCallable } from 'firebase/functions'
import { db, functions } from '@/lib/firebase'
import { useAuth } from '@/hooks/useAuth'
import { useUser } from '@/hooks/useUser'
import { Header } from '@/components/layout/Header'
import { LevelProgress } from '../components/LevelProgress'
import { Calendar } from '../components/Calendar'
import { FateCardModal, InsuranceClaimModal } from '../components/FateCardModal'
import { formatCoin } from '@/lib/utils'
import { CoinIcon } from '@/components/icons/CoinIcon'

interface CheckInResult {
  success: boolean
  salary: number
  fateCard: {
    type: 'risk' | 'neutral' | 'reward'
    title: string
    description: string
    coinLoss: number
    coinGain: number
    hasInsurance: boolean
    claimAmount: number
  } | null
}

/**
 * 簽到頁面
 * 流程：點擊簽到 → 確認彈窗 → 簽到成功（顯示薪水）→ 抽取命運卡
 */
export function CheckInPage() {
  const { user: authUser } = useAuth()
  const { data: user } = useUser()
  const queryClient = useQueryClient()

  // 簽到流程狀態
  const [showConfirm, setShowConfirm] = useState(false)
  const [showSuccess, setShowSuccess] = useState(false)
  const [showFateCard, setShowFateCard] = useState(false)
  const [showInsuranceClaim, setShowInsuranceClaim] = useState(false)
  const [checkInResult, setCheckInResult] = useState<CheckInResult | null>(null)

  const today = new Date()
  const year = today.getFullYear()
  const month = today.getMonth() + 1
  const todayDate = today.toISOString().split('T')[0]

  // 取得本月簽到紀錄
  const { data: checkIns = [] } = useQuery({
    queryKey: ['checkIns', authUser?.uid, year, month],
    queryFn: async () => {
      if (!authUser?.uid) return []

      const checkInsRef = collection(db, 'users', authUser.uid, 'checkIns')
      const snapshot = await getDocs(query(checkInsRef))

      return snapshot.docs
        .map((doc) => doc.id)
        .filter((date) => date.startsWith(`${year}-${String(month).padStart(2, '0')}`))
    },
    enabled: !!authUser?.uid,
  })

  // 取得等級資料
  const { data: levelData } = useQuery({
    queryKey: ['levels', user?.level],
    queryFn: async () => {
      const currentLevel = user?.level ?? 1
      const currentDoc = await getDoc(doc(db, 'levels', String(currentLevel)))
      const nextDoc = await getDoc(doc(db, 'levels', String(currentLevel + 1)))

      return {
        current: currentDoc.exists()
          ? currentDoc.data()
          : { level: 1, name: '打工新手', dailySalary: 1000, experienceRequired: 0 },
        next: nextDoc.exists()
          ? nextDoc.data()
          : { level: 2, name: '資深打工族', dailySalary: 1200, experienceRequired: 1600 },
      }
    },
    enabled: !!user,
  })

  // 簽到 mutation
  const checkInMutation = useMutation({
    mutationFn: async (useInsurance: boolean) => {
      const checkInFn = httpsCallable<{ useInsurance: boolean }, CheckInResult>(
        functions,
        'checkIn'
      )
      const result = await checkInFn({ useInsurance })
      return result.data
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['user'] })
      queryClient.invalidateQueries({ queryKey: ['checkIns'] })
      setCheckInResult(data)
      // 關閉確認彈窗 → 顯示簽到成功視窗（步驟二）
      setShowConfirm(false)
      setShowSuccess(true)
    },
  })

  const canCheckIn = !checkIns.includes(todayDate)

  // 步驟一：點擊日曆簽到 → 顯示確認彈窗
  const handleCheckInClick = () => {
    setShowConfirm(true)
  }

  // 確認簽到 → 呼叫 API（保持 Modal 開啟顯示 loading，等 API 回應再切換）
  const handleConfirmCheckIn = () => {
    checkInMutation.mutate(false)
  }

  // 步驟二：點擊「抽取命運卡」→ 顯示命運卡
  const handleDrawFateCard = () => {
    setShowSuccess(false)
    if (checkInResult?.fateCard) {
      setShowFateCard(true)
    }
  }

  // 步驟三：命運卡互動
  const handlePayCoins = () => {
    setShowFateCard(false)
    setCheckInResult(null)
  }

  const handleUseInsurance = () => {
    setShowFateCard(false)
    setShowInsuranceClaim(true)
  }

  const handleFateConfirm = () => {
    setShowFateCard(false)
    setCheckInResult(null)
  }

  const handleClaimConfirm = () => {
    setShowInsuranceClaim(false)
    setCheckInResult(null)
  }

  return (
    <div className="min-h-screen bg-bg-cream">
      <Header
        experience={user?.experience ?? 0}
        coins={user?.coins ?? 0}
        displayName={user?.displayName ?? '叩叮'}
        backTo="/"
      />

      <main className="mx-auto max-w-[1000px] px-6 py-8">
        <div className="space-y-6">
          {/* 等級進度條 */}
          <LevelProgress
            currentLevel={user?.level ?? 1}
            currentLevelName={levelData?.current?.name ?? '打工新手'}
            currentSalary={levelData?.current?.dailySalary ?? 1000}
            nextLevel={(user?.level ?? 1) + 1}
            nextLevelName={levelData?.next?.name ?? '資深打工族'}
            nextSalary={levelData?.next?.dailySalary ?? 1200}
            currentExp={user?.experience ?? 0}
            requiredExp={levelData?.next?.experienceRequired ?? 1600}
          />

          {/* 日曆 */}
          <Calendar
            year={year}
            month={month}
            checkedDates={checkIns}
            todayDate={todayDate}
            onCheckIn={handleCheckInClick}
            canCheckIn={canCheckIn}
            isCheckingIn={checkInMutation.isPending}
          />
        </div>
      </main>

      {/* 步驟一：簽到確認彈窗 */}
      {showConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="mx-4 w-full max-w-sm rounded-[20px] bg-white p-6 shadow-[0_8px_32px_rgba(0,0,0,0.16)]">
            <div className="mb-4 flex justify-center">
              <span className="text-5xl">🎲</span>
            </div>
            <p className="mb-6 text-center text-text-primary">
              簽到時，將抽取命運卡。<br />確定現在要簽到了嗎？
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowConfirm(false)}
                disabled={checkInMutation.isPending}
                className="flex-1 rounded-[8px] border border-gray-300 py-3 font-medium text-text-secondary disabled:opacity-50"
              >
                取消
              </button>
              <button
                onClick={handleConfirmCheckIn}
                disabled={checkInMutation.isPending}
                className="flex-1 rounded-[8px] bg-coral py-3 font-medium text-white disabled:opacity-70"
              >
                {checkInMutation.isPending ? '簽到中...' : '我要簽到'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 步驟二：簽到成功視窗 */}
      {showSuccess && checkInResult && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="mx-4 w-full max-w-sm rounded-[20px] bg-white p-6 shadow-[0_8px_32px_rgba(0,0,0,0.16)]">
            <div className="mb-4 flex justify-center">
              <span className="text-5xl">🎉</span>
            </div>
            <h2 className="mb-2 text-center text-xl font-bold text-text-primary">簽到成功！</h2>
            <p className="mb-4 text-center text-sm text-text-secondary">{todayDate}</p>
            <div className="mb-6 rounded-[12px] bg-green-50 px-4 py-4 text-center">
              <p className="text-sm text-text-secondary">今日薪水</p>
              <p className="flex items-center justify-center gap-1 text-2xl font-bold text-teal">
                <CoinIcon size={24} /> +{formatCoin(checkInResult.salary)}
              </p>
            </div>
            {/* 必須點擊抽取命運卡，不能跳過 */}
            <button
              onClick={handleDrawFateCard}
              className="w-full rounded-[8px] bg-coral py-3 font-medium text-white transition-shadow hover:shadow-[0_4px_16px_rgba(0,0,0,0.12)]"
            >
              🎲 抽取命運卡
            </button>
          </div>
        </div>
      )}

      {/* 步驟三：命運卡彈窗 */}
      <FateCardModal
        isOpen={showFateCard}
        type={checkInResult?.fateCard?.type ?? 'neutral'}
        title={checkInResult?.fateCard?.title ?? ''}
        description={checkInResult?.fateCard?.description ?? ''}
        coinLoss={checkInResult?.fateCard?.coinLoss ?? 0}
        coinGain={checkInResult?.fateCard?.coinGain ?? 0}
        hasInsurance={checkInResult?.fateCard?.hasInsurance ?? false}
        claimAmount={checkInResult?.fateCard?.claimAmount ?? 0}
        onPayCoins={handlePayCoins}
        onUseInsurance={handleUseInsurance}
        onConfirm={handleFateConfirm}
        isProcessing={false}
      />

      {/* 步驟四：保險理賠彈窗 */}
      <InsuranceClaimModal
        isOpen={showInsuranceClaim}
        claimAmount={checkInResult?.fateCard?.claimAmount ?? 0}
        onConfirm={handleClaimConfirm}
      />
    </div>
  )
}
