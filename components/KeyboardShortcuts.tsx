'use client'

import { useEffect } from 'react'
import { useCanvasStore } from '../store/canvas-store'

interface KeyboardShortcut {
  key: string
  ctrlKey?: boolean
  shiftKey?: boolean
  altKey?: boolean
  action: () => void
  description: string
}

export default function KeyboardShortcuts() {
  const {
    selectedElement,
    deleteElement,
    addElement,
    pages,
    currentPageId,
    selectElement,
    addPage,
    duplicatePage,
    setCurrentPage,
    undo,
    redo,
  } = useCanvasStore()

  const currentPage = pages.find(page => page.id === currentPageId)
  const currentPageElements = currentPage?.elements || []

  const copyElement = () => {
    if (selectedElement) {
      const element = currentPageElements.find(el => el.id === selectedElement)
      if (element) {
        localStorage.setItem('copiedElement', JSON.stringify(element))
      }
    }
  }

  const pasteElement = () => {
    const copied = localStorage.getItem('copiedElement')
    if (copied) {
      const element = JSON.parse(copied)
      addElement({
        ...element,
        x: element.x + 20,
        y: element.y + 20,
      })
    }
  }

  const shortcuts: KeyboardShortcut[] = [
    // Undo/redo operations
    {
      key: 'z',
      ctrlKey: true,
      action: undo,
      description: 'Undo',
    },
    {
      key: 'z',
      ctrlKey: true,
      shiftKey: true,
      action: redo,
      description: 'Redo',
    },
    {
      key: 'y',
      ctrlKey: true,
      action: redo,
      description: 'Redo',
    },

    // Element operations
    {
      key: 'Delete',
      action: () => selectedElement && deleteElement(selectedElement),
      description: 'Delete selected element',
    },
    {
      key: 'c',
      ctrlKey: true,
      action: copyElement,
      description: 'Copy element',
    },
    {
      key: 'v',
      ctrlKey: true,
      action: pasteElement,
      description: 'Paste element',
    },
    {
      key: 'd',
      ctrlKey: true,
      action: () => selectedElement && copyElement() && pasteElement(),
      description: 'Duplicate element',
    },
    {
      key: 'a',
      ctrlKey: true,
      action: () => {
        // Select all elements
        if (currentPageElements.length > 0) {
          selectElement(currentPageElements[0].id)
        }
      },
      description: 'Select all',
    },

    // Text operations
    {
      key: 't',
      action: () => {
        addElement({
          type: 'text',
          x: 100,
          y: 100,
          width: 200,
          height: 50,
          content: 'New Text',
          fontSize: 16,
          fontFamily: 'Arial',
          color: '#000000',
        })
      },
      description: 'Add text element',
    },

    // Page operations
    {
      key: 'n',
      ctrlKey: true,
      action: addPage,
      description: 'New page',
    },
    {
      key: 'd',
      ctrlKey: true,
      shiftKey: true,
      action: () => currentPageId && duplicatePage(currentPageId),
      description: 'Duplicate page',
    },
    {
      key: 'PageDown',
      action: () => {
        const currentIndex = pages.findIndex(p => p.id === currentPageId)
        if (currentIndex < pages.length - 1) {
          setCurrentPage(pages[currentIndex + 1].id)
        }
      },
      description: 'Next page',
    },
    {
      key: 'PageUp',
      action: () => {
        const currentIndex = pages.findIndex(p => p.id === currentPageId)
        if (currentIndex > 0) {
          setCurrentPage(pages[currentIndex - 1].id)
        }
      },
      description: 'Previous page',
    },

    // Escape to deselect
    {
      key: 'Escape',
      action: () => selectElement(null),
      description: 'Deselect element',
    },
  ]

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't trigger shortcuts when typing in input fields
      const target = e.target as HTMLElement
      if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.contentEditable === 'true') {
        return
      }

      const shortcut = shortcuts.find(s => 
        s.key === e.key &&
        (s.ctrlKey ? e.ctrlKey || e.metaKey : !e.ctrlKey && !e.metaKey) &&
        (s.shiftKey ? e.shiftKey : !e.shiftKey) &&
        (s.altKey ? e.altKey : !e.altKey)
      )

      if (shortcut) {
        e.preventDefault()
        shortcut.action()
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [selectedElement, currentPageElements, currentPageId, pages])

  // Return null as this component doesn't render anything
  return null
}

// Helper component to display shortcuts
export function KeyboardShortcutsHelp() {
  const shortcuts = [
    { keys: 'Ctrl+Z', description: 'Undo' },
    { keys: 'Ctrl+Shift+Z', description: 'Redo' },
    { keys: 'Ctrl+Y', description: 'Redo' },
    { keys: 'Ctrl+C', description: 'Copy element' },
    { keys: 'Ctrl+V', description: 'Paste element' },
    { keys: 'Ctrl+D', description: 'Duplicate element' },
    { keys: 'Delete', description: 'Delete selected' },
    { keys: 'T', description: 'Add text' },
    { keys: 'Ctrl+N', description: 'New page' },
    { keys: 'Ctrl+Shift+D', description: 'Duplicate page' },
    { keys: 'PageUp/PageDown', description: 'Navigate pages' },
    { keys: 'Escape', description: 'Deselect' },
  ]

  return (
    <div className="p-4">
      <h3 className="font-semibold mb-3">Keyboard Shortcuts</h3>
      <div className="space-y-2 text-sm">
        {shortcuts.map((shortcut, index) => (
          <div key={index} className="flex justify-between">
            <kbd className="px-2 py-1 bg-gray-100 border border-gray-300 rounded text-xs">
              {shortcut.keys}
            </kbd>
            <span className="text-gray-600">{shortcut.description}</span>
          </div>
        ))}
      </div>
    </div>
  )
}
