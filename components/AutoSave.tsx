'use client'

import { useEffect, useRef } from 'react'
import { useCanvasStore } from '../store/canvas-store'
import { useThrottle } from '../hooks/usePerformance'

export default function AutoSave() {
  const saveTimeoutRef = useRef<NodeJS.Timeout>()
  const lastSaveRef = useRef<string>('')

  const { pages, currentPageId, saveToHistory } = useCanvasStore()

  // Throttled save function to prevent excessive saves
  const throttledSave = useThrottle(() => {
    const dataToSave = {
      pages,
      currentPageId,
      timestamp: new Date().toISOString(),
    }
    
    const dataString = JSON.stringify(dataToSave)
    
    // Only save if data has actually changed
    if (dataString !== lastSaveRef.current) {
      localStorage.setItem('design-editor-autosave', dataString)
      lastSaveRef.current = dataString
      
      // Also save to history for undo/redo
      saveToHistory()
      
      console.log('Auto-saved at', new Date().toLocaleTimeString())
    }
  }, 1000) // Throttle to save at most once per second

  useEffect(() => {
    // Save when pages or current page changes
    if (pages.length > 0 && currentPageId) {
      throttledSave()
    }
  }, [pages, currentPageId, throttledSave])

  // Load saved data on mount
  useEffect(() => {
    const loadSavedData = () => {
      try {
        const savedData = localStorage.getItem('design-editor-autosave')
        if (savedData) {
          const parsed = JSON.parse(savedData)
          
          // Only load if saved data is not too old (24 hours)
          const savedTime = new Date(parsed.timestamp)
          const now = new Date()
          const hoursDiff = (now.getTime() - savedTime.getTime()) / (1000 * 60 * 60)
          
          if (hoursDiff < 24 && parsed.pages && parsed.currentPageId) {
            // Import the saved data into the store
            const { loadState } = useCanvasStore.getState()
            loadState({
              pages: parsed.pages,
              currentPageId: parsed.currentPageId,
              selectedElement: null,
            })
            
            console.log('Loaded auto-saved data from', savedTime.toLocaleString())
          }
        }
      } catch (error) {
        console.error('Failed to load auto-saved data:', error)
      }
    }

    loadSavedData()
  }, [])

  // Periodic save every 5 minutes (less frequent than before)
  useEffect(() => {
    const interval = setInterval(() => {
      if (pages.length > 0 && currentPageId) {
        const dataToSave = {
          pages,
          currentPageId,
          timestamp: new Date().toISOString(),
        }
        
        localStorage.setItem('design-editor-autosave', JSON.stringify(dataToSave))
        console.log('Periodic auto-save at', new Date().toLocaleTimeString())
      }
    }, 5 * 60 * 1000) // 5 minutes

    return () => clearInterval(interval)
  }, [pages, currentPageId])

  // Save before window closes
  useEffect(() => {
    const handleBeforeUnload = () => {
      const dataToSave = {
        pages,
        currentPageId,
        timestamp: new Date().toISOString(),
      }
      
      localStorage.setItem('design-editor-autosave', JSON.stringify(dataToSave))
    }

    window.addEventListener('beforeunload', handleBeforeUnload)
    return () => window.removeEventListener('beforeunload', handleBeforeUnload)
  }, [pages, currentPageId])

  // This component doesn't render anything
  return null
}

// Hook for manual save/load
export function useSaveLoad() {
  const { pages, currentPageId } = useCanvasStore()

  const saveToFile = () => {
    try {
      const dataToSave = {
        pages,
        currentPageId,
        timestamp: new Date().toISOString(),
        version: '1.0',
      }
      
      const dataString = JSON.stringify(dataToSave, null, 2)
      const blob = new Blob([dataString], { type: 'application/json' })
      const url = URL.createObjectURL(blob)
      
      const link = document.createElement('a')
      link.href = url
      link.download = `design-${new Date().toISOString().slice(0, 10)}.json`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      
      URL.revokeObjectURL(url)
      console.log('Design saved to file')
    } catch (error) {
      console.error('Failed to save design:', error)
    }
  }

  const loadFromFile = (file: File) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      
      reader.onload = (e) => {
        try {
          const data = JSON.parse(e.target?.result as string)
          
          if (data.pages && data.currentPageId) {
            const { loadState } = useCanvasStore.getState()
            loadState({
              pages: data.pages,
              currentPageId: data.currentPageId,
              selectedElement: null,
            })
            
            console.log('Design loaded from file')
            resolve(data)
          } else {
            reject(new Error('Invalid file format'))
          }
        } catch (error) {
          reject(error)
        }
      }
      
      reader.onerror = () => reject(new Error('Failed to read file'))
      reader.readAsText(file)
    })
  }

  const clearAutoSave = () => {
    localStorage.removeItem('design-editor-autosave')
    console.log('Auto-save data cleared')
  }

  return {
    saveToFile,
    loadFromFile,
    clearAutoSave,
    hasAutoSave: !!localStorage.getItem('design-editor-autosave'),
  }
}
