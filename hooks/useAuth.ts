import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'

export function useAuth(requireAuth = true, requiredRole?: string) {
  const { data: session, status } = useSession()
  const router = useRouter()

  useEffect(() => {
    if (requireAuth && status === 'loading') return // Still loading

    if (requireAuth && !session) {
      router.push('/auth/signin')
      return
    }

    if (session && !session.user.isActive) {
      router.push('/auth/error?error=AccountDisabled')
      return
    }

    if (requiredRole && session?.user.role !== requiredRole) {
      router.push('/dashboard')
      return
    }
  }, [session, status, router, requireAuth, requiredRole])

  return {
    user: session?.user,
    isLoading: status === 'loading',
    isAuthenticated: !!session,
  }
}