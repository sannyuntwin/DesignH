import { create } from 'zustand'
import { v4 as uuidv4 } from 'uuid'

// Helper functions for localStorage
const loadStateFromStorage = () => {
  if (typeof window !== 'undefined') {
    try {
      const savedState = localStorage.getItem('canvas-state')
      if (savedState) {
        return JSON.parse(savedState)
      }
    } catch (error) {
      console.error('Failed to load state from localStorage:', error)
    }
  }
  return null
}

const saveStateToStorage = (state: any) => {
  if (typeof window !== 'undefined') {
    try {
      // Save only essential data, not entire history
      const stateToSave = {
        pages: state.pages,
        currentPageId: state.currentPageId,
        selectedElement: state.selectedElement,
        selectedElements: state.selectedElements,
        zoomLevel: state.zoomLevel,
        panOffset: state.panOffset,
        customFonts: state.customFonts,
        // Don't save history - it will be rebuilt from current state
      }
      localStorage.setItem('canvas-state', JSON.stringify(stateToSave))
    } catch (error) {
      console.error('Failed to save state to localStorage:', error)
    }
  }
}

export interface DesignElement {
  id: string
  type: 'text' | 'image' | 'circle' | 'square' | 'rectangle' | 'triangle' | 'star' | 'heart' | 'oval'
  x: number
  y: number
  width: number
  height: number
  content?: string
  src?: string
  fontSize?: number
  fontFamily?: string
  fontWeight?: string
  fontStyle?: string
  textAlign?: 'left' | 'center' | 'right'
  verticalAlign?: 'top' | 'middle' | 'bottom'
  color?: string
  backgroundColor?: string
  gradient?: {
    colors: string[]
    direction: 'horizontal' | 'vertical' | 'diagonal'
  }
  zIndex: number
  rotation?: number
  opacity?: number
  // Text spacing properties
  lineHeight?: number
  letterSpacing?: number
  wordSpacing?: number
  textIndent?: number
  marginTop?: number
  marginBottom?: number
  marginLeft?: number
  marginRight?: number
  paddingTop?: number
  paddingBottom?: number
  paddingLeft?: number
  paddingRight?: number
  // Advanced text effects
  boxShadow?: string
  textShadow?: string
  textStroke?: string
  textStrokeColor?: string
  WebkitBackgroundClip?: string
  WebkitTextFillColor?: string
  background?: string
  // Special text properties
  isCurved?: boolean
  curvePath?: string
  is3D?: boolean
  isNeon?: boolean
}

export interface Page {
  id: string
  name: string
  elements: DesignElement[]
  canvasWidth: number
  canvasHeight: number
}

interface CanvasStore {
  pages: Page[]
  currentPageId: string | null
  selectedElement: string | null
  selectedElements: string[] // For multi-select functionality

  // History for undo/redo
  history: Page[][]
  historyIndex: number

  // Zoom controls
  zoomLevel: number
  panOffset: { x: number; y: number }

  // Page management actions
  addPage: (name?: string) => void
  deletePage: (id: string) => void
  duplicatePage: (id: string) => void
  setCurrentPage: (id: string) => void
  updatePageName: (id: string, name: string) => void

  // Element actions (operate on current page)
  addElement: (element: Omit<DesignElement, 'id' | 'zIndex'>) => void
  updateElement: (id: string, updates: Partial<DesignElement>) => void
  deleteElement: (id: string) => void
  selectElement: (id: string | null) => void
  // Multi-select actions
  selectMultipleElements: (ids: string[]) => void
  addToSelection: (id: string) => void
  removeFromSelection: (id: string) => void
  clearSelection: () => void
  deleteSelectedElements: () => void
  updateElementPosition: (id: string, x: number, y: number) => void
  resizeElement: (id: string, width: number, height: number) => void
  clearCanvas: () => void
  setCanvasSize: (width: number, height: number) => void
  bringToFront: (id: string) => void
  sendToBack: (id: string) => void

  // Zoom actions
  setZoomLevel: (zoom: number) => void
  zoomIn: () => void
  zoomOut: () => void
  resetZoom: () => void
  setPanOffset: (x: number, y: number) => void
  panTo: (x: number, y: number) => void

  // Snapping
  snapGuides: { x: number | null; y: number | null }
  setSnapGuides: (x: number | null, y: number | null) => void

  // Undo/redo actions
  undo: () => void
  redo: () => void
  saveToHistory: () => void

  // Load/save actions
  loadState: (state: Partial<CanvasStore>) => void

  // Custom fonts loaded at runtime
  customFonts: string[]
  addCustomFont: (fontFamily: string) => void
}

export const useCanvasStore = create<CanvasStore>((set, get) => {
  // Load saved state from localStorage
  const savedState = loadStateFromStorage()
  
  // Create initial page with A4 size (210mm x 297mm at 96 DPI = 794px x 1123px)
  const initialPage: Page = {
    id: uuidv4(),
    name: 'Page 1',
    elements: [],
    canvasWidth: 794,
    canvasHeight: 1123,
  }

  return {
    pages: savedState?.pages || [initialPage],
    currentPageId: savedState?.currentPageId || initialPage.id,
    selectedElement: savedState?.selectedElement || null,
    selectedElements: savedState?.selectedElements || [],
    history: savedState?.pages ? [JSON.parse(JSON.stringify(savedState.pages))] : [JSON.parse(JSON.stringify(initialPage))],
    historyIndex: savedState?.pages ? 0 : 0,
    zoomLevel: savedState?.zoomLevel || 0.6,
    panOffset: savedState?.panOffset || { x: 0, y: 0 },
    customFonts: savedState?.customFonts || [],
    snapGuides: { x: null, y: null },

    addCustomFont: (fontFamily) => {
      set((state) => ({
        customFonts: state.customFonts.includes(fontFamily)
          ? state.customFonts
          : [...state.customFonts, fontFamily]
      }))
    },

    // Page management actions
    addPage: (name = `Page ${get().pages.length + 1}`) => {
      const newPage: Page = {
        id: uuidv4(),
        name,
        elements: [],
        canvasWidth: 794, // A4 width at 96 DPI
        canvasHeight: 1123, // A4 height at 96 DPI
      }

      set((state) => ({
        pages: [...state.pages, newPage],
        currentPageId: newPage.id,
        selectedElement: null,
      }))
    },

    deletePage: (id) => {
      const { pages, currentPageId } = get()
      if (pages.length <= 1) return // Can't delete last page

      const newPages = pages.filter(page => page.id !== id)
      const newCurrentPageId = currentPageId === id ? newPages[0].id : currentPageId

      set({
        pages: newPages,
        currentPageId: newCurrentPageId,
        selectedElement: null,
      })
    },

    duplicatePage: (id) => {
      const { pages } = get()
      const pageToDuplicate = pages.find(page => page.id === id)
      if (!pageToDuplicate) return

      const duplicatedPage: Page = {
        ...pageToDuplicate,
        id: uuidv4(),
        name: `${pageToDuplicate.name} (Copy)`,
        elements: pageToDuplicate.elements.map(el => ({
          ...el,
          id: uuidv4(),
        })),
      }

      set((state) => ({
        pages: [...state.pages, duplicatedPage],
        currentPageId: duplicatedPage.id,
        selectedElement: null,
      }))
    },

    setCurrentPage: (id) => {
      set({
        currentPageId: id,
        selectedElement: null,
      })
    },

    updatePageName: (id, name) => {
      set((state) => ({
        pages: state.pages.map(page =>
          page.id === id ? { ...page, name } : page
        ),
      }))
    },

    // Element actions (operate on current page)
    addElement: (element) => {
      console.log('addElement called with:', element)
      const { currentPageId, pages } = get()
      
      let targetPageId = currentPageId
      
      if (!targetPageId && pages.length > 0) {
        console.warn('addElement: currentPageId is null, falling back to first page')
        targetPageId = pages[0].id
      }
      
      if (!targetPageId) {
        console.error('addElement: No page ID found and no pages available')
        return
      }

      const currentPage = pages.find(page => page.id === targetPageId)
      if (!currentPage) {
        console.error(`addElement: Current page not found for ID: ${targetPageId}. Available pages:`, pages.map(p => p.id))
        return
      }

      const maxZIndex = Math.max(0, ...currentPage.elements.map(e => e.zIndex))

      const newElement: DesignElement = {
        ...element,
        id: uuidv4(),
        zIndex: maxZIndex + 1,
      }

      set((state) => ({
        pages: state.pages.map(page =>
          page.id === currentPageId
            ? { ...page, elements: [...page.elements, newElement] }
            : page
        ),
        selectedElement: newElement.id,
      }))
      
      // Save state after adding element and save to localStorage
      const { saveToHistory } = get()
      saveToHistory()
      saveStateToStorage(get())
    },

    updateElement: (id, updates) => {
      const { currentPageId } = get()
      if (!currentPageId) return

      set((state) => ({
        pages: state.pages.map(page =>
          page.id === currentPageId
            ? {
              ...page,
              elements: page.elements.map(el =>
                el.id === id ? { ...el, ...updates } : el
              ),
            }
            : page
        ),
      }))
      
      // Save state after update and save to localStorage
      if (Object.keys(updates).length > 0) {
        const { saveToHistory } = get()
        saveToHistory()
        saveStateToStorage(get())
      }
    },

    deleteElement: (id) => {
      const { currentPageId, selectedElement } = get()
      if (!currentPageId) return

      set((state) => ({
        pages: state.pages.map(page =>
          page.id === currentPageId
            ? { ...page, elements: page.elements.filter(el => el.id !== id) }
            : page
        ),
        selectedElement: selectedElement === id ? null : selectedElement,
      }))
      
      // Save state after deletion and save to localStorage
      const { saveToHistory } = get()
      saveToHistory()
      saveStateToStorage(get())
    },

    selectElement: (id) => {
      set({ selectedElement: id, selectedElements: id ? [id] : [] })
      
      // Save to localStorage
      saveStateToStorage(get())
    },

    // Multi-select actions
    selectMultipleElements: (ids) => {
      set({ selectedElements: ids, selectedElement: ids.length > 0 ? ids[0] : null })
      
      // Save to localStorage
      saveStateToStorage(get())
    },

    addToSelection: (id) => {
      const { selectedElements } = get()
      if (!selectedElements.includes(id)) {
        set({ 
          selectedElements: [...selectedElements, id],
          selectedElement: id 
        })
        
        // Save to localStorage
        saveStateToStorage(get())
      }
    },

    removeFromSelection: (id) => {
      const { selectedElements } = get()
      const newSelectedElements = selectedElements.filter(selectedId => selectedId !== id)
      set({ 
        selectedElements: newSelectedElements,
        selectedElement: newSelectedElements.length > 0 ? newSelectedElements[0] : null
      })
      
      // Save to localStorage
      saveStateToStorage(get())
    },

    clearSelection: () => {
      set({ selectedElements: [], selectedElement: null })
      
      // Save to localStorage
      saveStateToStorage(get())
    },

    deleteSelectedElements: () => {
      const { currentPageId, selectedElements } = get()
      if (!currentPageId || selectedElements.length === 0) return

      set((state) => ({
        pages: state.pages.map(page =>
          page.id === currentPageId
            ? { ...page, elements: page.elements.filter(el => !selectedElements.includes(el.id)) }
            : page
        ),
        selectedElements: [],
        selectedElement: null,
      }))
      
      // Save state after deletion and save to localStorage
      const { saveToHistory } = get()
      saveToHistory()
      saveStateToStorage(get())
    },

    updateElementPosition: (id, x, y) => {
      const { currentPageId } = get()
      if (!currentPageId) return

      set((state) => {
        const updatedPages = state.pages.map(page =>
          page.id === currentPageId
            ? {
              ...page,
              elements: page.elements.map(el =>
                el.id === id
                  ? { ...el, x: x, y: y }
                  : el
              ),
            }
            : page
        )
        return { pages: updatedPages }
      })
      
      // Save to localStorage
      saveStateToStorage(get())
    },

    resizeElement: (id, width, height) => {
      const { currentPageId, saveToHistory } = get()
      if (!currentPageId) return

      // Save state before resizing
      saveToHistory()

      set((state) => ({
        pages: state.pages.map(page =>
          page.id === currentPageId
            ? {
              ...page,
              elements: page.elements.map(el =>
                el.id === id ? { ...el, width, height, src: el.src } : el
              ),
            }
            : page
        ),
      }))
      
      // Save to localStorage
      saveStateToStorage(get())
    },

    clearCanvas: () => {
      const { currentPageId } = get()
      if (!currentPageId) return

      set((state) => ({
        pages: state.pages.map(page =>
          page.id === currentPageId
            ? { ...page, elements: [] }
            : page
        ),
        selectedElement: null,
      }))
    },

    setCanvasSize: (width, height) => {
      const { currentPageId } = get()
      if (!currentPageId) return

      set((state) => ({
        pages: state.pages.map(page =>
          page.id === currentPageId
            ? { ...page, canvasWidth: width, canvasHeight: height }
            : page
        ),
      }))
    },

    bringToFront: (id) => {
      const { currentPageId } = get()
      if (!currentPageId) return

      const currentPage = get().pages.find(page => page.id === currentPageId)
      if (!currentPage) return

      const maxZIndex = Math.max(...currentPage.elements.map(e => e.zIndex))

      set((state) => ({
        pages: state.pages.map(page =>
          page.id === currentPageId
            ? {
              ...page,
              elements: page.elements.map(el =>
                el.id === id ? { ...el, zIndex: maxZIndex + 1 } : el
              ),
            }
            : page
        ),
      }))
    },

    sendToBack: (id) => {
      const { currentPageId } = get()
      if (!currentPageId) return

      const currentPage = get().pages.find(page => page.id === currentPageId)
      if (!currentPage) return

      const minZIndex = Math.min(...currentPage.elements.map(e => e.zIndex))

      set((state) => ({
        pages: state.pages.map(page =>
          page.id === currentPageId
            ? {
              ...page,
              elements: page.elements.map(el =>
                el.id === id ? { ...el, zIndex: minZIndex - 1 } : el
              ),
            }
            : page
        ),
      }))
    },

    // Undo/redo actions
    saveToHistory: () => {
      const { pages, history, historyIndex } = get()
      const newHistory = history.slice(0, historyIndex + 1)
      newHistory.push(JSON.parse(JSON.stringify(pages)))

      // Keep only last 50 states to prevent memory issues
      if (newHistory.length > 50) {
        newHistory.shift()
      }

      set({
        history: newHistory,
        historyIndex: newHistory.length - 1,
      })
    },

    undo: () => {
      const { history, historyIndex } = get()
      if (historyIndex > 0) {
        const previousState = history[historyIndex - 1]
        set({
          pages: JSON.parse(JSON.stringify(previousState)),
          historyIndex: historyIndex - 1,
          selectedElement: null,
        })
        // Visual feedback
        console.log('Undo: Restored previous state')
      }
    },

    redo: () => {
      const { history, historyIndex } = get()
      if (historyIndex < history.length - 1) {
        const nextState = history[historyIndex + 1]
        set({
          pages: JSON.parse(JSON.stringify(nextState)),
          historyIndex: historyIndex + 1,
          selectedElement: null,
        })
        // Visual feedback
        console.log('Redo: Restored next state')
      }
    },

    // Load/save actions
    loadState: (state) => {
      set(state)
    },

    // Zoom actions
    setZoomLevel: (zoom) => {
      set({ zoomLevel: Math.max(0.1, Math.min(5, zoom)) })
    },

    zoomIn: () => {
      set((state) => ({
        zoomLevel: Math.min(5, state.zoomLevel + 0.1)
      }))
    },

    zoomOut: () => {
      set((state) => ({
        zoomLevel: Math.max(0.1, state.zoomLevel - 0.1)
      }))
    },

    resetZoom: () => {
      set({ zoomLevel: 1, panOffset: { x: 0, y: 0 } })
    },

    setPanOffset: (x, y) => {
      set({ panOffset: { x, y } })
    },

    panTo: (x, y) => {
      set((state) => ({
        panOffset: { x: state.panOffset.x + x, y: state.panOffset.y + y }
      }))
    },

    setSnapGuides: (x, y) => {
      set({ snapGuides: { x, y } })
    },
  }
})
