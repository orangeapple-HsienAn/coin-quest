interface CoinIconProps {
  className?: string
  size?: number
}

/**
 * 金幣圖示 SVG
 * 金黃色圓形硬幣，中央有星星圖案
 */
export function CoinIcon({ className = '', size = 24 }: CoinIconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 32 32"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      {/* 外圈陰影 */}
      <ellipse cx="16" cy="17" rx="14" ry="14" fill="#D4A017" />
      {/* 主體圓形 */}
      <circle cx="16" cy="15" r="14" fill="url(#coinGradient)" />
      {/* 內圈邊框 */}
      <circle cx="16" cy="15" r="11" stroke="#E8C547" strokeWidth="1.5" fill="none" />
      {/* 中央星星 */}
      <path
        d="M16 8L17.8 12.2L22.4 12.8L19.2 15.8L20 20.4L16 18.2L12 20.4L12.8 15.8L9.6 12.8L14.2 12.2L16 8Z"
        fill="#E8C547"
      />
      {/* 漸層定義 */}
      <defs>
        <linearGradient id="coinGradient" x1="16" y1="1" x2="16" y2="29" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#FFE066" />
          <stop offset="50%" stopColor="#F5C842" />
          <stop offset="100%" stopColor="#D4A017" />
        </linearGradient>
      </defs>
    </svg>
  )
}
