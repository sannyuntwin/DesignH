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

interface CanvasStore {
  elements: DesignElement[]
  selectedElement: string | null
  canvasWidth: number
  canvasHeight: number
  
  // Actions
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
}

export const useCanvasStore = create<CanvasStore>((set, get) => ({
  elements: [],
  selectedElement: null,
  canvasWidth: 800,
  canvasHeight: 600,

  addElement: (element) => {
    const newElement: DesignElement = {
      ...element,
      id: uuidv4(),
      zIndex: Math.max(...get().elements.map(e => e.zIndex), 0) + 1,
    }
    set((state) => ({
      elements: [...state.elements, newElement],
      selectedElement: newElement.id,
    }))
  },

  updateElement: (id, updates) => {
    set((state) => ({
      elements: state.elements.map((el) =>
        el.id === id ? { ...el, ...updates } : el
      ),
    }))
  },

  deleteElement: (id) => {
    set((state) => ({
      elements: state.elements.filter((el) => el.id !== id),
      selectedElement: state.selectedElement === id ? null : state.selectedElement,
    }))
  },

  selectElement: (id) => {
    set({ selectedElement: id })
  },

  moveElement: (id, x, y) => {
    set((state) => ({
      elements: state.elements.map((el) =>
        el.id === id ? { ...el, x, y } : el
      ),
    }))
  },

  resizeElement: (id, width, height) => {
    set((state) => ({
      elements: state.elements.map((el) =>
        el.id === id ? { ...el, width, height } : el
      ),
    }))
  },

  clearCanvas: () => {
    set({ elements: [], selectedElement: null })
  },

  setCanvasSize: (width, height) => {
    set({ canvasWidth: width, canvasHeight: height })
  },

  bringToFront: (id) => {
    const { elements } = get()
    const maxZIndex = Math.max(...elements.map(e => e.zIndex))
    set((state) => ({
      elements: state.elements.map((el) =>
        el.id === id ? { ...el, zIndex: maxZIndex + 1 } : el
      ),
    }))
  },

  sendToBack: (id) => {
    const { elements } = get()
    const minZIndex = Math.min(...elements.map(e => e.zIndex))
    set((state) => ({
      elements: state.elements.map((el) =>
        el.id === id ? { ...el, zIndex: minZIndex - 1 } : el
      ),
    }))
  },
}))
