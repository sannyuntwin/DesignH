import React, { useEffect } from 'react'
import { createPortal } from 'react-dom'
import { X } from 'lucide-react'

interface ToolModalProps {
  isOpen: boolean
  onClose: () => void
  title: string
  children: React.ReactNode
}

export default function ToolModal({ isOpen, onClose, title, children }: ToolModalProps) {
  // Handle escape key to close modal
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose()
      }
    }

    if (isOpen) {
      document.addEventListener('keydown', handleEscape)
      // Prevent body scroll when modal is open
      document.body.style.overflow = 'hidden'
    }

    return () => {
      document.removeEventListener('keydown', handleEscape)
      document.body.style.overflow = 'unset'
    }
  }, [isOpen, onClose])

  if (!isOpen) return null

  const modalContent = (
    <div className="fixed inset-0 z-[999999] flex items-center justify-center p-4">
      {/* Backdrop with blur */}
      <div 
        className="absolute inset-0 bg-black/60 backdrop-blur-md transition-opacity duration-300 z-[999998]"
        onClick={onClose}
      />
      
      {/* Modal Content */}
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden animate-scale-in z-[1000000] border border-gray-200 flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-100 bg-gradient-to-r from-white to-gray-50 relative z-10 flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-2 h-8 bg-gradient-to-b from-indigo-500 to-purple-600 rounded-full" />
            <h2 className="text-xl font-bold text-gray-900">{title}</h2>
          </div>
          <button
            onClick={onClose}
            className="group p-2 hover:bg-gray-100 rounded-xl transition-all duration-200 hover:scale-110 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 relative z-10"
            title="Close (Esc)"
          >
            <X className="w-5 h-5 text-gray-400 group-hover:text-gray-600 transition-colors" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto relative z-10 min-h-0">
          <div className="p-6">
            {children}
          </div>
        </div>

        {/* Footer hint */}
        <div className="px-6 py-3 bg-gray-50 border-t border-gray-100 relative z-10 flex-shrink-0">
          <p className="text-xs text-gray-500 text-center">
            Press <kbd className="px-1.5 py-0.5 bg-white rounded border border-gray-300 text-xs font-mono">Esc</kbd> to close
          </p>
        </div>
      </div>
    </div>
  )

  return createPortal(modalContent, document.body)
}
