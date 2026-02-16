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
    deleteElement,
    setCanvasSize,
    resizeElement,
    updateElementPosition,
    zoomLevel,
    panOffset,
  } = useCanvasStore()

  const currentPage = pages.find(page => page.id === currentPageId)
  const currentPageElements = currentPage?.elements || []
  const actualWidth = width || currentPage?.canvasWidth || 800
  const actualHeight = height || currentPage?.canvasHeight || 600

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()

    const files = e.dataTransfer.files
    if (files && files.length > 0) {
      const file = files[0]
      if (file.type.startsWith('image/')) {
        const reader = new FileReader()
        reader.onload = (event) => {
          const src = event.target?.result as string

          // Calculate drop position relative to canvas
          const rect = canvasRef.current?.getBoundingClientRect()
          if (rect) {
            const x = (e.clientX - rect.left) / zoomLevel
            const y = (e.clientY - rect.top) / zoomLevel

            addElement({
              type: 'image',
              x,
              y,
              width: 200,
              height: 200,
              src,
            })
          }
        }
        reader.readAsDataURL(file)
      }
    }
  }, [addElement, zoomLevel])

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    e.dataTransfer.dropEffect = 'copy'
  }, [])

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
        const deltaX = (touch.clientX - dragStart.x) / zoomLevel
        const deltaY = (touch.clientY - dragStart.y) / zoomLevel

        updateElementPosition(selectedElement, elementStart.x + deltaX, elementStart.y + deltaY)
      }
    }
  }, [isDragging, selectedElement, dragStart, elementStart, updateElementPosition, zoomLevel])

  const handleTouchEnd = useCallback(() => {
    setIsDragging(false)
  }, [])

  // Throttled mouse move for better performance
  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (isDragging && selectedElement) {
      e.preventDefault()
      const deltaX = (e.clientX - dragStart.x) / zoomLevel
      const deltaY = (e.clientY - dragStart.y) / zoomLevel

      updateElementPosition(selectedElement, elementStart.x + deltaX, elementStart.y + deltaY)
    }

    if (isResizing && selectedElement) {
      e.preventDefault()
      const deltaX = (e.clientX - resizeStart.x) / zoomLevel
      const deltaY = (e.clientY - resizeStart.y) / zoomLevel

      const newWidth = Math.max(20, resizeStart.width + deltaX)
      const newHeight = Math.max(20, resizeStart.height + deltaY)

      resizeElement(selectedElement, newWidth, newHeight)
    }
  }, [isDragging, isResizing, selectedElement, dragStart, elementStart, resizeStart, updateElementPosition, resizeElement, zoomLevel])

  const handleMouseUp = useCallback(() => {
    setIsDragging(false)
    setIsResizing(false)
  }, [])

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    // Don't delete if we're typing in an input or textarea
    const target = e.target as HTMLElement
    const isEditing = target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable

    if (selectedElement && e.key === 'Delete' && !isEditing) {
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
      onDragOver={handleDragOver}
      onDrop={handleDrop}
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

  const handleTextAreaKeyDown = useCallback((e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    e.stopPropagation()

    if (e.key === ' ') {
      e.preventDefault()
      e.stopPropagation()
      const textarea = e.currentTarget
      const { selectionStart, selectionEnd, value } = textarea
      const newValue = value.substring(0, selectionStart) + ' ' + value.substring(selectionEnd)
      onUpdate({ content: newValue })
      setTimeout(() => {
        textarea.selectionStart = textarea.selectionEnd = selectionStart + 1
      }, 0)
    }

    if (e.key === 'Enter') {
      e.preventDefault()
      e.stopPropagation()
      const textarea = e.currentTarget
      const { selectionStart, selectionEnd, value } = textarea
      const newValue = value.substring(0, selectionStart) + '\n' + value.substring(selectionEnd)
      onUpdate({ content: newValue })
      setTimeout(() => {
        textarea.selectionStart = textarea.selectionEnd = selectionStart + 1
      }, 0)
    }

    if (e.key === 'Tab') {
      e.preventDefault()
      const textarea = e.currentTarget
      const { selectionStart, selectionEnd, value } = textarea

      // Use 4 spaces for tab
      const tabString = '    '
      const newValue = value.substring(0, selectionStart) + tabString + value.substring(selectionEnd)

      onUpdate({ content: newValue })

      // Reset cursor position after React update
      setTimeout(() => {
        textarea.selectionStart = textarea.selectionEnd = selectionStart + tabString.length
      }, 0)
    }
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
    // Don't prevent default if we're clicking inside the textarea while editing
    if (isEditing) return

    e.preventDefault()
    onMouseDown(e)
  }, [onMouseDown, isEditing])

  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    if (isEditing) return

    e.preventDefault()
    if (onTouchStart) {
      onTouchStart(e)
    }
  }, [onTouchStart, isEditing])

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
              onKeyDown={handleTextAreaKeyDown}
              onMouseDown={(e) => e.stopPropagation()}
              className="w-full h-full resize-none border-none outline-none bg-transparent"
              style={{
                fontSize: element.fontSize || 16,
                fontFamily: element.fontFamily || 'Arial',
                fontWeight: element.fontWeight || 'normal',
                fontStyle: element.fontStyle || 'normal',
                textAlign: element.textAlign || 'left',
                color: element.color || 'inherit',
                padding: `${element.paddingTop || 8}px ${element.paddingRight || 8}px ${element.paddingBottom || 8}px ${element.paddingLeft || 8}px`,
                margin: 0,
                lineHeight: element.lineHeight || 1.2,
                letterSpacing: `${element.letterSpacing || 0}px`,
                wordSpacing: `${element.wordSpacing || 0}px`,
                textIndent: `${element.textIndent || 0}px`,
                boxSizing: 'border-box',
                whiteSpace: 'pre-wrap',
                wordBreak: 'break-word',
              }}
              autoFocus
            />

          </div>
        ) : (
          <div
            className="w-full h-full"
            style={{
              padding: `${element.paddingTop || 8}px ${element.paddingRight || 8}px ${element.paddingBottom || 8}px ${element.paddingLeft || 8}px`,
              margin: `${element.marginTop || 0}px ${element.marginRight || 0}px ${element.marginBottom || 0}px ${element.marginLeft || 0}px`,
              display: 'flex',
              flexDirection: 'column',
              justifyContent: element.verticalAlign === 'bottom' ? 'flex-end' : element.verticalAlign === 'middle' ? 'center' : 'flex-start',
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
                width: '100%',
                whiteSpace: 'pre-wrap',
                wordBreak: 'break-word',
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
        {element.src ? (
          <div
            className="w-full h-full pointer-events-none"
            style={{
              backgroundImage: `url(${element.src})`,
              backgroundSize: 'cover',
              backgroundPosition: 'center',
              backgroundRepeat: 'no-repeat',
              display: 'block'
            }}
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-gray-200 text-gray-500">
            <span>No image source</span>
          </div>
        )}
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
