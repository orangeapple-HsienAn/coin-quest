import { Link } from 'react-router'
import { PieChart, Pie, Cell, ResponsiveContainer } from 'recharts'
import type { PieLabelRenderProps } from 'recharts'
import { Coins, TrendingUp, PiggyBank, ShieldCheck } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { formatCoin } from '@/lib/utils'

interface AssetOverviewProps {
  totalAssets: number
  rank: number
  cash: number
  investment: number
  savings: number
  insuranceCount: number
}

/**
 * 資產總覽區塊
 * 風格：溫馨、遊戲化、馬卡龍色系
 */
export function AssetOverview({
  totalAssets,
  rank,
  cash,
  investment,
  savings,
  insuranceCount,
}: AssetOverviewProps) {
  // 半圓形圓餅圖資料（只包含數值大於 0 的項目）
  const allChartData = [
    { name: '可用現金', value: cash, color: '#1BC49F' },
    { name: '投資理財', value: investment, color: '#FFBD4A' },
    { name: '銀行儲蓄', value: savings, color: '#FF7E6B' },
  ]
  const chartData = allChartData.filter((item) => item.value > 0)

  // 計算百分比
  const total = cash + investment + savings
  const getPercent = (value: number) =>
    total > 0 ? Math.round((value / total) * 100) : 0

  // 半圓形圖表的標籤渲染（白色文字壓在色塊上，數值為 0 不顯示）
  const renderLabel = (props: PieLabelRenderProps) => {
    const { cx, cy, midAngle, innerRadius, outerRadius, name, value } = props

    // 數值為 0 時不顯示標籤
    if (Number(value) === 0) return null

    if (
      typeof cx !== 'number' ||
      typeof cy !== 'number' ||
      typeof midAngle !== 'number' ||
      typeof innerRadius !== 'number' ||
      typeof outerRadius !== 'number'
    ) {
      return null
    }

    const RADIAN = Math.PI / 180
    const radius = innerRadius + (outerRadius - innerRadius) * 0.5
    const x = cx + radius * Math.cos(-midAngle * RADIAN)
    const y = cy + radius * Math.sin(-midAngle * RADIAN)

    return (
      <text
        x={x}
        y={y}
        textAnchor="middle"
        dominantBaseline="central"
        fill="#FFFFFF"
        fontSize={11}
        fontWeight={500}
      >
        <tspan x={x} dy="-0.4em">{String(name)}</tspan>
        <tspan x={x} dy="1.2em">{getPercent(Number(value))}%</tspan>
      </text>
    )
  }

  return (
    <div className="space-y-4">
      {/* 頂部資訊欄：資產總額與排名（2:1 比例） */}
      <div className="flex gap-4">
        {/* 資產總額 - 黃色大卡片 */}
        <div className="flex-[2] rounded-[24px] bg-[#FCD667] p-5 relative shadow-[0_4px_6px_-1px_rgba(0,0,0,0.05)] transition-transform hover:scale-[1.02] cursor-pointer">
          <div className="flex flex-col h-full justify-between">
            <span className="text-[#8B5E00] font-bold text-sm bg-white/30 px-3 py-1 rounded-full w-max backdrop-blur-sm">
              資產總額
            </span>
            <div className="mt-4">
              <span className="text-3xl font-extrabold text-text-primary tracking-tight block">
                $ {formatCoin(totalAssets)}
              </span>
            </div>
          </div>
        </div>

        {/* 排名 - 橘色小卡片 */}
        <Link
          to="/ranking"
          className="flex-[1] rounded-[24px] bg-[#FFAD60] p-4 flex flex-col items-center justify-center text-center shadow-[0_4px_6px_-1px_rgba(0,0,0,0.05)] transition-transform hover:scale-[1.02]"
        >
          <span className="text-white text-sm font-bold opacity-90 mb-1">排名</span>
          <span className="text-4xl font-black text-white drop-shadow-sm">{rank}</span>
        </Link>
      </div>

      {/* 圓餅圖 + 快捷入口列表 - 同一個 Card */}
      <div className="rounded-[24px] border-2 border-[#FCD667] bg-white p-4 shadow-sm">
        {/* 半圓形圓餅圖 */}
        <div className="h-[160px]">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={chartData}
                cx="50%"
                cy="100%"
                startAngle={180}
                endAngle={0}
                innerRadius={60}
                outerRadius={120}
                paddingAngle={3}
                dataKey="value"
                label={renderLabel}
                labelLine={false}
                stroke="#FFFFFF"
                strokeWidth={5}
              >
                {chartData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* 快捷入口列表 */}
        <div className="mt-4 space-y-3">
          <AssetLink
            to="/cash"
            icon={Coins}
            label="可用現金"
            value={cash}
            color="#1BC49F"
          />
          <AssetLink
            to="/stock"
            icon={TrendingUp}
            label="投資理財"
            value={investment}
            color="#FFBD4A"
          />
          <AssetLink
            to="/savings"
            icon={PiggyBank}
            label="銀行儲蓄"
            value={savings}
            color="#FF7E6B"
          />
          <AssetLink
            to="/insurance"
            icon={ShieldCheck}
            label="持有保險"
            value={insuranceCount}
            unit="張"
            color="#9CA3AF"
          />
        </div>
      </div>
    </div>
  )
}

interface AssetLinkProps {
  to: string
  icon: LucideIcon
  label: string
  value: number
  unit?: string
  color: string
}

/**
 * 資產連結項目
 * 樣式：白色背景 + 彩色邊框 + hover 效果
 */
function AssetLink({
  to,
  icon: Icon,
  label,
  value,
  unit = '',
  color,
}: AssetLinkProps) {
  return (
    <Link
      to={to}
      className="group flex items-center justify-between rounded-2xl border-2 bg-white p-3 shadow-sm transition-all hover:shadow-md"
      style={{ borderColor: color }}
    >
      <div className="flex items-center gap-3">
        {/* 圓形圖示背景 */}
        <div
          className="flex h-10 w-10 items-center justify-center rounded-full"
          style={{ backgroundColor: `${color}15` }}
        >
          <Icon className="h-5 w-5" style={{ color }} />
        </div>
        <div>
          <div className="text-sm font-bold text-text-primary">{label}</div>
          <div className="text-base font-extrabold" style={{ color }}>
            {unit ? `${value} ${unit}` : `$ ${formatCoin(value)}`}
          </div>
        </div>
      </div>
      {/* 右側箭頭 */}
      <div
        className="flex h-8 w-8 items-center justify-center rounded-full bg-gray-50 text-gray-400 transition-colors group-hover:text-white"
        onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = color)}
        onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = '')}
      >
        <TrendingUp className="h-3 w-3" />
      </div>
    </Link>
  )
}
