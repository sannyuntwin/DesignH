'use client'

import React, { useState } from 'react'
import {
  Plus,
  Trash2,
  Copy,
  ChevronLeft,
  ChevronRight,
  Edit3,
  Check,
  X
} from 'lucide-react'
import { useCanvasStore } from '@/store/canvas-store'
import { useToast } from '@/components/ui/Toast'

export default function PageNavigation() {
  const { showToast } = useToast()
  const {
    pages,
    currentPageId,
    setCurrentPage,
    addPage,
    deletePage,
    duplicatePage,
    updatePageName
  } = useCanvasStore()

  const [editingPageId, setEditingPageId] = useState<string | null>(null)
  const [editingName, setEditingName] = useState('')

  const currentPageIndex = pages.findIndex(page => page.id === currentPageId)
  const currentPage = pages.find(page => page.id === currentPageId)

  const handleStartEdit = (pageId: string, currentName: string) => {
    setEditingPageId(pageId)
    setEditingName(currentName)
  }

  const handleSaveEdit = () => {
    if (editingPageId && editingName.trim()) {
      updatePageName(editingPageId, editingName.trim())
    }
    setEditingPageId(null)
    setEditingName('')
  }

  const handleCancelEdit = () => {
    setEditingPageId(null)
    setEditingName('')
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSaveEdit()
    } else if (e.key === 'Escape') {
      handleCancelEdit()
    }
  }

  const goToPreviousPage = () => {
    if (currentPageIndex > 0) {
      setCurrentPage(pages[currentPageIndex - 1].id)
    }
  }

  const goToNextPage = () => {
    if (currentPageIndex < pages.length - 1) {
      setCurrentPage(pages[currentPageIndex + 1].id)
    }
  }

  const handleAddPage = () => {
    console.log('PageNavigation - Add Page button clicked')
    addPage()
  }

  return (
    <div className="h-16 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between px-4 transition-colors">
      {/* Left Section - Page Navigation */}
      <div className="flex items-center gap-3">
        <button
          onClick={goToPreviousPage}
          disabled={currentPageIndex <= 0}
          className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-gray-700 dark:text-gray-300"
        >
          <ChevronLeft size={16} />
        </button>

        <div className="flex items-center gap-2">
          <span className="text-sm text-gray-600 dark:text-gray-400">
            {currentPageIndex + 1} / {pages.length}
          </span>
        </div>

        <button
          onClick={goToNextPage}
          disabled={currentPageIndex >= pages.length - 1}
          className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-gray-700 dark:text-gray-300"
        >
          <ChevronRight size={16} />
        </button>
      </div>

      {/* Center Section - Page Tabs */}
      <div className="flex-1 flex items-center justify-center max-w-2xl mx-4">
        <div className="flex items-center gap-1 overflow-x-auto">
          {pages.map((page, index) => (
            <div
              key={page.id}
              className={`flex items-center gap-1 px-3 py-1.5 rounded-lg cursor-pointer transition-colors ${page.id === currentPageId
                ? 'bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-400'
                : 'hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300'
                }`}
              onClick={() => setCurrentPage(page.id)}
            >
              {editingPageId === page.id ? (
                <div className="flex items-center gap-1">
                  <input
                    type="text"
                    value={editingName}
                    onChange={(e) => setEditingName(e.target.value)}
                    onKeyDown={handleKeyDown}
                    className="px-1 py-0.5 text-sm border border-gray-300 dark:border-gray-600 rounded focus:outline-none focus:border-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                    onClick={(e) => e.stopPropagation()}
                  />
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      handleSaveEdit()
                    }}
                    className="p-0.5 hover:bg-blue-200 rounded"
                  >
                    <Check size={12} />
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      handleCancelEdit()
                    }}
                    className="p-0.5 hover:bg-red-200 rounded"
                  >
                    <X size={12} />
                  </button>
                </div>
              ) : (
                <>
                  <span className="text-sm font-medium whitespace-nowrap">
                    {page.name}
                  </span>
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      handleStartEdit(page.id, page.name)
                    }}
                    className="p-0.5 hover:bg-gray-200 dark:hover:bg-gray-600 rounded opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <Edit3 size={10} />
                  </button>
                </>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Right Section - Page Actions */}
      <div className="flex items-center gap-2">
        <button
          onClick={() => {
            handleAddPage()
            showToast('New page added', 'success')
          }}
          className="flex items-center justify-center w-10 h-10 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors shadow-sm"
          title="Add Page"
        >
          <Plus size={18} />
        </button>

        {currentPage && pages.length > 1 && (
          <>
            <button
              onClick={() => {
                duplicatePage(currentPage.id)
                showToast('Page duplicated', 'success')
              }}
              className="p-2 hover:bg-blue-100 dark:hover:bg-blue-900/40 rounded-lg transition-colors text-gray-700 dark:text-gray-300"
              title="Duplicate page"
            >
              <Copy size={16} />
            </button>

            <button
              onClick={() => {
                deletePage(currentPage.id)
                showToast('Page deleted', 'error')
              }}
              className="p-2 hover:bg-red-100 dark:hover:bg-red-900/40 rounded-lg transition-colors text-red-600"
              title="Delete page"
            >
              <Trash2 size={16} />
            </button>
          </>
        )}
      </div>
    </div>
  )
}
