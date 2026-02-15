'use client'

import React from 'react'
import { useCanvasStore } from '../store/canvas-store'

const SHAPES = [
  { type: 'circle', icon: 'M12 12C12 15.3137 9.31371 18 6 18C2.68629 18 0 15.3137 0 12C0 8.68629 2.68629 6 6 6C9.31371 6 12 8.68629 12 12Z', label: 'Circle' },
  { type: 'square', icon: 'M3 3H21V21H3V3Z', label: 'Square' },
  { type: 'rectangle', icon: 'M3 6H21V18H3V6Z', label: 'Rectangle' },
  { type: 'triangle', icon: 'M12 2L22 20H2L12 2Z', label: 'Triangle' },
]

export default function ShapeToolbar() {
  const { addElement } = useCanvasStore()

  const handleAddShape = (shapeType: string) => {
    const defaultSize = shapeType === 'circle' ? 100 : shapeType === 'square' ? 100 : 120
    const defaultHeight = shapeType === 'rectangle' ? 80 : defaultSize

    addElement({
      type: shapeType as any,
      x: 50,
      y: 50,
      width: defaultSize,
      height: defaultHeight,
      backgroundColor: '#3b82f6',
    })
  }

  return (
    <div className="p-4 space-y-2">
      <h3 className="font-semibold text-sm mb-3">Shapes</h3>
      <div className="grid grid-cols-2 gap-2">
        {SHAPES.map((shape) => (
          <button
            key={shape.type}
            onClick={() => handleAddShape(shape.type)}
            className="flex flex-col items-center justify-center p-3 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors group"
            title={`Add ${shape.label}`}
          >
            <svg 
              className="w-6 h-6 text-gray-700 dark:text-gray-300 group-hover:text-blue-500 transition-colors mb-1" 
              fill="currentColor" 
              viewBox="0 0 24 24"
            >
              <path d={shape.icon} />
            </svg>
            <span className="text-xs text-gray-600 dark:text-gray-400 group-hover:text-blue-500 transition-colors">
              {shape.label}
            </span>
          </button>
        ))}
      </div>
    </div>
  )
}
