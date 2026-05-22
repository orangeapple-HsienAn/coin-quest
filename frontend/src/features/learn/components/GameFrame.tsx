/**
 * 小遊戲容器（5.5 步驟一）
 * - 16:9 黃色框 + iframe 載入 CMS publishedGames 的 HTML
 * - 兩種「遊戲結束」訊號：
 *    A. iframe 內 postMessage({type:'GAME_RESULT', score, maxScore})（CMS v0.14.0+）
 *    B. 使用者手動點外部「完成遊戲」按鈕，從 iframe DOM 讀 #score-val 文字
 */
import { useEffect, useRef, useState } from 'react'

interface GameFrameProps {
  htmlUrl: string
  onResult: (score: number) => void
}

interface GameResultMessage {
  type: 'GAME_RESULT'
  score: number
  maxScore?: number
}

function isGameResultMessage(d: unknown): d is GameResultMessage {
  return (
    typeof d === 'object' &&
    d !== null &&
    (d as { type?: unknown }).type === 'GAME_RESULT' &&
    typeof (d as { score?: unknown }).score === 'number'
  )
}

export function GameFrame({ htmlUrl, onResult }: GameFrameProps) {
  const iframeRef = useRef<HTMLIFrameElement>(null)
  const [reported, setReported] = useState(false)

  // 監聽 iframe 內 postMessage
  useEffect(() => {
    const handler = (e: MessageEvent) => {
      if (reported) return
      if (isGameResultMessage(e.data)) {
        setReported(true)
        onResult(e.data.score)
      }
    }
    window.addEventListener('message', handler)
    return () => window.removeEventListener('message', handler)
  }, [onResult, reported])

  // 手動完成：嘗試從 iframe DOM 讀分數（舊版遊戲用）
  const handleManualFinish = () => {
    if (reported) return
    let score = 0
    try {
      const doc = iframeRef.current?.contentDocument
      const scoreEl = doc?.getElementById('score-val')
      if (scoreEl?.textContent) {
        const parsed = parseInt(scoreEl.textContent.trim(), 10)
        if (!isNaN(parsed)) score = parsed
      }
    } catch (e) {
      console.error('讀取 iframe 分數失敗', e)
    }
    setReported(true)
    onResult(score)
  }

  return (
    <div className="flex w-full items-center justify-center gap-6">
      {/* 16:9 遊戲容器 — 外層黃色 padding 框 */}
      <div className="w-full max-w-4xl rounded-3xl bg-[#FFC857] p-3 shadow-card">
        <div className="relative w-full overflow-hidden rounded-2xl" style={{ paddingBottom: '56.25%' }}>
          <iframe
            ref={iframeRef}
            src={htmlUrl}
            title="課程小遊戲"
            className="absolute inset-0 h-full w-full border-0"
            // 允許 iframe 與父視窗 postMessage、同源 DOM 存取
            sandbox="allow-scripts allow-same-origin"
          />
        </div>
      </div>

      {/* 手動完成按鈕（fallback for 舊版未內建 postMessage 的遊戲） */}
      <button
        type="button"
        onClick={handleManualFinish}
        disabled={reported}
        className="flex h-20 w-20 flex-col items-center justify-center rounded-2xl bg-[#FFC857] text-xs text-white shadow-card transition hover:scale-110 active:scale-95 disabled:cursor-not-allowed disabled:opacity-40"
      >
        <span className="text-2xl">▶</span>
        <span>完成</span>
      </button>
    </div>
  )
}
