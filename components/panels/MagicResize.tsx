'use client'

import { useState } from 'react'
import { Maximize2, Download, ArrowRight } from 'lucide-react'
import { useCanvasStore } from '@/store/canvas-store'

interface MagicResizeProps {
  onClose: () => void
}

const PRESET_SIZES = [
  { name: 'Instagram Post', width: 1080, height: 1080, icon: '📱' },
  { name: 'Instagram Story', width: 1080, height: 1920, icon: '📱' },
  { name: 'Facebook Post', width: 1200, height: 630, icon: '📘' },
  { name: 'Twitter Post', width: 1200, height: 675, icon: '🐦' },
  { name: 'LinkedIn Post', width: 1200, height: 627, icon: '💼' },
  { name: 'Pinterest Pin', width: 1000, height: 1500, icon: '📌' },
  { name: 'YouTube Thumbnail', width: 1280, height: 720, icon: '🎥' },
  { name: 'A4 Print', width: 794, height: 1123, icon: '📄' },
  { name: 'Business Card', width: 350, height: 200, icon: '💳' },
  { name: 'Presentation Slide', width: 1920, height: 1080, icon: '🖥️' },
  { name: 'Website Banner', width: 1920, height: 500, icon: '🌐' },
  { name: 'Email Header', width: 600, height: 200, icon: '📧' },
]

export default function MagicResize({ onClose }: MagicResizeProps) {
  const [selectedSize, setSelectedSize] = useState<typeof PRESET_SIZES[0] | null>(null)
  const [isResizing, setIsResizing] = useState(false)
  const [preserveAspectRatio, setPreserveAspectRatio] = useState(true)
  
  const { pages, currentPageId, setCanvasSize, addPage, setCurrentPage, updateElement } = useCanvasStore()
  const currentPage = pages.find(page => page.id === currentPageId)

  const handleResize = async () => {
    if (!selectedSize || !currentPage) return

    setIsResizing(true)

    try {
      // Create a new page with the selected size
      const newPageName = `${currentPage.name} - ${selectedSize.name}`
      
      // Add new page
      addPage(newPageName)
      
      // Get the newly created page (it will be the last one)
      const newPages = useCanvasStore.getState().pages
      const newPage = newPages[newPages.length - 1]
      
      if (newPage) {
        // Set the canvas size
        setCanvasSize(selectedSize.width, selectedSize.height)
        
        // Calculate scale factors
        const scaleX = selectedSize.width / currentPage.canvasWidth
        const scaleY = selectedSize.height / currentPage.canvasHeight
        
        // Reposition and resize elements
        currentPage.elements.forEach(element => {
          const updatedElement = {
            ...element,
            x: element.x * scaleX,
            y: element.y * scaleY,
            width: element.width * scaleX,
            height: element.height * scaleY,
            // Adjust font sizes proportionally
            fontSize: element.fontSize ? element.fontSize * Math.min(scaleX, scaleY) : undefined,
          }
          
          // Add the updated element to the new page
          updateElement(element.id, updatedElement)
        })
        
        // Switch to the new page
        setCurrentPage(newPage.id)
      }
      
      onClose()
    } catch (error) {
      console.error('Failed to resize:', error)
    } finally {
      setIsResizing(false)
    }
  }

  const handleCustomResize = () => {
    const width = prompt('Enter width (px):', '1200')
    const height = prompt('Enter height (px):', '630')
    
    if (width && height && !isNaN(Number(width)) && !isNaN(Number(height))) {
      const customSize = {
        name: 'Custom Size',
        width: Number(width),
        height: Number(height),
        icon: '📐'
      }
      setSelectedSize(customSize)
    }
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg w-full max-w-4xl max-h-[90vh] mx-4 flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b">
          <div>
            <h2 className="text-2xl font-semibold flex items-center gap-2">
              <Maximize2 className="w-6 h-6" />
              Magic Resize
            </h2>
            <p className="text-sm text-gray-600 mt-1">
              Resize your design to any format while preserving content
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg"
          >
            ×
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6">
          {/* Current Size Info */}
          {currentPage && (
            <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <h3 className="font-semibold text-blue-900 mb-2">Current Design Size</h3>
              <div className="flex items-center gap-4 text-blue-700">
                <span>{currentPage.canvasWidth} × {currentPage.canvasHeight}px</span>
                <span>•</span>
                <span>{currentPage.elements.length} elements</span>
              </div>
            </div>
          )}

          {/* Size Options */}
          <div className="mb-6">
            <h3 className="text-lg font-semibold mb-4">Choose New Size</h3>
            
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
              {PRESET_SIZES.map((size) => (
                <SizeCard
                  key={size.name}
                  size={size}
                  isSelected={selectedSize?.name === size.name}
                  onSelect={() => setSelectedSize(size)}
                />
              ))}
              
              {/* Custom Size */}
              <button
                onClick={handleCustomResize}
                className="p-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-colors"
              >
                <div className="text-2xl mb-2">📐</div>
                <div className="font-medium">Custom Size</div>
                <div className="text-sm text-gray-500">Set dimensions</div>
              </button>
            </div>
          </div>

          {/* Resize Options */}
          <div className="mb-6">
            <h3 className="text-lg font-semibold mb-4">Resize Options</h3>
            
            <div className="space-y-3">
              <label className="flex items-center gap-3">
                <input
                  type="checkbox"
                  checked={preserveAspectRatio}
                  onChange={(e) => setPreserveAspectRatio(e.target.checked)}
                  className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                />
                <span>Preserve aspect ratio of elements</span>
              </label>
            </div>
          </div>

          {/* Preview */}
          {selectedSize && currentPage && (
            <div className="mb-6">
              <h3 className="text-lg font-semibold mb-4">Preview</h3>
              
              <div className="flex items-center gap-8 p-4 bg-gray-50 rounded-lg">
                <div className="text-center">
                  <div className="text-sm text-gray-500 mb-2">Current</div>
                  <div
                    className="bg-white border-2 border-gray-300 rounded"
                    style={{
                      width: '60px',
                      height: `${(60 * currentPage.canvasHeight) / currentPage.canvasWidth}px`
                    }}
                  />
                  <div className="text-xs text-gray-500 mt-1">
                    {currentPage.canvasWidth}×{currentPage.canvasHeight}
                  </div>
                </div>
                
                <ArrowRight className="w-5 h-5 text-gray-400" />
                
                <div className="text-center">
                  <div className="text-sm text-gray-500 mb-2">New</div>
                  <div
                    className="bg-white border-2 border-blue-500 rounded"
                    style={{
                      width: '60px',
                      height: `${(60 * selectedSize.height) / selectedSize.width}px`
                    }}
                  />
                  <div className="text-xs text-gray-500 mt-1">
                    {selectedSize.width}×{selectedSize.height}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="p-6 border-t flex items-center justify-between">
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg"
          >
            Cancel
          </button>
          
          <button
            onClick={handleResize}
            disabled={!selectedSize || isResizing}
            className="px-6 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:bg-gray-300 disabled:cursor-not-allowed flex items-center gap-2"
          >
            {isResizing ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                Resizing...
              </>
            ) : (
              <>
                <Maximize2 className="w-4 h-4" />
                Resize Design
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  )
}

interface SizeCardProps {
  size: typeof PRESET_SIZES[0]
  isSelected: boolean
  onSelect: () => void
}

function SizeCard({ size, isSelected, onSelect }: SizeCardProps) {
  return (
    <button
      onClick={onSelect}
      className={`p-4 border rounded-lg transition-all ${
        isSelected
          ? 'border-blue-500 bg-blue-50 shadow-md'
          : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
      }`}
    >
      <div className="text-2xl mb-2">{size.icon}</div>
      <div className="font-medium text-sm mb-1">{size.name}</div>
      <div className="text-xs text-gray-500">
        {size.width} × {size.height}px
      </div>
    </button>
  )
}
