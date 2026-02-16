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
import { useToast } from './Toast'

interface Template {
  id: string
  name: string
  icon: React.ReactNode
  category: string
  preview: string
  createElement: () => void
}

export default function TemplatesPanel() {
  const { showToast } = useToast()
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
          type: 'rectangle',
          x: 100,
          y: 100,
          width: 150,
          height: 100,
          backgroundColor: '#3b82f6',
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
          type: 'circle',
          x: 100,
          y: 100,
          width: 120,
          height: 120,
          backgroundColor: '#ef4444',
        })
      }
    },
    {
      id: 'square',
      name: 'Square',
      icon: <Square size={20} />,
      category: 'shapes',
      preview: '□',
      createElement: () => {
        addElement({
          type: 'square',
          x: 100,
          y: 100,
          width: 100,
          height: 100,
          backgroundColor: '#10b981',
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
          type: 'triangle',
          x: 100,
          y: 100,
          width: 140,
          height: 120,
          backgroundColor: '#f59e0b',
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
          type: 'star',
          x: 100,
          y: 100,
          width: 120,
          height: 120,
          backgroundColor: '#f59e0b',
        })
      }
    },
    {
      id: 'heart',
      name: 'Heart',
      icon: <Heart size={20} />,
      category: 'shapes',
      preview: '♥',
      createElement: () => {
        addElement({
          type: 'heart',
          x: 100,
          y: 100,
          width: 120,
          height: 120,
          backgroundColor: '#ef4444',
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
    <div className="w-80 bg-white dark:bg-gray-800 border-l border-gray-200 dark:border-gray-700 h-full flex flex-col transition-colors relative">
      {/* Header */}
      <div className="p-4 border-b border-gray-100 dark:border-gray-800">
        <div className="flex items-center justify-center mb-3">
          <Palette className="text-blue-600" size={20} />
        </div>

        {/* Category Tabs */}
        <div className="flex gap-1">
          {categories.map((category) => (
            <button
              key={category.id}
              onClick={() => setActiveCategory(category.id)}
              className={`flex-1 flex items-center justify-center gap-1 px-3 py-2 rounded-lg text-sm transition-colors ${activeCategory === category.id
                ? 'bg-blue-100/50 dark:bg-blue-900/40 text-blue-700 dark:text-blue-400 shadow-sm border border-blue-200/50 dark:border-blue-800/50'
                : 'hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-400'
                }`}
              title={category.name}
            >
              {category.icon}
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
              className="group relative aspect-square bg-gray-50 dark:bg-gray-700/50 border-2 border-gray-200 dark:border-gray-600 rounded-lg hover:border-blue-400 dark:hover:border-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/30 transition-all duration-200 flex flex-col items-center justify-center gap-2"
            >
              {/* Icon */}
              <div className="text-gray-500 dark:text-gray-500 group-hover:text-blue-600 transition-colors">
                {template.icon}
              </div>

              {/* Name */}
              <span className="text-xs font-medium text-gray-700 dark:text-gray-300 group-hover:text-blue-700 dark:group-hover:text-blue-300 transition-colors text-center">
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

      {/* Quick Add Section - Overlapping */}
      <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-white via-white to-transparent dark:from-gray-800 dark:via-gray-800 to-transparent">
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 shadow-lg p-3">
          <div className="grid grid-cols-4 gap-2">
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
                showToast('Text added', 'success')
              }}
              className="p-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition-colors flex items-center justify-center"
              title="Add Text"
            >
              <Type size={16} />
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
                      showToast('Image added', 'success')
                    }
                    reader.readAsDataURL(file)
                  }
                }
                input.click()
              }}
              className="p-2 bg-green-500 text-white rounded-md hover:bg-green-600 transition-colors flex items-center justify-center"
              title="Add Image"
            >
              <Image size={16} />
            </button>
            <button
              onClick={() => {
                addElement({
                  type: 'rectangle',
                  x: 100,
                  y: 100,
                  width: 150,
                  height: 100,
                  backgroundColor: '#3b82f6',
                })
                showToast('Shape added', 'success')
              }}
              className="p-2 bg-purple-500 text-white rounded-md hover:bg-purple-600 transition-colors flex items-center justify-center"
              title="Add Shape"
            >
              <Square size={16} />
            </button>
            <button
              onClick={() => {
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
                showToast('Layout added', 'success')
              }}
              className="p-2 bg-orange-500 text-white rounded-md hover:bg-orange-600 transition-colors flex items-center justify-center"
              title="Add Layout"
            >
              <Layout size={16} />
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
