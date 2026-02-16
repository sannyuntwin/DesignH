import { create } from 'zustand'
import { v4 as uuidv4 } from 'uuid'

export interface DesignElement {
  id: string
  type: 'text' | 'image' | 'circle' | 'square' | 'rectangle' | 'triangle' | 'star' | 'heart'
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
  // Create initial page with A4 size (210mm x 297mm at 96 DPI = 794px x 1123px)
  const initialPage: Page = {
    id: uuidv4(),
    name: 'Page 1',
    elements: [],
    canvasWidth: 794,
    canvasHeight: 1123,
  }

  return {
    pages: [initialPage],
    currentPageId: initialPage.id,
    selectedElement: null,
    history: [JSON.parse(JSON.stringify([initialPage]))],
    historyIndex: 0,
    zoomLevel: 1,
    panOffset: { x: 0, y: 0 },
    customFonts: [],

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
      const { currentPageId, saveToHistory } = get()
      if (!currentPageId) return

      // Save state before adding element
      saveToHistory()

      const currentPage = get().pages.find(page => page.id === currentPageId)
      if (!currentPage) return

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
    },

    updateElement: (id, updates) => {
      const { currentPageId, saveToHistory } = get()
      if (!currentPageId) return

      // Save state before major changes
      if (Object.keys(updates).length > 0) {
        saveToHistory()
      }

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
    },

    deleteElement: (id) => {
      const { currentPageId, selectedElement, saveToHistory } = get()
      if (!currentPageId) return

      // Save state before deletion
      saveToHistory()

      set((state) => ({
        pages: state.pages.map(page =>
          page.id === currentPageId
            ? { ...page, elements: page.elements.filter(el => el.id !== id) }
            : page
        ),
        selectedElement: selectedElement === id ? null : selectedElement,
      }))
    },

    selectElement: (id) => {
      set({ selectedElement: id })
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
  }
})
