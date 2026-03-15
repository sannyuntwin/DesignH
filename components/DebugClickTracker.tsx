'use client'

import { useEffect } from 'react'

export function DebugClickTracker() {
  useEffect(() => {
    const handleGlobalClick = (e: MouseEvent) => {
      console.log('Global Click Target:', e.target)
      if (e.target instanceof HTMLElement) {
        console.log('Target Classes:', e.target.className)
        console.log('Pointer Events Style:', window.getComputedStyle(e.target).pointerEvents)
      }
    }
    window.addEventListener('click', handleGlobalClick, true)
    return () => window.removeEventListener('click', handleGlobalClick, true)
  }, [])

  return null
}
