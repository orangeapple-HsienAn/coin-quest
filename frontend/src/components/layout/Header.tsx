import { Link } from 'react-router'
import { useAuth } from '@/hooks/useAuth'
import { signOut } from '@/lib/auth'
import { formatCoin } from '@/lib/utils'
import { CoinIcon } from '@/components/icons/CoinIcon'

interface HeaderProps {
  experience?: number
  coins?: number
  displayName?: string
  /** 傳入返回路徑時，左側顯示返回按鈕取代 Logo */
  backTo?: string
}

/**
 * 頁面頂部 Header（統一資訊列）
 * 包含 返回按鈕/Logo、經驗值、金幣數量、個人頭像
 */
export function Header({ experience = 0, coins = 0, displayName = '玩家', backTo }: HeaderProps) {
  const { user } = useAuth()

  const handleSignOut = async () => {
    await signOut()
  }

  return (
    <header className="h-[60px] bg-primary px-6">
      <div className="mx-auto flex h-full max-w-[1200px] items-center justify-between">
        {/* 左側：返回按鈕或 Logo */}
        {backTo ? (
          <Link to={backTo} className="flex items-center gap-2 text-white hover:text-white/80">
            <span className="text-lg">←</span>
            <span className="text-sm font-medium">返回</span>
          </Link>
        ) : (
          <Link to="/" className="flex items-center gap-2">
            <span className="text-xl font-bold text-white">橘子蘋果</span>
          </Link>
        )}

        {/* 右側資訊 */}
        <div className="flex items-center gap-6">
          {/* 經驗值 */}
          <div className="flex items-center gap-1 rounded-full bg-white/20 px-3 py-1">
            <span className="text-sm">⚡</span>
            <span className="font-mono-number text-sm font-medium text-white">
              {formatCoin(experience)}
            </span>
          </div>

          {/* 金幣 */}
          <div className="flex items-center gap-1 rounded-full bg-white/20 px-3 py-1">
            <CoinIcon size={16} />
            <span className="font-mono-number text-sm font-medium text-white">
              {formatCoin(coins)}
            </span>
          </div>

          {/* 使用者資訊 */}
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-white/30">
              <span className="text-sm">👤</span>
            </div>
            <span className="text-sm font-medium text-white">
              {user?.displayName || displayName}
            </span>
            <button
              onClick={handleSignOut}
              className="ml-2 text-xs text-white/70 hover:text-white"
            >
              登出
            </button>
          </div>
        </div>
      </div>
    </header>
  )
}
