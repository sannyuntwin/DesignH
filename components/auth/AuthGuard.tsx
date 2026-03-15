'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'

export default function AuthGuard({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth()
  const router = useRouter()

  // Bypass authentication - go directly to main page
  useEffect(() => {
    if (!loading) {
      // Auto-login with a mock user for development
      if (!user) {
        const mockUser = {
          id: 'dev-user-123',
          email: 'dev@example.com',
          name: 'Developer'
        }
        // Set mock user in localStorage
        localStorage.setItem('auth_token', 'dev-token-123')
        localStorage.setItem('user_data', JSON.stringify(mockUser))
        // Reload to trigger auth context update
        window.location.reload()
      }
    }
  }, [user, loading, router])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    )
  }

  // Always render children - no authentication check
  return <>{children}</>
}
