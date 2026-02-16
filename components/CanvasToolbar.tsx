'use client'

import React, { useState } from 'react'
import {
  Download,
  Share2,
  FileImage,
  FileText,
  Type,
  Palette,
  RotateCcw,
  RotateCw
} from 'lucide-react'
import { useCanvasStore, DesignElement } from '../store/canvas-store'
import { exportAsPNG, exportAsJPG, exportAsPDF } from '../utils/exportUtils'
import AlignmentTools from './AlignmentTools'
import ThemeToggle from './ThemeToggle'
import { useToast } from './Toast'

export default function CanvasToolbar() {
  const { showToast } = useToast()
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
    showToast(`Preparing ${format.toUpperCase()}...`, 'info')
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
      showToast(`${format.toUpperCase()} downloaded!`, 'success')
    } catch (error) {
      console.error('Export failed:', error)
      showToast('Export failed. Please try again.', 'error')
    }
  }

  return (
    <div className="h-14 bg-transparent flex items-center justify-between px-6 transition-all">
      {/* Left Section - Tools Group */}
      <div className="flex items-center bg-gray-100/30 dark:bg-gray-800/20 p-1.5 rounded-2xl gap-1 border border-gray-200/30 dark:border-gray-700/30 shadow-sm">
        <AlignmentTools />

        {selectedElementData && selectedElementData.type === 'text' && (
          <>
            <div className="w-px h-6 bg-gray-200 dark:bg-gray-700 mx-2"></div>
            <div className="flex items-center gap-3 pr-2">
              <div className="flex items-center gap-1.5">
                <span className="text-[10px] font-bold uppercase tracking-wider text-gray-600 dark:text-gray-400">Size</span>
                <select
                  value={selectedSize}
                  onChange={(e) => handleSizeChange(parseInt(e.target.value))}
                  className="px-2 py-1 text-xs font-semibold bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-blue-500/40 outline-none transition-all cursor-pointer"
                >
                  {[12, 14, 16, 18, 20, 24, 28, 32, 36, 48, 64, 72].map(size => (
                    <option key={size} value={size}>{size}px</option>
                  ))}
                </select>
              </div>

              <div className="flex items-center gap-1.5">
                <span className="text-[10px] font-bold uppercase tracking-wider text-gray-600 dark:text-gray-400">Color</span>
                <button
                  className="w-6 h-6 rounded-lg border-2 border-white dark:border-gray-700 shadow-sm hover:scale-110 active:scale-95 transition-all"
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
            </div>
          </>
        )}
      </div>

      {/* Center Section - Global Actions */}
      <div className="flex items-center bg-gray-100/30 dark:bg-gray-800/20 p-1.5 rounded-2xl gap-1 border border-gray-200/30 dark:border-gray-700/30 shadow-sm">
        <button
          onClick={addTextElement}
          className="p-2.5 rounded-xl text-gray-700 dark:text-gray-300 hover:bg-white dark:hover:bg-gray-700 hover:text-blue-600 dark:hover:text-blue-400 hover:shadow-sm transition-all active:scale-90"
          title="Add Text"
        >
          <Type size={18} />
        </button>
        <div className="w-px h-6 bg-gray-200 dark:bg-gray-700 mx-1"></div>
        <button className="p-2.5 rounded-xl text-gray-700 dark:text-gray-300 hover:bg-white dark:hover:bg-gray-700 hover:text-blue-600 dark:hover:text-blue-400 hover:shadow-sm transition-all active:scale-90">
          <RotateCcw size={18} />
        </button>
        <button className="p-2.5 rounded-xl text-gray-700 dark:text-gray-300 hover:bg-white dark:hover:bg-gray-700 hover:text-blue-600 dark:hover:text-blue-400 hover:shadow-sm transition-all active:scale-90">
          <RotateCw size={18} />
        </button>
      </div>

      {/* Right Section - Export & Theme Group */}
      <div className="flex items-center bg-gray-100/30 dark:bg-gray-800/20 p-1.5 rounded-2xl gap-2 border border-gray-200/30 dark:border-gray-700/30 shadow-sm">
        <ThemeToggle />
        <div className="w-px h-6 bg-gray-200 dark:bg-gray-700 mx-1"></div>
        <div className="relative">
          <button
            onClick={() => setShowExportMenu(!showExportMenu)}
            className="flex items-center justify-center w-10 h-10 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-xl shadow-lg shadow-blue-500/25 transition-all active:scale-95"
            title="Export Design"
          >
            <Download size={20} />
          </button>

          {/* Export Dropdown Menu */}
          {showExportMenu && (
            <div className="absolute top-full right-0 mt-3 glass-panel rounded-2xl shadow-xl z-50 min-w-[56px] overflow-hidden p-1 animate-in fade-in slide-in-from-top-2 duration-200 flex flex-col gap-1">
              <button
                onClick={() => handleExport('png')}
                className="w-10 h-10 flex items-center justify-center hover:bg-blue-500 hover:text-white rounded-xl transition-all text-gray-700 dark:text-gray-200"
                title="Download PNG"
              >
                <FileImage size={20} />
              </button>
              <button
                onClick={() => handleExport('jpg')}
                className="w-10 h-10 flex items-center justify-center hover:bg-blue-500 hover:text-white rounded-xl transition-all text-gray-700 dark:text-gray-200"
                title="Download JPG"
              >
                <FileImage size={20} />
              </button>
              <button
                onClick={() => handleExport('pdf')}
                className="w-10 h-10 flex items-center justify-center hover:bg-blue-500 hover:text-white rounded-xl transition-all text-gray-700 dark:text-gray-200"
                title="Download PDF"
              >
                <FileText size={20} />
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
