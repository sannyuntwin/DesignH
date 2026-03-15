import React, { useState } from 'react'
import { ChevronDown, FileText } from 'lucide-react'
import { useCanvasStore } from '@/store/canvas-store'

const quickSizes = [
  { name: 'A4', width: 794, height: 1123 },
  { name: 'Letter', width: 816, height: 1056 },
  { name: 'Mobile', width: 375, height: 812 },
  { name: 'Desktop', width: 1920, height: 1080 },
]

export default function QuickPageSizeSelector() {
  const { pages, currentPageId, setCanvasSize } = useCanvasStore()
  const [isOpen, setIsOpen] = useState(false)
  
  const currentPage = pages.find(page => page.id === currentPageId)

  const handleSizeSelect = (width: number, height: number) => {
    setCanvasSize(width, height)
    setIsOpen(false)
  }

  const getCurrentSizeName = () => {
    if (!currentPage) return 'Custom'
    
    const match = quickSizes.find(
      size => size.width === currentPage.canvasWidth && size.height === currentPage.canvasHeight
    )
    return match ? match.name : 'Custom'
  }

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-3 py-1.5 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors duration-200 text-sm"
      >
        <FileText className="w-4 h-4 text-gray-500" />
        <span className="font-medium text-gray-700">{getCurrentSizeName()}</span>
        <ChevronDown className={`w-3 h-3 text-gray-400 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <div className="absolute top-full left-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-50 min-w-[140px]">
          <div className="p-1">
            {quickSizes.map((size) => (
              <button
                key={size.name}
                onClick={() => handleSizeSelect(size.width, size.height)}
                className="w-full text-left px-3 py-2 text-sm rounded-md hover:bg-gray-100 transition-colors duration-200 flex items-center justify-between"
              >
                <span className="font-medium text-gray-700">{size.name}</span>
                <span className="text-xs text-gray-500">
                  {size.width}×{size.height}
                </span>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
