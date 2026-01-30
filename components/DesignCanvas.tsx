'use client'

import React, { useRef, useEffect, useState } from 'react'
import { useCanvasStore, DesignElement } from '../store/canvas-store'

interface DesignCanvasProps {
  width?: number
  height?: number
}

export default function DesignCanvas({ width = 800, height = 600 }: DesignCanvasProps) {
  const canvasRef = useRef<HTMLDivElement>(null)
  const [isDragging, setIsDragging] = useState(false)
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 })
  const [elementStart, setElementStart] = useState({ x: 0, y: 0 })
  
  const {
    elements,
    selectedElement,
    addElement,
    updateElement,
    selectElement,
    moveElement,
    deleteElement,
    setCanvasSize,
  } = useCanvasStore()

  useEffect(() => {
    setCanvasSize(width, height)
  }, [width, height, setCanvasSize])

  const handleCanvasClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === canvasRef.current) {
      selectElement(null)
    }
  }

  const handleElementMouseDown = (e: React.MouseEvent, elementId: string) => {
    e.stopPropagation()
    selectElement(elementId)
    setIsDragging(true)
    
    const element = elements.find(el => el.id === elementId)
    if (element) {
      setDragStart({ x: e.clientX, y: e.clientY })
      setElementStart({ x: element.x, y: element.y })
    }
  }

  const handleMouseMove = (e: React.MouseEvent) => {
    if (isDragging && selectedElement) {
      const deltaX = e.clientX - dragStart.x
      const deltaY = e.clientY - dragStart.y
      
      moveElement(selectedElement, elementStart.x + deltaX, elementStart.y + deltaY)
    }
  }

  const handleMouseUp = () => {
    setIsDragging(false)
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (selectedElement && e.key === 'Delete') {
      deleteElement(selectedElement)
    }
  }

  return (
    <div
      id="design-canvas"
      ref={canvasRef}
      className="canvas-container relative bg-white overflow-hidden"
      style={{ width, height }}
      onClick={handleCanvasClick}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
      onKeyDown={handleKeyDown}
      tabIndex={0}
    >
      {elements
        .sort((a, b) => a.zIndex - b.zIndex)
        .map((element) => (
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
}

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
  const [isResizing, setIsResizing] = useState(false)
  const [isRotating, setIsRotating] = useState(false)
  const [resizeStart, setResizeStart] = useState({ x: 0, y: 0, width: 0, height: 0 })
  const [rotateStart, setRotateStart] = useState({ x: 0, y: 0, rotation: 0 })

  const handleTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    onUpdate({ content: e.target.value })
  }

  const handleTextBlur = () => {
    setIsEditing(false)
  }

  const handleTextDoubleClick = () => {
    if (element.type === 'text') {
      setIsEditing(true)
    }
  }

  const handleResizeMouseDown = (e: React.MouseEvent) => {
    e.stopPropagation()
    setIsResizing(true)
    setResizeStart({
      x: e.clientX,
      y: e.clientY,
      width: element.width,
      height: element.height,
    })
  }

  const handleRotateMouseDown = (e: React.MouseEvent) => {
    e.stopPropagation()
    setIsRotating(true)
    setRotateStart({
      x: e.clientX,
      y: e.clientY,
      rotation: element.rotation || 0,
    })
  }

  React.useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (isResizing) {
        const deltaX = e.clientX - resizeStart.x
        const deltaY = e.clientY - resizeStart.y
        const newWidth = Math.max(50, resizeStart.width + deltaX)
        const newHeight = Math.max(50, resizeStart.height + deltaY)
        onUpdate({ width: newWidth, height: newHeight })
      }

      if (isRotating) {
        const centerX = element.x + element.width / 2
        const centerY = element.y + element.height / 2
        const angle = Math.atan2(e.clientY - centerY, e.clientX - centerX)
        const degrees = (angle * 180) / Math.PI + 90
        onUpdate({ rotation: degrees })
      }
    }

    const handleMouseUp = () => {
      setIsResizing(false)
      setIsRotating(false)
    }

    if (isResizing || isRotating) {
      document.addEventListener('mousemove', handleMouseMove)
      document.addEventListener('mouseup', handleMouseUp)
      return () => {
        document.removeEventListener('mousemove', handleMouseMove)
        document.removeEventListener('mouseup', handleMouseUp)
      }
    }
  }, [isResizing, isRotating, resizeStart, rotateStart, element, onUpdate])

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
        
        {/* Resize and Rotate Handles */}
        {isSelected && (
          <>
            {/* Resize Handle - Bottom Right Corner */}
            <div
              className="absolute bottom-0 right-0 w-3 h-3 bg-blue-500 border border-white cursor-se-resize"
              style={{ transform: 'translate(50%, 50%)' }}
              onMouseDown={handleResizeMouseDown}
            />
            
            {/* Rotate Handle - Top Center */}
            <div
              className="absolute top-0 left-1/2 w-3 h-3 bg-green-500 border border-white rounded-full cursor-pointer"
              style={{ transform: 'translate(-50%, -50%)' }}
              onMouseDown={handleRotateMouseDown}
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
        
        {/* Resize and Rotate Handles */}
        {isSelected && (
          <>
            {/* Resize Handle - Bottom Right Corner */}
            <div
              className="absolute bottom-0 right-0 w-3 h-3 bg-blue-500 border border-white cursor-se-resize"
              style={{ transform: 'translate(50%, 50%)' }}
              onMouseDown={handleResizeMouseDown}
            />
            
            {/* Rotate Handle - Top Center */}
            <div
              className="absolute top-0 left-1/2 w-3 h-3 bg-green-500 border border-white rounded-full cursor-pointer"
              style={{ transform: 'translate(-50%, -50%)' }}
              onMouseDown={handleRotateMouseDown}
            />
          </>
        )}
      </div>
    )
  }

  return null
}
