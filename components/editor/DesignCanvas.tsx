'use client'

import React, { useRef, useEffect, useState, memo, useCallback } from 'react'
import { useCanvasStore, DesignElement } from '@/store/canvas-store'

interface DesignCanvasProps {
  width?: number
  height?: number
}

const DesignCanvas = memo(function DesignCanvas({ width, height }: DesignCanvasProps) {
  const canvasRef = useRef<HTMLDivElement>(null)
  const [isDragging, setIsDragging] = useState(false)
  const [isResizing, setIsResizing] = useState(false)
  const [isPanning, setIsPanning] = useState(false)
  const [isSpacePressed, setIsSpacePressed] = useState(false)
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 })
  const [elementStart, setElementStart] = useState({ x: 0, y: 0 })
  const [resizeStart, setResizeStart] = useState({ width: 0, height: 0, x: 0, y: 0 })
  const [panStart, setPanStart] = useState({ x: 0, y: 0 })
  const [selectionBox, setSelectionBox] = useState<{ startX: number; startY: number; endX: number; endY: number } | null>(null)
  const [isDropHover, setIsDropHover] = useState(false)
  const [showGrid, setShowGrid] = useState(false)
  const [showAlignmentGuides, setShowAlignmentGuides] = useState(true)
  
  // Use a ref for RAF to avoid multiple clicks/moves in a single frame
  const requestRef = useRef<number | null>(null)

  const {
    pages,
    currentPageId,
    selectedElement,
    selectedElements,
    addElement,
    updateElement,
    selectElement,
    addToSelection,
    removeFromSelection,
    clearSelection,
    deleteSelectedElements,
    deleteElement,
    setCanvasSize,
    resizeElement,
    updateElementPosition,
    zoomLevel,
    panOffset,
    setPanOffset,
    snapGuides,
    setSnapGuides,
  } = useCanvasStore()

  const currentPage = pages.find(page => page.id === currentPageId)
  const currentPageElements = currentPage?.elements || []
  const actualWidth = width || currentPage?.canvasWidth || 800
  const actualHeight = height || currentPage?.canvasHeight || 600

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDropHover(false)

    const files = e.dataTransfer.files
    if (files && files.length > 0) {
      const file = files[0]
      if (file.type.startsWith('image/')) {
        const reader = new FileReader()
        reader.onload = (event) => {
          const src = event.target?.result as string

          // Calculate drop position relative to canvas with better positioning
          const rect = canvasRef.current?.getBoundingClientRect()
          if (rect) {
            // Subtract canvas left/top coordinates from the mouse pointer coordinates to get local position
            // Then divide by zoomLevel to map to canvas internal coordinate space
            const x = (e.clientX - rect.left) / zoomLevel - 100 // Center the 200px width image
            const y = (e.clientY - rect.top) / zoomLevel - 100 // Center the 200px height image

            addElement({
              type: 'image',
              x: Math.max(0, x),
              y: Math.max(0, y),
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
    setIsDropHover(true)
  }, [])

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDropHover(false)
  }, [])

  useEffect(() => {
    if (width && height) {
      setCanvasSize(width, height)
    }
  }, [width, height, setCanvasSize])

  // Listen for spacebar to enable panning
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === 'Space' && !['INPUT', 'TEXTAREA'].includes((e.target as HTMLElement).tagName) && !(e.target as HTMLElement).isContentEditable) {
        setIsSpacePressed(true)
        if (e.target === document.body) e.preventDefault()
      }
    }
    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.code === 'Space') {
        setIsSpacePressed(false)
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    window.addEventListener('keyup', handleKeyUp)
    return () => {
      window.removeEventListener('keydown', handleKeyDown)
      window.removeEventListener('keyup', handleKeyUp)
    }
  }, [])

  // Update canvas when current page changes
  useEffect(() => {
    // Force re-render when page changes
  }, [currentPageId, currentPageElements])

  const handleCanvasClick = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === canvasRef.current) {
      clearSelection()
    }
  }, [clearSelection])

  const handleCanvasMouseDown = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    if (e.button === 1 || (e.target === canvasRef.current && isSpacePressed)) {
      // Start panning with middle mouse or Space + Left click
      setIsPanning(true)
      setPanStart({ x: e.clientX - panOffset.x, y: e.clientY - panOffset.y })
      e.preventDefault()
    } else if (e.target === canvasRef.current) {
      // Start lasso selection if clicking empty canvas
      const rect = canvasRef.current?.getBoundingClientRect()
      if (rect) {
        const x = (e.clientX - rect.left) / zoomLevel
        const y = (e.clientY - rect.top) / zoomLevel
        setSelectionBox({ startX: x, startY: y, endX: x, endY: y })
        clearSelection()
      }
    }
  }, [panOffset, isSpacePressed, clearSelection, zoomLevel])

  const handleElementMouseDown = useCallback((e: React.MouseEvent, elementId: string) => {
    e.stopPropagation()
    
    // Check if Ctrl/Cmd is pressed for multi-select
    if (e.ctrlKey || e.metaKey) {
      // Toggle selection for multi-select
      if (selectedElements.includes(elementId)) {
        removeFromSelection(elementId)
      } else {
        addToSelection(elementId)
      }
    } else {
      // Single selection (normal behavior)
      selectElement(elementId)
    }
    
    setIsDragging(true)

    const element = currentPageElements.find((el: DesignElement) => el.id === elementId)
    if (element) {
      setDragStart({ x: e.clientX, y: e.clientY })
      setElementStart({ x: element.x, y: element.y })
    }
  }, [selectElement, addToSelection, removeFromSelection, selectedElements, currentPageElements])

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

  // Throttled mouse move using RAF
  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (requestRef.current) return

    requestRef.current = requestAnimationFrame(() => {
      requestRef.current = null

      if (isPanning) {
        const newPanX = e.clientX - panStart.x
        const newPanY = e.clientY - panStart.y
        setPanOffset(newPanX, newPanY)
      } else if (isDragging && selectedElement) {
        const deltaX = (e.clientX - dragStart.x) / zoomLevel
        const deltaY = (e.clientY - dragStart.y) / zoomLevel
        
        let newX = elementStart.x + deltaX
        let newY = elementStart.y + deltaY

        // Smart Snapping Logic
        const SNAP_THRESHOLD = 5
        const element = currentPageElements.find(el => el.id === selectedElement)
        
        if (element && showAlignmentGuides) {
          let snappedX: number | null = null
          let snappedY: number | null = null

          const elementHalfWidth = element.width / 2
          const elementHalfHeight = element.height / 2
          
          const myPointsX = [newX, newX + elementHalfWidth, newX + element.width]
          const myPointsY = [newY, newY + elementHalfHeight, newY + element.height]

          // Check against other elements
          for (const other of currentPageElements) {
            if (other.id === selectedElement) continue

            const otherHalfWidth = other.width / 2
            const otherHalfHeight = other.height / 2
            const otherPointsX = [other.x, other.x + otherHalfWidth, other.x + other.width]
            const otherPointsY = [other.y, other.y + otherHalfHeight, other.y + other.height]

            // Check X axis snapping
            for (let i = 0; i < 3; i++) {
              for (let j = 0; j < 3; j++) {
                if (Math.abs(myPointsX[i] - otherPointsX[j]) < SNAP_THRESHOLD) {
                  snappedX = otherPointsX[j]
                  if (i === 0) newX = snappedX
                  else if (i === 1) newX = snappedX - elementHalfWidth
                  else if (i === 2) newX = snappedX - element.width
                  break
                }
              }
              if (snappedX !== null) break
            }

            // Check Y axis snapping
            for (let i = 0; i < 3; i++) {
              for (let j = 0; j < 3; j++) {
                if (Math.abs(myPointsY[i] - otherPointsY[j]) < SNAP_THRESHOLD) {
                  snappedY = otherPointsY[j]
                  if (i === 0) newY = snappedY
                  else if (i === 1) newY = snappedY - elementHalfHeight
                  else if (i === 2) newY = snappedY - element.height
                  break
                }
              }
              if (snappedY !== null) break
            }
          }

          // Check against canvas center
          if (Math.abs(newX + elementHalfWidth - actualWidth / 2) < SNAP_THRESHOLD) {
            snappedX = actualWidth / 2
            newX = snappedX - elementHalfWidth
          }
          if (Math.abs(newY + elementHalfHeight - actualHeight / 2) < SNAP_THRESHOLD) {
            snappedY = actualHeight / 2
            newY = snappedY - elementHalfHeight
          }

          setSnapGuides(snappedX, snappedY)
        }

        updateElementPosition(selectedElement, newX, newY)
      } else if (isResizing && selectedElement) {
        const deltaX = (e.clientX - resizeStart.x) / zoomLevel
        const deltaY = (e.clientY - resizeStart.y) / zoomLevel

        let newWidth = Math.max(20, resizeStart.width + deltaX)
        let newHeight = Math.max(20, resizeStart.height + deltaY)

        // Maintain aspect ratio if shift is held
        if (e.shiftKey) {
          const ratio = resizeStart.width / resizeStart.height
          if (newWidth / newHeight > ratio) {
            newHeight = newWidth / ratio
          } else {
            newWidth = newHeight * ratio
          }
        }

        resizeElement(selectedElement, newWidth, newHeight)
      } else if (selectionBox) {
        const rect = canvasRef.current?.getBoundingClientRect()
        if (rect) {
          const x = (e.clientX - rect.left) / zoomLevel
          const y = (e.clientY - rect.top) / zoomLevel
          setSelectionBox(prev => prev ? { ...prev, endX: x, endY: y } : null)
        }
      }
    })
  }, [isPanning, isDragging, isResizing, selectionBox, selectedElement, dragStart, elementStart, resizeStart, updateElementPosition, resizeElement, zoomLevel, panStart, setPanOffset])

  const handleMouseUp = useCallback(() => {
    if (selectionBox) {
      // Calculate final selection box coordinates
      const x1 = Math.min(selectionBox.startX, selectionBox.endX)
      const y1 = Math.min(selectionBox.startY, selectionBox.endY)
      const x2 = Math.max(selectionBox.startX, selectionBox.endX)
      const y2 = Math.max(selectionBox.startY, selectionBox.endY)

      // Find elements that overlap with the selection box
      const selectedIds = currentPageElements
        .filter(el => {
          const elX2 = el.x + el.width
          const elY2 = el.y + el.height
          // Check if selection box intersects element bounding box
          return x1 < elX2 && x2 > el.x && y1 < elY2 && y2 > el.y
        })
        .map(el => el.id)

      if (selectedIds.length > 0) {
        useCanvasStore.getState().selectMultipleElements(selectedIds)
      }
      setSelectionBox(null)
    }

    setIsDragging(false)
    setIsResizing(false)
    setIsPanning(false)
    useCanvasStore.getState().setSnapGuides(null, null)
  }, [selectionBox, currentPageElements])

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    // Canvas-specific keyboard shortcuts
    const target = e.target as HTMLElement
    const isEditing = target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable

    if (!isEditing) {
      // Toggle grid
      if (e.key === 'g' && (e.ctrlKey || e.metaKey)) {
        e.preventDefault()
        setShowGrid(!showGrid)
      }
    }
  }, [showGrid])

  const handleWheel = useCallback((e: WheelEvent) => {
    e.preventDefault()
    e.stopPropagation()

    if (e.ctrlKey || e.metaKey) {
      // Zoom
      const zoomSensitivity = 0.001
      const delta = -e.deltaY * zoomSensitivity
      const newZoom = Math.max(0.1, Math.min(5, zoomLevel + delta))
      
      useCanvasStore.getState().setZoomLevel(newZoom)
    } else {
      // Pan
      const panSensitivity = 1
      const newPanX = panOffset.x - e.deltaX * panSensitivity
      const newPanY = panOffset.y - e.deltaY * panSensitivity
      setPanOffset(newPanX, newPanY)
    }
  }, [zoomLevel, panOffset, setPanOffset])

  useEffect(() => {
    const canvas = canvasRef.current
    if (canvas) {
      canvas.addEventListener('wheel', handleWheel, { passive: false })
      return () => {
        canvas.removeEventListener('wheel', handleWheel)
      }
    }
  }, [handleWheel])

  return (
    <div
      id="design-canvas"
      ref={canvasRef}
      className={`canvas-container relative bg-white dark:bg-gray-800 transition-all duration-200 ${
        isDropHover ? 'bg-indigo-50/30' : ''
      } ${isPanning ? 'cursor-grabbing' : 'cursor-grab hover:cursor-grab'}`}
      title="Click and drag to pan the canvas"
      style={{
        width: actualWidth,
        height: actualHeight,
        outline: 'none',
        transform: `translate(${panOffset.x}px, ${panOffset.y}px) scale(${zoomLevel})`,
        transformOrigin: 'center center',
      }}
      onClick={handleCanvasClick}
      onMouseDown={handleCanvasMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      onKeyDown={handleKeyDown}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      tabIndex={0}
    >
      {/* Grid Background */}
      {showGrid && (
        <div 
          className="absolute inset-0 pointer-events-none opacity-20"
          style={{
            backgroundImage: 'linear-gradient(to right, #e5e7eb 1px, transparent 1px), linear-gradient(to bottom, #e5e7eb 1px, transparent 1px)',
            backgroundSize: '20px 20px'
          }}
        />
      )}

      {/* Drop Zone Indicator */}
      {isDropHover && (
        <div className="absolute inset-0 pointer-events-none flex items-center justify-center bg-indigo-500/10 rounded-lg">
          <div className="text-center">
            <div className="text-2xl mb-2">📁</div>
            <p className="text-sm font-medium text-indigo-600">Drop image here</p>
          </div>
        </div>
      )}

      {/* Lasso Selection Box */}
      {selectionBox && (
        <div 
          className="absolute border border-indigo-500 bg-indigo-500/10 pointer-events-none z-50"
          style={{
            left: Math.min(selectionBox.startX, selectionBox.endX),
            top: Math.min(selectionBox.startY, selectionBox.endY),
            width: Math.abs(selectionBox.startX - selectionBox.endX),
            height: Math.abs(selectionBox.startY - selectionBox.endY),
          }}
        />
      )}

      {/* Snap Guides */}
      {snapGuides.x !== null && (
        <div 
          className="absolute border-l border-pink-500 pointer-events-none z-40"
          style={{
            left: snapGuides.x,
            top: -2000,
            bottom: -2000,
            width: 0,
            opacity: 0.8
          }}
        />
      )}
      {snapGuides.y !== null && (
        <div 
          className="absolute border-t border-pink-500 pointer-events-none z-40"
          style={{
            top: snapGuides.y,
            left: -2000,
            right: -2000,
            height: 0,
            opacity: 0.8
          }}
        />
      )}
      {currentPageElements
        .sort((a: DesignElement, b: DesignElement) => a.zIndex - b.zIndex)
        .map((element: DesignElement) => (
          <DesignElementComponent
            key={element.id}
            element={element}
            isSelected={selectedElements.includes(element.id)}
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
    left: 0,
    top: 0,
    width: element.width,
    height: element.height,
    cursor: 'default',
    transform: `translate(${element.x}px, ${element.y}px) rotate(${element.rotation || 0}deg)`,
    willChange: 'transform',
    zIndex: element.zIndex,
    opacity: element.opacity ?? 1,
    border: (element.type === 'text' && (isSelected || isEditing)) ? '2px dashed #3B82F6' : 'none',
    userSelect: isEditing ? 'auto' : 'none',
    // Advanced text effects
    boxShadow: element.boxShadow,
    textShadow: element.textShadow,
    WebkitTextStroke: element.textStroke ? `${element.textStroke} ${element.textStrokeColor || '#000'}` : undefined,
    WebkitBackgroundClip: element.WebkitBackgroundClip,
    WebkitTextFillColor: element.WebkitTextFillColor,
    background: (element.type === 'text' && (isSelected || isEditing)) ? 'rgba(59, 130, 246, 0.05)' : (element.background || 'transparent'),
  }

  if (element.type === 'text') {
    // Handle curved text
    if (element.isCurved && element.curvePath) {
      return (
        <div
          className={`design-element ${isSelected ? 'selected' : ''}`}
          style={baseStyle}
          onMouseDown={handleMouseDown}
          onTouchStart={handleTouchStart}
          onDoubleClick={handleTextDoubleClick}
        >
          <svg
            width={element.width}
            height={element.height}
            className="w-full h-full pointer-events-none select-none"
          >
            <defs>
              <path
                id={`curve-${element.id}`}
                d={element.curvePath}
                fill="none"
              />
            </defs>
            <text
              style={{
                fontSize: element.fontSize || 16,
                fontFamily: element.fontFamily || 'Arial',
                fontWeight: element.fontWeight || 'normal',
                fontStyle: element.fontStyle || 'normal',
                fill: element.color || '#111827',
                textShadow: element.textShadow,
                WebkitTextStroke: element.textStroke ? `${element.textStroke} ${element.textStrokeColor || '#000'}` : undefined,
              }}
            >
              <textPath href={`#curve-${element.id}`} startOffset="50%" textAnchor="middle">
                {element.content}
              </textPath>
            </text>
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

    // Regular text rendering with effects
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
                // Preserve effects during editing
                boxShadow: element.boxShadow,
                textShadow: element.textShadow,
                WebkitTextStroke: element.textStroke ? `${element.textStroke} ${element.textStrokeColor || '#000'}` : undefined,
                WebkitBackgroundClip: element.WebkitBackgroundClip,
                WebkitTextFillColor: element.WebkitTextFillColor,
                background: element.background,
              }}
              autoFocus
            />

          </div>
        ) : (
          <div
            className="w-full h-full pointer-events-none select-none"
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
                // Apply all text effects
                boxShadow: element.boxShadow,
                textShadow: element.textShadow,
                WebkitTextStroke: element.textStroke ? `${element.textStroke} ${element.textStrokeColor || '#000'}` : undefined,
                WebkitBackgroundClip: element.WebkitBackgroundClip,
                WebkitTextFillColor: element.WebkitTextFillColor,
                background: element.background,
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

  const isShape = ['circle', 'square', 'rectangle', 'triangle', 'star', 'heart', 'oval'].includes(element.type)

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
          className="overflow-visible pointer-events-none select-none"
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

          {element.type === 'oval' && (
            <ellipse cx="50" cy="50" rx="50" ry="30" fill={fill} />
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
