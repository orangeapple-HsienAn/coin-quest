/**
 * 讀取使用者在某個 lesson 的 courseProgress。
 * users/{uid}/courseProgress/{lessonKey}.completedChapters: string[]
 */
import { useQuery } from '@tanstack/react-query'
import { doc, getDoc } from 'firebase/firestore'
import { db } from '@/lib/firebase'
import { useAuth } from '@/hooks/useAuth'

export function useCourseProgress(lessonKey: string) {
  const { user: authUser } = useAuth()

  return useQuery({
    queryKey: ['courseProgress', authUser?.uid, lessonKey],
    queryFn: async (): Promise<Set<string>> => {
      if (!authUser?.uid || !lessonKey) return new Set()
      const snap = await getDoc(doc(db, 'users', authUser.uid, 'courseProgress', lessonKey))
      if (!snap.exists()) return new Set()
      const completed = (snap.data()?.completedChapters ?? []) as string[]
      return new Set(completed)
    },
    enabled: !!authUser?.uid && !!lessonKey,
    // 全域 staleTime 是 5 分鐘，但章節完成後返回必須立刻看到新狀態
    staleTime: 0,
    refetchOnMount: 'always',
  })
}
