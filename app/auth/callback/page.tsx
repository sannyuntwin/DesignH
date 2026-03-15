'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
// --- SUPABASE COMMENTED OUT ---
// import { supabase } from '@/lib/supabase'

export default function AuthCallback() {
  const router = useRouter()

  useEffect(() => {
    const handleAuthCallback = async () => {
      // --- SUPABASE COMMENTED OUT ---
      // const { error } = await supabase.auth.getSession()
      // if (error) {
      //   console.error('Auth callback error:', error)
      //   router.push('/error')
      // } else {
      //   router.push('/')
      // }
      router.push('/')
    }

    handleAuthCallback()
  }, [router])

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
        <p className="mt-4 text-gray-600">Completing authentication...</p>
      </div>
    </div>
  )
}
