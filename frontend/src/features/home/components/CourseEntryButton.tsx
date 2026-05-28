import { Link } from 'react-router'
import { tUI } from '@/lib/uiStrings'

/**
 * 進入課程按鈕
 */
export function CourseEntryButton() {
  return (
    <Link
      to="/course"
      className="flex items-center justify-center gap-4 rounded-[16px] border-[3px] border-coral bg-[#FFEEE8] px-6 py-8 transition-shadow hover:shadow-[0_4px_16px_rgba(0,0,0,0.12)]"
    >
      {/* 吉祥物圖示（暫用 emoji） */}
      <div className="flex h-16 w-16 items-center justify-center rounded-full bg-white">
        <span className="text-3xl">🦥</span>
      </div>

      <span className="text-2xl font-bold text-coral">{tUI('進入課程')}</span>
    </Link>
  )
}
