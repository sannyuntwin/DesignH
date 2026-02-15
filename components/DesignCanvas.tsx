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
  const [isResizing, setIsResizing] = useState(false)
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 })
  const [elementStart, setElementStart] = useState({ x: 0, y: 0 })
  const [resizeStart, setResizeStart] = useState({ width: 0, height: 0, x: 0, y: 0 })

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
    resizeElement,
    zoomLevel,
    panOffset,
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

  const handleResizeMouseDown = useCallback((e: React.MouseEvent, elementId: string) => {
    e.stopPropagation()
    e.preventDefault()
    setIsResizing(true)
    selectElement(elementId)

    const element = currentPageElements.find((el: DesignElement) => el.id === elementId)
    if (element) {
      setResizeStart({
        width: element.width,
        height: element.height,
        x: e.clientX,
        y: e.clientY
      })
    }
  }, [selectElement, currentPageElements])

  // Touch event handlers
  const handleTouchStart = useCallback((e: React.TouchEvent, elementId: string) => {
    e.stopPropagation()
    selectElement(elementId)
    setIsDragging(true)

    const touch = e.touches[0]
    const element = currentPageElements.find((el: DesignElement) => el.id === elementId)
    if (element && touch) {
      setDragStart({ x: touch.clientX, y: touch.clientY })
      setElementStart({ x: element.x, y: element.y })
    }
  }, [selectElement, currentPageElements])

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    if (isDragging && selectedElement) {
      e.preventDefault()
      const touch = e.touches[0]
      if (touch) {
        const deltaX = touch.clientX - dragStart.x
        const deltaY = touch.clientY - dragStart.y

        moveElement(selectedElement, elementStart.x + deltaX, elementStart.y + deltaY)
      }
    }
  }, [isDragging, selectedElement, dragStart, elementStart, moveElement])

  const handleTouchEnd = useCallback(() => {
    setIsDragging(false)
  }, [])

  // Throttled mouse move for better performance
  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (isDragging && selectedElement) {
      e.preventDefault()
      const deltaX = e.clientX - dragStart.x
      const deltaY = e.clientY - dragStart.y

      moveElement(selectedElement, elementStart.x + deltaX, elementStart.y + deltaY)
    }

    if (isResizing && selectedElement) {
      e.preventDefault()
      const deltaX = e.clientX - resizeStart.x
      const deltaY = e.clientY - resizeStart.y

      const newWidth = Math.max(20, resizeStart.width + deltaX)
      const newHeight = Math.max(20, resizeStart.height + deltaY)

      resizeElement(selectedElement, newWidth, newHeight)
    }
  }, [isDragging, isResizing, selectedElement, dragStart, elementStart, resizeStart, moveElement, resizeElement])

  const handleMouseUp = useCallback(() => {
    setIsDragging(false)
    setIsResizing(false)
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
      className="canvas-container relative bg-white dark:bg-gray-800 overflow-hidden transition-colors border-2 border-gray-300 dark:border-gray-600"
      style={{
        width: actualWidth,
        height: actualHeight,
        outline: 'none',
        boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
        transform: `translate(${panOffset.x}px, ${panOffset.y}px) scale(${zoomLevel})`,
        transformOrigin: 'center center',
      }}
      onClick={handleCanvasClick}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
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
            onResizeMouseDown={(e) => handleResizeMouseDown(e, element.id)}
            onTouchStart={(e) => handleTouchStart(e, element.id)}
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
  onResizeMouseDown: (e: React.MouseEvent) => void
  onTouchStart?: (e: React.TouchEvent) => void
  onUpdate: (updates: Partial<DesignElement>) => void
}

function DesignElementComponent({
  element,
  isSelected,
  onMouseDown,
  onResizeMouseDown,
  onTouchStart,
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
      // Select all text when double-clicked
      setTimeout(() => {
        const textarea = document.querySelector(`textarea[data-element-id="${element.id}"]`) as HTMLTextAreaElement
        if (textarea) {
          textarea.focus()
          textarea.select()
          textarea.setSelectionRange(0, textarea.value.length)
        }
      }, 0)
      setIsEditing(true)
    }
  }, [element.type, element.id])

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault()
    onMouseDown(e)
  }, [onMouseDown])

  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    e.preventDefault()
    if (onTouchStart) {
      onTouchStart(e)
    }
  }, [onTouchStart])

  const baseStyle: React.CSSProperties = {
    position: 'absolute',
    left: element.x,
    top: element.y,
    width: element.width,
    height: element.height,
    cursor: 'move',
    transform: `rotate(${element.rotation || 0}deg)`,
    zIndex: element.zIndex,
    opacity: element.opacity ?? 1,
  }

  if (element.type === 'text') {
    return (
      <div
        className={`design-element ${isSelected ? 'selected' : ''}`}
        style={baseStyle}
        onMouseDown={handleMouseDown}
        onTouchStart={handleTouchStart}
        onDoubleClick={handleTextDoubleClick}
      >
        {isEditing ? (
          <div className="relative w-full h-full">
            <textarea
              data-element-id={element.id}
              value={element.content || ''}
              onChange={handleTextChange}
              onBlur={handleTextBlur}
              className="w-full h-full resize-none border-none outline-none bg-transparent"
              style={{
                fontSize: element.fontSize || 16,
                fontFamily: element.fontFamily || 'Arial',
                fontWeight: element.fontWeight || 'normal',
                fontStyle: element.fontStyle || 'normal',
                textAlign: element.textAlign || 'left',
                color: element.color || 'inherit',
                padding: `${element.paddingTop || 8}px ${element.paddingRight || 8}px ${element.paddingBottom || 8}px ${element.paddingLeft || 8}px`,
                margin: `${element.marginTop || 0}px ${element.marginRight || 0}px ${element.marginBottom || 0}px ${element.marginLeft || 0}px`,
                lineHeight: element.lineHeight || 1.2,
                letterSpacing: `${element.letterSpacing || 0}px`,
                wordSpacing: `${element.wordSpacing || 0}px`,
                textIndent: `${element.textIndent || 0}px`,
                display: 'flex',
                flexDirection: 'column',
                justifyContent: element.verticalAlign === 'top' ? 'flex-start' : element.verticalAlign === 'bottom' ? 'flex-end' : 'center',
                boxSizing: 'border-box'
              }}
              autoFocus
            />
            {/* Visual indicator for text editing mode */}
            <div className="absolute top-0 right-0 bg-blue-500 text-white text-xs px-2 py-1 rounded-bl-lg">
              Editing Text
            </div>
          </div>
        ) : (
          <div
            className="w-full h-full"
            style={{
              padding: `${element.paddingTop || 8}px ${element.paddingRight || 8}px ${element.paddingBottom || 8}px ${element.paddingLeft || 8}px`,
              margin: `${element.marginTop || 0}px ${element.marginRight || 0}px ${element.marginBottom || 0}px ${element.marginLeft || 0}px`,
              display: 'flex',
              flexDirection: 'column',
              justifyContent: element.verticalAlign === 'top' ? 'flex-start' : element.verticalAlign === 'bottom' ? 'flex-end' : 'center',
              boxSizing: 'border-box'
            }}
          >
            <div
              style={{
                fontSize: element.fontSize || 16,
                fontFamily: element.fontFamily || 'Arial',
                fontWeight: element.fontWeight || 'normal',
                fontStyle: element.fontStyle || 'normal',
                textAlign: element.textAlign || 'left',
                color: element.color || 'inherit',
                lineHeight: element.lineHeight || 1.2,
                letterSpacing: `${element.letterSpacing || 0}px`,
                wordSpacing: `${element.wordSpacing || 0}px`,
                textIndent: `${element.textIndent || 0}px`,
                width: '100%'
              }}
            >
              {element.content}
            </div>
          </div>
        )}

        {/* Selection handles */}
        {isSelected && (
          <>
            <div
              className="absolute bottom-0 right-0 w-4 h-4 bg-blue-500 border-2 border-white cursor-se-resize shadow-lg no-export"
              style={{ transform: 'translate(50%, 50%)' }}
              onMouseDown={onResizeMouseDown}
            />
            <div
              className="absolute top-0 left-1/2 w-4 h-4 bg-green-500 border-2 border-white rounded-full cursor-pointer shadow-lg no-export"
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
        onMouseDown={handleMouseDown}
        onTouchStart={handleTouchStart}
      >
        <img
          src={element.src}
          alt="Design element"
          className="w-full h-full pointer-events-none"
          style={{
            objectFit: 'cover',
            display: 'block'
          }}
          draggable={false}
        />
        {isSelected && (
          <div className="absolute inset-0 border-2 border-blue-500 pointer-events-none no-export" />
        )}

        {/* Selection handles */}
        {isSelected && (
          <>
            <div
              className="absolute bottom-0 right-0 w-3 h-3 bg-blue-500 border border-white cursor-se-resize no-export"
              style={{ transform: 'translate(50%, 50%)' }}
              onMouseDown={onResizeMouseDown}
            />
            <div
              className="absolute top-0 left-1/2 w-3 h-3 bg-green-500 border border-white rounded-full cursor-pointer no-export"
              style={{ transform: 'translate(-50%, -50%)' }}
            />
          </>
        )}
      </div>
    )
  }

  const isShape = ['circle', 'square', 'rectangle', 'triangle', 'star', 'heart'].includes(element.type)

  if (isShape) {
    const gradId = `grad-${element.id}`
    const hasGradient = !!element.gradient
    const fill = hasGradient ? `url(#${gradId})` : (element.backgroundColor || element.color || '#3b82f6')

    return (
      <div
        className={`design-element ${isSelected ? 'selected' : ''}`}
        style={baseStyle}
        onMouseDown={handleMouseDown}
        onTouchStart={handleTouchStart}
      >
        <svg
          width="100%"
          height="100%"
          viewBox="0 0 100 100"
          preserveAspectRatio="none"
          className="overflow-visible"
        >
          {hasGradient && (
            <defs>
              <linearGradient
                id={gradId}
                x1="0%"
                y1="0%"
                x2={element.gradient!.direction === 'horizontal' ? '100%' : element.gradient!.direction === 'vertical' ? '0%' : '100%'}
                y2={element.gradient!.direction === 'horizontal' ? '0%' : element.gradient!.direction === 'vertical' ? '100%' : '100%'}
              >
                {element.gradient!.colors.map((color, i) => (
                  <stop
                    key={i}
                    offset={`${(i / (element.gradient!.colors.length - 1)) * 100}%`}
                    stopColor={color}
                  />
                ))}
              </linearGradient>
            </defs>
          )}

          {element.type === 'circle' && (
            <circle cx="50" cy="50" r="50" fill={fill} />
          )}

          {(element.type === 'square' || element.type === 'rectangle') && (
            <rect
              width="100"
              height="100"
              rx="0"
              fill={fill}
            />
          )}

          {element.type === 'triangle' && (
            <polygon points="50,0 0,100 100,100" fill={fill} />
          )}

          {element.type === 'star' && (
            <polygon points="50,0 61,35 98,35 68,57 79,91 50,70 21,91 32,57 2,35 39,35" fill={fill} />
          )}

          {element.type === 'heart' && (
            <path d="M50,25 C30,0 0,12.5 0,30 C0,45 15,60 50,95 C85,60 100,45 100,30 C100,12.5 70,0 50,25 Z" fill={fill} />
          )}
        </svg>

        {/* Selection handles */}
        {isSelected && (
          <>
            <div
              className="absolute bottom-0 right-0 w-4 h-4 bg-blue-500 border-2 border-white cursor-se-resize shadow-lg no-export"
              style={{ transform: 'translate(50%, 50%)' }}
              onMouseDown={onResizeMouseDown}
            />
            <div
              className="absolute top-0 left-1/2 w-4 h-4 bg-green-500 border-2 border-white rounded-full cursor-pointer shadow-lg no-export"
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
