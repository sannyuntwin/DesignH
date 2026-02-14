'use client'

import React, { useState } from 'react'
import { 
  Download,
  Share2,
  FileImage,
  FileText,
  Type,
  Palette
} from 'lucide-react'
import { useCanvasStore, DesignElement } from '../store/canvas-store'
import { exportAsPNG, exportAsJPG, exportAsPDF } from '../utils/exportUtils'
import AlignmentTools from './AlignmentTools'

export default function CanvasToolbar() {
  const [selectedColor, setSelectedColor] = useState('#000000')
  const [selectedSize, setSelectedSize] = useState(16)
  const [showExportMenu, setShowExportMenu] = useState(false)
  const { 
    selectedElement, 
    updateElement, 
    pages, 
    currentPageId, 
    addElement 
  } = useCanvasStore()

  const currentPage = pages.find(page => page.id === currentPageId)
  const currentPageElements = currentPage?.elements || []
  const selectedElementData = currentPageElements.find(el => el.id === selectedElement)

  const handleColorChange = (color: string) => {
    setSelectedColor(color)
    if (selectedElementData && selectedElementData.type === 'text' && selectedElement) {
      updateElement(selectedElement, { color })
    }
  }

  const handleSizeChange = (size: number) => {
    setSelectedSize(size)
    if (selectedElementData && selectedElementData.type === 'text' && selectedElement) {
      updateElement(selectedElement, { fontSize: size })
    }
  }

  const addTextElement = () => {
    addElement({
      type: 'text',
      x: 100,
      y: 100,
      width: 200,
      height: 50,
      content: 'Edit this text',
      fontSize: selectedSize,
      fontFamily: 'Arial',
      color: selectedColor,
    })
  }

  const handleExport = async (format: 'png' | 'jpg' | 'pdf') => {
    setShowExportMenu(false)
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
    }
  }

  return (
    <div className="h-12 bg-white border-b border-gray-200 flex items-center justify-between px-4">
      {/* Left Section - Text Tools */}
      <div className="flex items-center gap-2">
        {/* Alignment Tools */}
        <AlignmentTools />
        
        {/* Text Controls - Only show when text is selected */}
        {selectedElementData && selectedElementData.type === 'text' && (
          <>
            <div className="h-6 w-px bg-gray-300"></div>
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-600">Size:</span>
              <select
                value={selectedSize}
                onChange={(e) => handleSizeChange(parseInt(e.target.value))}
                className="px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:border-blue-500 bg-white text-gray-700"
              >
                <option value="12">12px</option>
                <option value="14">14px</option>
                <option value="16">16px</option>
                <option value="18">18px</option>
                <option value="20">20px</option>
                <option value="24">24px</option>
                <option value="28">28px</option>
                <option value="32">32px</option>
                <option value="36">36px</option>
                <option value="48">48px</option>
                <option value="64">64px</option>
                <option value="72">72px</option>
              </select>
            </div>
            
            <div className="h-6 w-px bg-gray-300"></div>
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-600">Color:</span>
              <button 
                className="w-6 h-6 rounded-full border-2 border-gray-300 hover:border-gray-400 transition-colors"
                style={{ backgroundColor: selectedColor }}
                onClick={() => {
                  const input = document.createElement('input')
                  input.type = 'color'
                  input.value = selectedColor
                  input.onchange = (e) => handleColorChange((e.target as HTMLInputElement).value)
                  input.click()
                }}
              />
            </div>
          </>
        )}
      </div>

      {/* Right Section - Export Options */}
      <div className="flex items-center gap-2">
        <div className="relative">
          <button 
            onClick={() => setShowExportMenu(!showExportMenu)}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors text-gray-700"
          >
            <Download size={18} />
          </button>
          
          {/* Export Dropdown Menu */}
          {showExportMenu && (
            <div className="absolute top-full right-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-50 min-w-[120px]">
              <button
                onClick={() => handleExport('png')}
                className="w-full px-3 py-2 text-left text-sm hover:bg-gray-100 transition-colors flex items-center gap-2 text-gray-700"
              >
                <FileImage size={16} />
                PNG
              </button>
              <button
                onClick={() => handleExport('jpg')}
                className="w-full px-3 py-2 text-left text-sm hover:bg-gray-100 transition-colors flex items-center gap-2 text-gray-700"
              >
                <FileImage size={16} />
                JPG
              </button>
              <button
                onClick={() => handleExport('pdf')}
                className="w-full px-3 py-2 text-left text-sm hover:bg-gray-100 transition-colors flex items-center gap-2 text-gray-700"
              >
                <FileText size={16} />
                PDF
              </button>
            </div>
          )}
        </div>
        
        <button className="p-2 hover:bg-gray-100 rounded-lg transition-colors text-gray-700">
          <Share2 size={18} />
        </button>
        <div className="h-6 w-px bg-gray-300"></div>
        <button className="p-2 hover:bg-gray-100 rounded-lg transition-colors text-gray-700">
          <FileImage size={18} />
        </button>
        <button className="p-2 hover:bg-gray-100 rounded-lg transition-colors text-gray-700">
          <FileText size={18} />
        </button>
      </div>
    </div>
  )
}
