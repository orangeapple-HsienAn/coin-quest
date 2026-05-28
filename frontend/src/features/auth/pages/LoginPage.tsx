import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useNavigate } from 'react-router'
import { signIn } from '@/lib/auth'
import { tUI } from '@/lib/uiStrings'

// 表單驗證 schema
const loginSchema = z.object({
  email: z.string().email(tUI('請輸入有效的 Email')),
  password: z.string().min(6, tUI('密碼至少 6 個字元')),
})

type LoginFormData = z.infer<typeof loginSchema>

export function LoginPage() {
  const navigate = useNavigate()
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
  })

  const onSubmit = async (data: LoginFormData) => {
    setError(null)
    setIsLoading(true)

    try {
      await signIn(data.email, data.password)
      navigate('/')
    } catch (err) {
      setError((err as Error).message)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-bg-cream px-4">
      <div className="w-full max-w-md rounded-[16px] bg-white p-8 shadow-[0_2px_8px_rgba(0,0,0,0.08)]">
        {/* Logo */}
        <div className="mb-8 text-center">
          <h1 className="text-2xl font-bold text-primary">{tUI('橘子蘋果')}</h1>
          <p className="mt-2 text-text-secondary">{tUI('財商學習平台')}</p>
        </div>

        {/* 錯誤訊息 */}
        {error && (
          <div className="mb-4 rounded-[8px] bg-red-50 p-3 text-sm text-red-600">
            {error}
          </div>
        )}

        {/* 登入表單 */}
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <label htmlFor="email" className="mb-1 block text-sm font-medium text-text-primary">
              Email
            </label>
            <input
              id="email"
              type="email"
              {...register('email')}
              className="w-full rounded-[8px] border border-gray-300 px-4 py-3 text-text-primary focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
              placeholder={tUI('請輸入 Email')}
            />
            {errors.email && (
              <p className="mt-1 text-sm text-red-500">{errors.email.message}</p>
            )}
          </div>

          <div>
            <label htmlFor="password" className="mb-1 block text-sm font-medium text-text-primary">
              {tUI('密碼')}
            </label>
            <input
              id="password"
              type="password"
              {...register('password')}
              className="w-full rounded-[8px] border border-gray-300 px-4 py-3 text-text-primary focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
              placeholder={tUI('請輸入密碼')}
            />
            {errors.password && (
              <p className="mt-1 text-sm text-red-500">{errors.password.message}</p>
            )}
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full rounded-[8px] bg-coral py-3 font-medium text-white transition-shadow hover:shadow-[0_4px_16px_rgba(0,0,0,0.12)] disabled:cursor-not-allowed disabled:opacity-50"
          >
            {isLoading ? tUI('登入中...') : tUI('登入')}
          </button>
        </form>

        {/* 測試帳號提示（M1 過渡期）— 正式上線前移除 */}
        <p className="mt-6 text-center text-xs text-text-tertiary">
          {tUI('測試帳號：admin@test.local / student-1@test.local（密碼 test1234）')}
        </p>
      </div>
    </div>
  )
}
