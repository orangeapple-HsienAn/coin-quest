import { formatCoin } from '@/lib/utils'
import { CoinIcon } from '@/components/icons/CoinIcon'
import { tUI } from '@/lib/uiStrings'

interface FateCardModalProps {
  isOpen: boolean
  type: 'risk' | 'neutral' | 'reward'
  title: string
  description: string
  coinLoss: number
  coinGain: number
  hasInsurance: boolean
  claimAmount: number
  onPayCoins: () => void
  onUseInsurance: () => void
  onConfirm: () => void
  isProcessing: boolean
}

/** 命運卡 emoji 對照 */
const typeEmoji = { risk: '💥', neutral: '😌', reward: '🎉' }

/**
 * 命運卡彈窗（命運一抽）
 * 支援三種類型：risk（風險損失）、neutral（無事發生）、reward（正面獎勵）
 */
export function FateCardModal({
  isOpen,
  type,
  title,
  description,
  coinLoss,
  coinGain,
  hasInsurance,
  claimAmount,
  onPayCoins,
  onUseInsurance,
  onConfirm,
  isProcessing,
}: FateCardModalProps) {
  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="mx-4 w-full max-w-md rounded-[20px] bg-white p-6 shadow-[0_8px_32px_rgba(0,0,0,0.16)]">
        {/* 標題 */}
        <div className="mb-4 flex items-center gap-2">
          <span className="text-2xl">🎲</span>
          <h2 className="text-xl font-bold text-text-primary">{tUI('命運一抽')}</h2>
        </div>

        {/* 金額顯示：依類型不同 */}
        {type === 'risk' && (
          <div className="mb-4 rounded-[12px] bg-red-50 px-4 py-3 text-center">
            <span className="flex items-center justify-center gap-1 text-lg font-bold text-loss-red">
              <CoinIcon size={18} /> -{formatCoin(coinLoss)}
            </span>
          </div>
        )}
        {type === 'reward' && (
          <div className="mb-4 rounded-[12px] bg-green-50 px-4 py-3 text-center">
            <span className="flex items-center justify-center gap-1 text-lg font-bold text-gain-green">
              <CoinIcon size={18} /> +{formatCoin(coinGain)}
            </span>
          </div>
        )}
        {type === 'neutral' && (
          <div className="mb-4 rounded-[12px] bg-gray-100 px-4 py-3 text-center">
            <span className="text-lg font-bold text-text-secondary">{tUI('平安無事')}</span>
          </div>
        )}

        {/* 卡片內容 */}
        <div className="mb-6 rounded-[12px] bg-gray-50 p-4">
          <div className="mb-3 flex h-32 items-center justify-center rounded-[8px] bg-white">
            <span className="text-6xl">{typeEmoji[type]}</span>
          </div>
          <h3 className="mb-1 text-center font-medium text-text-primary">{title}</h3>
          <p className="text-center text-sm text-text-secondary">{description}</p>
        </div>

        {/* 操作按鈕：risk 顯示支付/保險，neutral/reward 顯示確認 */}
        {type === 'risk' ? (
          <>
            <div className="flex gap-3">
              <button
                onClick={onPayCoins}
                disabled={isProcessing}
                className="flex flex-1 items-center justify-center gap-1 rounded-[8px] bg-coral py-3 font-medium text-white transition-shadow hover:shadow-[0_4px_16px_rgba(0,0,0,0.12)] disabled:opacity-50"
              >
                {isProcessing ? tUI('處理中...') : <><CoinIcon size={16} /> {tUI('支付金幣')}</>}
              </button>

              {hasInsurance && (
                <button
                  onClick={onUseInsurance}
                  disabled={isProcessing}
                  className="flex-1 rounded-[8px] bg-teal py-3 font-medium text-white transition-shadow hover:shadow-[0_4px_16px_rgba(0,0,0,0.12)] disabled:opacity-50"
                >
                  {isProcessing ? tUI('處理中...') : tUI('🛡️ 我有保險')}
                </button>
              )}
            </div>

            {hasInsurance && (
              <p className="mt-3 flex items-center justify-center gap-1 text-xs text-text-tertiary">
                {tUI('使用保險可獲得')} <CoinIcon size={12} /> {formatCoin(claimAmount)} {tUI('理賠金')}
              </p>
            )}
          </>
        ) : (
          <button
            onClick={onConfirm}
            className="w-full rounded-[8px] bg-teal py-3 font-medium text-white transition-shadow hover:shadow-[0_4px_16px_rgba(0,0,0,0.12)]"
          >
            {tUI('確認')}
          </button>
        )}
      </div>
    </div>
  )
}

interface InsuranceClaimModalProps {
  isOpen: boolean
  claimAmount: number
  onConfirm: () => void
}

/**
 * 保險理賠成功彈窗
 */
export function InsuranceClaimModal({
  isOpen,
  claimAmount,
  onConfirm,
}: InsuranceClaimModalProps) {
  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="mx-4 w-full max-w-md rounded-[20px] bg-white p-6 shadow-[0_8px_32px_rgba(0,0,0,0.16)]">
        {/* 標題 */}
        <div className="mb-4 flex items-center justify-center gap-2">
          <span className="text-2xl">🛡️</span>
          <h2 className="text-xl font-bold text-text-primary">{tUI('保險理賠')}</h2>
        </div>

        {/* 理賠金額 */}
        <div className="mb-4 rounded-[12px] bg-green-50 px-4 py-3 text-center">
          <span className="flex items-center justify-center gap-1 text-lg font-bold text-gain-green">
            <CoinIcon size={18} /> +{formatCoin(claimAmount)}
          </span>
        </div>

        {/* 插圖 */}
        <div className="mb-6 flex justify-center">
          <span className="text-8xl">👼</span>
        </div>

        <p className="mb-6 text-center text-sm text-text-secondary">
          {tUI('還好有保險！保險公司幫你支付了這筆費用，守住了你的錢包！')}
        </p>

        {/* 確認按鈕 */}
        <button
          onClick={onConfirm}
          className="w-full rounded-[8px] bg-teal py-3 font-medium text-white transition-shadow hover:shadow-[0_4px_16px_rgba(0,0,0,0.12)]"
        >
          確認
        </button>
      </div>
    </div>
  )
}
