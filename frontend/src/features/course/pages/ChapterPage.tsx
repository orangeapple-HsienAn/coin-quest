import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { doc, getDoc } from 'firebase/firestore'
import { httpsCallable } from 'firebase/functions'
import { Link, useParams, useNavigate } from 'react-router'
import { db, functions } from '@/lib/firebase'
import { useUser } from '@/hooks/useUser'
import { Header } from '@/components/layout/Header'
import { GuessNumberGame } from '@/features/course/games/GuessNumberGame'
import { MemoryFlipGame } from '@/features/course/games/MemoryFlipGame'

// === Content 型別 ===

interface StoryContent {
  videoUrl: string
  scenarios: {
    label: string
    description: string
    result: string
    stars: number
    experienceReward: number
  }[]
}

interface KnowledgeContent {
  videoUrl: string
}

interface QuizContent {
  questions: {
    question: string
    options: string[]
    correctIndex: number
    explanation: string
  }[]
}

interface GameContent {
  gameType: 'guessNumber' | 'memoryFlip'
}

interface Chapter {
  id: string
  title: string
  type: 'story' | 'knowledge' | 'quiz' | 'game'
  order: number
  experienceReward: number
  coinReward: number
  content: StoryContent | KnowledgeContent | QuizContent | GameContent
}

/**
 * 章節內容頁面 — 根據 type 渲染小故事/小知識/小測驗
 */
export function ChapterPage() {
  const { courseId, chapterId } = useParams<{ courseId: string; chapterId: string }>()
  const { data: user } = useUser()
  const navigate = useNavigate()

  // 取得章節資料
  const { data: chapter, isLoading } = useQuery({
    queryKey: ['chapter', courseId, chapterId],
    queryFn: async () => {
      if (!courseId || !chapterId) return null
      const chapterDoc = await getDoc(
        doc(db, 'courses', courseId, 'chapters', chapterId)
      )
      if (!chapterDoc.exists()) return null
      return { id: chapterDoc.id, ...chapterDoc.data() } as Chapter
    },
    enabled: !!courseId && !!chapterId,
  })

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center bg-bg-cream">
        <div className="text-lg text-text-secondary">載入中...</div>
      </div>
    )
  }

  if (!chapter) {
    return (
      <div className="flex h-screen flex-col items-center justify-center bg-bg-cream">
        <p className="text-lg text-text-secondary">章節不存在</p>
        <Link to={`/course/${courseId}`} className="mt-4 text-primary hover:underline">
          返回章節列表
        </Link>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-bg-cream">
      <Header
        experience={user?.experience ?? 0}
        coins={user?.coins ?? 0}
        displayName={user?.displayName ?? '玩家'}
        backTo={`/course/${courseId}`}
      />

      <main className="mx-auto max-w-[800px] px-6 py-8">
        {chapter.type === 'story' && (
          <StoryView chapter={chapter} courseId={courseId!} navigate={navigate} />
        )}
        {chapter.type === 'knowledge' && (
          <KnowledgeView chapter={chapter} courseId={courseId!} navigate={navigate} />
        )}
        {chapter.type === 'quiz' && (
          <QuizView chapter={chapter} courseId={courseId!} navigate={navigate} />
        )}
        {chapter.type === 'game' && (
          <GameView chapter={chapter} courseId={courseId!} navigate={navigate} />
        )}
      </main>
    </div>
  )
}

// === 共用：完成章節 hook ===

function useCompleteChapter() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (params: {
      courseId: string
      chapterId: string
      experienceReward: number
      coinReward: number
    }) => {
      const fn = httpsCallable<typeof params, { success: boolean }>(
        functions,
        'completeChapter'
      )
      return (await fn(params)).data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user'] })
      queryClient.invalidateQueries({ queryKey: ['courseProgress'] })
    },
  })
}

// === 小故事 (story) ===

interface ViewProps {
  chapter: Chapter
  courseId: string
  navigate: (path: string) => void
}

function StoryView({ chapter, courseId, navigate }: ViewProps) {
  const content = chapter.content as StoryContent
  const completeMutation = useCompleteChapter()

  // 步驟：video → choose → result
  const [step, setStep] = useState<'video' | 'choose' | 'result'>('video')
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null)

  const selectedScenario = selectedIndex !== null ? content.scenarios[selectedIndex] : null

  // 完成並領取獎勵
  const handleComplete = () => {
    if (!selectedScenario) return
    completeMutation.mutate({
      courseId,
      chapterId: chapter.id,
      experienceReward: selectedScenario.experienceReward,
      coinReward: chapter.coinReward,
    })
    navigate(`/course/${courseId}`)
  }

  return (
    <div>
      <h2 className="mb-6 text-center text-lg font-bold text-primary">
        📕 {chapter.title}
      </h2>

      {/* 步驟一：影片 */}
      {step === 'video' && (
        <div className="space-y-4">
          {content.videoUrl ? (
            <video
              src={content.videoUrl}
              controls
              className="w-full rounded-2xl"
            />
          ) : (
            <div className="flex h-64 items-center justify-center rounded-2xl bg-gray-200">
              <p className="text-text-tertiary">影片將於稍後上架</p>
            </div>
          )}
          <div className="flex justify-end">
            <button
              onClick={() => setStep('choose')}
              className="rounded-xl bg-primary px-6 py-2 font-medium text-white"
            >
              觀看完成，下一步 →
            </button>
          </div>
        </div>
      )}

      {/* 步驟二：情境選擇 */}
      {step === 'choose' && (
        <div className="space-y-4">
          <p className="text-center text-sm text-text-secondary">請選擇一個情境：</p>
          <div className="space-y-3">
            {content.scenarios.map((scenario, idx) => (
              <button
                key={idx}
                onClick={() => setSelectedIndex(idx)}
                className={`w-full rounded-2xl border-2 p-4 text-left transition-all ${
                  selectedIndex === idx
                    ? 'border-primary bg-primary/10'
                    : selectedIndex !== null
                      ? 'border-gray-200 opacity-50'
                      : 'border-gray-200 hover:border-primary/50'
                }`}
              >
                <p className="font-medium text-text-primary">{scenario.label}</p>
                <p className="mt-1 text-sm text-text-secondary">{scenario.description}</p>
              </button>
            ))}
          </div>
          <div className="flex justify-between">
            <button
              onClick={() => setStep('video')}
              className="rounded-xl bg-gray-200 px-6 py-2 font-medium text-text-secondary"
            >
              ← 重播影片
            </button>
            <button
              onClick={() => selectedIndex !== null && setStep('result')}
              disabled={selectedIndex === null}
              className="rounded-xl bg-primary px-6 py-2 font-medium text-white disabled:opacity-50"
            >
              確認選擇 →
            </button>
          </div>
        </div>
      )}

      {/* 步驟三：結果結算 */}
      {step === 'result' && selectedScenario && (
        <div className="space-y-6">
          <div className="rounded-2xl border border-[#F0E6D8] bg-white p-6 shadow-sm">
            <p className="text-text-primary">{selectedScenario.result}</p>
            <div className="mt-4 flex items-center gap-4">
              {/* 星級評價 */}
              <div className="text-2xl">
                {Array.from({ length: 3 }, (_, i) => (
                  <span key={i}>{i < selectedScenario.stars ? '⭐' : '☆'}</span>
                ))}
              </div>
              <span className="text-sm text-text-secondary">
                經驗值 +{selectedScenario.experienceReward}
              </span>
            </div>
          </div>
          <div className="flex justify-between">
            <button
              onClick={() => {
                setStep('video')
                setSelectedIndex(null)
              }}
              className="rounded-xl bg-gray-200 px-6 py-2 font-medium text-text-secondary"
            >
              再看一次
            </button>
            <button
              onClick={handleComplete}
              disabled={completeMutation.isPending}
              className="rounded-xl bg-primary px-6 py-2 font-medium text-white"
            >
              前往下個章節 →
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

// === 小知識 (knowledge) ===

function KnowledgeView({ chapter, courseId, navigate }: ViewProps) {
  const completeMutation = useCompleteChapter()
  const [step, setStep] = useState<'video' | 'result'>('video')

  const handleComplete = () => {
    completeMutation.mutate({
      courseId,
      chapterId: chapter.id,
      experienceReward: chapter.experienceReward,
      coinReward: chapter.coinReward,
    })
    navigate(`/course/${courseId}`)
  }

  return (
    <div>
      <h2 className="mb-6 text-center text-lg font-bold text-primary">
        📘 {chapter.title}
      </h2>

      {/* 步驟一：影片 */}
      {step === 'video' && (
        <div className="space-y-4">
          {(chapter.content as KnowledgeContent).videoUrl ? (
            <video
              src={(chapter.content as KnowledgeContent).videoUrl}
              controls
              className="w-full rounded-2xl"
            />
          ) : (
            <div className="flex h-64 items-center justify-center rounded-2xl bg-gray-200">
              <p className="text-text-tertiary">影片將於稍後上架</p>
            </div>
          )}
          <div className="flex justify-end">
            <button
              onClick={() => setStep('result')}
              className="rounded-xl bg-primary px-6 py-2 font-medium text-white"
            >
              觀看完成 →
            </button>
          </div>
        </div>
      )}

      {/* 步驟二：完成結算 */}
      {step === 'result' && (
        <div className="space-y-6">
          <div className="rounded-2xl border border-[#F0E6D8] bg-white p-6 text-center shadow-sm">
            <p className="text-4xl">🎉</p>
            <p className="mt-4 text-lg font-bold text-text-primary">
              完成小知識，成功獲得經驗！
            </p>
            <p className="mt-2 text-primary">經驗值 +{chapter.experienceReward}</p>
          </div>
          <div className="flex justify-between">
            <button
              onClick={() => setStep('video')}
              className="rounded-xl bg-gray-200 px-6 py-2 font-medium text-text-secondary"
            >
              再看一次
            </button>
            <button
              onClick={handleComplete}
              disabled={completeMutation.isPending}
              className="rounded-xl bg-primary px-6 py-2 font-medium text-white"
            >
              前往下個章節 →
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

// === 小測驗 (quiz) ===

function QuizView({ chapter, courseId, navigate }: ViewProps) {
  const content = chapter.content as QuizContent
  const completeMutation = useCompleteChapter()

  const [currentQ, setCurrentQ] = useState(0)
  const [selectedOption, setSelectedOption] = useState<number | null>(null)
  const [submitted, setSubmitted] = useState(false)
  const [correctCount, setCorrectCount] = useState(0)
  const [finished, setFinished] = useState(false)

  const question = content.questions[currentQ]
  const isCorrect = selectedOption === question?.correctIndex

  // 提交答案
  const handleSubmit = () => {
    if (selectedOption === null) return
    setSubmitted(true)
    if (selectedOption === question.correctIndex) {
      setCorrectCount((c) => c + 1)
    }
  }

  // 下一題或結算
  const handleNext = () => {
    if (currentQ < content.questions.length - 1) {
      setCurrentQ((q) => q + 1)
      setSelectedOption(null)
      setSubmitted(false)
    } else {
      setFinished(true)
    }
  }

  // 結算獎勵公式：經驗=50+答對×10，金幣=答對×10
  const finalCorrect = finished
    ? correctCount + (submitted && isCorrect ? 0 : 0) // correctCount 已在 handleSubmit 累計
    : correctCount
  const expReward = 50 + finalCorrect * 10
  const coinReward = finalCorrect * 10

  const handleComplete = () => {
    completeMutation.mutate({
      courseId,
      chapterId: chapter.id,
      experienceReward: expReward,
      coinReward: coinReward,
    })
    navigate(`/course/${courseId}`)
  }

  // 結算畫面
  if (finished) {
    return (
      <div>
        <h2 className="mb-6 text-center text-lg font-bold text-primary">
          📝 測驗結果
        </h2>
        <div className="space-y-6">
          <div className="rounded-2xl border border-[#F0E6D8] bg-white p-6 text-center shadow-sm">
            <p className="text-4xl">🎉</p>
            <p className="mt-4 text-lg font-bold text-text-primary">
              總共答對 {finalCorrect} / {content.questions.length} 題
            </p>
            <div className="mt-4 flex justify-center gap-6">
              <div className="text-center">
                <p className="text-xs text-text-tertiary">經驗值</p>
                <p className="text-lg font-bold text-primary">+{expReward}</p>
              </div>
              <div className="text-center">
                <p className="text-xs text-text-tertiary">金幣</p>
                <p className="text-lg font-bold text-invest-orange">+{coinReward}</p>
              </div>
            </div>
          </div>
          <div className="flex justify-between">
            <button
              onClick={() => {
                // 重新開始（唯讀模式暫不實作，直接重置）
                setCurrentQ(0)
                setSelectedOption(null)
                setSubmitted(false)
                setCorrectCount(0)
                setFinished(false)
              }}
              className="rounded-xl bg-gray-200 px-6 py-2 font-medium text-text-secondary"
            >
              再看一次題目
            </button>
            <button
              onClick={handleComplete}
              disabled={completeMutation.isPending}
              className="rounded-xl bg-primary px-6 py-2 font-medium text-white"
            >
              前往下個章節 →
            </button>
          </div>
        </div>
      </div>
    )
  }

  // 題目作答畫面
  return (
    <div>
      <h2 className="mb-6 text-center text-lg font-bold text-primary">
        📝 {chapter.title}
      </h2>

      {/* 題號進度 */}
      <p className="mb-4 text-center text-sm text-text-tertiary">
        第 {currentQ + 1} / {content.questions.length} 題
      </p>

      {/* 題目 */}
      <div className="mb-6 rounded-2xl border border-[#F0E6D8] bg-white p-6 shadow-sm">
        <p className="text-lg font-medium text-text-primary">{question.question}</p>
      </div>

      {/* 選項（垂直排列） */}
      <div className="mb-6 space-y-3">
        {question.options.map((option, idx) => {
          let borderClass = 'border-gray-200'
          if (submitted) {
            if (idx === question.correctIndex) borderClass = 'border-gain-green bg-gain-green/10'
            else if (idx === selectedOption) borderClass = 'border-loss-red bg-loss-red/10'
          } else if (idx === selectedOption) {
            borderClass = 'border-primary bg-primary/10'
          }

          return (
            <button
              key={idx}
              onClick={() => !submitted && setSelectedOption(idx)}
              disabled={submitted}
              className={`w-full rounded-xl border-2 p-4 text-left transition-all ${borderClass}`}
            >
              <span className="text-text-primary">{option}</span>
            </button>
          )
        })}
      </div>

      {/* 詳解（提交後顯示） */}
      {submitted && (
        <div className="mb-6 max-h-40 overflow-y-auto rounded-xl bg-pink-50 p-4">
          <p className="text-sm font-medium text-pink-800">
            {isCorrect ? '✅ 答對了！' : '❌ 答錯了！'}
          </p>
          <p className="mt-2 text-sm text-pink-700">{question.explanation}</p>
        </div>
      )}

      {/* 操作按鈕 */}
      <div className="flex justify-end">
        {!submitted ? (
          <button
            onClick={handleSubmit}
            disabled={selectedOption === null}
            className="rounded-xl bg-primary px-6 py-2 font-medium text-white disabled:opacity-50"
          >
            提交答案 →
          </button>
        ) : (
          <button
            onClick={handleNext}
            className="rounded-xl bg-primary px-6 py-2 font-medium text-white"
          >
            {currentQ < content.questions.length - 1 ? '下一題 →' : '查看結果 →'}
          </button>
        )}
      </div>
    </div>
  )
}

// === 小遊戲 (game) ===

/** 星級對應金幣獎勵 */
const STAR_COINS = [0, 50, 100, 200] as const

/** 分數轉星級（由各遊戲自訂閾值） */
function scoreToStars(score: number, thresholds: [number, number]): 1 | 2 | 3 {
  if (score >= thresholds[1]) return 3
  if (score >= thresholds[0]) return 2
  return 1
}

function GameView({ chapter, courseId, navigate }: ViewProps) {
  const content = chapter.content as GameContent
  const completeMutation = useCompleteChapter()

  const [step, setStep] = useState<'play' | 'result'>('play')
  const [stars, setStars] = useState<1 | 2 | 3>(1)

  // 遊戲完成回調：接收分數，計算星級，進入結算
  const handleGameComplete = (score: number) => {
    // 各遊戲的星級閾值（由遊戲類型決定）
    const thresholds: Record<string, [number, number]> = {
      guessNumber: [60, 85],   // ≥60→2星, ≥85→3星
      memoryFlip: [60, 85],
    }
    const t = thresholds[content.gameType] || [60, 85]
    setStars(scoreToStars(score, t))
    setStep('result')
  }

  const coinReward = STAR_COINS[stars]

  const handleComplete = () => {
    completeMutation.mutate({
      courseId,
      chapterId: chapter.id,
      experienceReward: chapter.experienceReward,
      coinReward,
    })
    navigate(`/course/${courseId}`)
  }

  return (
    <div>
      <h2 className="mb-6 text-center text-lg font-bold text-primary">
        🎮 {chapter.title}
      </h2>

      {/* 遊戲進行中 */}
      {step === 'play' && (
        <div>
          {content.gameType === 'guessNumber' && (
            <GuessNumberGame onComplete={handleGameComplete} />
          )}
          {content.gameType === 'memoryFlip' && (
            <MemoryFlipGame onComplete={handleGameComplete} />
          )}
        </div>
      )}

      {/* 結算畫面 */}
      {step === 'result' && (
        <div className="space-y-6">
          <div className="rounded-2xl border border-[#F0E6D8] bg-white p-6 text-center shadow-sm">
            <p className="text-4xl">🎉</p>
            <p className="mt-4 text-lg font-bold text-text-primary">遊戲結束！</p>

            {/* 星級 */}
            <div className="mt-4 text-3xl">
              {Array.from({ length: 3 }, (_, i) => (
                <span key={i}>{i < stars ? '⭐' : '☆'}</span>
              ))}
            </div>

            {/* 獎勵對照表 */}
            <div className="mt-4 flex justify-center gap-4">
              {[1, 2, 3].map((s) => (
                <div
                  key={s}
                  className={`rounded-lg px-4 py-2 text-sm ${
                    s === stars
                      ? 'border-2 border-invest-orange bg-yellow-50 font-bold'
                      : 'border border-gray-200 text-text-tertiary'
                  }`}
                >
                  {'⭐'.repeat(s)} +{STAR_COINS[s]} 金幣
                </div>
              ))}
            </div>

            <p className="mt-4 text-lg font-bold text-invest-orange">
              獲得 {coinReward} 金幣！
            </p>
          </div>

          <div className="flex justify-between">
            <button
              onClick={() => setStep('play')}
              className="rounded-xl bg-gray-200 px-6 py-2 font-medium text-text-secondary"
            >
              再玩一次
            </button>
            <button
              onClick={handleComplete}
              disabled={completeMutation.isPending}
              className="rounded-xl bg-primary px-6 py-2 font-medium text-white"
            >
              前往下個章節 →
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

