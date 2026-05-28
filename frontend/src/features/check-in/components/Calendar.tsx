import { useMemo } from 'react'
import { CoinIcon } from '@/components/icons/CoinIcon'
import { tUI } from '@/lib/uiStrings'
import { FORCED_LANGUAGE } from '@/lib/forcedLanguage'

interface CalendarProps {
  year: number
  month: number
  checkedDates: string[]
  todayDate: string
  onCheckIn: () => void
  canCheckIn: boolean
  isCheckingIn: boolean
}

const WEEKDAYS_ZH = ['一', '二', '三', '四', '五', '六', '日']
const WEEKDAYS_JA = ['月', '火', '水', '木', '金', '土', '日']
const WEEKDAYS = FORCED_LANGUAGE === 'ja' ? WEEKDAYS_JA : WEEKDAYS_ZH

/**
 * 簽到日曆元件
 * 視覺狀態：已簽到（淺綠+金幣+打勾）、今日未簽到（橘紅爆炸貼紙）、未來日期（僅數字）
 */
export function Calendar({
  year,
  month,
  checkedDates,
  todayDate,
  onCheckIn,
  canCheckIn,
  isCheckingIn,
}: CalendarProps) {
  // 計算該月的日期格子
  const calendarDays = useMemo(() => {
    const firstDay = new Date(year, month - 1, 1)
    const lastDay = new Date(year, month, 0)
    const daysInMonth = lastDay.getDate()

    // 星期一 = 0, 星期日 = 6
    let startWeekday = firstDay.getDay() - 1
    if (startWeekday < 0) startWeekday = 6

    const days: (number | null)[] = []

    // 填充月初空白
    for (let i = 0; i < startWeekday; i++) {
      days.push(null)
    }

    // 填充日期
    for (let i = 1; i <= daysInMonth; i++) {
      days.push(i)
    }

    return days
  }, [year, month])

  // 檢查某天是否已簽到
  const isChecked = (day: number) => {
    const dateStr = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`
    return checkedDates.includes(dateStr)
  }

  // 檢查是否為今天
  const isToday = (day: number) => {
    const dateStr = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`
    return dateStr === todayDate
  }

  // 判斷是否為未來日期
  const isFuture = (day: number) => {
    const dateStr = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`
    return dateStr > todayDate
  }

  return (
    <div className="rounded-[16px] border border-[#F0E6D8] bg-white p-5 shadow-[0_2px_8px_rgba(0,0,0,0.08)]">
      {/* 月份標題 */}
      <h3 className="mb-3 text-center text-lg font-bold text-text-primary">
        {FORCED_LANGUAGE === 'ja' ? `${year}年 ${month}月` : `${year} 年 ${month} 月`}
      </h3>

      {/* 星期標題 */}
      <div className="mb-2 grid grid-cols-7 gap-1">
        {WEEKDAYS.map((day) => (
          <div
            key={day}
            className="py-2 text-center text-sm font-medium text-text-secondary"
          >
            {day}
          </div>
        ))}
      </div>

      {/* 日期格子 */}
      <div className="grid grid-cols-7 gap-1">
        {calendarDays.map((day, index) => {
          if (day === null) return <div key={index} />

          const checked = isChecked(day)
          const today = isToday(day)
          const future = isFuture(day)

          // 今日已簽到
          if (today && !canCheckIn) {
            return (
              <div
                key={index}
                className="relative flex h-14 flex-col items-center justify-center rounded-[8px] bg-green-100"
              >
                <CoinIcon size={14} />
                <span className="text-xs font-medium text-teal">{day}</span>
                <span className="absolute right-1 top-1 text-[10px] text-teal">✓</span>
              </div>
            )
          }

          // 今日未簽到：橘紅爆炸貼紙風格
          if (today && canCheckIn) {
            return (
              <button
                key={index}
                onClick={onCheckIn}
                disabled={isCheckingIn}
                className="relative flex h-14 items-center justify-center rounded-[8px] bg-coral text-sm font-bold text-white shadow-[0_2px_8px_rgba(255,107,107,0.4)] transition-transform hover:scale-105 disabled:opacity-50"
              >
                {isCheckingIn ? '...' : tUI('簽到')}
              </button>
            )
          }

          // 已簽到（非今天）：淺綠+金幣+打勾
          if (checked) {
            return (
              <div
                key={index}
                className="relative flex h-14 flex-col items-center justify-center rounded-[8px] bg-green-100"
              >
                <CoinIcon size={14} />
                <span className="text-xs font-medium text-teal">{day}</span>
                <span className="absolute right-1 top-1 text-[10px] text-teal">✓</span>
              </div>
            )
          }

          // 未來日期或過去未簽到：僅顯示數字
          return (
            <div
              key={index}
              className={`flex h-14 items-center justify-center rounded-[8px] ${
                future ? 'bg-gray-50' : 'bg-gray-50'
              }`}
            >
              <span className={`text-sm ${future ? 'text-text-tertiary' : 'text-text-secondary'}`}>
                {day}
              </span>
            </div>
          )
        })}
      </div>
    </div>
  )
}
