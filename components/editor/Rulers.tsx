import React, { useEffect, useRef, useState } from 'react'
import { useCanvasStore } from '@/store/canvas-store'

interface RulerProps {
  width: number
  height: number
  zoomLevel: number
  panOffset: { x: number; y: number }
}

// Simple ruler visibility state using localStorage
const useRulerVisibility = () => {
  const [isVisible, setIsVisible] = useState(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('rulers-visible')
      return saved !== null ? saved === 'true' : true
    }
    return true
  })

  const toggleVisibility = () => {
    const newState = !isVisible
    setIsVisible(newState)
    if (typeof window !== 'undefined') {
      localStorage.setItem('rulers-visible', newState.toString())
    }
  }

  // Listen for storage changes from other components
  useEffect(() => {
    const handleStorageChange = () => {
      const saved = localStorage.getItem('rulers-visible')
      if (saved !== null) {
        setIsVisible(saved === 'true')
      }
    }

    window.addEventListener('storage', handleStorageChange)
    return () => window.removeEventListener('storage', handleStorageChange)
  }, [])

  return { isVisible, toggleVisibility }
}

export default function Rulers({ width, height, zoomLevel, panOffset }: RulerProps) {
  const { isVisible } = useRulerVisibility()
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 })
  const containerRef = useRef<HTMLDivElement>(null)

  if (!isVisible) {
    return null
  }

  // Calculate ruler dimensions
  const rulerHeight = 20
  const rulerWidth = 20
  const rulerMarkSize = 8
  const rulerTextSize = 10

  // Generate ruler marks
  const generateHorizontalMarks = () => {
    const marks = []
    const step = zoomLevel >= 2 ? 100 : zoomLevel >= 1 ? 50 : 25
    const start = Math.floor((-panOffset.x / zoomLevel) / step) * step
    const end = Math.ceil((width - panOffset.x) / zoomLevel / step) * step

    for (let i = start; i <= end; i += step) {
      if (i >= 0) {
        const x = i * zoomLevel + panOffset.x
        marks.push(
          <div
            key={`h-${i}`}
            className="absolute"
            style={{
              left: `${x}px`,
              top: '0px',
              width: '1px',
              height: `${i % (step * 2) === 0 ? rulerMarkSize : rulerMarkSize / 2}px`,
              backgroundColor: i % (step * 2) === 0 ? '#374151' : '#9CA3AF'
            }}
          />
        )
        if (i % (step * 2) === 0) {
          marks.push(
            <div
              key={`ht-${i}`}
              className="absolute text-gray-600"
              style={{
                left: `${x - 10}px`,
                top: '2px',
                fontSize: `${rulerTextSize}px`,
                transform: `scale(${1 / zoomLevel})`,
                transformOrigin: 'left center'
              }}
            >
              {i}
            </div>
          )
        }
      }
    }
    return marks
  }

  const generateVerticalMarks = () => {
    const marks = []
    const step = zoomLevel >= 2 ? 100 : zoomLevel >= 1 ? 50 : 25
    const start = Math.floor((-panOffset.y / zoomLevel) / step) * step
    const end = Math.ceil((height - panOffset.y) / zoomLevel / step) * step

    for (let i = start; i <= end; i += step) {
      if (i >= 0) {
        const y = i * zoomLevel + panOffset.y
        marks.push(
          <div
            key={`v-${i}`}
            className="absolute"
            style={{
              left: '0px',
              top: `${y}px`,
              width: `${i % (step * 2) === 0 ? rulerMarkSize : rulerMarkSize / 2}px`,
              height: '1px',
              backgroundColor: i % (step * 2) === 0 ? '#374151' : '#9CA3AF'
            }}
          />
        )
        if (i % (step * 2) === 0) {
          marks.push(
            <div
              key={`vt-${i}`}
              className="absolute text-gray-600"
              style={{
                left: '2px',
                top: `${y - 8}px`,
                fontSize: `${rulerTextSize}px`,
                transform: `scale(${1 / zoomLevel})`,
                transformOrigin: 'left center'
              }}
            >
              {i}
            </div>
          )
        }
      }
    }
    return marks
  }

  const handleMouseMove = (e: React.MouseEvent) => {
    if (containerRef.current) {
      const rect = containerRef.current.getBoundingClientRect()
      setMousePos({
        x: Math.round((e.clientX - rect.left - panOffset.x) / zoomLevel),
        y: Math.round((e.clientY - rect.top - panOffset.y) / zoomLevel)
      })
    }
  }

  return (
    <div
      ref={containerRef}
      className="absolute inset-0 pointer-events-none"
      onMouseMove={handleMouseMove}
    >
      {/* Horizontal Ruler */}
      <div
        className="absolute left-0 right-0 bg-gray-100 border-b border-gray-300 overflow-hidden"
        style={{
          height: `${rulerHeight}px`,
          left: `${rulerWidth}px`
        }}
      >
        {generateHorizontalMarks()}
        
        {/* Mouse position indicator */}
        <div
          className="absolute top-0 w-0.5 h-full bg-red-500"
          style={{
            left: `${mousePos.x * zoomLevel + panOffset.x}px`,
            transform: 'translateX(-50%)'
          }}
        />
        
        {/* Mouse position text */}
        <div
          className="absolute top-1 bg-red-500 text-white text-xs px-1 rounded"
          style={{
            left: `${mousePos.x * zoomLevel + panOffset.x + 10}px`,
            transform: `scale(${1 / zoomLevel})`,
            transformOrigin: 'left center'
          }}
        >
          {mousePos.x}px
        </div>
      </div>

      {/* Vertical Ruler */}
      <div
        className="absolute top-0 bottom-0 bg-gray-100 border-r border-gray-300 overflow-hidden"
        style={{
          width: `${rulerWidth}px`,
          top: `${rulerHeight}px`
        }}
      >
        {generateVerticalMarks()}
        
        {/* Mouse position indicator */}
        <div
          className="absolute left-0 w-full h-0.5 bg-red-500"
          style={{
            top: `${mousePos.y * zoomLevel + panOffset.y}px`,
            transform: 'translateY(-50%)'
          }}
        />
        
        {/* Mouse position text */}
        <div
          className="absolute left-1 bg-red-500 text-white text-xs px-1 rounded"
          style={{
            top: `${mousePos.y * zoomLevel + panOffset.y + 10}px`,
            transform: `scale(${1 / zoomLevel}) rotate(-90deg)`,
            transformOrigin: 'left center'
          }}
        >
          {mousePos.y}px
        </div>
      </div>

      {/* Corner */}
      <div
        className="absolute bg-gray-200 border-r border-b border-gray-300"
        style={{
          width: `${rulerWidth}px`,
          height: `${rulerHeight}px`,
          left: '0px',
          top: '0px'
        }}
      />
    </div>
  )
}
