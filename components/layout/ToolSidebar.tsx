'use client'

import React, { useState } from 'react'
import { Palette, Sliders, Type } from 'lucide-react'
import { useCanvasStore, DesignElement } from '@/store/canvas-store'
import FontStylePanel from '@/components/panels/FontStylePanel'
import ShapePropertiesPanel from '@/components/panels/ShapePropertiesPanel'
import OpacityControl from '@/components/panels/OpacityControl'

export default function ToolSidebar() {
  const { pages, currentPageId, selectedElement, updateElement, deleteElement } = useCanvasStore()
  const [activeTab, setActiveTab] = useState<'properties' | 'fonts'>('properties')

  const currentPage = pages.find(page => page.id === currentPageId)
  const currentElement = currentPage?.elements.find(el => el.id === selectedElement)

  const handleUpdate = (updates: Partial<DesignElement>) => {
    if (selectedElement) {
      updateElement(selectedElement, updates)
    }
  }

  const handleDelete = () => {
    if (selectedElement) {
      deleteElement(selectedElement)
    }
  }

  return (
    <div className="h-full flex flex-col bg-transparent transition-colors">
      {/* Tab Navigation */}
      <div className="flex p-2 bg-gray-50/50 border-b border-gray-200/50 gap-1">
        <button
          onClick={() => setActiveTab('properties')}
          className={`flex-1 py-3 flex items-center justify-center rounded-xl transition-all duration-200 ${activeTab === 'properties'
            ? 'bg-white text-primary shadow-sm'
            : 'text-gray-500 hover:text-gray-700'
            }`}
          title="Properties"
        >
          <Sliders className="w-4 h-4" />
        </button>
        <button
          onClick={() => setActiveTab('fonts')}
          className={`flex-1 py-3 flex items-center justify-center rounded-xl transition-all duration-200 ${activeTab === 'fonts'
            ? 'bg-white text-primary shadow-sm'
            : 'text-gray-500 hover:text-gray-700'
            }`}
          title="Fonts"
        >
          <Type className="w-4 h-4" />
        </button>
      </div>

      {/* Tab Content */}
      <div className="flex-1 overflow-y-auto">
        {activeTab === 'properties' && (
          <div className="p-4 space-y-4">
            {currentElement ? (
              <>
                {/* Position */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Position
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-xs font-bold text-gray-500 mb-1">X</label>
                      <input
                        type="number"
                        value={currentElement.x}
                        onChange={(e) => handleUpdate({ x: Number(e.target.value) })}
                        className="input text-xs"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-gray-500 mb-1">Y</label>
                      <input
                        type="number"
                        value={currentElement.y}
                        onChange={(e) => handleUpdate({ y: Number(e.target.value) })}
                        className="input text-xs"
                      />
                    </div>
                  </div>
                </div>

                {/* Size */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Size
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-xs font-bold text-gray-500 mb-1">Width</label>
                      <input
                        type="number"
                        value={currentElement.width}
                        onChange={(e) => handleUpdate({ width: Number(e.target.value) })}
                        className="input text-xs"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-gray-500 mb-1">Height</label>
                      <input
                        type="number"
                        value={currentElement.height}
                        onChange={(e) => handleUpdate({ height: Number(e.target.value) })}
                        className="input text-xs"
                      />
                    </div>
                  </div>
                </div>

                {/* Rotation */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Rotation: {currentElement.rotation || 0}°
                  </label>
                  <input
                    type="range"
                    min="0"
                    max="360"
                    value={currentElement.rotation || 0}
                    onChange={(e) => handleUpdate({ rotation: Number(e.target.value) })}
                    className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                  />
                </div>

                {/* Z-Index */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Layer (Z-Index)
                  </label>
                  <input
                    type="number"
                    value={currentElement.zIndex}
                    onChange={(e) => handleUpdate({ zIndex: Number(e.target.value) })}
                    className="input text-xs"
                  />
                </div>

                {/* Opacity Control */}
                <OpacityControl
                  opacity={currentElement.opacity ?? 1}
                  onChange={(opacity) => handleUpdate({ opacity })}
                />

                {/* Actions */}
                <div className="pt-6 border-t border-gray-100">
                  <button
                    onClick={handleDelete}
                    className="btn btn-secondary w-full text-error hover:bg-error hover:text-white"
                  >
                    Delete Element
                  </button>
                </div>
              </>
            ) : (
              <div className="flex flex-col items-center justify-center h-64 text-center px-6">
                <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                  <Palette className="text-gray-400" size={24} />
                </div>
                <p className="text-gray-600 text-sm font-medium">Select an element to edit its properties</p>
              </div>
            )}
          </div>
        )}

        {activeTab === 'fonts' && <FontStylePanel />}

        {/* Shape Properties Panel - Show when shape is selected */}
        {currentElement && ['circle', 'square', 'rectangle', 'triangle'].includes(currentElement.type) && (
          <ShapePropertiesPanel />
        )}
      </div>
    </div>
  )
}
