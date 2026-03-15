'use client'

import React from 'react'
import { useTheme } from '@/contexts/ThemeContext'
import { Sun, Moon } from 'lucide-react'

export default function ThemeToggle() {
  const { theme, toggleTheme } = useTheme()
  const [mounted, setMounted] = React.useState(false)

  React.useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) {
    return <div className="w-10 h-10 rounded-lg bg-surface-muted animate-pulse" />
  }

  return (
    <button
      onClick={toggleTheme}
      className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-secondary hover:bg-surface-muted hover:text-slate-900 transition-all duration-200"
      title={theme === 'light' ? 'Switch to dark mode' : 'Switch to light mode'}
    >
      {theme === 'light' ? (
        <>
          <Moon className="w-4 h-4" />
          <span className="text-sm">Dark</span>
        </>
      ) : (
        <>
          <Sun className="w-4 h-4" />
          <span className="text-sm">Light</span>
        </>
      )}
    </button>
  )
}
