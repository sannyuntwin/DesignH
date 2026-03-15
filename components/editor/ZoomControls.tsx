'use client'

import React from 'react'
import { ZoomIn, ZoomOut, Maximize2, Move } from 'lucide-react'
import { useCanvasStore } from '@/store/canvas-store'

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
    if (e.button === 1 || (e.button === 0 && e.shiftKey)) {
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
      const target = e.target as HTMLElement
      const isEditing = target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable

      if (e.code === 'Space') {
        if (!isEditing) {
          e.preventDefault()
          if (!e.repeat) {
            setIsPanning(true)
            document.body.style.cursor = 'grab'
          }
        }
      }
    }

    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.code === 'Space') {
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
      <div className="flex items-center gap-1 bg-surface border border-border rounded-lg p-1">
        <button
          className={`btn btn-ghost btn-icon-sm ${isPanning ? 'bg-primary/10 text-primary' : ''}`}
          title="Pan (Space + Drag)"
        >
          <Move className="w-4 h-4" />
        </button>

        <div className="w-px h-5 bg-border" />

        <button
          onClick={zoomOut}
          className="btn btn-ghost btn-icon-sm"
          title="Zoom Out (Ctrl + Scroll)"
        >
          <ZoomOut className="w-4 h-4" />
        </button>

        <span className="text-xs font-medium text-secondary min-w-[40px] text-center">
          {zoomPercentage}%
        </span>

        <button
          onClick={zoomIn}
          className="btn btn-ghost btn-icon-sm"
          title="Zoom In (Ctrl + Scroll)"
        >
          <ZoomIn className="w-4 h-4" />
        </button>

        <div className="w-px h-5 bg-border" />

        <button
          onClick={resetZoom}
          className="btn btn-ghost btn-icon-sm"
          title="Reset Zoom"
        >
          <Maximize2 className="w-4 h-4" />
        </button>
      </div>

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
