'use client'

import React, { useRef, useEffect, useState, memo, useCallback } from 'react'
import { useCanvasStore, DesignElement } from '../store/canvas-store'

interface DesignCanvasProps {
  width?: number
  height?: number
}

const DesignCanvas = memo(function DesignCanvas({ width, height }: DesignCanvasProps) {
  const canvasRef = useRef<HTMLDivElement>(null)
  const [isDragging, setIsDragging] = useState(false)
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 })
  const [elementStart, setElementStart] = useState({ x: 0, y: 0 })
  
  const {
    pages,
    currentPageId,
    selectedElement,
    addElement,
    updateElement,
    selectElement,
    moveElement,
    deleteElement,
    setCanvasSize,
  } = useCanvasStore()

  const currentPage = pages.find(page => page.id === currentPageId)
  const currentPageElements = currentPage?.elements || []
  const actualWidth = width || currentPage?.canvasWidth || 800
  const actualHeight = height || currentPage?.canvasHeight || 600

  useEffect(() => {
    if (width && height) {
      setCanvasSize(width, height)
    }
  }, [width, height, setCanvasSize])

  // Update canvas when current page changes
  useEffect(() => {
    // Force re-render when page changes
  }, [currentPageId, currentPageElements])

  const handleCanvasClick = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === canvasRef.current) {
      selectElement(null)
    }
  }, [selectElement])

  const handleElementMouseDown = useCallback((e: React.MouseEvent, elementId: string) => {
    e.stopPropagation()
    selectElement(elementId)
    setIsDragging(true)
    
    const element = currentPageElements.find((el: DesignElement) => el.id === elementId)
    if (element) {
      setDragStart({ x: e.clientX, y: e.clientY })
      setElementStart({ x: element.x, y: element.y })
    }
  }, [selectElement, currentPageElements])

  // Throttled mouse move for better performance
  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (isDragging && selectedElement) {
      e.preventDefault()
      const deltaX = e.clientX - dragStart.x
      const deltaY = e.clientY - dragStart.y
      
      moveElement(selectedElement, elementStart.x + deltaX, elementStart.y + deltaY)
    }
  }, [isDragging, selectedElement, dragStart, elementStart, moveElement])

  const handleMouseUp = useCallback(() => {
    setIsDragging(false)
  }, [])

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (selectedElement && e.key === 'Delete') {
      deleteElement(selectedElement)
      selectElement(null)
    }
  }, [selectedElement, deleteElement, selectElement])

  return (
    <div
      id="design-canvas"
      ref={canvasRef}
      className="canvas-container relative bg-white overflow-hidden"
      style={{ 
        width: actualWidth, 
        height: actualHeight,
        border: '2px solid #e5e7eb',
        outline: 'none',
        boxShadow: 'none'
      }}
      onClick={handleCanvasClick}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
      onKeyDown={handleKeyDown}
      tabIndex={0}
    >
      {currentPageElements
        .sort((a: DesignElement, b: DesignElement) => a.zIndex - b.zIndex)
        .map((element: DesignElement) => (
          <DesignElementComponent
            key={element.id}
            element={element}
            isSelected={selectedElement === element.id}
            onMouseDown={(e) => handleElementMouseDown(e, element.id)}
            onUpdate={(updates) => updateElement(element.id, updates)}
          />
        ))}
    </div>
  )
})

// Simple element component
interface DesignElementComponentProps {
  element: DesignElement
  isSelected: boolean
  onMouseDown: (e: React.MouseEvent) => void
  onUpdate: (updates: Partial<DesignElement>) => void
}

function DesignElementComponent({
  element,
  isSelected,
  onMouseDown,
  onUpdate,
}: DesignElementComponentProps) {
  const [isEditing, setIsEditing] = useState(false)

  const handleTextChange = useCallback((e: React.ChangeEvent<HTMLTextAreaElement>) => {
    onUpdate({ content: e.target.value })
  }, [onUpdate])

  const handleTextBlur = useCallback(() => {
    setIsEditing(false)
  }, [])

  const handleTextDoubleClick = useCallback(() => {
    if (element.type === 'text') {
      setIsEditing(true)
    }
  }, [element.type])

  const baseStyle: React.CSSProperties = {
    position: 'absolute',
    left: element.x,
    top: element.y,
    width: element.width,
    height: element.height,
    cursor: 'move',
    transform: `rotate(${element.rotation || 0}deg)`,
    zIndex: element.zIndex,
  }

  if (element.type === 'text') {
    return (
      <div
        className={`design-element ${isSelected ? 'selected' : ''}`}
        style={baseStyle}
        onMouseDown={onMouseDown}
        onDoubleClick={handleTextDoubleClick}
      >
        {isEditing ? (
          <textarea
            value={element.content || ''}
            onChange={handleTextChange}
            onBlur={handleTextBlur}
            className="w-full h-full resize-none border-none outline-none bg-transparent"
            style={{
              fontSize: element.fontSize || 16,
              fontFamily: element.fontFamily || 'Arial',
              color: element.color || '#000000',
            }}
            autoFocus
          />
        ) : (
          <div
            className="w-full h-full flex items-center justify-center"
            style={{
              fontSize: element.fontSize || 16,
              fontFamily: element.fontFamily || 'Arial',
              color: element.color || '#000000',
              whiteSpace: 'pre-wrap',
              wordBreak: 'break-word',
            }}
          >
            {element.content}
          </div>
        )}
        
        {/* Selection handles */}
        {isSelected && (
          <>
            <div
              className="absolute bottom-0 right-0 w-3 h-3 bg-blue-500 border border-white cursor-se-resize"
              style={{ transform: 'translate(50%, 50%)' }}
            />
            <div
              className="absolute top-0 left-1/2 w-3 h-3 bg-green-500 border border-white rounded-full cursor-pointer"
              style={{ transform: 'translate(-50%, -50%)' }}
            />
          </>
        )}
      </div>
    )
  }

  if (element.type === 'image') {
    return (
      <div
        className={`design-element ${isSelected ? 'selected' : ''}`}
        style={baseStyle}
        onMouseDown={onMouseDown}
      >
        <img
          src={element.src}
          alt="Design element"
          className="w-full h-full object-cover pointer-events-none"
          draggable={false}
        />
        
        {/* Selection handles */}
        {isSelected && (
          <>
            <div
              className="absolute bottom-0 right-0 w-3 h-3 bg-blue-500 border border-white cursor-se-resize"
              style={{ transform: 'translate(50%, 50%)' }}
            />
            <div
              className="absolute top-0 left-1/2 w-3 h-3 bg-green-500 border border-white rounded-full cursor-pointer"
              style={{ transform: 'translate(-50%, -50%)' }}
            />
          </>
        )}
      </div>
    )
  }

  return null
}

DesignCanvas.displayName = 'DesignCanvas'

export default DesignCanvas
