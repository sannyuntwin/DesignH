'use client'

import React, { useState } from 'react'
import { 
  Square, 
  Circle, 
  Triangle, 
  Type, 
  Crown, 
  Upload, 
  Wrench, 
  Folder, 
  Grid3X3, 
  Sparkles, 
  StickyNote, 
  Clock,
  ChevronDown,
  Search,
  Layout
} from 'lucide-react'
import { useCanvasStore } from '../store/canvas-store'

interface SidebarItem {
  id: string
  label: string
  icon: React.ReactNode
  badge?: string
}

export default function LeftSidebar() {
  const [activeTab, setActiveTab] = useState('design')
  const [showDesignPanel, setShowDesignPanel] = useState(true)
  const { addElement } = useCanvasStore()

  const mainTabs: SidebarItem[] = [
    { id: 'design', label: 'Design', icon: <Layout size={20} /> },
    { id: 'elements', label: 'Elements', icon: <Square size={20} /> },
    { id: 'text', label: 'Text', icon: <Type size={20} /> },
    { id: 'uploads', label: 'Uploads', icon: <Upload size={20} /> },
    { id: 'tools', label: 'Tools', icon: <Wrench size={20} /> },
    { id: 'projects', label: 'Projects', icon: <Folder size={20} /> },
    { id: 'apps', label: 'Apps', icon: <Grid3X3 size={20} /> },
  ]

  const bottomTabs: SidebarItem[] = [
    { id: 'magic', label: 'Magic Media', icon: <Sparkles size={20} /> },
    { id: 'notes', label: 'Notes', icon: <StickyNote size={20} /> },
    { id: 'timer', label: 'Timer', icon: <Clock size={20} /> },
  ]

  const handleTabClick = (tabId: string) => {
    setActiveTab(tabId)
    
    // Add text element when Text tab is clicked
    if (tabId === 'text') {
      addElement({
        type: 'text',
        x: 100,
        y: 100,
        width: 200,
        height: 50,
        content: 'Edit this text',
        fontSize: 16,
        fontFamily: 'Arial',
        color: '#000000',
      })
    }
    
    // Handle image upload when Uploads tab is clicked
    if (tabId === 'uploads') {
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
  }

  return (
    <div className="w-20 bg-white border-r border-gray-200 flex flex-col">
      {/* Main Navigation */}
      <div className="flex-1 py-4">
        {mainTabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => handleTabClick(tab.id)}
            className={`w-full p-3 flex flex-col items-center gap-1 hover:bg-gray-50 transition-colors relative ${
              activeTab === tab.id ? 'bg-blue-50 text-blue-600' : 'text-gray-700'
            }`}
          >
            {tab.icon}
            <span className="text-xs">{tab.label}</span>
            {tab.badge && (
              <span className="absolute top-2 right-2 bg-purple-600 text-white text-xs px-1 rounded">
                {tab.badge}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Bottom Navigation */}
      <div className="border-t border-gray-200 py-2">
        {bottomTabs.map((tab) => (
          <button
            key={tab.id}
            className="w-full p-3 flex flex-col items-center gap-1 hover:bg-gray-50 transition-colors text-gray-700"
          >
            {tab.icon}
            <span className="text-xs">{tab.label}</span>
          </button>
        ))}
      </div>

      {/* Design Panel (slides out when Design is selected) */}
      {activeTab === 'design' && showDesignPanel && (
        <div className="fixed left-20 top-14 bottom-0 w-80 bg-white border-r border-gray-200 shadow-lg z-10">
          <div className="p-4 border-b border-gray-200">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold">Design</h3>
              <button 
                onClick={() => setShowDesignPanel(false)}
                className="p-1 hover:bg-gray-100 rounded"
              >
                ×
              </button>
            </div>
            
            {/* Search Bar */}
            <div className="relative mb-4">
              <Search size={16} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Search templates"
                className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:border-blue-500"
              />
            </div>

            {/* Template Preview */}
            <div className="space-y-3">
              <div className="bg-gray-50 rounded-lg p-3">
                <h4 className="font-medium text-sm mb-1">Blue Minimalist Artificial Intelligence Presentation</h4>
                <p className="text-xs text-gray-500 mb-2">Presentation • 1920 x 1080 px</p>
                <p className="text-xs text-blue-600 mb-3">DF View more by Design Fortuna</p>
                <button className="w-full bg-blue-500 text-white py-2 rounded-lg text-sm hover:bg-blue-600 transition-colors">
                  Apply all 15 pages
                </button>
              </div>

              {/* Template Grid */}
              <div className="grid grid-cols-3 gap-2">
                {[...Array(6)].map((_, i) => (
                  <div key={i} className="aspect-video bg-gray-100 rounded-lg border border-gray-200 hover:border-blue-500 cursor-pointer transition-colors">
                    <div className="w-full h-full flex items-center justify-center text-xs text-gray-400">
                      Slide {i + 1}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Elements Section */}
          <div className="p-4">
            <h3 className="font-semibold mb-3">Elements</h3>
            <div className="grid grid-cols-3 gap-3">
              <button className="aspect-square bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors flex flex-col items-center justify-center gap-1">
                <Square size={20} />
                <span className="text-xs">Square</span>
              </button>
              <button className="aspect-square bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors flex flex-col items-center justify-center gap-1">
                <Circle size={20} />
                <span className="text-xs">Circle</span>
              </button>
              <button className="aspect-square bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors flex flex-col items-center justify-center gap-1">
                <Triangle size={20} />
                <span className="text-xs">Triangle</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
