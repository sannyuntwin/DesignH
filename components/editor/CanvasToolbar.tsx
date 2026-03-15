'use client'

import React, { useState } from 'react'
import {
  Download,
  FileImage,
  FileText,
  Monitor,
  Ruler,
  Settings,
} from 'lucide-react'
import { useToast } from '@/components/ui/Toast'
import { exportAsPNG, exportAsJPG, exportAsPDF } from '@/lib/exportUtils'
import { useCanvasStore } from '@/store/canvas-store'
import QuickPageSizeSelector from './QuickPageSizeSelector'
import PageSettings from './PageSettings'
import ToolModal from '@/components/layout/ToolModal'

export default function CanvasToolbar() {
  const { showToast } = useToast()
  const { pages, currentPageId } = useCanvasStore()
  const [showExportMenu, setShowExportMenu] = useState(false)
  const [showRulers, setShowRulers] = useState(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('rulers-visible')
      return saved !== null ? saved === 'true' : true
    }
    return true
  })
  const [isExporting, setIsExporting] = useState<string | null>(null)
  const [showPageSettings, setShowPageSettings] = useState(false)

  const currentPage = pages.find(page => page.id === currentPageId)

  const toggleRulers = () => {
    const newState = !showRulers
    setShowRulers(newState)
    if (typeof window !== 'undefined') {
      localStorage.setItem('rulers-visible', newState.toString())
    }
  }

  const handleExport = async (format: 'png' | 'jpg' | 'pdf') => {
    setShowExportMenu(false)
    setIsExporting(format)
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
      showToast(`${format.toUpperCase()} downloaded successfully!`, 'success')
    } catch (error) {
      console.error('Export failed:', error)
      showToast('Export failed. Please try again.', 'error')
    } finally {
      setIsExporting(null)
    }
  }

  return (
    <div className="flex items-center gap-3">
      {/* Quick Page Size Selector */}
      <QuickPageSizeSelector />

      {/* Page Settings Button */}
      <button
        onClick={() => setShowPageSettings(true)}
        className="btn btn-ghost btn-icon transition-all duration-200 hover:bg-slate-100"
        title="Page Settings"
      >
        <Settings className="w-4 h-4" />
      </button>

      <div className="toolbar-divider" />

      {/* Ruler Toggle */}
      <button
        onClick={toggleRulers}
        className={`btn btn-ghost btn-icon transition-all duration-200 ${
          showRulers 
            ? 'bg-indigo-100 text-indigo-600 hover:bg-indigo-200 border border-indigo-200' 
            : 'hover:bg-slate-100'
        }`}
        title={showRulers ? 'Hide Rulers (Ctrl+R)' : 'Show Rulers (Ctrl+R)'}
      >
        <Ruler className="w-4 h-4" />
      </button>

      <div className="toolbar-divider" />

      {/* Export Button with Loading State */}
      <div className="relative">
        <button
          onClick={() => setShowExportMenu(!showExportMenu)}
          disabled={!!isExporting}
          className={`btn btn-primary btn-icon transition-all duration-200 ${
            isExporting 
              ? 'opacity-50 cursor-not-allowed' 
              : 'hover:bg-primary/90 hover:shadow-lg'
          }`}
          title={isExporting ? `Exporting ${isExporting.toUpperCase()}...` : 'Export Design'}
        >
          {isExporting ? (
            <div className="w-4 h-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
          ) : (
            <Download className="w-4 h-4" />
          )}
        </button>

        {showExportMenu && (
          <div className="dropdown right-0 top-full mt-2 p-2 min-w-[180px] animate-slide-up">
            <div className="px-3 py-2 text-xs font-semibold text-gray-500 uppercase tracking-wider">
              Export Format
            </div>
            <button
              onClick={() => handleExport('png')}
              disabled={isExporting === 'png'}
              className={`dropdown-item w-full transition-all duration-200 ${
                isExporting === 'png' ? 'opacity-50 cursor-not-allowed' : 'hover:bg-slate-100'
              }`}
            >
              <FileImage className="w-4 h-4" />
              <span className="flex-1 text-left">PNG</span>
              <span className="text-xs text-gray-400">High quality</span>
            </button>
            <button
              onClick={() => handleExport('jpg')}
              disabled={isExporting === 'jpg'}
              className={`dropdown-item w-full transition-all duration-200 ${
                isExporting === 'jpg' ? 'opacity-50 cursor-not-allowed' : 'hover:bg-slate-100'
              }`}
            >
              <FileImage className="w-4 h-4" />
              <span className="flex-1 text-left">JPG</span>
              <span className="text-xs text-gray-400">Smaller size</span>
            </button>
            <button
              onClick={() => handleExport('pdf')}
              disabled={isExporting === 'pdf'}
              className={`dropdown-item w-full transition-all duration-200 ${
                isExporting === 'pdf' ? 'opacity-50 cursor-not-allowed' : 'hover:bg-slate-100'
              }`}
            >
              <FileText className="w-4 h-4" />
              <span className="flex-1 text-left">PDF</span>
              <span className="text-xs text-gray-400">For printing</span>
            </button>
          </div>
        )}
      </div>

      {/* Keyboard Shortcuts Hint */}
      <div className="hidden lg:flex items-center gap-1 px-2 py-1 bg-slate-100 rounded-lg text-xs text-gray-600">
        <kbd className="px-1 py-0.5 bg-white rounded border border-gray-300">Ctrl+G</kbd>
        <span>Grid</span>
      </div>
      {/* Page Settings Modal */}
      <ToolModal
        isOpen={showPageSettings}
        onClose={() => setShowPageSettings(false)}
        title="Page Settings"
      >
        <PageSettings />
      </ToolModal>
    </div>
  )
}
