'use client'

import React from 'react'
import { useCanvasStore } from '@/store/canvas-store'

const GRADIENT_DIRECTIONS = [
  { label: 'Horizontal', value: 'horizontal' },
  { label: 'Vertical', value: 'vertical' },
  { label: 'Diagonal', value: 'diagonal' },
]

const PRESET_COLORS = [
  '#ef4444', '#f97316', '#f59e0b', '#eab308', '#84cc16',
  '#22c55e', '#10b981', '#14b8a6', '#06b6d4', '#0ea5e9',
  '#3b82f6', '#6366f1', '#8b5cf6', '#a855f7', '#d946ef',
  '#ec4899', '#f43f5e', '#000000', '#6b7280', '#ffffff'
]

const PRESET_GRADIENTS = [
  { colors: ['#3b82f6', '#8b5cf6', '#ec4899'], direction: 'horizontal' as const },
  { colors: ['#ef4444', '#f97316', '#eab308'], direction: 'horizontal' as const },
  { colors: ['#22c55e', '#10b981', '#14b8a6'], direction: 'horizontal' as const },
  { colors: ['#f59e0b', '#ef4444', '#8b5cf6'], direction: 'vertical' as const },
  { colors: ['#8b5cf6', '#ec4899', '#f97316'], direction: 'diagonal' as const },
]

export default function ShapePropertiesPanel() {
  const { pages, currentPageId, selectedElement, updateElement } = useCanvasStore()

  const currentPage = pages.find(page => page.id === currentPageId)
  const currentElement = currentPage?.elements.find(el => el.id === selectedElement)

  if (!currentElement || !['circle', 'square', 'rectangle', 'triangle'].includes(currentElement.type)) {
    return (
      <div className="p-4">
        <p className="text-gray-500 text-sm">Select a shape to edit properties</p>
      </div>
    )
  }

  const handleColorChange = (color: string) => {
    if (selectedElement) {
      updateElement(selectedElement, {
        backgroundColor: color,
        gradient: undefined // Remove gradient when solid color is selected
      })
    }
  }

  const handleGradientChange = (gradient: { colors: string[]; direction: 'horizontal' | 'vertical' | 'diagonal' }) => {
    if (selectedElement) {
      updateElement(selectedElement, { gradient })
    }
  }

  const handleGradientDirectionChange = (direction: 'horizontal' | 'vertical' | 'diagonal') => {
    if (selectedElement && currentElement.gradient) {
      updateElement(selectedElement, {
        gradient: { ...currentElement.gradient, direction }
      })
    }
  }

  const handleUpdateStopColor = (index: number, color: string) => {
    if (selectedElement && currentElement.gradient) {
      const newColors = [...currentElement.gradient.colors]
      newColors[index] = color
      updateElement(selectedElement, {
        gradient: { ...currentElement.gradient, colors: newColors }
      })
    }
  }

  const handleAddStop = () => {
    if (selectedElement && currentElement.gradient) {
      const lastColor = currentElement.gradient.colors[currentElement.gradient.colors.length - 1]
      updateElement(selectedElement, {
        gradient: {
          ...currentElement.gradient,
          colors: [...currentElement.gradient.colors, lastColor]
        }
      })
    }
  }

  const handleRemoveStop = (index: number) => {
    if (selectedElement && currentElement.gradient && currentElement.gradient.colors.length > 2) {
      const newColors = currentElement.gradient.colors.filter((_, i) => i !== index)
      updateElement(selectedElement, {
        gradient: { ...currentElement.gradient, colors: newColors }
      })
    }
  }

  const isGradient = !!currentElement.gradient

  return (
    <div className="p-4 space-y-4 max-h-[calc(100vh-200px)] overflow-y-auto">
      <h3 className="font-semibold text-lg mb-4">Shape Properties</h3>

      {/* Shape Type Display */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Shape Type
        </label>
        <div className="px-3 py-2 bg-gray-100 dark:bg-gray-700 rounded-md text-gray-900 dark:text-gray-100 capitalize">
          {currentElement.type}
        </div>
      </div>

      {/* Color Type Toggle */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Fill Type
        </label>
        <div className="flex space-x-2">
          <button
            onClick={() => handleColorChange(currentElement.backgroundColor || currentElement.color || '#3b82f6')}
            className={`flex-1 px-3 py-2 text-sm rounded-md border transition-colors ${!isGradient
              ? 'bg-blue-500 text-white border-blue-500'
              : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50 dark:bg-gray-800 dark:text-gray-300'
              }`}
          >
            Solid Color
          </button>
          <button
            onClick={() => handleGradientChange(PRESET_GRADIENTS[0])}
            className={`flex-1 px-3 py-2 text-sm rounded-md border transition-colors ${isGradient
              ? 'bg-blue-500 text-white border-blue-500'
              : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50 dark:bg-gray-800 dark:text-gray-300'
              }`}
          >
            Gradient
          </button>
        </div>
      </div>

      {!isGradient ? (
        /* Solid Color Picker */
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Fill Color
          </label>
          <div className="space-y-3">
            <div className="flex items-center space-x-2">
              <input
                type="color"
                value={currentElement.backgroundColor || currentElement.color || '#3b82f6'}
                onChange={(e) => handleColorChange(e.target.value)}
                className="w-12 h-12 border border-gray-300 rounded-md cursor-pointer"
              />
              <input
                type="text"
                value={currentElement.backgroundColor || currentElement.color || '#3b82f6'}
                onChange={(e) => handleColorChange(e.target.value)}
                placeholder="#3b82f6"
                className="flex-1 px-3 py-2 border border-gray-300 rounded-md text-sm"
              />
            </div>
            <div className="grid grid-cols-5 gap-2">
              {PRESET_COLORS.map((color) => (
                <button
                  key={color}
                  onClick={() => handleColorChange(color)}
                  className="w-full h-8 rounded-md border-2 border-gray-300 hover:border-gray-400 transition-colors"
                  style={{ backgroundColor: color }}
                  title={color}
                />
              ))}
            </div>
          </div>
        </div>
      ) : (
        /* Gradient Controls */
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Gradient Direction
            </label>
            <div className="grid grid-cols-3 gap-2">
              {GRADIENT_DIRECTIONS.map((dir) => (
                <button
                  key={dir.value}
                  onClick={() => handleGradientDirectionChange(dir.value as any)}
                  className={`px-3 py-2 text-sm rounded-md border transition-colors ${currentElement.gradient?.direction === dir.value
                    ? 'bg-blue-500 text-white border-blue-500'
                    : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50 dark:bg-gray-800 dark:text-gray-300'
                    }`}
                >
                  {dir.label}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <label className="block text-sm font-medium text-gray-700">
                Gradient Stops
              </label>
              <button
                onClick={handleAddStop}
                className="text-xs text-blue-500 hover:text-blue-600 font-semibold"
              >
                + Add Stop
              </button>
            </div>

            {currentElement.gradient?.colors.map((color, index) => (
              <div key={index} className="flex items-center space-x-2">
                <input
                  type="color"
                  value={color}
                  onChange={(e) => handleUpdateStopColor(index, e.target.value)}
                  className="w-8 h-8 border border-gray-300 rounded-md cursor-pointer"
                />
                <input
                  type="text"
                  value={color}
                  onChange={(e) => handleUpdateStopColor(index, e.target.value)}
                  className="flex-1 min-w-0 px-2 py-1 border border-gray-300 rounded-md text-xs"
                />
                {currentElement.gradient!.colors.length > 2 && (
                  <button
                    onClick={() => handleRemoveStop(index)}
                    className="p-1 text-gray-400 hover:text-red-500"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                )}
              </div>
            ))}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Preset Gradients
            </label>
            <div className="grid grid-cols-2 gap-2">
              {PRESET_GRADIENTS.map((preset, index) => (
                <button
                  key={index}
                  onClick={() => handleGradientChange(preset as any)}
                  className="h-12 rounded-md border-2 border-gray-300 hover:border-gray-400 transition-colors"
                  style={{
                    background: `linear-gradient(${preset.direction === 'horizontal' ? '90deg' :
                      preset.direction === 'vertical' ? '180deg' : '45deg'
                      }, ${preset.colors.join(', ')})`
                  }}
                  title={`${preset.direction} gradient`}
                />
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Preview */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Preview
        </label>
        <div className="p-4 border border-gray-200 rounded-md bg-gray-50 dark:bg-gray-800">
          <div
            className="w-16 h-16 mx-auto"
            style={{
              backgroundColor: isGradient ? undefined : (currentElement.backgroundColor || currentElement.color || '#3b82f6'),
              background: isGradient && currentElement.gradient
                ? `linear-gradient(${currentElement.gradient.direction === 'horizontal' ? '90deg' :
                  currentElement.gradient.direction === 'vertical' ? '180deg' : '45deg'
                }, ${currentElement.gradient.colors.join(', ')})`
                : undefined,
              borderRadius: currentElement.type === 'circle' ? '50%' : '0',
            }}
          />
        </div>
      </div>
    </div>
  )
}
