import { useQuery } from '@tanstack/react-query'
import { collection, query, where, orderBy, getDocs, limit, doc, getDoc } from 'firebase/firestore'
import { db } from '@/lib/firebase'
import { useUser } from '@/hooks/useUser'
import { Header } from '@/components/layout/Header'
import { formatCoin } from '@/lib/utils'
import { tUI } from '@/lib/uiStrings'
import type { User } from '@/types'

/**
 * 排行榜頁面
 * 顯示同等級使用者的資產排名
 */
export function RankingPage() {
  const { data: user } = useUser()
  const userLevel = user?.level ?? 1

  // 取得等級名稱
  const { data: levelName } = useQuery({
    queryKey: ['levelName', userLevel],
    queryFn: async () => {
      const levelDoc = await getDoc(doc(db, 'levels', String(userLevel)))
      return levelDoc.exists() ? (levelDoc.data().name as string) : `Lv.${userLevel}`
    },
  })

  // 取得同等級使用者排行
  const { data: rankings = [], isLoading } = useQuery({
    queryKey: ['rankings', userLevel],
    queryFn: async () => {
      const usersRef = collection(db, 'users')
      const q = query(
        usersRef,
        where('level', '==', userLevel),
        orderBy('totalAssets', 'desc'),
        limit(50)
      )
      const snapshot = await getDocs(q)
      return snapshot.docs.map((doc, index) => ({
        id: doc.id,
        rank: index + 1,
        ...doc.data(),
      })) as (User & { id: string; rank: number })[]
    },
    enabled: !!user,
  })

  // 找出當前使用者的排名
  const myRanking = rankings.find((r) => r.displayName === user?.displayName)

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
          🏆 {levelName ?? `Lv.${userLevel}`} {tUI('排行榜')} 🏆
        </h1>

        {/* 前三名：凸字型頒獎台 */}
        {rankings.length >= 3 && (
          <div className="mb-8 flex items-end justify-center gap-3">
            {/* 第二名（左側較矮） */}
            <div className="flex flex-col items-center">
              <div className="flex h-14 w-14 items-center justify-center rounded-full bg-gray-200 text-2xl">
                🥈
              </div>
              <p className="mt-2 text-sm font-medium text-text-primary">
                {rankings[1]?.displayName}
              </p>
              <div className="mt-2 flex w-28 flex-col items-center rounded-t-[12px] bg-gray-300 px-2 pb-3 pt-4">
                <span className="text-lg font-bold text-text-primary">2</span>
                <p className="font-mono-number text-xs text-text-secondary">
                  ${formatCoin(rankings[1]?.totalAssets ?? 0)}
                </p>
              </div>
            </div>

            {/* 第一名（中間最高） */}
            <div className="flex flex-col items-center">
              <div className="text-center text-lg">👑</div>
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-yellow-400 text-3xl shadow-lg">
                🥇
              </div>
              <p className="mt-2 font-bold text-text-primary">
                {rankings[0]?.displayName}
              </p>
              <div className="mt-2 flex w-28 flex-col items-center rounded-t-[12px] bg-yellow-400 px-2 pb-3 pt-6">
                <span className="text-xl font-bold text-white">1</span>
                <p className="font-mono-number text-xs text-white">
                  ${formatCoin(rankings[0]?.totalAssets ?? 0)}
                </p>
              </div>
            </div>

            {/* 第三名（右側最矮） */}
            <div className="flex flex-col items-center">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-orange-200 text-xl">
                🥉
              </div>
              <p className="mt-2 text-sm font-medium text-text-primary">
                {rankings[2]?.displayName}
              </p>
              <div className="mt-2 flex w-28 flex-col items-center rounded-t-[12px] bg-orange-300 px-2 pb-3 pt-2">
                <span className="text-lg font-bold text-text-primary">3</span>
                <p className="font-mono-number text-xs text-text-secondary">
                  ${formatCoin(rankings[2]?.totalAssets ?? 0)}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* 我的排名 */}
        {myRanking && (
          <div className="mb-6 rounded-[16px] border-2 border-teal bg-teal/5 p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <span className="font-mono-number text-2xl font-bold text-teal">
                  #{myRanking.rank}
                </span>
                <span className="font-medium text-text-primary">{tUI('我的排名')}</span>
              </div>
              <div className="text-right">
                <p className="font-mono-number text-lg font-bold text-text-primary">
                  ${formatCoin(myRanking.totalAssets)}
                </p>
                <p className="text-xs text-text-tertiary">{tUI('總資產')}</p>
              </div>
            </div>
          </div>
        )}

        {/* 排行榜列表 */}
        <div className="overflow-hidden rounded-[16px] border border-[#F0E6D8] bg-white shadow-[0_2px_8px_rgba(0,0,0,0.08)]">
          {/* 表頭（圖示 + Tooltip） */}
          <div className="grid grid-cols-7 bg-primary px-4 py-3 text-sm font-medium text-white">
            <div>{tUI('排名')}</div>
            <div className="col-span-2">{tUI('玩家')}</div>
            <div className="group relative text-right" title={tUI('可用現金')}>
              <span className="cursor-default">💰</span>
              <div className="pointer-events-none absolute right-0 top-full z-10 mt-1 whitespace-nowrap rounded bg-gray-800 px-2 py-1 text-xs text-white opacity-0 shadow-lg transition-opacity group-hover:opacity-100">
                {tUI('可用現金')}
              </div>
            </div>
            <div className="group relative text-right" title={tUI('投資理財')}>
              <span className="cursor-default">📈</span>
              <div className="pointer-events-none absolute right-0 top-full z-10 mt-1 whitespace-nowrap rounded bg-gray-800 px-2 py-1 text-xs text-white opacity-0 shadow-lg transition-opacity group-hover:opacity-100">
                {tUI('投資理財')}
              </div>
            </div>
            <div className="group relative text-right" title={tUI('銀行儲蓄')}>
              <span className="cursor-default">🐷</span>
              <div className="pointer-events-none absolute right-0 top-full z-10 mt-1 whitespace-nowrap rounded bg-gray-800 px-2 py-1 text-xs text-white opacity-0 shadow-lg transition-opacity group-hover:opacity-100">
                {tUI('銀行儲蓄')}
              </div>
            </div>
            <div className="group relative text-right" title={tUI('資產總額')}>
              <span className="cursor-default">💼</span>
              <div className="pointer-events-none absolute right-0 top-full z-10 mt-1 whitespace-nowrap rounded bg-gray-800 px-2 py-1 text-xs text-white opacity-0 shadow-lg transition-opacity group-hover:opacity-100">
                {tUI('資產總額')}
              </div>
            </div>
          </div>

          {/* 列表內容 */}
          {isLoading ? (
            <div className="px-4 py-8 text-center text-text-secondary">{tUI('載入中...')}</div>
          ) : rankings.length === 0 ? (
            <div className="px-4 py-8 text-center text-text-secondary">
              {tUI('尚無排名資料')}
            </div>
          ) : (
            <div className="divide-y divide-[#F0E6D8]">
              {rankings.map((player) => {
                const isMe = player.displayName === user?.displayName

                return (
                  <div
                    key={player.id}
                    className={`grid grid-cols-7 items-center px-4 py-3 text-sm ${
                      isMe ? 'border-l-4 border-teal bg-teal/5' : ''
                    }`}
                  >
                    <div className="font-mono-number font-bold text-text-primary">
                      {player.rank <= 3 ? (
                        <span className="text-lg">
                          {player.rank === 1 && '🥇'}
                          {player.rank === 2 && '🥈'}
                          {player.rank === 3 && '🥉'}
                        </span>
                      ) : (
                        `#${player.rank}`
                      )}
                    </div>
                    <div className="col-span-2">
                      <span
                        className={`font-medium ${
                          isMe ? 'text-teal' : 'text-text-primary'
                        }`}
                      >
                        {player.displayName}
                        {isMe && ` ${tUI('(我)')}`}
                      </span>
                    </div>
                    <div className="text-right font-mono-number text-text-secondary">
                      {formatCoin(player.coins)}
                    </div>
                    <div className="text-right font-mono-number text-invest-orange">
                      {formatCoin(player.totalStockValue)}
                    </div>
                    <div className="text-right font-mono-number text-teal">
                      {formatCoin(player.totalSavings)}
                    </div>
                    <div className="text-right font-mono-number font-bold text-text-primary">
                      {formatCoin(player.totalAssets)}
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
