import { Link } from 'react-router'
import { formatCoin } from '@/lib/utils'
import { CoinIcon } from '@/components/icons/CoinIcon'
import { tUI } from '@/lib/uiStrings'

interface CheckInButtonProps {
  dailySalary: number
  hasCheckedIn?: boolean
}

/**
 * 簽到按鈕
 */
export function CheckInButton({ dailySalary, hasCheckedIn = false }: CheckInButtonProps) {
  return (
    <Link
      to="/check-in"
      className={`flex items-center justify-between rounded-[12px] border-[3px] px-5 py-4 transition-shadow hover:shadow-[0_4px_16px_rgba(0,0,0,0.12)] ${
        hasCheckedIn ? 'border-teal bg-teal' : 'border-coral bg-coral'
      }`}
    >
      <div className="flex items-center gap-2">
        <span className="text-lg">✅</span>
        <span className="font-medium text-white">
          {hasCheckedIn ? tUI('已簽到') : tUI('簽到')}
        </span>
      </div>

      <div className="flex items-center gap-2">
        <span className="flex items-center gap-1 text-sm text-white">
          <CoinIcon size={14} /> {tUI('日薪')} {formatCoin(dailySalary)}
        </span>
        <span className="text-white">↗</span>
      </div>
    </Link>
  )
}
