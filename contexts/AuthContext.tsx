'use client'

import { createContext, useContext, useEffect, useState } from 'react'
import { authApi } from '@/lib/api'

// Types for our user system
type User = {
  id: string
  email: string
  name?: string
}

type Session = {
  token: string
  user: User
}

type AuthError = {
  message: string
}

interface AuthContextType {
  user: User | null
  session: Session | null
  loading: boolean
  signInWithGoogle: () => Promise<{ error: AuthError | null }>
  signInWithEmail: (email: string, password: string) => Promise<{ error: AuthError | null }>
  signUpWithEmail: (email: string, password: string, displayName?: string) => Promise<{ error: AuthError | null }>
  signOut: () => Promise<{ error: AuthError | null }>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [session, setSession] = useState<Session | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Check for stored session on mount
    const token = localStorage.getItem('auth_token')
    if (token) {
      // In a real app, you'd validate the token here
      const userData = localStorage.getItem('user_data')
      if (userData) {
        try {
          const user = JSON.parse(userData)
          setUser(user)
          setSession({ token, user })
        } catch (error) {
          console.error('Failed to parse stored user data:', error)
          localStorage.removeItem('auth_token')
          localStorage.removeItem('user_data')
        }
      }
    } else {
      // Auto-login with mock user for development
      const mockUser = {
        id: 'dev-user-123',
        email: 'dev@example.com',
        name: 'Developer'
      }
      const mockToken = 'dev-token-123'
      setUser(mockUser)
      setSession({ token: mockToken, user: mockUser })
      localStorage.setItem('auth_token', mockToken)
      localStorage.setItem('user_data', JSON.stringify(mockUser))
    }
    setLoading(false)
  }, [])

  const signInWithGoogle = async () => {
    // TODO: Implement OAuth with Google
    console.warn('Google sign in not implemented yet.')
    return { error: { message: 'Google sign in not implemented' } }
  }

  const signInWithEmail = async (email: string, password: string) => {
    try {
      const result = await authApi.login({ email, password })
      
      if ('error' in result) {
        return { error: { message: result.error } }
      }
      
      setUser(result.user)
      setSession({ token: result.session, user: result.user })
      
      // Store in localStorage
      localStorage.setItem('auth_token', result.session)
      localStorage.setItem('user_data', JSON.stringify(result.user))
      
      return { error: null }
    } catch (error) {
      return { error: { message: 'Login failed' } }
    }
  }

  const signUpWithEmail = async (email: string, password: string, displayName?: string) => {
    try {
      const result = await authApi.signup({ 
        email, 
        password, 
        name: displayName 
      })
      
      if ('error' in result) {
        return { error: { message: result.error } }
      }
      
      setUser(result.user)
      setSession({ token: result.session, user: result.user })
      
      // Store in localStorage
      localStorage.setItem('auth_token', result.session)
      localStorage.setItem('user_data', JSON.stringify(result.user))
      
      return { error: null }
    } catch (error) {
      return { error: { message: 'Signup failed' } }
    }
  }

  const signOut = async () => {
    try {
      if (session?.token) {
        await authApi.logout(session.token)
      }
    } catch (error) {
      console.warn('Logout API call failed:', error)
    }
    
    // Clear local state regardless of API call success
    setUser(null)
    setSession(null)
    localStorage.removeItem('auth_token')
    localStorage.removeItem('user_data')
    
    return { error: null }
  }

  const value = {
    user,
    session,
    loading,
    signInWithGoogle,
    signInWithEmail,
    signUpWithEmail,
    signOut,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
