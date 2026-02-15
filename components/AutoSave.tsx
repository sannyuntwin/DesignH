'use client'

import { useEffect, useRef } from 'react'
import { useCanvasStore } from '../store/canvas-store'
import { useThrottle } from '../hooks/usePerformance'
import { saveDesignToDB, getDesignFromDB, removeDesignFromDB } from '../utils/storageUtils'
import { supabase } from '../utils/supabase'

const AUTOSAVE_KEY = 'design-editor-autosave'
const CLOUD_DESIGN_ID = 'last-design'

export default function AutoSave() {
  const lastSaveRef = useRef<string>('')
  const syncTimeoutRef = useRef<NodeJS.Timeout>()

  const { pages, currentPageId, saveToHistory } = useCanvasStore()

  // Cloud Sync Function
  const syncToCloud = async (data: any) => {
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL === 'your_supabase_project_url') {
      return
    }

    try {
      const { error } = await supabase
        .from('designs')
        .upsert({
          id: CLOUD_DESIGN_ID,
          content: data,
          updated_at: new Date().toISOString()
        })

      if (error) throw error
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
      try {
        // 1. Try to load from IndexedDB
        let savedData = await getDesignFromDB(AUTOSAVE_KEY)

        // 2. If not local, try cloud
        if (!savedData && process.env.NEXT_PUBLIC_SUPABASE_URL !== 'your_supabase_project_url') {
          console.log('Checking cloud for design data...')
          const { data, error } = await supabase
            .from('designs')
            .select('content')
            .eq('id', CLOUD_DESIGN_ID)
            .single()

          if (data?.content) {
            console.log('Found design in cloud, importing...')
            savedData = data.content
            await saveDesignToDB(AUTOSAVE_KEY, savedData)
          }
        }

        // 3. Check localStorage for migration
        if (!savedData) {
          const legacyData = localStorage.getItem(AUTOSAVE_KEY)
          if (legacyData) {
            console.log('Found legacy localStorage data, migrating to IndexedDB...')
            savedData = JSON.parse(legacyData)
            if (savedData) {
              await saveDesignToDB(AUTOSAVE_KEY, savedData)
              localStorage.removeItem(AUTOSAVE_KEY)
            }
          }
        }

        if (savedData) {
          const parsed = savedData
          const { loadState } = useCanvasStore.getState()
          loadState({
            pages: parsed.pages,
            currentPageId: parsed.currentPageId,
            selectedElement: null,
          })

          lastSaveRef.current = JSON.stringify(savedData)
          console.log('Loaded design data successfully')
        }
      } catch (error) {
        console.error('Failed to load/migrate data:', error)
      }
    }

    loadAndMigrate()
  }, [])

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
