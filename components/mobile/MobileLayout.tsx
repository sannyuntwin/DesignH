'use client'

import { useState, useEffect, useRef } from 'react'
import { Menu, X, ChevronLeft, ChevronRight, Plus, Settings, Home, Folder, User } from 'lucide-react'

interface MobileLayoutProps {
  children: React.ReactNode
  title?: string
  showBackButton?: boolean
  onBack?: () => void
  rightAction?: React.ReactNode
}

export function MobileLayout({ 
  children, 
  title, 
  showBackButton, 
  onBack, 
  rightAction 
}: MobileLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [isMobile, setIsMobile] = useState(false)

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768)
    }
    
    checkMobile()
    window.addEventListener('resize', checkMobile)
    return () => window.removeEventListener('resize', checkMobile)
  }, [])

  if (!isMobile) {
    return <div className="w-full h-full">{children}</div>
  }

  return (
    <div className="flex flex-col h-full bg-gray-50">
      {/* Mobile Header */}
      <div className="flex items-center justify-between p-4 bg-white border-b">
        <div className="flex items-center gap-3">
          {showBackButton && (
            <button
              onClick={onBack}
              className="p-2 hover:bg-gray-100 rounded-lg"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
          )}
          
          <button
            onClick={() => setSidebarOpen(true)}
            className="p-2 hover:bg-gray-100 rounded-lg"
          >
            <Menu className="w-5 h-5" />
          </button>
          
          {title && (
            <h1 className="text-lg font-semibold text-gray-900">{title}</h1>
          )}
        </div>
        
        {rightAction}
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-hidden">
        {children}
      </div>

      {/* Mobile Sidebar */}
      <MobileSidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
    </div>
  )
}

interface MobileSidebarProps {
  isOpen: boolean
  onClose: () => void
}

function MobileSidebar({ isOpen, onClose }: MobileSidebarProps) {
  const overlayRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose()
      }
    }

    if (isOpen) {
      document.addEventListener('keydown', handleEscape)
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }

    return () => {
      document.removeEventListener('keydown', handleEscape)
      document.body.style.overflow = ''
    }
  }, [isOpen, onClose])

  const handleOverlayClick = (e: React.MouseEvent) => {
    if (e.target === overlayRef.current) {
      onClose()
    }
  }

  if (!isOpen) return null

  return (
    <div
      ref={overlayRef}
      className="fixed inset-0 z-50 flex"
      onClick={handleOverlayClick}
    >
      {/* Overlay */}
      <div className="absolute inset-0 bg-black bg-opacity-50" />
      
      {/* Sidebar */}
      <div className="relative w-80 max-w-[80vw] h-full bg-white shadow-xl">
        <div className="flex items-center justify-between p-4 border-b">
          <h2 className="text-lg font-semibold">Menu</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        
        <nav className="p-4 space-y-2">
          <button className="w-full flex items-center gap-3 p-3 hover:bg-gray-100 rounded-lg text-left">
            <Home className="w-5 h-5" />
            <span>Dashboard</span>
          </button>
          
          <button className="w-full flex items-center gap-3 p-3 hover:bg-gray-100 rounded-lg text-left">
            <Folder className="w-5 h-5" />
            <span>My Designs</span>
          </button>
          
          <button className="w-full flex items-center gap-3 p-3 hover:bg-gray-100 rounded-lg text-left">
            <Plus className="w-5 h-5" />
            <span>New Design</span>
          </button>
          
          <button className="w-full flex items-center gap-3 p-3 hover:bg-gray-100 rounded-lg text-left">
            <Settings className="w-5 h-5" />
            <span>Settings</span>
          </button>
          
          <button className="w-full flex items-center gap-3 p-3 hover:bg-gray-100 rounded-lg text-left">
            <User className="w-5 h-5" />
            <span>Profile</span>
          </button>
        </nav>
      </div>
    </div>
  )
}

// Touch gesture hook for mobile interactions
export function useTouchGestures() {
  const [gestures, setGestures] = useState({
    tap: false,
    swipe: null as 'left' | 'right' | 'up' | 'down' | null,
    pinch: 0,
    rotate: 0
  })

  const touchStartRef = useRef<{ x: number; y: number; time: number } | null>(null)
  const lastTouchRef = useRef<{ x: number; y: number } | null>(null)

  const handleTouchStart = (e: React.TouchEvent) => {
    if (e.touches.length === 1) {
      const touch = e.touches[0]
      touchStartRef.current = {
        x: touch.clientX,
        y: touch.clientY,
        time: Date.now()
      }
      lastTouchRef.current = { x: touch.clientX, y: touch.clientY }
    }
  }

  const handleTouchMove = (e: React.TouchEvent) => {
    if (e.touches.length === 1 && lastTouchRef.current) {
      const touch = e.touches[0]
      lastTouchRef.current = { x: touch.clientX, y: touch.clientY }
    }
  }

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (!touchStartRef.current || !lastTouchRef.current) return

    const deltaX = lastTouchRef.current.x - touchStartRef.current.x
    const deltaY = lastTouchRef.current.y - touchStartRef.current.y
    const deltaTime = Date.now() - touchStartRef.current.time

    // Detect swipe
    if (Math.abs(deltaX) > 50 && deltaTime < 300) {
      const swipe = deltaX > 0 ? 'right' : 'left'
      setGestures(prev => ({ ...prev, swipe }))
      setTimeout(() => setGestures(prev => ({ ...prev, swipe: null })), 100)
    } else if (Math.abs(deltaY) > 50 && deltaTime < 300) {
      const swipe = deltaY > 0 ? 'down' : 'up'
      setGestures(prev => ({ ...prev, swipe }))
      setTimeout(() => setGestures(prev => ({ ...prev, swipe: null })), 100)
    }
    // Detect tap
    else if (Math.abs(deltaX) < 10 && Math.abs(deltaY) < 10 && deltaTime < 200) {
      setGestures(prev => ({ ...prev, tap: true }))
      setTimeout(() => setGestures(prev => ({ ...prev, tap: false })), 100)
    }

    touchStartRef.current = null
    lastTouchRef.current = null
  }

  return {
    gestures,
    handleTouchStart,
    handleTouchMove,
    handleTouchEnd
  }
}

// Mobile-optimized toolbar
export function MobileToolbar({
  activeTool,
  onToolChange,
  onToggleGrid,
  showGrid
}: {
  activeTool: string
  onToolChange: (tool: string) => void
  onToggleGrid: () => void
  showGrid: boolean
}) {
  const tools = [
    { id: 'select', name: 'Select', icon: '↖️' },
    { id: 'rectangle', name: 'Rectangle', icon: '⬜' },
    { id: 'circle', name: 'Circle', icon: '⭕' },
    { id: 'text', name: 'Text', icon: '📝' },
    { id: 'image', name: 'Image', icon: '🖼️' }
  ]

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-white border-t p-2 z-40">
      <div className="flex items-center justify-around">
        {tools.map((tool) => (
          <button
            key={tool.id}
            onClick={() => onToolChange(tool.id)}
            className={`flex flex-col items-center p-2 rounded-lg ${
              activeTool === tool.id ? 'bg-blue-100 text-blue-600' : 'text-gray-600'
            }`}
          >
            <span className="text-xl">{tool.icon}</span>
            <span className="text-xs mt-1">{tool.name}</span>
          </button>
        ))}
        
        <button
          onClick={onToggleGrid}
          className={`flex flex-col items-center p-2 rounded-lg ${
            showGrid ? 'bg-blue-100 text-blue-600' : 'text-gray-600'
          }`}
        >
          <span className="text-xl">⊞</span>
          <span className="text-xs mt-1">Grid</span>
        </button>
      </div>
    </div>
  )
}

// Mobile-optimized properties panel
export function MobilePropertiesPanel({
  element,
  onUpdate,
  onClose
}: {
  element: any
  onUpdate: (updates: any) => void
  onClose: () => void
}) {
  const [activeTab, setActiveTab] = useState<'basic' | 'style' | 'effects'>('basic')

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-white">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b">
        <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg">
          <ChevronLeft className="w-5 h-5" />
        </button>
        <h2 className="text-lg font-semibold">Properties</h2>
        <div className="w-9" /> {/* Spacer for centering */}
      </div>

      {/* Tabs */}
      <div className="flex border-b">
        <button
          onClick={() => setActiveTab('basic')}
          className={`flex-1 py-3 text-sm font-medium ${
            activeTab === 'basic'
              ? 'text-blue-600 border-b-2 border-blue-600'
              : 'text-gray-500'
          }`}
        >
          Basic
        </button>
        <button
          onClick={() => setActiveTab('style')}
          className={`flex-1 py-3 text-sm font-medium ${
            activeTab === 'style'
              ? 'text-blue-600 border-b-2 border-blue-600'
              : 'text-gray-500'
          }`}
        >
          Style
        </button>
        <button
          onClick={() => setActiveTab('effects')}
          className={`flex-1 py-3 text-sm font-medium ${
            activeTab === 'effects'
              ? 'text-blue-600 border-b-2 border-blue-600'
              : 'text-gray-500'
          }`}
        >
          Effects
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4">
        {activeTab === 'basic' && (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">Width</label>
              <input
                type="number"
                value={element.width || 0}
                onChange={(e) => onUpdate({ width: Number(e.target.value) })}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Height</label>
              <input
                type="number"
                value={element.height || 0}
                onChange={(e) => onUpdate({ height: Number(e.target.value) })}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Opacity</label>
              <input
                type="range"
                min="0"
                max="1"
                step="0.1"
                value={element.opacity || 1}
                onChange={(e) => onUpdate({ opacity: Number(e.target.value) })}
                className="w-full"
              />
            </div>
          </div>
        )}

        {activeTab === 'style' && (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">Fill Color</label>
              <input
                type="color"
                value={element.fill || '#000000'}
                onChange={(e) => onUpdate({ fill: e.target.value })}
                className="w-full h-10 border border-gray-200 rounded-lg"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Stroke Color</label>
              <input
                type="color"
                value={element.stroke || '#000000'}
                onChange={(e) => onUpdate({ stroke: e.target.value })}
                className="w-full h-10 border border-gray-200 rounded-lg"
              />
            </div>
          </div>
        )}

        {activeTab === 'effects' && (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">Rotation</label>
              <input
                type="range"
                min="0"
                max="360"
                value={element.rotation || 0}
                onChange={(e) => onUpdate({ rotation: Number(e.target.value) })}
                className="w-full"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Shadow</label>
              <select className="w-full px-3 py-2 border border-gray-200 rounded-lg">
                <option>None</option>
                <option>Small</option>
                <option>Medium</option>
                <option>Large</option>
              </select>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

// Responsive design hook
export function useResponsive() {
  const [screenSize, setScreenSize] = useState<'mobile' | 'tablet' | 'desktop'>('desktop')
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 })

  useEffect(() => {
    const updateDimensions = () => {
      const width = window.innerWidth
      const height = window.innerHeight
      
      setDimensions({ width, height })
      
      if (width < 768) {
        setScreenSize('mobile')
      } else if (width < 1024) {
        setScreenSize('tablet')
      } else {
        setScreenSize('desktop')
      }
    }

    updateDimensions()
    window.addEventListener('resize', updateDimensions)
    return () => window.removeEventListener('resize', updateDimensions)
  }, [])

  return {
    screenSize,
    dimensions,
    isMobile: screenSize === 'mobile',
    isTablet: screenSize === 'tablet',
    isDesktop: screenSize === 'desktop'
  }
}

// Mobile-safe canvas wrapper
export function MobileCanvas({ children }: { children: React.ReactNode }) {
  const canvasRef = useRef<HTMLDivElement>(null)
  const { isMobile } = useResponsive()

  useEffect(() => {
    if (!isMobile || !canvasRef.current) return

    const preventDefault = (e: TouchEvent) => {
      e.preventDefault()
    }

    const canvas = canvasRef.current
    canvas.addEventListener('touchstart', preventDefault, { passive: false })
    canvas.addEventListener('touchmove', preventDefault, { passive: false })

    return () => {
      canvas.removeEventListener('touchstart', preventDefault)
      canvas.removeEventListener('touchmove', preventDefault)
    }
  }, [isMobile])

  return (
    <div
      ref={canvasRef}
      className={`w-full h-full ${isMobile ? 'touch-none' : ''}`}
      style={{ touchAction: isMobile ? 'none' : 'auto' }}
    >
      {children}
    </div>
  )
}
