import { useQuery } from '@tanstack/react-query'
import { doc, getDoc } from 'firebase/firestore'
import { db } from '@/lib/firebase'
import { useAuth } from './useAuth'
import type { User } from '@/types'

/**
 * 取得當前登入用戶的 Firestore 資料
 */
export function useUser() {
  const { user: authUser } = useAuth()

  return useQuery({
    queryKey: ['user', authUser?.uid],
    queryFn: async () => {
      if (!authUser?.uid) return null

      const userDoc = await getDoc(doc(db, 'users', authUser.uid))

      if (!userDoc.exists()) return null

      return { id: userDoc.id, ...userDoc.data() } as User & { id: string }
    },
    enabled: !!authUser?.uid,
  })
}
