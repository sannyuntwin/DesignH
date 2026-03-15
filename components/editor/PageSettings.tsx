import React, { useState } from 'react'
import { Settings, FileText, Monitor, Smartphone } from 'lucide-react'
import { useCanvasStore } from '@/store/canvas-store'

interface PageSizePreset {
  name: string
  width: number
  height: number
  icon: React.ReactNode
  description: string
}

const pageSizePresets: PageSizePreset[] = [
  {
    name: 'A4',
    width: 794,
    height: 1123,
    icon: <FileText className="w-4 h-4" />,
    description: '210 × 297 mm'
  },
  {
    name: 'A3',
    width: 1123,
    height: 1587,
    icon: <FileText className="w-4 h-4" />,
    description: '297 × 420 mm'
  },
  {
    name: 'Letter',
    width: 816,
    height: 1056,
    icon: <FileText className="w-4 h-4" />,
    description: '8.5 × 11 inches'
  },
  {
    name: 'Legal',
    width: 816,
    height: 1344,
    icon: <FileText className="w-4 h-4" />,
    description: '8.5 × 14 inches'
  },
  {
    name: 'Desktop',
    width: 1920,
    height: 1080,
    icon: <Monitor className="w-4 h-4" />,
    description: '1920 × 1080 px (HD)'
  },
  {
    name: 'Mobile',
    width: 375,
    height: 812,
    icon: <Smartphone className="w-4 h-4" />,
    description: '375 × 812 px (iPhone X)'
  },
  {
    name: 'Square',
    width: 1080,
    height: 1080,
    icon: <Settings className="w-4 h-4" />,
    description: '1080 × 1080 px (Instagram)'
  },
  {
    name: 'Custom',
    width: 794,
    height: 1123,
    icon: <Settings className="w-4 h-4" />,
    description: 'Custom dimensions'
  }
]

export default function PageSettings() {
  const { pages, currentPageId, setCanvasSize, updatePageName } = useCanvasStore()
  const [customWidth, setCustomWidth] = useState(794)
  const [customHeight, setCustomHeight] = useState(1123)
  const [selectedPreset, setSelectedPreset] = useState('A4')
  const [isCustom, setIsCustom] = useState(false)

  const currentPage = pages.find(page => page.id === currentPageId)

  const handlePresetSelect = (preset: PageSizePreset) => {
    setSelectedPreset(preset.name)
    setIsCustom(preset.name === 'Custom')
    
    if (preset.name !== 'Custom') {
      setCanvasSize(preset.width, preset.height)
      setCustomWidth(preset.width)
      setCustomHeight(preset.height)
    }
  }

  const handleCustomSizeApply = () => {
    const width = Math.max(100, Math.min(5000, customWidth))
    const height = Math.max(100, Math.min(5000, customHeight))
    
    setCanvasSize(width, height)
    setCustomWidth(width)
    setCustomHeight(height)
  }

  const handlePageNameChange = (name: string) => {
    if (currentPage) {
      updatePageName(currentPage.id, name)
    }
  }

  if (!currentPage) return null

  return (
    <div className="p-4 space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Page Settings</h3>
        
        {/* Page Name */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Page Name
          </label>
          <input
            type="text"
            value={currentPage.name}
            onChange={(e) => handlePageNameChange(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="Enter page name"
          />
        </div>

        {/* Current Size Display */}
        <div className="mb-6 p-3 bg-gray-50 rounded-lg">
          <div className="text-sm text-gray-600 mb-1">Current Size</div>
          <div className="text-lg font-semibold text-gray-900">
            {currentPage.canvasWidth} × {currentPage.canvasHeight} px
          </div>
        </div>

        {/* Preset Sizes */}
        <div className="space-y-3">
          <label className="block text-sm font-medium text-gray-700 mb-3">
            Page Size Presets
          </label>
          
          <div className="grid grid-cols-2 gap-2">
            {pageSizePresets.map((preset) => (
              <button
                key={preset.name}
                onClick={() => handlePresetSelect(preset)}
                className={`p-3 rounded-lg border-2 transition-all duration-200 text-left ${
                  selectedPreset === preset.name
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                }`}
              >
                <div className="flex items-center gap-2 mb-1">
                  {preset.icon}
                  <span className="font-medium text-sm">{preset.name}</span>
                </div>
                <div className="text-xs text-gray-500">{preset.description}</div>
              </button>
            ))}
          </div>
        </div>

        {/* Custom Size Inputs */}
        {isCustom && (
          <div className="mt-6 p-4 border border-gray-200 rounded-lg bg-gray-50">
            <h4 className="text-sm font-medium text-gray-700 mb-3">Custom Dimensions</h4>
            
            <div className="space-y-3">
              <div>
                <label className="block text-xs text-gray-600 mb-1">Width (px)</label>
                <input
                  type="number"
                  value={customWidth}
                  onChange={(e) => setCustomWidth(Number(e.target.value))}
                  min="100"
                  max="5000"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              
              <div>
                <label className="block text-xs text-gray-600 mb-1">Height (px)</label>
                <input
                  type="number"
                  value={customHeight}
                  onChange={(e) => setCustomHeight(Number(e.target.value))}
                  min="100"
                  max="5000"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              
              <button
                onClick={handleCustomSizeApply}
                className="w-full px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors duration-200 font-medium text-sm"
              >
                Apply Custom Size
              </button>
            </div>
          </div>
        )}

        {/* Aspect Ratio Info */}
        <div className="mt-6 p-3 bg-blue-50 rounded-lg">
          <div className="text-sm text-blue-800">
            <div className="font-medium mb-1">Aspect Ratio</div>
            <div className="text-xs">
              {(currentPage.canvasWidth / currentPage.canvasHeight).toFixed(2)} : 1
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
