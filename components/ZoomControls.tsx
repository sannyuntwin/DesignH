'use client'

import React from 'react'
import { ZoomIn, ZoomOut, Maximize2, Move } from 'lucide-react'
import { useCanvasStore } from '../store/canvas-store'

export default function ZoomControls() {
  const { zoomLevel, zoomIn, zoomOut, resetZoom, setZoomLevel, panOffset, setPanOffset } = useCanvasStore()
  const [isPanning, setIsPanning] = React.useState(false)
  const [panStart, setPanStart] = React.useState({ x: 0, y: 0 })

  const zoomPercentage = Math.round(zoomLevel * 100)

  const handleWheel = (e: React.WheelEvent) => {
    if (e.ctrlKey || e.metaKey) {
      e.preventDefault()
      const delta = e.deltaY > 0 ? -0.1 : 0.1
      setZoomLevel(zoomLevel + delta)
    }
  }

  const handlePanStart = (e: React.MouseEvent) => {
    if (e.button === 1 || (e.button === 0 && e.shiftKey)) { // Middle mouse or shift+click
      e.preventDefault()
      setIsPanning(true)
      setPanStart({ x: e.clientX - panOffset.x, y: e.clientY - panOffset.y })
    }
  }

  const handlePanMove = (e: React.MouseEvent) => {
    if (isPanning) {
      setPanOffset(
        e.clientX - panStart.x,
        e.clientY - panStart.y
      )
    }
  }

  const handlePanEnd = () => {
    setIsPanning(false)
  }

  React.useEffect(() => {
    const handleGlobalWheel = (e: WheelEvent) => {
      if (e.ctrlKey || e.metaKey) {
        e.preventDefault()
        const delta = e.deltaY > 0 ? -0.1 : 0.1
        setZoomLevel(zoomLevel + delta)
      }
    }

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === 'Space' && !e.repeat) {
        e.preventDefault()
        setIsPanning(true)
        document.body.style.cursor = 'grab'
      }
    }

    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.code === 'Space') {
        e.preventDefault()
        setIsPanning(false)
        document.body.style.cursor = 'default'
      }
    }

    document.addEventListener('wheel', handleGlobalWheel, { passive: false })
    document.addEventListener('keydown', handleKeyDown)
    document.addEventListener('keyup', handleKeyUp)

    return () => {
      document.removeEventListener('wheel', handleGlobalWheel)
      document.removeEventListener('keydown', handleKeyDown)
      document.removeEventListener('keyup', handleKeyUp)
      document.body.style.cursor = 'default'
    }
  }, [zoomLevel, setZoomLevel])

  return (
    <>
      <div className="fixed bottom-8 right-8 glass-panel rounded-2xl shadow-xl p-1.5 flex items-center gap-1.5 z-50 transition-all duration-300 hover:shadow-2xl translate-y-0 hover:-translate-y-1">
        {/* Pan Tool */}
        <button
          className={`p-2 rounded transition-colors ${isPanning ? 'bg-blue-100 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400' : 'hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300'
            }`}
          title="Pan (Space + Drag)"
        >
          <Move size={16} />
        </button>

        <div className="w-px h-6 bg-gray-300 dark:bg-gray-600"></div>

        {/* Zoom Controls */}
        <button
          onClick={zoomOut}
          className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition-colors text-gray-700 dark:text-gray-300"
          title="Zoom Out (Ctrl + Scroll)"
        >
          <ZoomOut size={16} />
        </button>

        <div className="min-w-[60px] text-center">
          <span className="text-sm font-medium text-gray-700 dark:text-gray-300">{zoomPercentage}%</span>
        </div>

        <button
          onClick={zoomIn}
          className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition-colors text-gray-700 dark:text-gray-300"
          title="Zoom In (Ctrl + Scroll)"
        >
          <ZoomIn size={16} />
        </button>

        <div className="w-px h-6 bg-gray-300 dark:bg-gray-600"></div>

        <button
          onClick={resetZoom}
          className="p-2.5 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-xl transition-all active:scale-90 text-gray-700 dark:text-gray-300"
          title="Reset Zoom"
        >
          <Maximize2 size={16} />
        </button>
      </div>

      {/* Global pan overlay */}
      {isPanning && (
        <div
          className="fixed inset-0 z-40 cursor-grab"
          onMouseMove={handlePanMove}
          onMouseUp={handlePanEnd}
          onMouseDown={handlePanStart}
          onWheel={handleWheel}
        />
      )}
    </>
  )
}

// Hook for canvas zoom and pan
export function useCanvasZoom() {
  const [zoom, setZoom] = React.useState(100)
  const [pan, setPan] = React.useState({ x: 0, y: 0 })

  const getTransform = () => {
    return `translate(${pan.x}px, ${pan.y}px) scale(${zoom / 100})`
  }

  const getInverseTransform = () => {
    return `scale(${100 / zoom}) translate(${-pan.x}px, ${-pan.y}px)`
  }

  const screenToCanvas = (screenX: number, screenY: number) => {
    const canvasX = (screenX - pan.x) / (zoom / 100)
    const canvasY = (screenY - pan.y) / (zoom / 100)
    return { x: canvasX, y: canvasY }
  }

  const canvasToScreen = (canvasX: number, canvasY: number) => {
    const screenX = canvasX * (zoom / 100) + pan.x
    const screenY = canvasY * (zoom / 100) + pan.y
    return { x: screenX, y: screenY }
  }

  return {
    zoom,
    setZoom,
    pan,
    setPan,
    getTransform,
    getInverseTransform,
    screenToCanvas,
    canvasToScreen,
  }
}
