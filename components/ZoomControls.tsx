'use client'

import React, { useState } from 'react'
import { ZoomIn, ZoomOut, Maximize2, Move } from 'lucide-react'
import { useCanvasStore } from '../store/canvas-store'

export default function ZoomControls() {
  const [zoom, setZoom] = useState(100)
  const [isPanning, setIsPanning] = useState(false)
  const [pan, setPan] = useState({ x: 0, y: 0 })
  const [panStart, setPanStart] = useState({ x: 0, y: 0 })

  const handleZoomIn = () => {
    setZoom(prev => Math.min(prev + 25, 500))
  }

  const handleZoomOut = () => {
    setZoom(prev => Math.max(prev - 25, 25))
  }

  const handleZoomReset = () => {
    setZoom(100)
    setPan({ x: 0, y: 0 })
  }

  const handleWheel = (e: React.WheelEvent) => {
    if (e.ctrlKey || e.metaKey) {
      e.preventDefault()
      const delta = e.deltaY > 0 ? -25 : 25
      setZoom(prev => Math.max(25, Math.min(500, prev + delta)))
    }
  }

  const handlePanStart = (e: React.MouseEvent) => {
    if (e.button === 1 || (e.button === 0 && (e as any).spaceKey)) { // Middle mouse or space+click
      e.preventDefault()
      setIsPanning(true)
      setPanStart({ x: e.clientX - pan.x, y: e.clientY - pan.y })
    }
  }

  const handlePanMove = (e: React.MouseEvent) => {
    if (isPanning) {
      setPan({
        x: e.clientX - panStart.x,
        y: e.clientY - panStart.y,
      })
    }
  }

  const handlePanEnd = () => {
    setIsPanning(false)
  }

  return (
    <div className="fixed bottom-4 right-4 bg-white border border-gray-200 rounded-lg shadow-lg p-2 flex items-center gap-2 z-50">
      {/* Pan Tool */}
      <button
        className={`p-2 rounded transition-colors ${
          isPanning ? 'bg-blue-100 text-blue-600' : 'hover:bg-gray-100 text-gray-700'
        }`}
        title="Pan (Space + Drag)"
      >
        <Move size={16} />
      </button>

      <div className="w-px h-6 bg-gray-300"></div>

      {/* Zoom Controls */}
      <button
        onClick={handleZoomOut}
        className="p-2 hover:bg-gray-100 rounded transition-colors text-gray-700"
        title="Zoom Out (Ctrl + Scroll)"
      >
        <ZoomOut size={16} />
      </button>

      <div className="min-w-[60px] text-center">
        <span className="text-sm font-medium text-gray-700">{zoom}%</span>
      </div>

      <button
        onClick={handleZoomIn}
        className="p-2 hover:bg-gray-100 rounded transition-colors text-gray-700"
        title="Zoom In (Ctrl + Scroll)"
      >
        <ZoomIn size={16} />
      </button>

      <div className="w-px h-6 bg-gray-300"></div>

      <button
        onClick={handleZoomReset}
        className="p-2 hover:bg-gray-100 rounded transition-colors text-gray-700"
        title="Reset Zoom"
      >
        <Maximize2 size={16} />
      </button>
    </div>
  )
}

// Hook for canvas zoom and pan
export function useCanvasZoom() {
  const [zoom, setZoom] = useState(100)
  const [pan, setPan] = useState({ x: 0, y: 0 })

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
