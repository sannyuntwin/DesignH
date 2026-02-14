'use client'

import React from 'react'
import { 
  AlignLeft, 
  AlignCenter, 
  AlignRight, 
  ArrowUp, 
  ArrowDown, 
  Minus,
  GripVertical,
  GripHorizontal
} from 'lucide-react'
import { useCanvasStore } from '../store/canvas-store'

export default function AlignmentTools() {
  const { 
    pages, 
    selectedElement, 
    updateElement
  } = useCanvasStore()

  const currentPage = pages.find(page => page.id === useCanvasStore.getState().currentPageId)
  const currentPageElements = currentPage?.elements || []
  const hasSelection = selectedElement && currentPageElements.some(el => el.id === selectedElement)

  // Get all selected elements (for now, just one, but prepared for multi-select)
  const getSelectedElements = () => {
    return selectedElement ? currentPageElements.filter(el => el.id === selectedElement) : []
  }

  // Alignment functions
  const alignLeft = () => {
    const elements = getSelectedElements()
    if (elements.length === 0) return
    
    const minLeft = Math.min(...elements.map(el => el.x))
    elements.forEach(el => {
      updateElement(el.id, { x: minLeft })
    })
  }

  const alignCenter = () => {
    const elements = getSelectedElements()
    if (elements.length === 0) return
    
    const canvasWidth = currentPage?.canvasWidth || 800
    const centerX = canvasWidth / 2
    elements.forEach(el => {
      updateElement(el.id, { x: centerX - el.width / 2 })
    })
  }

  const alignRight = () => {
    const elements = getSelectedElements()
    if (elements.length === 0) return
    
    const maxRight = Math.max(...elements.map(el => el.x + el.width))
    elements.forEach(el => {
      updateElement(el.id, { x: maxRight - el.width })
    })
  }

  const alignTop = () => {
    const elements = getSelectedElements()
    if (elements.length === 0) return
    
    const minTop = Math.min(...elements.map(el => el.y))
    elements.forEach(el => {
      updateElement(el.id, { y: minTop })
    })
  }

  const alignMiddle = () => {
    const elements = getSelectedElements()
    if (elements.length === 0) return
    
    const canvasHeight = currentPage?.canvasHeight || 600
    const centerY = canvasHeight / 2
    elements.forEach(el => {
      updateElement(el.id, { y: centerY - el.height / 2 })
    })
  }

  const alignBottom = () => {
    const elements = getSelectedElements()
    if (elements.length === 0) return
    
    const maxBottom = Math.max(...elements.map(el => el.y + el.height))
    elements.forEach(el => {
      updateElement(el.id, { y: maxBottom - el.height })
    })
  }

  // Distribution functions (for multiple elements)
  const distributeHorizontal = () => {
    const elements = getSelectedElements()
    if (elements.length < 3) return
    
    const sortedElements = [...elements].sort((a, b) => a.x - b.x)
    const totalWidth = sortedElements[sortedElements.length - 1].x - sortedElements[0].x
    const spacing = totalWidth / (sortedElements.length - 1)
    
    sortedElements.forEach((el, index) => {
      if (index > 0 && index < sortedElements.length - 1) {
        updateElement(el.id, { x: sortedElements[0].x + (spacing * index) })
      }
    })
  }

  const distributeVertical = () => {
    const elements = getSelectedElements()
    if (elements.length < 3) return
    
    const sortedElements = [...elements].sort((a, b) => a.y - b.y)
    const totalHeight = sortedElements[sortedElements.length - 1].y - sortedElements[0].y
    const spacing = totalHeight / (sortedElements.length - 1)
    
    sortedElements.forEach((el, index) => {
      if (index > 0 && index < sortedElements.length - 1) {
        updateElement(el.id, { y: sortedElements[0].y + (spacing * index) })
      }
    })
  }

  if (!hasSelection) {
    return null
  }

  return (
    <div className="flex items-center gap-1 p-2 bg-white border border-gray-200 rounded-lg">
      {/* Horizontal Alignment */}
      <div className="flex items-center gap-1 pr-2 border-r border-gray-200">
        <button
          onClick={alignLeft}
          className="p-1.5 hover:bg-gray-100 rounded transition-colors"
          title="Align Left"
        >
          <AlignLeft size={14} />
        </button>
        <button
          onClick={alignCenter}
          className="p-1.5 hover:bg-gray-100 rounded transition-colors"
          title="Align Center"
        >
          <AlignCenter size={14} />
        </button>
        <button
          onClick={alignRight}
          className="p-1.5 hover:bg-gray-100 rounded transition-colors"
          title="Align Right"
        >
          <AlignRight size={14} />
        </button>
      </div>

      {/* Vertical Alignment */}
      <div className="flex items-center gap-1 pr-2 border-r border-gray-200">
        <button
          onClick={alignTop}
          className="p-1.5 hover:bg-gray-100 rounded transition-colors"
          title="Align Top"
        >
          <ArrowUp size={14} />
        </button>
        <button
          onClick={alignMiddle}
          className="p-1.5 hover:bg-gray-100 rounded transition-colors"
          title="Align Middle"
        >
          <Minus size={14} />
        </button>
        <button
          onClick={alignBottom}
          className="p-1.5 hover:bg-gray-100 rounded transition-colors"
          title="Align Bottom"
        >
          <ArrowDown size={14} />
        </button>
      </div>

      {/* Distribution */}
      <div className="flex items-center gap-1">
        <button
          onClick={distributeHorizontal}
          className="p-1.5 hover:bg-gray-100 rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          title="Distribute Horizontally"
          disabled={getSelectedElements().length < 3}
        >
          <GripHorizontal size={14} />
        </button>
        <button
          onClick={distributeVertical}
          className="p-1.5 hover:bg-gray-100 rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          title="Distribute Vertically"
          disabled={getSelectedElements().length < 3}
        >
          <GripVertical size={14} />
        </button>
      </div>
    </div>
  )
}
