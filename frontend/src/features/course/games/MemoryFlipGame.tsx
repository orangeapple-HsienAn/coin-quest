import { useState } from 'react'
import type { GameProps } from './GuessNumberGame'

// 記憶翻牌用的 emoji 組
const FLIP_EMOJIS = ['🐶', '🐱', '🐼', '🦊', '🐸', '🐵', '🐷', '🐰']

/** 記憶翻牌遊戲：4x4 emoji 配對，依翻牌次數計星 */
export function MemoryFlipGame({ onComplete }: GameProps) {
  // 產生 4x4 配對卡片（8 對 = 16 張）
  const [cards] = useState(() => {
    const pairs = FLIP_EMOJIS.map((emoji, i) => [
      { id: i * 2, emoji, matched: false },
      { id: i * 2 + 1, emoji, matched: false },
    ]).flat()
    // Fisher-Yates 洗牌
    for (let i = pairs.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [pairs[i], pairs[j]] = [pairs[j], pairs[i]]
    }
    return pairs
  })

  const [flipped, setFlipped] = useState<number[]>([])     // 目前翻開的卡片 index
  const [matched, setMatched] = useState<Set<number>>(new Set()) // 已配對的卡片 index
  const [moves, setMoves] = useState(0)
  const [locked, setLocked] = useState(false) // 翻牌動畫中鎖定

  const handleFlip = (index: number) => {
    if (locked || flipped.includes(index) || matched.has(index)) return

    const newFlipped = [...flipped, index]
    setFlipped(newFlipped)

    if (newFlipped.length === 2) {
      const newMoves = moves + 1
      setMoves(newMoves)

      if (cards[newFlipped[0]].emoji === cards[newFlipped[1]].emoji) {
        // 配對成功
        const newMatched = new Set(matched)
        newMatched.add(newFlipped[0])
        newMatched.add(newFlipped[1])
        setMatched(newMatched)
        setFlipped([])

        // 全部配對完成
        if (newMatched.size === cards.length) {
          // 分數：≤10 步 = 100, ≤15 步 = 85, ≤20 步 = 60, >20 = 30
          const score = newMoves <= 10 ? 100 : newMoves <= 15 ? 85 : newMoves <= 20 ? 60 : 30
          setTimeout(() => onComplete(score), 500)
        }
      } else {
        // 配對失敗，短暫顯示後翻回
        setLocked(true)
        setTimeout(() => {
          setFlipped([])
          setLocked(false)
        }, 800)
      }
    }
  }

  return (
    <div className="space-y-4 rounded-2xl border border-[#F0E6D8] bg-white p-6 shadow-sm">
      <div className="text-center">
        <p className="text-lg font-bold text-text-primary">翻牌配對</p>
        <p className="mt-1 text-sm text-text-tertiary">
          已翻 {moves} 次 ｜ 剩餘 {(cards.length - matched.size) / 2} 對
        </p>
      </div>

      {/* 4x4 卡片網格 */}
      <div className="mx-auto grid max-w-xs grid-cols-4 gap-2">
        {cards.map((card, index) => {
          const isFlipped = flipped.includes(index) || matched.has(index)
          return (
            <button
              key={card.id}
              onClick={() => handleFlip(index)}
              className={`flex h-16 w-16 items-center justify-center rounded-xl text-2xl transition-all duration-200 ${
                matched.has(index)
                  ? 'bg-green-100 border-2 border-gain-green'
                  : isFlipped
                    ? 'bg-primary/10 border-2 border-primary'
                    : 'bg-gray-200 border-2 border-gray-300 hover:bg-gray-300'
              }`}
            >
              {isFlipped ? card.emoji : '?'}
            </button>
          )
        })}
      </div>

      {/* 星級提示 */}
      <div className="text-center text-xs text-text-tertiary">
        10次內 → ⭐⭐⭐ ｜ 15次內 → ⭐⭐ ｜ 20次內 → ⭐
      </div>
    </div>
  )
}
