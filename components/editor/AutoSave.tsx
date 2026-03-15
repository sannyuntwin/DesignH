'use client'

import { useEffect, useRef } from 'react'
import { useCanvasStore } from '@/store/canvas-store'
import { useThrottle } from '@/hooks/usePerformance'
import { designsApi, Design } from '@/lib/api'
import { useAuth } from '@/contexts/AuthContext'

const AUTOSAVE_KEY = 'design-editor-autosave'
const CLOUD_DESIGN_ID = 'user-autosave'

// Type guard function to check if the result has designs
function hasDesigns(result: { designs: Design[] } | { error: string }): result is { designs: Design[] } {
  return 'designs' in result && Array.isArray(result.designs)
}

export default function AutoSave() {
  const lastSaveRef = useRef<string>('')
  const syncTimeoutRef = useRef<NodeJS.Timeout>()
  const { user, session, loading } = useAuth()

  const { pages, currentPageId, saveToHistory } = useCanvasStore()

  // Cloud Sync Function - temporarily disabled
  const syncToCloud = async (data: any) => {
    // Temporarily disabled to avoid database errors
    console.log('Cloud sync temporarily disabled - using localStorage only')
    return
    
    const userId = user?.id
    if (!userId) {
      return
    }
    
    // TypeScript knows userId is a string here since we checked for falsy

    try {
      // Try to update existing design first
      const existingDesigns = await designsApi.getDesigns({ userId })
      
      if ('designs' in existingDesigns && Array.isArray((existingDesigns as any).designs)) {
        const designs = (existingDesigns as any).designs
        if (designs.length > 0) {
          // Update the most recent design
          const latestDesign = designs[0]
          await designsApi.updateDesign(latestDesign.id, {
            name: latestDesign.name || 'Auto-saved Design',
            canvas_data: data
          })
        } else {
          // No existing designs, create new one
          await designsApi.createDesign({
            name: 'Auto-saved Design',
            canvas_data: data,
            user_id: userId as string
          })
        }
      } else {
        // Error case, still try to create new design
        console.warn('Failed to fetch existing designs:', (existingDesigns as any).error)
        await designsApi.createDesign({
          name: 'Auto-saved Design',
          canvas_data: data,
          user_id: userId as string
        })
      }

      console.log('Synced to cloud successfully')
    } catch (error) {
      console.warn('Cloud sync failed:', error)
    }
  }

  // Throttled save function to prevent excessive saves
  const throttledSave = useThrottle(async () => {
    const { pages, currentPageId, zoomLevel, panOffset, customFonts, selectedElement, selectedElements } = useCanvasStore.getState()
    
    const dataToSave = {
      pages,
      currentPageId,
      zoomLevel,
      panOffset,
      customFonts,
      selectedElement,
      selectedElements,
      timestamp: new Date().toISOString(),
    }

    const dataString = JSON.stringify(dataToSave)

    // Only save if data has actually changed
    if (dataString !== lastSaveRef.current) {
      try {
        // 1. Save locally (Instant)
        localStorage.setItem('canvas-state', dataString)
        lastSaveRef.current = dataString
        saveToHistory()
        console.log('Auto-saved to localStorage at', new Date().toLocaleTimeString())

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

  // Load saved data on mount - localStorage only for now
  useEffect(() => {
    const loadAndMigrate = async () => {
      console.log('AutoSave: Starting load process...', { user: !!user, session: !!session })
      try {
        let savedData = null

        // Try local storage
        console.log('AutoSave: Checking local storage...')
        const localData = localStorage.getItem('canvas-state') || localStorage.getItem(AUTOSAVE_KEY)
        if (localData) {
          savedData = JSON.parse(localData)
          console.log('AutoSave: Found local data')
        }

        // Cloud sync temporarily disabled to avoid database errors
        /*
        // If user is authenticated, also try to load from cloud and merge if newer
        if (user) {
          console.log('AutoSave: Loading user designs from cloud...')
          try {
            const designsResult = await designsApi.getDesigns({ userId: user.id })
            
            if ('designs' in designsResult && Array.isArray((designsResult as any).designs) && (designsResult as any).designs.length > 0) {
              const latestDesign = (designsResult as any).designs[0]
              const cloudData = latestDesign.canvas_data
              
              // Use cloud data if it's newer than local data
              if (!savedData || new Date(latestDesign.updated_at) > new Date(savedData.timestamp)) {
                savedData = cloudData
                console.log('AutoSave: Using newer cloud data')
              }
            } else {
              console.log('AutoSave: No designs found in cloud')
            }
          } catch (error) {
            console.warn('AutoSave: Failed to load from cloud:', error)
          }
        }
        */

        if (savedData && savedData.pages && Array.isArray(savedData.pages)) {
          console.log('AutoSave: Loading data into canvas...', savedData)
          const parsed = savedData
          const { loadState } = useCanvasStore.getState()
          
          // Load to saved state properly
          loadState({
            pages: parsed.pages,
            currentPageId: parsed.currentPageId || parsed.pages[0]?.id,
            selectedElement: parsed.selectedElement || null,
            selectedElements: parsed.selectedElements || [],
            zoomLevel: parsed.zoomLevel || 0.6,
            panOffset: parsed.panOffset || { x: 0, y: 0 },
            customFonts: parsed.customFonts || [],
          })

          lastSaveRef.current = JSON.stringify({
            pages: parsed.pages,
            currentPageId: parsed.currentPageId || parsed.pages[0]?.id,
            zoomLevel: parsed.zoomLevel || 0.6,
            panOffset: parsed.panOffset || { x: 0, y: 0 },
            customFonts: parsed.customFonts || [],
            selectedElement: parsed.selectedElement || null,
            selectedElements: parsed.selectedElements || [],
            timestamp: new Date().toISOString(),
          })
          console.log('AutoSave: Design data loaded successfully')
        } else {
          console.log('AutoSave: No valid saved data found')
        }
      } catch (error) {
        console.error('AutoSave: Failed to load/migrate data:', error)
      }
    }

    // Load immediately, don't wait for authentication
    console.log('AutoSave: Loading data on mount...')
    loadAndMigrate()
  }, []) // Empty dependency array - only run once on mount

  // Periodic save and beforeunload
  useEffect(() => {
    const handleEvents = async () => {
      if (pages.length > 0 && currentPageId) {
        const dataToSave = {
          pages,
          currentPageId,
          timestamp: new Date().toISOString(),
        }
        localStorage.setItem(AUTOSAVE_KEY, JSON.stringify(dataToSave))
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
    console.log('Auto-save data cleared from local storage')
  }

  return {
    saveToFile,
    loadFromFile,
    clearAutoSave,
  }
}
