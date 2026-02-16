'use client'

import { useEffect, useRef } from 'react'
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
    updateElement,
    updateElementPosition,
    saveToHistory,
    zoomIn,
    zoomOut,
    resetZoom,
    setZoomLevel,
  } = useCanvasStore()

  const moveTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const isMovingRef = useRef(false)

  const currentPage = pages.find(page => page.id === currentPageId)
  const currentPageElements = currentPage?.elements || []

  const debouncedSaveHistory = () => {
    if (moveTimeoutRef.current) {
      clearTimeout(moveTimeoutRef.current)
    }
    moveTimeoutRef.current = setTimeout(() => {
      saveToHistory()
      isMovingRef.current = false
    }, 500) // Save after 500ms of no movement
  }

  const startMovement = () => {
    if (!isMovingRef.current) {
      saveToHistory()
      isMovingRef.current = true
    }
  }

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
        // Select all elements - cycle through them or create multi-select
        if (currentPageElements.length > 0) {
          // For now, select the first element. In future, could implement multi-select
          const firstElement = currentPageElements[0]
          selectElement(firstElement.id)
          console.log(`Selected ${currentPageElements.length} elements (showing first: ${firstElement.type})`)
        }
      },
      description: 'Select all elements',
    },

    // Select next/previous element
    {
      key: 'Tab',
      ctrlKey: true,
      action: () => {
        if (currentPageElements.length > 0) {
          const currentIndex = currentPageElements.findIndex(el => el.id === selectedElement)
          const nextIndex = (currentIndex + 1) % currentPageElements.length
          selectElement(currentPageElements[nextIndex].id)
        }
      },
      description: 'Select next element',
    },
    {
      key: 'Tab',
      ctrlKey: true,
      shiftKey: true,
      action: () => {
        if (currentPageElements.length > 0) {
          const currentIndex = currentPageElements.findIndex(el => el.id === selectedElement)
          const prevIndex = currentIndex <= 0 ? currentPageElements.length - 1 : currentIndex - 1
          selectElement(currentPageElements[prevIndex].id)
        }
      },
      description: 'Select previous element',
    },

    // Quick color shortcuts
    {
      key: '1',
      action: () => {
        if (selectedElement) {
          updateElement(selectedElement, { color: '#000000' })
        }
      },
      description: 'Set color to black',
    },
    {
      key: '2',
      action: () => {
        if (selectedElement) {
          updateElement(selectedElement, { color: '#ef4444' })
        }
      },
      description: 'Set color to red',
    },
    {
      key: '3',
      action: () => {
        if (selectedElement) {
          updateElement(selectedElement, { color: '#3b82f6' })
        }
      },
      description: 'Set color to blue',
    },
    {
      key: '4',
      action: () => {
        if (selectedElement) {
          updateElement(selectedElement, { color: '#10b981' })
        }
      },
      description: 'Set color to green',
    },
    {
      key: '5',
      action: () => {
        if (selectedElement) {
          updateElement(selectedElement, { color: '#f59e0b' })
        }
      },
      description: 'Set color to yellow',
    },

    // Size shortcuts
    {
      key: '+',
      action: () => {
        if (selectedElement) {
          const element = currentPageElements.find(el => el.id === selectedElement)
          if (element) {
            updateElement(selectedElement, {
              width: element.width * 1.1,
              height: element.height * 1.1
            })
          }
        }
      },
      description: 'Increase size by 10%',
    },
    {
      key: '-',
      action: () => {
        if (selectedElement) {
          const element = currentPageElements.find(el => el.id === selectedElement)
          if (element) {
            updateElement(selectedElement, {
              width: element.width * 0.9,
              height: element.height * 0.9
            })
          }
        }
      },
      description: 'Decrease size by 10%',
    },
    {
      key: '=',
      shiftKey: true,
      action: () => {
        if (selectedElement) {
          const element = currentPageElements.find(el => el.id === selectedElement)
          if (element) {
            updateElement(selectedElement, {
              width: element.width * 1.5,
              height: element.height * 1.5
            })
          }
        }
      },
      description: 'Increase size by 50%',
    },
    {
      key: '_',
      shiftKey: true,
      action: () => {
        if (selectedElement) {
          const element = currentPageElements.find(el => el.id === selectedElement)
          if (element) {
            updateElement(selectedElement, {
              width: element.width * 0.5,
              height: element.height * 0.5
            })
          }
        }
      },
      description: 'Decrease size by 50%',
    },

    // Font size shortcuts (for text elements)
    {
      key: '}',
      action: () => {
        if (selectedElement) {
          const element = currentPageElements.find(el => el.id === selectedElement)
          if (element && element.type === 'text') {
            updateElement(selectedElement, {
              fontSize: (element.fontSize || 16) + 2
            })
          }
        }
      },
      description: 'Increase font size',
    },
    {
      key: '{',
      action: () => {
        if (selectedElement) {
          const element = currentPageElements.find(el => el.id === selectedElement)
          if (element && element.type === 'text') {
            updateElement(selectedElement, {
              fontSize: Math.max(8, (element.fontSize || 16) - 2)
            })
          }
        }
      },
      description: 'Decrease font size',
    },

    // Alignment shortcuts
    {
      key: 'l',
      ctrlKey: true,
      action: () => {
        if (selectedElement) {
          updateElement(selectedElement, { textAlign: 'left' })
        }
      },
      description: 'Align text left',
    },
    {
      key: 'e',
      ctrlKey: true,
      action: () => {
        if (selectedElement) {
          updateElement(selectedElement, { textAlign: 'center' })
        }
      },
      description: 'Align text center',
    },
    {
      key: 'r',
      ctrlKey: true,
      action: () => {
        if (selectedElement) {
          updateElement(selectedElement, { textAlign: 'right' })
        }
      },
      description: 'Align text right',
    },

    // Quick positioning
    {
      key: 'h',
      ctrlKey: true,
      action: () => {
        if (selectedElement) {
          updateElement(selectedElement, { x: 50 })
        }
      },
      description: 'Move to left edge',
    },
    {
      key: 'j',
      ctrlKey: true,
      action: () => {
        if (selectedElement) {
          updateElement(selectedElement, { x: 400 })
        }
      },
      description: 'Center horizontally',
    },
    {
      key: 'k',
      ctrlKey: true,
      action: () => {
        if (selectedElement) {
          updateElement(selectedElement, { y: 50 })
        }
      },
      description: 'Move to top edge',
    },
    {
      key: 'l',
      ctrlKey: true,
      action: () => {
        if (selectedElement) {
          updateElement(selectedElement, { y: 300 })
        }
      },
      description: 'Center vertically',
    },

    // Clear canvas
    {
      key: 'Delete',
      ctrlKey: true,
      action: () => {
        if (confirm('Clear all elements from canvas? This cannot be undone.')) {
          const { clearCanvas } = useCanvasStore.getState()
          clearCanvas()
        }
      },
      description: 'Clear canvas',
    },

    // Export/Save shortcuts
    {
      key: 's',
      ctrlKey: true,
      action: () => {
        // Trigger save/export
        const event = new CustomEvent('canvas:export')
        window.dispatchEvent(event)
        console.log('Export triggered')
      },
      description: 'Export/Save design',
    },

    // Toggle grid/snap
    {
      key: 'g',
      ctrlKey: true,
      action: () => {
        // Toggle grid (would need implementation)
        console.log('Toggle grid (not implemented)')
      },
      description: 'Toggle grid',
    },

    // Zoom shortcuts
    {
      key: '=',
      ctrlKey: true,
      action: () => {
        zoomIn()
        console.log('Zoomed in')
      },
      description: 'Zoom in',
    },
    {
      key: '-',
      ctrlKey: true,
      action: () => {
        zoomOut()
        console.log('Zoomed out')
      },
      description: 'Zoom out',
    },
    {
      key: '0',
      ctrlKey: true,
      action: () => {
        resetZoom()
        console.log('Zoom reset')
      },
      description: 'Reset zoom',
    },
    {
      key: '+',
      ctrlKey: true,
      action: () => {
        setZoomLevel(2) // Set to 200%
        console.log('Zoom to 200%')
      },
      description: 'Zoom to 200%',
    },
    {
      key: '9',
      ctrlKey: true,
      action: () => {
        setZoomLevel(0.5) // Set to 50%
        console.log('Zoom to 50%')
      },
      description: 'Zoom to 50%',
    },
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

    // Arrow keys for precise movement
    {
      key: 'ArrowUp',
      action: () => {
        if (selectedElement) {
          const element = currentPageElements.find(el => el.id === selectedElement)
          if (element) {
            startMovement()
            updateElementPosition(selectedElement, element.x, element.y - 1)
            debouncedSaveHistory()
          }
        }
      },
      description: 'Move element up',
    },
    {
      key: 'ArrowDown',
      action: () => {
        if (selectedElement) {
          const element = currentPageElements.find(el => el.id === selectedElement)
          if (element) {
            startMovement()
            updateElementPosition(selectedElement, element.x, element.y + 1)
            debouncedSaveHistory()
          }
        }
      },
      description: 'Move element down',
    },
    {
      key: 'ArrowLeft',
      action: () => {
        if (selectedElement) {
          const element = currentPageElements.find(el => el.id === selectedElement)
          if (element) {
            startMovement()
            updateElementPosition(selectedElement, element.x - 1, element.y)
            debouncedSaveHistory()
          }
        }
      },
      description: 'Move element left',
    },
    {
      key: 'ArrowRight',
      action: () => {
        if (selectedElement) {
          const element = currentPageElements.find(el => el.id === selectedElement)
          if (element) {
            startMovement()
            updateElementPosition(selectedElement, element.x + 1, element.y)
            debouncedSaveHistory()
          }
        }
      },
      description: 'Move element right',
    },
    {
      key: 'ArrowUp',
      shiftKey: true,
      action: () => {
        if (selectedElement) {
          const element = currentPageElements.find(el => el.id === selectedElement)
          if (element) {
            startMovement()
            updateElementPosition(selectedElement, element.x, element.y - 10)
            debouncedSaveHistory()
          }
        }
      },
      description: 'Move element up (fast)',
    },
    {
      key: 'ArrowDown',
      shiftKey: true,
      action: () => {
        if (selectedElement) {
          const element = currentPageElements.find(el => el.id === selectedElement)
          if (element) {
            startMovement()
            updateElementPosition(selectedElement, element.x, element.y + 10)
            debouncedSaveHistory()
          }
        }
      },
      description: 'Move element down (fast)',
    },
    {
      key: 'ArrowLeft',
      shiftKey: true,
      action: () => {
        if (selectedElement) {
          const element = currentPageElements.find(el => el.id === selectedElement)
          if (element) {
            startMovement()
            updateElementPosition(selectedElement, element.x - 10, element.y)
            debouncedSaveHistory()
          }
        }
      },
      description: 'Move element left (fast)',
    },
    {
      key: 'ArrowRight',
      shiftKey: true,
      action: () => {
        if (selectedElement) {
          const element = currentPageElements.find(el => el.id === selectedElement)
          if (element) {
            startMovement()
            updateElementPosition(selectedElement, element.x + 10, element.y)
            debouncedSaveHistory()
          }
        }
      },
      description: 'Move element right (fast)',
    },

    // Opacity shortcuts
    {
      key: '[',
      action: () => {
        if (selectedElement) {
          const element = currentPageElements.find(el => el.id === selectedElement)
          if (element) {
            const newOpacity = Math.max((element.opacity ?? 1) - 0.1, 0)
            updateElement(selectedElement, { opacity: newOpacity })
          }
        }
      },
      description: 'Decrease opacity',
    },
    {
      key: ']',
      action: () => {
        if (selectedElement) {
          const element = currentPageElements.find(el => el.id === selectedElement)
          if (element) {
            const newOpacity = Math.min((element.opacity ?? 1) + 0.1, 1)
            updateElement(selectedElement, { opacity: newOpacity })
          }
        }
      },
      description: 'Increase opacity',
    },

    // Rotation shortcuts
    {
      key: 'r',
      action: () => {
        if (selectedElement) {
          const element = currentPageElements.find(el => el.id === selectedElement)
          if (element) {
            const newRotation = ((element.rotation ?? 0) + 15) % 360
            updateElement(selectedElement, { rotation: newRotation })
          }
        }
      },
      description: 'Rotate clockwise',
    },
    {
      key: 'r',
      shiftKey: true,
      action: () => {
        if (selectedElement) {
          const element = currentPageElements.find(el => el.id === selectedElement)
          if (element) {
            const newRotation = ((element.rotation ?? 0) - 15 + 360) % 360
            updateElement(selectedElement, { rotation: newRotation })
          }
        }
      },
      description: 'Rotate counter-clockwise',
    },

    // Layer shortcuts
    {
      key: 'PageUp',
      action: () => {
        if (selectedElement) {
          const element = currentPageElements.find(el => el.id === selectedElement)
          if (element) {
            updateElement(selectedElement, { zIndex: element.zIndex + 1 })
          }
        }
      },
      description: 'Bring forward',
    },
    {
      key: 'PageDown',
      action: () => {
        if (selectedElement) {
          const element = currentPageElements.find(el => el.id === selectedElement)
          if (element) {
            updateElement(selectedElement, { zIndex: Math.max(0, element.zIndex - 1) })
          }
        }
      },
      description: 'Send backward',
    },
    {
      key: 'Home',
      action: () => {
        if (selectedElement) {
          updateElement(selectedElement, { zIndex: 999 })
        }
      },
      description: 'Bring to front',
    },
    {
      key: 'End',
      action: () => {
        if (selectedElement) {
          updateElement(selectedElement, { zIndex: 0 })
        }
      },
      description: 'Send to back',
    },

    // Shape shortcuts
    {
      key: 'r',
      altKey: true,
      action: () => {
        addElement({
          type: 'rectangle',
          x: 100,
          y: 100,
          width: 100,
          height: 60,
          backgroundColor: '#3b82f6',
        })
      },
      description: 'Add rectangle',
    },
    {
      key: 'c',
      altKey: true,
      action: () => {
        addElement({
          type: 'circle',
          x: 100,
          y: 100,
          width: 80,
          height: 80,
          backgroundColor: '#ef4444',
        })
      },
      description: 'Add circle',
    },
    {
      key: 's',
      altKey: true,
      action: () => {
        addElement({
          type: 'square',
          x: 100,
          y: 100,
          width: 80,
          height: 80,
          backgroundColor: '#10b981',
        })
      },
      description: 'Add square',
    },
    {
      key: 't',
      altKey: true,
      action: () => {
        addElement({
          type: 'triangle',
          x: 100,
          y: 100,
          width: 80,
          height: 80,
          backgroundColor: '#f59e0b',
        })
      },
      description: 'Add triangle',
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
      const isInputElement = target.tagName === 'INPUT' || target.tagName === 'TEXTAREA'

      // Special handling for text editing - check if we're editing a text element
      const isEditingTextElement = target.tagName === 'TEXTAREA' && target.getAttribute('data-element-id')

      // Allow Delete/Backspace to work normally when editing text content
      const isDeleteKey = e.key === 'Delete' || e.key === 'Backspace'

      // Allow arrow keys to work normally when editing text
      const isArrowKey = ['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.key)

      // FIRST: Handle text editing context - this takes priority
      if (isEditingTextElement) {
        // When editing text, let Delete/Backspace and Arrow keys work normally
        if (isDeleteKey || isArrowKey) {
          return // Let the browser handle text editing
        }
        // Block other shortcuts when editing text
        return
      }

      // THEN: Handle regular input fields (not text elements)
      if (isInputElement) {
        return // Block all shortcuts in regular input fields
      }

      // FINALLY: Handle element deletion when NOT editing text
      if (isDeleteKey && selectedElement) {
        e.preventDefault()
        deleteElement(selectedElement)
        selectElement(null)
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

    // Cleanup function
    return () => {
      document.removeEventListener('keydown', handleKeyDown)
      if (moveTimeoutRef.current) {
        clearTimeout(moveTimeoutRef.current)
      }
    }
  }, [selectedElement, currentPageElements, currentPageId, pages])

  // Return null as this component doesn't render anything
  return null
}

// Helper component to display shortcuts
export function KeyboardShortcutsHelp() {
  const shortcuts = [
    // Basic operations
    { keys: 'Ctrl+Z', description: 'Undo' },
    { keys: 'Ctrl+Shift+Z', description: 'Redo' },
    { keys: 'Ctrl+Y', description: 'Redo' },
    { keys: 'Ctrl+C', description: 'Copy element' },
    { keys: 'Ctrl+V', description: 'Paste element' },
    { keys: 'Ctrl+D', description: 'Duplicate element' },
    { keys: 'Ctrl+A', description: 'Select all elements' },
    { keys: 'Ctrl+Tab', description: 'Select next element' },
    { keys: 'Ctrl+Shift+Tab', description: 'Select previous element' },
    { keys: 'Delete/Backspace', description: 'Delete selected' },
    { keys: 'Ctrl+Delete', description: 'Clear canvas' },

    // Movement
    { keys: 'Arrow Keys', description: 'Move element (1px)' },
    { keys: 'Shift + Arrow Keys', description: 'Move element (10px)' },
    { keys: 'Ctrl+H/J/K/L', description: 'Quick positioning' },

    // Size & Transform
    { keys: '+/-', description: 'Increase/Decrease size (10%)' },
    { keys: 'Shift+=/_', description: 'Increase/Decrease size (50%)' },
    { keys: 'R / Shift+R', description: 'Rotate element' },
    { keys: '[ / ]', description: 'Decrease/Increase opacity' },

    // Colors
    { keys: '1-5', description: 'Quick colors (black, red, blue, green, yellow)' },

    // Text
    { keys: 'T', description: 'Add text' },
    { keys: '{ / }', description: 'Decrease/Increase font size' },
    { keys: 'Ctrl+L/E/R', description: 'Text align (left, center, right)' },

    // Shapes
    { keys: 'Alt+R', description: 'Add rectangle' },
    { keys: 'Alt+C', description: 'Add circle' },
    { keys: 'Alt+S', description: 'Add square' },
    { keys: 'Alt+T', description: 'Add triangle' },

    // Layers
    { keys: 'PageUp/PageDown', description: 'Bring forward/Send back' },
    { keys: 'Home/End', description: 'Bring to front/Send to back' },

    // Pages
    { keys: 'Ctrl+N', description: 'New page' },
    { keys: 'Ctrl+Shift+D', description: 'Duplicate page' },

    // View & Tools
    { keys: 'Ctrl+S', description: 'Export/Save design' },
    { keys: 'Ctrl+G', description: 'Toggle grid' },
    { keys: 'Ctrl+=/-', description: 'Zoom in/out' },
    { keys: 'Ctrl+0', description: 'Reset zoom' },
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
