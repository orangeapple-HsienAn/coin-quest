import { useState, useEffect } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { collection, doc, getDoc, getDocs, query, orderBy } from 'firebase/firestore'
import { httpsCallable } from 'firebase/functions'
import {
  LineChart, Line, XAxis, YAxis,
  Tooltip as RechartsTooltip, ResponsiveContainer,
} from 'recharts'
import { db, functions } from '@/lib/firebase'
import { useAuth } from '@/hooks/useAuth'
import { useUser } from '@/hooks/useUser'
import { Header } from '@/components/layout/Header'
import { CoinIcon } from '@/components/icons/CoinIcon'
import { formatCoin } from '@/lib/utils'
import type { Stock, StockHolding, StockTransaction, CurrentStockPrices } from '@/types'

type TabType = 'buy' | 'unrealized' | 'realized'

/** 判斷目前是否為交易時段（台灣時間 16:00-21:00） */
function isTradingHours() {
  const now = new Date()
  const taiwanHour = (now.getUTCHours() + 8) % 24
  return taiwanHour >= 16 && taiwanHour < 21
}

/** 損益顏色（台股慣例：正值紅、負值綠） */
const pnlColor = (v: number) => (v >= 0 ? 'text-loss-red' : 'text-gain-green')
const pnlSign = (v: number) => (v >= 0 ? '+' : '')

/**
 * 投資理財頁面（三分頁：買賣股票、未實現損益、已實現損益）
 */
export function StockPage() {
  const { user: authUser } = useAuth()
  const { data: user } = useUser()
  const queryClient = useQueryClient()

  // 交易時段狀態（每分鐘更新一次）
  const [canTrade, setCanTrade] = useState(isTradingHours)
  useEffect(() => {
    const timer = setInterval(() => setCanTrade(isTradingHours()), 60_000)
    return () => clearInterval(timer)
  }, [])

  // 分頁與交易狀態
  const [activeTab, setActiveTab] = useState<TabType>('buy')
  const [selectedStock, setSelectedStock] = useState<(Stock & { id: string }) | null>(null)
  const [quantity, setQuantity] = useState(100)
  const [unit, setUnit] = useState<'share' | 'lot'>('share')

  // ─── Queries ───

  // 取得所有股票（從聚合文件，1 read）
  const { data: stocks = [] } = useQuery({
    queryKey: ['stocks'],
    queryFn: async () => {
      const configDoc = await getDoc(doc(db, 'config', 'currentStockPrices'))
      if (!configDoc.exists()) return []
      const data = configDoc.data() as CurrentStockPrices
      return Object.entries(data.stocks).map(([id, entry]) => ({
        id,
        symbol: entry.symbol,
        name: entry.name,
        country: 'TW',
        currentPrice: entry.price,
        previousClose: entry.prevClose,
        change: entry.change,
        changePercent: entry.changePercent,
        isIndex: entry.isIndex,
        isActive: true,
        updatedAt: data.updatedAt,
      })) as (Stock & { id: string })[]
    },
  })

  // 取得使用者持倉
  const { data: holdings = [] } = useQuery({
    queryKey: ['stockHoldings', authUser?.uid],
    queryFn: async () => {
      if (!authUser?.uid) return []
      const snapshot = await getDocs(collection(db, 'users', authUser.uid, 'stockHoldings'))
      return snapshot.docs.map((d) => ({ id: d.id, ...d.data() })) as (StockHolding & { id: string })[]
    },
    enabled: !!authUser?.uid,
  })

  // 取得賣出交易紀錄（已實現損益分頁）
  const { data: sellTransactions = [] } = useQuery({
    queryKey: ['stockTransactions', authUser?.uid],
    queryFn: async () => {
      if (!authUser?.uid) return []
      const q = query(
        collection(db, 'users', authUser.uid, 'stockTransactions'),
        orderBy('createdAt', 'desc'),
      )
      const snapshot = await getDocs(q)
      return snapshot.docs
        .map((d) => ({ id: d.id, ...d.data() }) as StockTransaction & { id: string })
        .filter((t) => t.type === 'sell')
    },
    enabled: !!authUser?.uid,
  })

  // 取得選中股票的歷史價格（走勢圖用）
  const { data: priceHistory = [] } = useQuery({
    queryKey: ['stockPriceHistory', selectedStock?.id],
    queryFn: async () => {
      if (!selectedStock) return []
      const stockDoc = await getDoc(doc(db, 'stocks', selectedStock.id))
      if (!stockDoc.exists()) return []
      const history = stockDoc.data().priceHistory || {}
      return Object.entries(history as Record<string, number>)
        .sort(([a], [b]) => a.localeCompare(b))
        .slice(-7)
        .map(([date, price]) => ({ date: date.slice(5), price }))
    },
    enabled: !!selectedStock && activeTab === 'buy',
  })

  // ─── Mutations ───

  const invalidateAll = () => {
    queryClient.invalidateQueries({ queryKey: ['user'] })
    queryClient.invalidateQueries({ queryKey: ['stockHoldings'] })
    queryClient.invalidateQueries({ queryKey: ['stocks'] })
    queryClient.invalidateQueries({ queryKey: ['stockTransactions'] })
  }

  const buyMutation = useMutation({
    mutationFn: async ({ stockId, qty }: { stockId: string; qty: number }) => {
      const fn = httpsCallable<{ stockId: string; quantity: number }, { success: boolean }>(functions, 'buyStock')
      return (await fn({ stockId, quantity: qty })).data
    },
    onSuccess: () => { invalidateAll(); setQuantity(100) },
  })

  const sellMutation = useMutation({
    mutationFn: async ({ stockId, qty }: { stockId: string; qty: number }) => {
      const fn = httpsCallable<{ stockId: string; quantity: number }, { success: boolean }>(functions, 'sellStock')
      return (await fn({ stockId, quantity: qty })).data
    },
    onSuccess: () => { invalidateAll(); setQuantity(100) },
  })

  // ─── Computed ───

  const getHolding = (stockId: string) => holdings.find((h) => h.id === stockId)

  const unrealizedPnL = holdings.reduce((total, h) => {
    const s = stocks.find((st) => st.id === h.id)
    return s ? total + (s.currentPrice - h.averageCost) * h.quantity : total
  }, 0)
  const totalPnL = (user?.realizedPnL || 0) + unrealizedPnL

  const selectedHolding = selectedStock ? getHolding(selectedStock.id) : null
  const actualShares = unit === 'lot' ? quantity * 1000 : quantity
  const maxSellShares = selectedHolding?.quantity || 0
  const insufficientCash = selectedStock
    ? actualShares * selectedStock.currentPrice > (user?.coins || 0)
    : false
  const insufficientStock = actualShares > maxSellShares

  // 可交易股票（排除指數）
  const tradeableStocks = stocks.filter((s) => !s.isIndex)

  // ─── Handlers ───

  const handleSelectStock = (stock: Stock & { id: string }) => {
    setSelectedStock(stock)
    setQuantity(100)
    setUnit('share')
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
        {/* ═══ 頂部資產儀表板 / 分頁切換器 ═══ */}
        <div className="mb-6 rounded-[16px] border border-[#F0E6D8] bg-white p-4 shadow-[0_2px_8px_rgba(0,0,0,0.08)]">
          <div className="grid grid-cols-5 gap-3">
            {/* 股票總資產 */}
            <div className="p-2">
              <p className="text-xs text-text-tertiary">股票總資產</p>
              <p className="font-mono-number text-lg font-bold text-text-primary">
                ${formatCoin(user?.totalStockValue ?? 0)}
              </p>
            </div>

            {/* 已實現損益（點擊切換分頁） */}
            <button
              onClick={() => setActiveTab('realized')}
              className={`rounded-[8px] p-2 text-left transition-colors hover:bg-gray-50 ${
                activeTab === 'realized' ? 'border-b-3 border-teal' : ''
              }`}
            >
              <p className="text-xs text-text-tertiary">已實現損益</p>
              <p className={`font-mono-number text-lg font-bold ${pnlColor(user?.realizedPnL || 0)}`}>
                {pnlSign(user?.realizedPnL || 0)}{formatCoin(user?.realizedPnL || 0)}
              </p>
            </button>

            {/* 未實現損益（點擊切換分頁） */}
            <button
              onClick={() => setActiveTab('unrealized')}
              className={`rounded-[8px] p-2 text-left transition-colors hover:bg-gray-50 ${
                activeTab === 'unrealized' ? 'border-b-3 border-teal' : ''
              }`}
            >
              <p className="text-xs text-text-tertiary">未實現損益</p>
              <p className={`font-mono-number text-lg font-bold ${pnlColor(unrealizedPnL)}`}>
                {pnlSign(unrealizedPnL)}{formatCoin(unrealizedPnL)}
              </p>
            </button>

            {/* 總損益 */}
            <div className="p-2">
              <p className="text-xs text-text-tertiary">總損益</p>
              <p className={`font-mono-number text-lg font-bold ${pnlColor(totalPnL)}`}>
                {pnlSign(totalPnL)}{formatCoin(totalPnL)}
              </p>
            </div>

            {/* 可用現金 */}
            <div className="p-2">
              <p className="text-xs text-text-tertiary">可用現金</p>
              <p className="flex items-center gap-1 font-mono-number text-lg font-bold text-text-primary">
                <CoinIcon size={16} /> {formatCoin(user?.coins ?? 0)}
              </p>
            </div>
          </div>
        </div>

        {/* ═══ Tab 2/3 回到買賣按鈕 ═══ */}
        {activeTab !== 'buy' && (
          <div className="mb-4 flex justify-end">
            <button
              onClick={() => setActiveTab('buy')}
              className="rounded-[8px] bg-invest-orange px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-invest-orange/90"
            >
              買賣股票 →
            </button>
          </div>
        )}

        {/* ═══ Tab 1：買賣股票 ═══ */}
        {activeTab === 'buy' && (
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-5">
            {/* 左側：股票列表 */}
            <div className="lg:col-span-3">
              <div className="overflow-hidden rounded-[16px] border border-[#F0E6D8] bg-white shadow-[0_2px_8px_rgba(0,0,0,0.08)]">
                <div className="grid grid-cols-5 bg-invest-orange px-4 py-3 text-sm font-medium text-white">
                  <div className="col-span-2">商品名稱</div>
                  <div className="text-right">成交價</div>
                  <div className="text-right">漲跌</div>
                  <div className="text-right">幅度</div>
                </div>

                {tradeableStocks.length === 0 ? (
                  <div className="px-4 py-8 text-center text-text-secondary">尚無股票資料</div>
                ) : (
                  <div className="max-h-[600px] divide-y divide-[#F0E6D8] overflow-y-auto">
                    {tradeableStocks.map((stock) => {
                      const holding = getHolding(stock.id)
                      const isUp = stock.change >= 0
                      const isSelected = selectedStock?.id === stock.id

                      return (
                        <button
                          key={stock.id}
                          onClick={() => handleSelectStock(stock)}
                          className={`grid w-full grid-cols-5 items-center px-4 py-3 text-left text-sm transition-colors hover:bg-gray-50 ${
                            isSelected ? 'border-l-3 border-invest-orange bg-invest-orange/5' : ''
                          }`}
                        >
                          <div className="col-span-2">
                            <p className="font-medium text-text-primary">
                              {stock.name}
                              {holding && (
                                <span className="ml-2 text-xs text-invest-orange">
                                  持有 {holding.quantity} 股
                                </span>
                              )}
                            </p>
                            <p className="text-xs text-text-tertiary">{stock.symbol}</p>
                          </div>
                          <div className="text-right font-mono-number font-medium text-text-primary">
                            {formatCoin(stock.currentPrice)}
                          </div>
                          <div className={`text-right font-mono-number ${isUp ? 'text-loss-red' : 'text-gain-green'}`}>
                            {isUp ? '▲' : '▼'} {Math.abs(stock.change).toFixed(2)}
                          </div>
                          <div className={`text-right font-mono-number ${isUp ? 'text-loss-red' : 'text-gain-green'}`}>
                            {isUp ? '+' : ''}{stock.changePercent.toFixed(2)}%
                          </div>
                        </button>
                      )
                    })}
                  </div>
                )}
              </div>
            </div>

            {/* 右側：交易面板 */}
            <div className="lg:col-span-2">
              {selectedStock ? (
                <div className="space-y-4 rounded-[16px] border border-[#F0E6D8] bg-white p-5 shadow-[0_2px_8px_rgba(0,0,0,0.08)]">
                  {/* 股票資訊 */}
                  <div>
                    <p className="text-sm text-text-tertiary">{selectedStock.symbol}</p>
                    <p className={`font-mono-number text-3xl font-bold ${
                      selectedStock.change >= 0 ? 'text-loss-red' : 'text-gain-green'
                    }`}>
                      ${formatCoin(selectedStock.currentPrice)}
                    </p>
                    <p className={`font-mono-number text-sm ${
                      selectedStock.change >= 0 ? 'text-loss-red' : 'text-gain-green'
                    }`}>
                      {selectedStock.change >= 0 ? '▲' : '▼'} {Math.abs(selectedStock.change).toFixed(2)}
                      {' '}({selectedStock.change >= 0 ? '+' : ''}{selectedStock.changePercent.toFixed(2)}%)
                    </p>
                  </div>

                  {/* 走勢圖 */}
                  {priceHistory.length > 0 ? (
                    <div className="rounded-[12px] bg-gray-50 p-3">
                      <p className="mb-2 text-xs text-text-tertiary">近期走勢</p>
                      <ResponsiveContainer width="100%" height={120}>
                        <LineChart data={priceHistory}>
                          <XAxis dataKey="date" tick={{ fontSize: 10 }} />
                          <YAxis domain={['auto', 'auto']} tick={{ fontSize: 10 }} width={50} />
                          <RechartsTooltip />
                          <Line type="monotone" dataKey="price" stroke="#F59E0B" strokeWidth={2} dot={false} />
                        </LineChart>
                      </ResponsiveContainer>
                    </div>
                  ) : (
                    <div className="rounded-[12px] bg-gray-50 p-4 text-center text-xs text-text-tertiary">
                      暫無走勢資料
                    </div>
                  )}

                  {/* 持倉資訊 */}
                  {selectedHolding && (
                    <div className="space-y-2 rounded-[12px] bg-gray-50 p-4">
                      <div className="flex justify-between text-sm">
                        <span className="text-text-secondary">持有數量</span>
                        <span className="font-mono-number">{selectedHolding.quantity} 股</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-text-secondary">平均成本</span>
                        <span className="font-mono-number">${formatCoin(selectedHolding.averageCost)}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-text-secondary">未實現損益</span>
                        {(() => {
                          const pnl = (selectedStock.currentPrice - selectedHolding.averageCost) * selectedHolding.quantity
                          return <span className={`font-mono-number font-medium ${pnlColor(pnl)}`}>{pnlSign(pnl)}{formatCoin(pnl)}</span>
                        })()}
                      </div>
                    </div>
                  )}

                  {/* 非交易時段提示 */}
                  {!canTrade && (
                    <div className="rounded-[8px] bg-amber-50 border border-amber-200 px-4 py-3 text-center text-sm text-amber-700">
                      目前非交易時段，交易時間為 16:00-21:00
                    </div>
                  )}

                  {/* 交易操作區 */}
                  <div className={!canTrade ? 'pointer-events-none opacity-50' : ''}>
                    <div className="mb-2 flex items-center justify-between">
                      <label className="text-sm text-text-secondary">交易數量</label>
                      {/* 股/張切換 */}
                      <div className="flex overflow-hidden rounded-[8px] border border-gray-300 text-xs">
                        <button
                          onClick={() => { setUnit('share'); setQuantity(100) }}
                          disabled={!canTrade}
                          className={`px-3 py-1 ${unit === 'share' ? 'bg-invest-orange text-white' : 'text-text-secondary'}`}
                        >股</button>
                        <button
                          onClick={() => { setUnit('lot'); setQuantity(1) }}
                          disabled={!canTrade}
                          className={`px-3 py-1 ${unit === 'lot' ? 'bg-invest-orange text-white' : 'text-text-secondary'}`}
                        >張</button>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <button
                        onClick={() => setQuantity(Math.max(unit === 'lot' ? 1 : 100, quantity - (unit === 'lot' ? 1 : 100)))}
                        disabled={!canTrade}
                        className="flex h-10 w-10 items-center justify-center rounded-full border border-gray-300 text-xl"
                      >−</button>
                      <input
                        type="number"
                        value={quantity}
                        onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value) || 1))}
                        disabled={!canTrade}
                        className="w-24 rounded-[8px] border border-gray-300 px-3 py-2 text-center font-mono-number"
                      />
                      <button
                        onClick={() => setQuantity(quantity + (unit === 'lot' ? 1 : 100))}
                        disabled={!canTrade}
                        className="flex h-10 w-10 items-center justify-center rounded-full border border-gray-300 text-xl"
                      >+</button>
                    </div>
                    <p className="mt-2 text-xs text-text-tertiary">
                      {unit === 'lot' && `${quantity} 張 = ${actualShares} 股 · `}
                      預估金額：${formatCoin(selectedStock.currentPrice * actualShares)}
                    </p>
                  </div>

                  {/* 現金不足 / 持股不足提示 */}
                  {canTrade && insufficientCash && quantity > 0 && (
                    <p className="text-center text-sm text-loss-red">
                      現金不足！需要 ${formatCoin(selectedStock.currentPrice * actualShares)}，目前僅有 ${formatCoin(user?.coins ?? 0)}
                    </p>
                  )}
                  {canTrade && insufficientStock && quantity > 0 && maxSellShares > 0 && (
                    <p className="text-center text-sm text-gain-green">
                      持股不足！目前僅持有 {maxSellShares} 股
                    </p>
                  )}

                  {/* 買賣按鈕（台股慣例：買進紅色、賣出綠色） */}
                  <div className="flex gap-3">
                    <button
                      onClick={() => buyMutation.mutate({ stockId: selectedStock.id, qty: actualShares })}
                      disabled={!canTrade || buyMutation.isPending || insufficientCash || actualShares <= 0}
                      className="flex-1 rounded-[8px] bg-loss-red py-3 font-medium text-white disabled:opacity-50"
                    >
                      {buyMutation.isPending ? '處理中...' : '買進'}
                    </button>
                    <button
                      onClick={() => sellMutation.mutate({ stockId: selectedStock.id, qty: actualShares })}
                      disabled={!canTrade || sellMutation.isPending || insufficientStock || actualShares <= 0}
                      className="flex-1 rounded-[8px] bg-gain-green py-3 font-medium text-white disabled:opacity-50"
                    >
                      {sellMutation.isPending ? '處理中...' : '賣出'}
                    </button>
                  </div>
                </div>
              ) : (
                <div className="flex h-64 items-center justify-center rounded-[16px] border border-[#F0E6D8] bg-white shadow-[0_2px_8px_rgba(0,0,0,0.08)]">
                  <p className="text-text-tertiary">← 請選擇股票</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ═══ Tab 2：未實現損益 ═══ */}
        {activeTab === 'unrealized' && (
          <div className="overflow-hidden rounded-[16px] border border-[#F0E6D8] bg-white shadow-[0_2px_8px_rgba(0,0,0,0.08)]">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-invest-orange text-white">
                    <th className="px-4 py-3 text-left font-medium">股票名稱</th>
                    <th className="px-4 py-3 text-right font-medium">庫存股數</th>
                    <th className="px-4 py-3 text-right font-medium">平均成本</th>
                    <th className="px-4 py-3 text-right font-medium">現在價格</th>
                    <th className="px-4 py-3 text-right font-medium">參考市值</th>
                    <th className="px-4 py-3 text-right font-medium">未實現損益</th>
                    <th className="px-4 py-3 text-right font-medium">報酬率</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#F0E6D8]">
                  {holdings.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="px-4 py-8 text-center text-text-secondary">尚無持倉</td>
                    </tr>
                  ) : (
                    holdings.map((holding) => {
                      const stock = stocks.find((s) => s.id === holding.id)
                      const currentPrice = stock?.currentPrice || holding.currentPrice
                      const marketValue = holding.quantity * currentPrice
                      const pnl = (currentPrice - holding.averageCost) * holding.quantity
                      const returnRate = holding.averageCost > 0
                        ? (pnl / (holding.averageCost * holding.quantity)) * 100
                        : 0

                      return (
                        <tr key={holding.id}>
                          <td className="px-4 py-3">
                            <p className="font-medium text-text-primary">{holding.stockName}</p>
                            <p className="text-xs text-text-tertiary">{holding.stockId}</p>
                          </td>
                          <td className="px-4 py-3 text-right font-mono-number">{holding.quantity}</td>
                          <td className="px-4 py-3 text-right font-mono-number">{formatCoin(holding.averageCost)}</td>
                          <td className="px-4 py-3 text-right font-mono-number">{formatCoin(currentPrice)}</td>
                          <td className="px-4 py-3 text-right font-mono-number">{formatCoin(marketValue)}</td>
                          <td className={`px-4 py-3 text-right font-mono-number font-medium ${pnlColor(pnl)}`}>
                            {pnlSign(pnl)}{formatCoin(pnl)}
                          </td>
                          <td className={`px-4 py-3 text-right font-mono-number font-medium ${pnlColor(returnRate)}`}>
                            {pnlSign(returnRate)}{returnRate.toFixed(2)}%
                          </td>
                        </tr>
                      )
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ═══ Tab 3：已實現損益 ═══ */}
        {activeTab === 'realized' && (
          <div className="overflow-hidden rounded-[16px] border border-[#F0E6D8] bg-white shadow-[0_2px_8px_rgba(0,0,0,0.08)]">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-invest-orange text-white">
                    <th className="px-4 py-3 text-left font-medium">時間</th>
                    <th className="px-4 py-3 text-left font-medium">股票名稱</th>
                    <th className="px-4 py-3 text-right font-medium">交易股數</th>
                    <th className="px-4 py-3 text-right font-medium">買入單價</th>
                    <th className="px-4 py-3 text-right font-medium">賣出單價</th>
                    <th className="px-4 py-3 text-right font-medium">損益金額</th>
                    <th className="px-4 py-3 text-right font-medium">報酬率</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#F0E6D8]">
                  {sellTransactions.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="px-4 py-8 text-center text-text-secondary">尚無已實現損益紀錄</td>
                    </tr>
                  ) : (
                    sellTransactions.map((tx) => {
                      const realized = tx.realizedPnL || 0
                      // 推算買入均價：avgCost = sellPrice - (realizedPnL / quantity)
                      const buyPrice = tx.price - realized / tx.quantity
                      const returnRate = buyPrice > 0
                        ? (realized / (buyPrice * tx.quantity)) * 100
                        : 0

                      return (
                        <tr key={tx.id}>
                          <td className="px-4 py-3 text-text-secondary">
                            {tx.createdAt?.toDate?.()
                              ? tx.createdAt.toDate().toLocaleDateString('zh-TW')
                              : '-'}
                          </td>
                          <td className="px-4 py-3 font-medium text-text-primary">{tx.stockName}</td>
                          <td className="px-4 py-3 text-right font-mono-number">{tx.quantity}</td>
                          <td className="px-4 py-3 text-right font-mono-number">{formatCoin(buyPrice)}</td>
                          <td className="px-4 py-3 text-right font-mono-number">{formatCoin(tx.price)}</td>
                          <td className={`px-4 py-3 text-right font-mono-number font-medium ${pnlColor(realized)}`}>
                            {pnlSign(realized)}{formatCoin(realized)}
                          </td>
                          <td className={`px-4 py-3 text-right font-mono-number font-medium ${pnlColor(returnRate)}`}>
                            {pnlSign(returnRate)}{returnRate.toFixed(2)}%
                          </td>
                        </tr>
                      )
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </main>
    </div>
  )
}
