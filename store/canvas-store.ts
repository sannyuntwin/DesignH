import { create } from 'zustand'
import { v4 as uuidv4 } from 'uuid'

export interface DesignElement {
  id: string
  type: 'text' | 'image'
  x: number
  y: number
  width: number
  height: number
  content?: string
  src?: string
  fontSize?: number
  fontFamily?: string
  color?: string
  rotation?: number
  zIndex: number
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
  moveElement: (id: string, x: number, y: number) => void
  resizeElement: (id: string, width: number, height: number) => void
  clearCanvas: () => void
  setCanvasSize: (width: number, height: number) => void
  bringToFront: (id: string) => void
  sendToBack: (id: string) => void
  
  // Undo/redo actions
  undo: () => void
  redo: () => void
  saveToHistory: () => void
  
  // Load/save actions
  loadState: (state: Partial<CanvasStore>) => void
}

export const useCanvasStore = create<CanvasStore>((set, get) => {
  // Create initial page
  const initialPage: Page = {
    id: uuidv4(),
    name: 'Page 1',
    elements: [],
    canvasWidth: 800,
    canvasHeight: 600,
  }

  return {
    pages: [initialPage],
    currentPageId: initialPage.id,
    selectedElement: null,
    history: [JSON.parse(JSON.stringify([initialPage]))],
    historyIndex: 0,

    // Page management actions
    addPage: (name = `Page ${get().pages.length + 1}`) => {
      const newPage: Page = {
        id: uuidv4(),
        name,
        elements: [],
        canvasWidth: 800,
        canvasHeight: 600,
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
      const { currentPageId } = get()
      if (!currentPageId) return

      const currentPage = get().pages.find(page => page.id === currentPageId)
      if (!currentPage) return

      const newElement: DesignElement = {
        ...element,
        id: uuidv4(),
        zIndex: Math.max(...currentPage.elements.map(e => e.zIndex), 0) + 1,
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
    },

    selectElement: (id) => {
      set({ selectedElement: id })
    },

    moveElement: (id, x, y) => {
      const { currentPageId } = get()
      if (!currentPageId) return

      set((state) => ({
        pages: state.pages.map(page =>
          page.id === currentPageId
            ? {
                ...page,
                elements: page.elements.map(el =>
                  el.id === id ? { ...el, x, y } : el
                ),
              }
            : page
        ),
      }))
    },

    resizeElement: (id, width, height) => {
      const { currentPageId } = get()
      if (!currentPageId) return

      set((state) => ({
        pages: state.pages.map(page =>
          page.id === currentPageId
            ? {
                ...page,
                elements: page.elements.map(el =>
                  el.id === id ? { ...el, width, height } : el
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
      }
    },

    // Load/save actions
    loadState: (state) => {
      set(state)
    },
  }
})
