import { formatCoin } from '@/lib/utils'
import { CoinIcon } from '@/components/icons/CoinIcon'

interface LevelProgressProps {
  currentLevel: number
  currentLevelName: string
  currentSalary: number
  nextLevel: number
  nextLevelName: string
  nextSalary: number
  currentExp: number
  requiredExp: number
}

/**
 * 等級進度條元件
 */
export function LevelProgress({
  currentLevel,
  currentLevelName,
  currentSalary,
  nextLevel,
  nextLevelName,
  nextSalary,
  currentExp,
  requiredExp,
}: LevelProgressProps) {
  const progress = requiredExp > 0 ? Math.min((currentExp / requiredExp) * 100, 100) : 0

  return (
    <div className="rounded-[16px] border border-[#F0E6D8] bg-white p-5 shadow-[0_2px_8px_rgba(0,0,0,0.08)]">
      <div className="flex items-center justify-between">
        {/* 當前等級 */}
        <div className="text-center">
          <span className="inline-block rounded-full bg-level-current px-3 py-1 text-xs font-medium text-white">
            目前等級：{currentLevel}
          </span>
          <div className="mt-2">
            <p className="text-sm font-medium text-text-primary">🎖️ {currentLevelName}</p>
            <p className="flex items-center justify-center gap-1 text-xs text-text-secondary">
              <CoinIcon size={12} /> 日薪 {formatCoin(currentSalary)}
            </p>
          </div>
        </div>

        {/* 經驗進度條 */}
        <div className="mx-6 flex-1">
          <div className="mb-1 flex justify-between text-xs text-text-tertiary">
            <span>{formatCoin(currentExp)}</span>
            <span>{formatCoin(requiredExp)}</span>
          </div>
          <div className="h-4 overflow-hidden rounded-full bg-exp-bar-bg">
            <div
              className="flex h-full items-center justify-end rounded-full bg-exp-bar-fill pr-2 transition-all duration-300"
              style={{ width: `${progress}%` }}
            >
              {progress > 10 && <span className="text-xs text-white">⚡ 經驗</span>}
            </div>
          </div>
        </div>

        {/* 下一等級 */}
        <div className="text-center">
          <span className="inline-block rounded-full bg-level-next px-3 py-1 text-xs font-medium text-white">
            下一等級：{nextLevel}
          </span>
          <div className="mt-2">
            <p className="text-sm font-medium text-text-primary">🎖️ {nextLevelName}</p>
            <p className="flex items-center justify-center gap-1 text-xs text-text-secondary">
              <CoinIcon size={12} /> 日薪 {formatCoin(nextSalary)}
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
