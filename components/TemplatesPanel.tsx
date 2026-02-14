'use client'

import React, { useState } from 'react'
import { 
  Type, 
  Square, 
  Circle, 
  Triangle, 
  Star, 
  Heart,
  Image,
  Layout,
  Palette,
  Plus
} from 'lucide-react'
import { useCanvasStore } from '../store/canvas-store'

interface Template {
  id: string
  name: string
  icon: React.ReactNode
  category: string
  preview: string
  createElement: () => void
}

export default function TemplatesPanel() {
  const [activeCategory, setActiveCategory] = useState('text')
  const { addElement } = useCanvasStore()

  const textTemplates: Template[] = [
    {
      id: 'heading',
      name: 'Heading',
      icon: <Type size={20} />,
      category: 'text',
      preview: 'Aa',
      createElement: () => {
        addElement({
          type: 'text',
          x: 100,
          y: 100,
          width: 300,
          height: 80,
          content: 'Heading Text',
          fontSize: 32,
          fontFamily: 'Arial',
          color: '#000000',
        })
      }
    },
    {
      id: 'subheading',
      name: 'Subheading',
      icon: <Type size={16} />,
      category: 'text',
      preview: 'Aa',
      createElement: () => {
        addElement({
          type: 'text',
          x: 100,
          y: 100,
          width: 250,
          height: 60,
          content: 'Subheading Text',
          fontSize: 24,
          fontFamily: 'Arial',
          color: '#333333',
        })
      }
    },
    {
      id: 'body',
      name: 'Body Text',
      icon: <Type size={14} />,
      category: 'text',
      preview: 'Aa',
      createElement: () => {
        addElement({
          type: 'text',
          x: 100,
          y: 100,
          width: 200,
          height: 100,
          content: 'Body text goes here. You can edit this text to fit your needs.',
          fontSize: 16,
          fontFamily: 'Arial',
          color: '#666666',
        })
      }
    },
    {
      id: 'quote',
      name: 'Quote',
      icon: <Type size={18} />,
      category: 'text',
      preview: '"',
      createElement: () => {
        addElement({
          type: 'text',
          x: 100,
          y: 100,
          width: 280,
          height: 120,
          content: '"This is a quote text that stands out from the rest of your content."',
          fontSize: 20,
          fontFamily: 'Georgia',
          color: '#2563eb',
        })
      }
    }
  ]

  const shapeTemplates: Template[] = [
    {
      id: 'rectangle',
      name: 'Rectangle',
      icon: <Square size={20} />,
      category: 'shapes',
      preview: '▢',
      createElement: () => {
        addElement({
          type: 'text',
          x: 100,
          y: 100,
          width: 150,
          height: 100,
          content: '',
          fontSize: 16,
          fontFamily: 'Arial',
          color: '#3b82f6',
        })
      }
    },
    {
      id: 'circle',
      name: 'Circle',
      icon: <Circle size={20} />,
      category: 'shapes',
      preview: '○',
      createElement: () => {
        addElement({
          type: 'text',
          x: 100,
          y: 100,
          width: 120,
          height: 120,
          content: '',
          fontSize: 16,
          fontFamily: 'Arial',
          color: '#ef4444',
        })
      }
    },
    {
      id: 'triangle',
      name: 'Triangle',
      icon: <Triangle size={20} />,
      category: 'shapes',
      preview: '△',
      createElement: () => {
        addElement({
          type: 'text',
          x: 100,
          y: 100,
          width: 140,
          height: 120,
          content: '',
          fontSize: 16,
          fontFamily: 'Arial',
          color: '#10b981',
        })
      }
    },
    {
      id: 'star',
      name: 'Star',
      icon: <Star size={20} />,
      category: 'shapes',
      preview: '★',
      createElement: () => {
        addElement({
          type: 'text',
          x: 100,
          y: 100,
          width: 120,
          height: 120,
          content: '',
          fontSize: 16,
          fontFamily: 'Arial',
          color: '#f59e0b',
        })
      }
    }
  ]

  const layoutTemplates: Template[] = [
    {
      id: 'two-column',
      name: 'Two Column',
      icon: <Layout size={20} />,
      category: 'layouts',
      preview: '▦',
      createElement: () => {
        // Left column
        addElement({
          type: 'text',
          x: 50,
          y: 50,
          width: 200,
          height: 300,
          content: 'Left column content',
          fontSize: 16,
          fontFamily: 'Arial',
          color: '#666666',
        })
        // Right column
        addElement({
          type: 'text',
          x: 300,
          y: 50,
          width: 200,
          height: 300,
          content: 'Right column content',
          fontSize: 16,
          fontFamily: 'Arial',
          color: '#666666',
        })
      }
    },
    {
      id: 'header-content',
      name: 'Header + Content',
      icon: <Layout size={20} />,
      category: 'layouts',
      preview: '▦',
      createElement: () => {
        // Header
        addElement({
          type: 'text',
          x: 50,
          y: 50,
          width: 450,
          height: 80,
          content: 'Header Title',
          fontSize: 28,
          fontFamily: 'Arial',
          color: '#000000',
        })
        // Content
        addElement({
          type: 'text',
          x: 50,
          y: 180,
          width: 450,
          height: 200,
          content: 'Main content area goes here. This can include multiple paragraphs of text.',
          fontSize: 16,
          fontFamily: 'Arial',
          color: '#666666',
        })
      }
    }
  ]

  const categories = [
    { id: 'text', name: 'Text', icon: <Type size={16} /> },
    { id: 'shapes', name: 'Shapes', icon: <Square size={16} /> },
    { id: 'layouts', name: 'Layouts', icon: <Layout size={16} /> },
  ]

  const getTemplates = () => {
    switch (activeCategory) {
      case 'text': return textTemplates
      case 'shapes': return shapeTemplates
      case 'layouts': return layoutTemplates
      default: return textTemplates
    }
  }

  const handleTemplateClick = (template: Template) => {
    template.createElement()
  }

  return (
    <div className="w-80 bg-white border-l border-gray-200 h-full flex flex-col">
      {/* Header */}
      <div className="p-4 border-b border-gray-200">
        <h3 className="font-semibold text-gray-800 mb-3">Templates</h3>
        
        {/* Category Tabs */}
        <div className="flex gap-1">
          {categories.map((category) => (
            <button
              key={category.id}
              onClick={() => setActiveCategory(category.id)}
              className={`flex-1 flex items-center justify-center gap-1 px-3 py-2 rounded-lg text-sm transition-colors ${
                activeCategory === category.id
                  ? 'bg-blue-100 text-blue-700'
                  : 'hover:bg-gray-100 text-gray-600'
              }`}
            >
              {category.icon}
              <span>{category.name}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Templates Grid */}
      <div className="flex-1 overflow-y-auto p-4">
        <div className="grid grid-cols-2 gap-3">
          {getTemplates().map((template) => (
            <button
              key={template.id}
              onClick={() => handleTemplateClick(template)}
              className="group relative aspect-square bg-gray-50 border-2 border-gray-200 rounded-lg hover:border-blue-400 hover:bg-blue-50 transition-all duration-200 flex flex-col items-center justify-center gap-2"
            >
              {/* Icon */}
              <div className="text-gray-400 group-hover:text-blue-500 transition-colors">
                {template.icon}
              </div>
              
              {/* Name */}
              <span className="text-xs font-medium text-gray-700 group-hover:text-blue-700 transition-colors">
                {template.name}
              </span>
              
              {/* Plus indicator */}
              <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                <Plus size={14} className="text-blue-500" />
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Quick Add Section */}
      <div className="p-4 border-t border-gray-200">
        <div className="text-sm text-gray-600 mb-2">Quick Add</div>
        <div className="flex gap-2">
          <button
            onClick={() => {
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
            }}
            className="flex-1 px-3 py-2 bg-blue-500 text-white text-sm rounded-lg hover:bg-blue-600 transition-colors"
          >
            Add Text
          </button>
          <button
            onClick={() => {
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
            }}
            className="flex-1 px-3 py-2 bg-green-500 text-white text-sm rounded-lg hover:bg-green-600 transition-colors"
          >
            Add Image
          </button>
        </div>
      </div>
    </div>
  )
}
