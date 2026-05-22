/**
 * 小考驗詳解區（5.6 步驟二）— 粉紅底卡片
 */
interface QuizExplanationProps {
  text: string
}

export function QuizExplanation({ text }: QuizExplanationProps) {
  return (
    <div className="mt-4 rounded-2xl bg-[#FFE5EC] px-6 py-5 text-base leading-relaxed text-[#5A3E45]">
      {text}
    </div>
  )
}
