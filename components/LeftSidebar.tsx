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
  Layout,
  Palette
} from 'lucide-react'
import { useCanvasStore } from '../store/canvas-store'
import ShapeToolbar from './ShapeToolbar'

interface SidebarItem {
  id: string
  label: string
  icon: React.ReactNode
  badge?: string
}

interface LeftSidebarProps {
  activeTab?: string
  onTabChange?: (tabId: string) => void
  showShapeToolbar?: boolean
}

export default function LeftSidebar({ activeTab: externalActiveTab, onTabChange }: LeftSidebarProps) {
  const [internalActiveTab, setInternalActiveTab] = useState('design')

  const activeTab = externalActiveTab || internalActiveTab
  const setActiveTab = onTabChange || setInternalActiveTab

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
    <div className="w-20 bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl border-r border-gray-200 dark:border-gray-800 flex flex-col transition-all duration-300">
      {/* App Logo/Icon Area */}
      <div className="h-16 flex items-center justify-center border-b border-gray-100 dark:border-gray-800/50">
        <div className="w-10 h-10 bg-gradient-to-tr from-blue-600 to-indigo-500 rounded-xl flex items-center justify-center shadow-lg shadow-blue-500/30 transform hover:rotate-12 transition-transform cursor-pointer">
          <Palette className="text-white" size={24} strokeWidth={2.5} />
        </div>
      </div>

      {/* Main Navigation */}
      <div className="flex-1 py-6 space-y-2 px-2 overflow-y-auto">
        {mainTabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => handleTabClick(tab.id)}
            className={`w-full group relative p-3 flex items-center justify-center rounded-2xl transition-all duration-200 hover:scale-[1.02] active:scale-95 ${activeTab === tab.id
              ? 'bg-blue-600 shadow-lg shadow-blue-500/25 text-white'
              : 'text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800'
              }`}
            title={tab.label}
          >
            <div className={`transition-transform duration-200 group-hover:-translate-y-0.5 ${activeTab === tab.id ? 'scale-110' : ''}`}>
              {tab.icon}
            </div>

            {/* Active Indicator Dot (optional, subtle) */}
            {activeTab === tab.id && (
              <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-8 bg-blue-600 rounded-r-full" />
            )}
          </button>
        ))}
      </div>

      {/* Bottom Navigation */}
      <div className="border-t border-gray-100 dark:border-gray-800 px-2 py-4 space-y-2">
        {bottomTabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => handleTabClick(tab.id)}
            className={`w-full group p-3 flex items-center justify-center rounded-2xl transition-all duration-200 hover:scale-[1.02] active:scale-95 ${activeTab === tab.id
              ? 'bg-blue-600 shadow-lg shadow-blue-500/25 text-white'
              : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800'
              }`}
            title={tab.label}
          >
            <div className="transition-transform duration-200 group-hover:-translate-y-0.5">
              {tab.icon}
            </div>
          </button>
        ))}
      </div>
    </div>
  )
}
