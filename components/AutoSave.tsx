'use client'

import { useEffect, useRef } from 'react'
import { useCanvasStore } from '../store/canvas-store'
import { useThrottle } from '../hooks/usePerformance'
import { saveDesignToDB, getDesignFromDB, removeDesignFromDB } from '../utils/storageUtils'
import { useAuth } from '../contexts/AuthContext'

const AUTOSAVE_KEY = 'design-editor-autosave'
const CLOUD_DESIGN_ID = 'user-autosave'

export default function AutoSave() {
  const lastSaveRef = useRef<string>('')
  const syncTimeoutRef = useRef<NodeJS.Timeout>()
  const { user, session, loading } = useAuth()

  const { pages, currentPageId, saveToHistory } = useCanvasStore()

  // Cloud Sync Function
  const syncToCloud = async (data: any) => {
    if (!user || !session || !process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL === 'your_supabase_project_url') {
      return
    }

    try {
      const response = await fetch('/api/designs', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({ content: data }),
      })

      if (!response.ok) {
        throw new Error('Failed to sync to cloud')
      }

      console.log('Synced to cloud successfully')
    } catch (error) {
      console.warn('Cloud sync failed:', error)
    }
  }

  // Throttled save function to prevent excessive saves
  const throttledSave = useThrottle(async () => {
    const dataToSave = {
      pages,
      currentPageId,
      timestamp: new Date().toISOString(),
    }

    const dataString = JSON.stringify(dataToSave)

    // Only save if data has actually changed
    if (dataString !== lastSaveRef.current) {
      try {
        // 1. Save locally (Instant)
        await saveDesignToDB(AUTOSAVE_KEY, dataToSave)
        lastSaveRef.current = dataString
        saveToHistory()
        console.log('Auto-saved to IndexedDB at', new Date().toLocaleTimeString())

        // 2. Sync to cloud (Background with debounce)
        if (syncTimeoutRef.current) clearTimeout(syncTimeoutRef.current)
        syncTimeoutRef.current = setTimeout(() => syncToCloud(dataToSave), 2000)

      } catch (error) {
        console.error('Auto-save failed:', error)
      }
    }
  }, 1000)

  useEffect(() => {
    if (pages.length > 0 && currentPageId) {
      throttledSave()
    }
  }, [pages, currentPageId, throttledSave])

  // Load saved data on mount with migration logic
  useEffect(() => {
    const loadAndMigrate = async () => {
      console.log('AutoSave: Starting load process...', { user: !!user, session: !!session })
      try {
        let savedData = null

        // If user is authenticated, try to load from cloud first
        if (user && session && process.env.NEXT_PUBLIC_SUPABASE_URL !== 'your_supabase_project_url') {
          console.log('AutoSave: Loading user designs from cloud...')
          try {
            const response = await fetch('/api/designs', {
              headers: {
                'Authorization': `Bearer ${session.access_token}`,
              },
            })

            if (response.ok) {
              const designs = await response.json()
              console.log('AutoSave: Found designs:', designs?.length || 0)
              if (designs && designs.length > 0) {
                // Get most recent design
                const latestDesign = designs[0]
                savedData = latestDesign.content
                console.log('AutoSave: Found design in cloud, loading...')
              }
            } else {
              console.log('AutoSave: No designs found in cloud')
            }
          } catch (error) {
            console.warn('AutoSave: Failed to load from cloud:', error)
          }
        } else {
          console.log('AutoSave: User not authenticated or Supabase not configured')
        }

        // If no cloud data, try local IndexedDB
        if (!savedData) {
          console.log('AutoSave: Checking local storage...')
          savedData = await getDesignFromDB(AUTOSAVE_KEY)
          if (savedData) {
            console.log('AutoSave: Found local data')
          }
        }

        // Check localStorage for migration
        if (!savedData) {
          const legacyData = localStorage.getItem(AUTOSAVE_KEY)
          if (legacyData) {
            console.log('AutoSave: Found legacy localStorage data, migrating to IndexedDB...')
            savedData = JSON.parse(legacyData)
            if (savedData) {
              await saveDesignToDB(AUTOSAVE_KEY, savedData)
              localStorage.removeItem(AUTOSAVE_KEY)
            }
          }
        }

        if (savedData) {
          console.log('AutoSave: Loading data into canvas...', savedData)
          const parsed = savedData
          const { loadState } = useCanvasStore.getState()
          loadState({
            pages: parsed.pages,
            currentPageId: parsed.currentPageId,
            selectedElement: null,
          })

          lastSaveRef.current = JSON.stringify(savedData)
          console.log('AutoSave: Design data loaded successfully')
        } else {
          console.log('AutoSave: No saved data found')
        }
      } catch (error) {
        console.error('AutoSave: Failed to load/migrate data:', error)
      }
    }

    // Only load when user authentication state is determined (not loading)
    if (!loading) {
      console.log('AutoSave: Authentication state determined, loading data...')
      loadAndMigrate()
    } else {
      console.log('AutoSave: Still loading authentication...')
    }
  }, [user, session, loading])

  // Periodic save and beforeunload
  useEffect(() => {
    const handleEvents = async () => {
      if (pages.length > 0 && currentPageId) {
        const dataToSave = {
          pages,
          currentPageId,
          timestamp: new Date().toISOString(),
        }
        await saveDesignToDB(AUTOSAVE_KEY, dataToSave)
        await syncToCloud(dataToSave)
      }
    }

    const interval = setInterval(handleEvents, 5 * 60 * 1000)
    window.addEventListener('beforeunload', handleEvents)

    return () => {
      clearInterval(interval)
      window.removeEventListener('beforeunload', handleEvents)
      if (syncTimeoutRef.current) clearTimeout(syncTimeoutRef.current)
    }
  }, [pages, currentPageId])


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

  const clearAutoSave = async () => {
    localStorage.removeItem(AUTOSAVE_KEY)
    await removeDesignFromDB(AUTOSAVE_KEY)
    console.log('Auto-save data cleared from all storage')
  }

  return {
    saveToFile,
    loadFromFile,
    clearAutoSave,
  }
}
