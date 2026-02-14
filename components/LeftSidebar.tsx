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
    </div>
  )
}
