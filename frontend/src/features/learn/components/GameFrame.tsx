/**
 * 小遊戲容器（5.5 步驟一）
 * - 16:9 黃色框 + iframe 載入 CMS publishedGames 的 HTML
 * - 兩種「遊戲結束」訊號：
 *    A. iframe 內 postMessage({type:'GAME_RESULT', score, maxScore})（CMS v0.14.0+）
 *    B. 使用者手動點外部「完成遊戲」按鈕，從 iframe DOM 讀 #score-val 文字
 * - 多語：language='ja' 時 fetch HTML、跑 translateGameHtml 後用 srcDoc 注入
 */
import { useEffect, useRef, useState } from 'react'
import type { Language } from '../lib/lessonKey'
import { translateGameHtml } from '../lib/gameTranslations'

interface GameFrameProps {
  htmlUrl: string
  language?: Language
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

export function GameFrame({ htmlUrl, language = 'zh', onResult }: GameFrameProps) {
  const iframeRef = useRef<HTMLIFrameElement>(null)
  const [reported, setReported] = useState(false)
  const [srcDoc, setSrcDoc] = useState<string | null>(null)
  const [loadError, setLoadError] = useState<string | null>(null)

  // 載入 HTML：zh 直接 src、ja 走 srcDoc + 翻譯
  useEffect(() => {
    if (language === 'zh') {
      setSrcDoc(null)
      return
    }
    let cancelled = false
    fetch(htmlUrl)
      .then((r) => {
        if (!r.ok) throw new Error(`HTTP ${r.status}`)
        return r.text()
      })
      .then((html) => {
        if (cancelled) return
        setSrcDoc(translateGameHtml(html, language))
      })
      .catch((e) => {
        if (cancelled) return
        setLoadError(String(e))
      })
    return () => {
      cancelled = true
    }
  }, [htmlUrl, language])

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

  // 等翻譯版 HTML 載好才渲染 iframe（避免閃一下中文）
  const isReady = language === 'zh' || srcDoc !== null || loadError !== null

  return (
    <div className="flex w-full items-center justify-center gap-6">
      <div className="w-full max-w-4xl rounded-3xl bg-[#FFC857] p-3 shadow-card">
        <div className="relative w-full overflow-hidden rounded-2xl" style={{ paddingBottom: '56.25%' }}>
          {loadError && (
            <div className="absolute inset-0 flex items-center justify-center bg-white text-red-500">
              遊戲載入失敗：{loadError}
            </div>
          )}
          {!isReady && !loadError && (
            <div className="absolute inset-0 flex items-center justify-center bg-white">載入中...</div>
          )}
          {isReady && !loadError && (
            <iframe
              ref={iframeRef}
              {...(language === 'zh' ? { src: htmlUrl } : { srcDoc: srcDoc ?? '' })}
              title="課程小遊戲"
              className="absolute inset-0 h-full w-full border-0"
              sandbox="allow-scripts allow-same-origin"
            />
          )}
        </div>
      </div>

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
