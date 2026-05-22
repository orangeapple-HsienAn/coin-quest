/**
 * 右側黃色箭頭按鈕（5.3~5.6 通用）
 * 點擊進入下一步；disabled 時降低不透明度
 */
interface NextArrowButtonProps {
  onClick: () => void
  disabled?: boolean
  label?: string
}

export function NextArrowButton({ onClick, disabled, label = '下一步' }: NextArrowButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-label={label}
      className={`flex h-20 w-20 items-center justify-center rounded-2xl bg-[#FFC857] text-3xl text-white shadow-card transition ${
        disabled ? 'cursor-not-allowed opacity-40' : 'hover:scale-110 active:scale-95'
      }`}
    >
      ▶
    </button>
  )
}
