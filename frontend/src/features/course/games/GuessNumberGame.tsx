import { useState } from 'react'

/** 遊戲元件共用 Props */
export interface GameProps {
  onComplete: (score: number) => void
}

/** 猜數字遊戲：猜 1~100 的數字，依次數計星 */
export function GuessNumberGame({ onComplete }: GameProps) {
  const [answer] = useState(() => Math.floor(Math.random() * 100) + 1)
  const [guess, setGuess] = useState('')
  const [attempts, setAttempts] = useState(0)
  const [hint, setHint] = useState<string | null>(null)
  const [history, setHistory] = useState<{ value: number; hint: string }[]>([])

  const handleGuess = () => {
    const num = parseInt(guess)
    if (isNaN(num) || num < 1 || num > 100) return

    const newAttempts = attempts + 1
    setAttempts(newAttempts)

    if (num === answer) {
      // 分數：≤3 次 = 100, ≤5 次 = 85, ≤8 次 = 60, >8 次 = 30
      const score = newAttempts <= 3 ? 100 : newAttempts <= 5 ? 85 : newAttempts <= 8 ? 60 : 30
      onComplete(score)
      return
    }

    const h = num > answer ? '太大了！往小一點猜' : '太小了！往大一點猜'
    setHint(h)
    setHistory((prev) => [...prev, { value: num, hint: h }])
    setGuess('')
  }

  return (
    <div className="space-y-4 rounded-2xl border border-[#F0E6D8] bg-white p-6 shadow-sm">
      <div className="text-center">
        <p className="text-lg font-bold text-text-primary">猜一個 1~100 的數字</p>
        <p className="mt-1 text-sm text-text-tertiary">已猜 {attempts} 次</p>
      </div>

      {/* 輸入區 */}
      <div className="flex items-center justify-center gap-3">
        <input
          type="number"
          min={1}
          max={100}
          value={guess}
          onChange={(e) => setGuess(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleGuess()}
          placeholder="輸入數字"
          className="w-32 rounded-xl border border-gray-300 px-4 py-3 text-center text-lg font-mono-number"
        />
        <button
          onClick={handleGuess}
          disabled={!guess}
          className="rounded-xl bg-primary px-6 py-3 font-medium text-white disabled:opacity-50"
        >
          猜！
        </button>
      </div>

      {/* 提示 */}
      {hint && (
        <p className="text-center text-lg font-medium text-invest-orange">{hint}</p>
      )}

      {/* 歷史紀錄 */}
      {history.length > 0 && (
        <div className="mx-auto max-w-xs space-y-1">
          {history.map((h, i) => (
            <div key={i} className="flex justify-between text-sm text-text-secondary">
              <span>第 {i + 1} 次：{h.value}</span>
              <span>{h.hint}</span>
            </div>
          ))}
        </div>
      )}

      {/* 星級提示 */}
      <div className="text-center text-xs text-text-tertiary">
        3次內 → ⭐⭐⭐ ｜ 5次內 → ⭐⭐ ｜ 8次內 → ⭐
      </div>
    </div>
  )
}
