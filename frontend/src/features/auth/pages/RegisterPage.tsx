import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Link, useNavigate } from 'react-router'
import { signUp } from '@/lib/auth'

// 表單驗證 schema
const registerSchema = z
  .object({
    displayName: z.string().min(2, '暱稱至少 2 個字元').max(20, '暱稱最多 20 個字元'),
    email: z.string().email('請輸入有效的 Email'),
    password: z.string().min(6, '密碼至少 6 個字元'),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: '密碼不一致',
    path: ['confirmPassword'],
  })

type RegisterFormData = z.infer<typeof registerSchema>

export function RegisterPage() {
  const navigate = useNavigate()
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
  })

  const onSubmit = async (data: RegisterFormData) => {
    setError(null)
    setIsLoading(true)

    try {
      await signUp(data.email, data.password, data.displayName)
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
          <h1 className="text-2xl font-bold text-primary">橘子蘋果</h1>
          <p className="mt-2 text-text-secondary">建立你的帳號</p>
        </div>

        {/* 錯誤訊息 */}
        {error && (
          <div className="mb-4 rounded-[8px] bg-red-50 p-3 text-sm text-red-600">
            {error}
          </div>
        )}

        {/* 註冊表單 */}
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <label htmlFor="displayName" className="mb-1 block text-sm font-medium text-text-primary">
              暱稱
            </label>
            <input
              id="displayName"
              type="text"
              {...register('displayName')}
              className="w-full rounded-[8px] border border-gray-300 px-4 py-3 text-text-primary focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
              placeholder="請輸入暱稱"
            />
            {errors.displayName && (
              <p className="mt-1 text-sm text-red-500">{errors.displayName.message}</p>
            )}
          </div>

          <div>
            <label htmlFor="email" className="mb-1 block text-sm font-medium text-text-primary">
              Email
            </label>
            <input
              id="email"
              type="email"
              {...register('email')}
              className="w-full rounded-[8px] border border-gray-300 px-4 py-3 text-text-primary focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
              placeholder="請輸入 Email"
            />
            {errors.email && (
              <p className="mt-1 text-sm text-red-500">{errors.email.message}</p>
            )}
          </div>

          <div>
            <label htmlFor="password" className="mb-1 block text-sm font-medium text-text-primary">
              密碼
            </label>
            <input
              id="password"
              type="password"
              {...register('password')}
              className="w-full rounded-[8px] border border-gray-300 px-4 py-3 text-text-primary focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
              placeholder="請輸入密碼（至少 6 個字元）"
            />
            {errors.password && (
              <p className="mt-1 text-sm text-red-500">{errors.password.message}</p>
            )}
          </div>

          <div>
            <label htmlFor="confirmPassword" className="mb-1 block text-sm font-medium text-text-primary">
              確認密碼
            </label>
            <input
              id="confirmPassword"
              type="password"
              {...register('confirmPassword')}
              className="w-full rounded-[8px] border border-gray-300 px-4 py-3 text-text-primary focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
              placeholder="請再次輸入密碼"
            />
            {errors.confirmPassword && (
              <p className="mt-1 text-sm text-red-500">{errors.confirmPassword.message}</p>
            )}
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full rounded-[8px] bg-coral py-3 font-medium text-white transition-shadow hover:shadow-[0_4px_16px_rgba(0,0,0,0.12)] disabled:cursor-not-allowed disabled:opacity-50"
          >
            {isLoading ? '註冊中...' : '註冊'}
          </button>
        </form>

        {/* 登入連結 */}
        <p className="mt-6 text-center text-sm text-text-secondary">
          已經有帳號？{' '}
          <Link to="/login" className="font-medium text-primary hover:underline">
            立即登入
          </Link>
        </p>
      </div>
    </div>
  )
}
