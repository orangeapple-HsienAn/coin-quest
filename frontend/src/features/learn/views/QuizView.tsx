/**
 * 小考驗整體流程（5.6）
 *   answering → reviewing → answering(next) → ... → result
 * 再看一次題目：回到第一題的 reviewing（唯讀）模式
 */
import { useState } from 'react'
import type { QuizContent } from '../hooks/useChapterContent'
import { QuizQuestion } from '../components/QuizQuestion'
import { QuizExplanation } from '../components/QuizExplanation'
import { QuizResultCard } from '../components/result/QuizResultCard'
import { NextArrowButton } from '../components/NextArrowButton'
import type { Language } from '../lib/lessonKey'

interface QuizViewProps {
  content: QuizContent
  language?: Language
  onComplete: (params: { experienceReward: number; coinReward: number }) => void
  onNext: () => void
}

type Phase = 'answering' | 'reviewing' | 'result'

export function QuizView({ content, language = 'zh', onComplete, onNext }: QuizViewProps) {
  const { questions } = content
  const total = questions.length

  // 每題答案（null = 未作答）；長度 = total
  const [answers, setAnswers] = useState<(number | null)[]>(() => new Array(total).fill(null))
  const [currentIdx, setCurrentIdx] = useState(0)
  const [phase, setPhase] = useState<Phase>('answering')
  // 是否處於「再看一次」唯讀模式
  const [reviewMode, setReviewMode] = useState(false)

  const correctCount = answers.filter((a, i) => a === questions[i].answer).length
  const experienceReward = 50 + correctCount * 10
  const coinReward = correctCount * 10

  const currentQ = questions[currentIdx]
  const selectedIdx = answers[currentIdx]

  // === 結算畫面 ===
  if (phase === 'result') {
    return (
      <div className="flex w-full justify-center py-10">
        <QuizResultCard
          correctCount={correctCount}
          totalCount={total}
          experienceReward={experienceReward}
          coinReward={coinReward}
          language={language}
          onReplay={() => {
            // 再看一次：回到第一題、進入唯讀的詳解模式
            setReviewMode(true)
            setCurrentIdx(0)
            setPhase('reviewing')
          }}
          onNext={onNext}
        />
      </div>
    )
  }

  // === 答題 / 詳解畫面 ===
  const isLast = currentIdx === total - 1
  // 唯讀 review 模式下不能改答案
  const handleSelect = (idx: number) => {
    if (reviewMode) return
    const next = [...answers]
    next[currentIdx] = idx
    setAnswers(next)
  }

  const handleNext = () => {
    if (phase === 'answering') {
      // 進入詳解
      setPhase('reviewing')
    } else {
      // reviewing → 下一題 or 結算
      if (isLast) {
        if (reviewMode) {
          // 唯讀模式看完 → 回結算畫面
          setPhase('result')
        } else {
          // 第一輪：發放獎勵並進結算
          onComplete({ experienceReward, coinReward })
          setPhase('result')
        }
      } else {
        setCurrentIdx(currentIdx + 1)
        setPhase(reviewMode ? 'reviewing' : 'answering')
      }
    }
  }

  // 「下一步」按鈕能否點：作答模式需先選一個選項
  const canProceed = phase === 'reviewing' || selectedIdx !== null

  return (
    <div className="flex w-full items-center justify-center gap-6 py-6">
      <div className="w-full max-w-2xl">
        <QuizQuestion
          index={currentIdx}
          question={currentQ}
          selectedIdx={selectedIdx}
          revealed={phase === 'reviewing'}
          onSelect={handleSelect}
        />
        {phase === 'reviewing' && <QuizExplanation text={currentQ.explanation} />}
      </div>
      <NextArrowButton onClick={handleNext} disabled={!canProceed} />
    </div>
  )
}
