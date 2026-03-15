'use client'

import { useState } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { LogOut, User } from 'lucide-react'

export default function AuthButton() {
  const { user, signInWithGoogle, signOut, loading } = useAuth()
  const [showDropdown, setShowDropdown] = useState(false)
  const [isSigningOut, setIsSigningOut] = useState(false)

  // Hide auth button for development - always show logged in state
  if (loading) {
    return (
      <div className="relative">
        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-100 to-purple-100 animate-pulse flex items-center justify-center">
          <div className="w-5 h-5 bg-white rounded-full animate-pulse" />
        </div>
      </div>
    )
  }

  // Always show as logged in with mock user
  return (
    <div className="relative">
      <button
        onClick={() => setShowDropdown(!showDropdown)}
        className="group relative w-10 h-10 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-lg shadow-indigo-500/25 hover:shadow-xl hover:shadow-indigo-500/30 transition-all duration-200 hover:scale-105 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
        title="User menu"
      >
        <span className="text-white font-semibold text-sm">
          {user?.email?.charAt(0).toUpperCase() || 'D'}
        </span>
        {/* Status indicator */}
        <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-400 border-2 border-white rounded-full" />
      </button>

      {/* Dropdown Menu */}
      {showDropdown && (
        <>
          {/* Backdrop */}
          <div 
            className="fixed inset-0 z-40" 
            onClick={() => setShowDropdown(false)}
          />
          
          {/* Dropdown Content */}
          <div className="absolute right-0 top-full mt-2 w-72 bg-white rounded-2xl shadow-2xl border border-gray-100/50 overflow-hidden z-50 animate-slide-up">
            {/* User Info Header */}
            <div className="bg-gradient-to-r from-indigo-50 to-purple-50 p-4 border-b border-gray-100">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-lg">
                  <span className="text-white font-bold text-lg">
                    {user?.email?.charAt(0).toUpperCase() || 'D'}
                  </span>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-semibold text-gray-900 truncate">
                    {user?.name || 'Developer'}
                  </div>
                  <div className="text-sm text-gray-500 truncate">
                    {user?.email || 'dev@example.com'}
                  </div>
                  <div className="flex items-center gap-1 mt-1">
                    <div className="w-2 h-2 bg-green-400 rounded-full" />
                    <span className="text-xs text-green-600 font-medium">Online</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Menu Items */}
            <div className="p-2">
              <button className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-gray-50 transition-colors text-left">
                <User className="w-4 h-4 text-gray-400" />
                <div className="flex-1">
                  <div className="text-sm font-medium text-gray-900">Profile Settings</div>
                  <div className="text-xs text-gray-500">Manage your account</div>
                </div>
              </button>
              
              <div className="border-t border-gray-100 my-2" />
              
              <button
                onClick={async () => {
                  setIsSigningOut(true)
                  try {
                    await signOut()
                    setShowDropdown(false)
                  } catch (error) {
                    console.error('Sign out error:', error)
                  } finally {
                    setIsSigningOut(false)
                  }
                }}
                disabled={isSigningOut}
                className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-red-50 transition-colors text-left group disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSigningOut ? (
                  <div className="w-4 h-4 animate-spin rounded-full border-2 border-red-500 border-t-transparent" />
                ) : (
                  <LogOut className="w-4 h-4 text-red-500 group-hover:text-red-600" />
                )}
                <div className="flex-1">
                  <div className="text-sm font-medium text-red-600">
                    {isSigningOut ? 'Signing out...' : 'Sign out'}
                  </div>
                  <div className="text-xs text-gray-500">See you later!</div>
                </div>
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  )
}
