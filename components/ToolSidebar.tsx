'use client'

import React, { useState } from 'react'
import { useCanvasStore, DesignElement } from '../store/canvas-store'
import { exportAsPNG, exportAsJPG, exportAsPDF } from '../utils/exportUtils'
import { Type, Image, Download, FileImage, FileText, Trash2, ArrowUp, ArrowDown, Layers } from 'lucide-react'

export default function ToolSidebar() {
  const [isExporting, setIsExporting] = useState(false)
  const {
    elements,
    selectedElement,
    addElement,
    updateElement,
    deleteElement,
    bringToFront,
    sendToBack,
  } = useCanvasStore()

  const selectedElementData = elements.find(el => el.id === selectedElement)

  const addTextElement = () => {
    addElement({
      type: 'text',
      x: 100,
      y: 100,
      width: 200,
      height: 50,
      content: 'Edit this text',
      fontSize: 16,
      fontFamily: 'Arial',
      color: '#000000',
    })
  }

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      const reader = new FileReader()
      reader.onload = (event) => {
        const src = event.target?.result as string
        addElement({
          type: 'image',
          x: 100,
          y: 100,
          width: 200,
          height: 200,
          src,
        })
      }
      reader.readAsDataURL(file)
    }
  }

  const updateSelectedElement = (updates: Partial<DesignElement>) => {
    if (selectedElement) {
      updateElement(selectedElement, updates)
    }
  }

  const handleExport = async (format: 'png' | 'jpg' | 'pdf') => {
    if (isExporting) return
    
    setIsExporting(true)
    try {
      const timestamp = new Date().toISOString().slice(0, 19).replace(/[:]/g, '-')
      const filename = `design-${timestamp}`
      
      switch (format) {
        case 'png':
          await exportAsPNG('design-canvas', filename)
          break
        case 'jpg':
          await exportAsJPG('design-canvas', filename)
          break
        case 'pdf':
          await exportAsPDF('design-canvas', filename)
          break
      }
    } catch (error) {
      console.error('Export failed:', error)
      alert('Export failed. Please try again.')
    } finally {
      setIsExporting(false)
    }
  }

  return (
    <div className="w-80 bg-white border-r border-gray-200 h-full overflow-y-auto">
      <div className="p-4 space-y-6">
        {/* Add Elements Section */}
        <div>
          <h3 className="text-lg font-semibold mb-3 text-gray-800">Add Elements</h3>
          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={addTextElement}
              className="flex flex-col items-center justify-center p-4 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
            >
              <Type size={24} />
              <span className="text-xs mt-1">Text</span>
            </button>
            <label className="flex flex-col items-center justify-center p-4 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors cursor-pointer">
              <Image size={24} />
              <span className="text-xs mt-1">Image</span>
              <input
                type="file"
                accept="image/*"
                onChange={handleImageUpload}
                className="hidden"
              />
            </label>
          </div>
        </div>

        {/* Export Section */}
        <div>
          <h3 className="text-lg font-semibold mb-3 text-gray-800">Export Design</h3>
          <div className="grid grid-cols-3 gap-2">
            <button
              onClick={() => handleExport('png')}
              disabled={isExporting}
              className="flex flex-col items-center justify-center p-3 bg-purple-500 text-white rounded-lg hover:bg-purple-600 transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed"
            >
              <FileImage size={20} />
              <span className="text-xs mt-1">PNG</span>
            </button>
            <button
              onClick={() => handleExport('jpg')}
              disabled={isExporting}
              className="flex flex-col items-center justify-center p-3 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed"
            >
              <FileImage size={20} />
              <span className="text-xs mt-1">JPG</span>
            </button>
            <button
              onClick={() => handleExport('pdf')}
              disabled={isExporting}
              className="flex flex-col items-center justify-center p-3 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed"
            >
              <FileText size={20} />
              <span className="text-xs mt-1">PDF</span>
            </button>
          </div>
        </div>

        {/* Element Properties Section */}
        {selectedElementData && (
          <div>
            <h3 className="text-lg font-semibold mb-3 text-gray-800">Element Properties</h3>
            <div className="space-y-4">
              {/* Position */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Position</label>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-xs text-gray-500">X</label>
                    <input
                      type="number"
                      value={selectedElementData.x}
                      onChange={(e) => updateSelectedElement({ x: parseInt(e.target.value) || 0 })}
                      className="w-full px-2 py-1 border border-gray-300 rounded"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-500">Y</label>
                    <input
                      type="number"
                      value={selectedElementData.y}
                      onChange={(e) => updateSelectedElement({ y: parseInt(e.target.value) || 0 })}
                      className="w-full px-2 py-1 border border-gray-300 rounded"
                    />
                  </div>
                </div>
              </div>

              {/* Size */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Size</label>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-xs text-gray-500">Width</label>
                    <input
                      type="number"
                      value={selectedElementData.width}
                      onChange={(e) => updateSelectedElement({ width: parseInt(e.target.value) || 100 })}
                      className="w-full px-2 py-1 border border-gray-300 rounded"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-500">Height</label>
                    <input
                      type="number"
                      value={selectedElementData.height}
                      onChange={(e) => updateSelectedElement({ height: parseInt(e.target.value) || 100 })}
                      className="w-full px-2 py-1 border border-gray-300 rounded"
                    />
                  </div>
                </div>
              </div>

              {/* Rotation */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Rotation</label>
                <input
                  type="range"
                  min="0"
                  max="360"
                  value={selectedElementData.rotation || 0}
                  onChange={(e) => updateSelectedElement({ rotation: parseInt(e.target.value) })}
                  className="w-full"
                />
                <div className="text-xs text-gray-500 text-center">{selectedElementData.rotation || 0}°</div>
              </div>

              {/* Text-specific properties */}
              {selectedElementData.type === 'text' && (
                <>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Text Content</label>
                    <textarea
                      value={selectedElementData.content || ''}
                      onChange={(e) => updateSelectedElement({ content: e.target.value })}
                      className="w-full px-2 py-1 border border-gray-300 rounded resize-none"
                      rows={3}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Font Size</label>
                    <input
                      type="number"
                      value={selectedElementData.fontSize || 16}
                      onChange={(e) => updateSelectedElement({ fontSize: parseInt(e.target.value) || 16 })}
                      className="w-full px-2 py-1 border border-gray-300 rounded"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Font Family</label>
                    <select
                      value={selectedElementData.fontFamily || 'Arial'}
                      onChange={(e) => updateSelectedElement({ fontFamily: e.target.value })}
                      className="w-full px-2 py-1 border border-gray-300 rounded"
                    >
                      <option value="Arial">Arial</option>
                      <option value="Times New Roman">Times New Roman</option>
                      <option value="Courier New">Courier New</option>
                      <option value="Georgia">Georgia</option>
                      <option value="Verdana">Verdana</option>
                      <option value="Comic Sans MS">Comic Sans MS</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Color</label>
                    <input
                      type="color"
                      value={selectedElementData.color || '#000000'}
                      onChange={(e) => updateSelectedElement({ color: e.target.value })}
                      className="w-full h-10 border border-gray-300 rounded cursor-pointer"
                    />
                  </div>
                </>
              )}

              {/* Actions */}
              <div className="space-y-2">
                <button
                  onClick={() => selectedElement && bringToFront(selectedElement)}
                  className="w-full flex items-center justify-center gap-2 px-3 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors text-sm"
                >
                  <ArrowUp size={16} />
                  Bring to Front
                </button>
                <button
                  onClick={() => selectedElement && sendToBack(selectedElement)}
                  className="w-full flex items-center justify-center gap-2 px-3 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors text-sm"
                >
                  <ArrowDown size={16} />
                  Send to Back
                </button>
                <button
                  onClick={() => selectedElement && deleteElement(selectedElement)}
                  className="w-full flex items-center justify-center gap-2 px-3 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors text-sm"
                >
                  <Trash2 size={16} />
                  Delete Element
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Elements List */}
        <div>
          <h3 className="text-lg font-semibold mb-3 text-gray-800 flex items-center gap-2">
            <Layers size={20} />
            Layers
          </h3>
          <div className="space-y-1">
            {elements
              .sort((a, b) => b.zIndex - a.zIndex)
              .map((element) => (
                <div
                  key={element.id}
                  onClick={() => useCanvasStore.getState().selectElement(element.id)}
                  className={`p-2 rounded-lg cursor-pointer text-sm flex items-center justify-between ${
                    selectedElement === element.id
                      ? 'bg-blue-100 border-blue-300 border'
                      : 'bg-gray-50 hover:bg-gray-100'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    {element.type === 'text' ? (
                      <Type size={14} />
                    ) : (
                      <Image size={14} />
                    )}
                    <span className="truncate">
                      {element.type === 'text' 
                        ? (element.content?.substring(0, 15) || 'Text') 
                        : 'Image'
                      }
                    </span>
                  </div>
                </div>
              ))}
          </div>
        </div>
      </div>
    </div>
  )
}
