import React from 'react'
import { useCanvasStore } from '@/store/canvas-store'
import {
  Type,
  FileText,
  Bookmark,
  Square,
  Circle,
  Triangle,
  Star,
  Heart,
  Image,
  Upload
} from 'lucide-react'

// Design Tools Content
export function DesignToolsContent() {
  const { addElement } = useCanvasStore()

  const addTextElement = (type: string, content: string, fontSize: number, fontWeight: string) => {
    addElement({
      type: 'text',
      x: 300,
      y: 200,
      width: 300,
      height: 50,
      content,
      fontSize,
      fontFamily: 'Inter',
      color: '#111827',
      fontWeight,
    })
  }

  return (
    <div className="grid grid-cols-2 gap-4">
      <button
        onClick={() => addTextElement('heading', 'Heading Text', 24, 'bold')}
        className="p-6 bg-white border-2 border-gray-200 rounded-xl hover:border-blue-500 hover:bg-blue-50 transition-all duration-200 group"
      >
        <Type className="w-8 h-8 text-blue-500 mb-3" />
        <h3 className="font-semibold text-gray-900">Heading</h3>
        <p className="text-sm text-gray-500">Large title text</p>
      </button>

      <button
        onClick={() => addTextElement('subheading', 'Subheading Text', 18, 'semibold')}
        className="p-6 bg-white border-2 border-gray-200 rounded-xl hover:border-blue-500 hover:bg-blue-50 transition-all duration-200 group"
      >
        <Type className="w-6 h-6 text-blue-500 mb-3" />
        <h3 className="font-semibold text-gray-900">Subheading</h3>
        <p className="text-sm text-gray-500">Medium title text</p>
      </button>

      <button
        onClick={() => addTextElement('bodytext', 'Body text content', 14, 'normal')}
        className="p-6 bg-white border-2 border-gray-200 rounded-xl hover:border-blue-500 hover:bg-blue-50 transition-all duration-200 group"
      >
        <FileText className="w-6 h-6 text-blue-500 mb-3" />
        <h3 className="font-semibold text-gray-900">Body Text</h3>
        <p className="text-sm text-gray-500">Regular paragraph text</p>
      </button>

      <button
        onClick={() => addTextElement('quote', '"Quote text here"', 16, 'italic')}
        className="p-6 bg-white border-2 border-gray-200 rounded-xl hover:border-blue-500 hover:bg-blue-50 transition-all duration-200 group"
      >
        <Bookmark className="w-6 h-6 text-blue-500 mb-3" />
        <h3 className="font-semibold text-gray-900">Quote</h3>
        <p className="text-sm text-gray-500">Styled quote text</p>
      </button>
    </div>
  )
}

// Shape Tools Content
export function ShapeToolsContent() {
  const { addElement } = useCanvasStore()

  const addShape = (type: string, width: number, height: number, backgroundColor: string) => {
    addElement({
      type: type as any,
      x: 300,
      y: 200,
      width,
      height,
      backgroundColor,
    })
  }

  const shapes = [
    { id: 'rectangle', label: 'Rectangle', icon: Square, width: 120, height: 80, color: '#3b82f6' },
    { id: 'circle', label: 'Circle', icon: Circle, width: 100, height: 100, color: '#3b82f6' },
    { id: 'triangle', label: 'Triangle', icon: Triangle, width: 120, height: 100, color: '#3b82f6' },
    { id: 'square', label: 'Square', icon: Square, width: 100, height: 100, color: '#3b82f6' },
    { id: 'star', label: 'Star', icon: Star, width: 120, height: 120, color: '#3b82f6' },
    { id: 'heart', label: 'Heart', icon: Heart, width: 120, height: 100, color: '#ef4444' },
    { id: 'oval', label: 'Oval', icon: Circle, width: 120, height: 80, color: '#3b82f6' },
  ] as const

  return (
    <div className="grid grid-cols-3 gap-4">
      {shapes.map((shape: any) => (
        <button
          key={shape.id}
          onClick={() => addShape(shape.id, shape.width, shape.height, shape.color)}
          className="p-6 bg-white border-2 border-gray-200 rounded-xl hover:border-blue-500 hover:bg-blue-50 transition-all duration-200 group"
        >
          <shape.icon className="w-8 h-8 text-blue-500 mb-3" />
          <h3 className="font-semibold text-gray-900">{shape.label}</h3>
          <p className="text-xs text-gray-500">{shape.width}×{shape.height}px</p>
        </button>
      ))}
    </div>
  )
}

// Text Tool Content
export function TextToolContent() {
  const { addElement } = useCanvasStore()

  const addBasicText = () => {
    console.log('addBasicText button clicked in TextToolContent')
    addElement({
      type: 'text',
      x: 300,
      y: 200,
      width: 200,
      height: 50,
      content: 'Edit this text',
      fontSize: 16,
      fontFamily: 'Inter',
      color: '#111827',
    })
  }

  return (
    <div className="text-center">
      <button
        onClick={addBasicText}
        className="p-8 bg-blue-500 text-white rounded-xl hover:bg-blue-600 transition-colors duration-200"
      >
        <Type className="w-12 h-12 mb-4" />
        <h3 className="text-xl font-semibold">Add Text</h3>
        <p className="text-sm opacity-90">Click to add editable text to canvas</p>
      </button>
    </div>
  )
}

// Image Tool Content
export function ImageToolContent() {
  const { addElement } = useCanvasStore()

  const handleImageUpload = () => {
    const input = document.createElement('input')
    input.type = 'file'
    input.accept = 'image/*'
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0]
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
    input.click()
  }

  return (
    <div className="text-center">
      <button
        onClick={handleImageUpload}
        className="p-8 bg-green-500 text-white rounded-xl hover:bg-green-600 transition-colors duration-200"
      >
        <Upload className="w-12 h-12 mb-4" />
        <h3 className="text-xl font-semibold">Upload Image</h3>
        <p className="text-sm opacity-90">Click to select and add an image</p>
      </button>
    </div>
  )
}
