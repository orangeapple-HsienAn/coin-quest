import { useAuthState } from 'react-firebase-hooks/auth'
import { auth } from '@/lib/firebase'

/**
 * 認證狀態 hook
 * 包裝 react-firebase-hooks 的 useAuthState
 */
export function useAuth() {
  const [user, loading, error] = useAuthState(auth)

  return {
    user,
    loading,
    error,
    isAuthenticated: !!user,
  }
}
