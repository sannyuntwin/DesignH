'use client'

import DesignCanvas from '../components/DesignCanvas'
import TopNavigation from '../components/TopNavigation'
import PageNavigation from '../components/PageNavigation'
import LeftSidebar from '../components/LeftSidebar'
import CanvasToolbar from '../components/CanvasToolbar'
import BottomPreview from '../components/BottomPreview'
import KeyboardShortcuts from '../components/KeyboardShortcuts'
import ZoomControls from '../components/ZoomControls'
import TemplatesPanel from '../components/TemplatesPanel'
import AutoSave from '../components/AutoSave'
import { useState } from 'react'

export default function Home() {
  const [showTemplates, setShowTemplates] = useState(false)

  return (
    <div className="h-screen flex flex-col bg-gray-50">
      {/* Top Navigation */}
      <TopNavigation />
      
      {/* Page Navigation */}
      <PageNavigation />
      
      {/* Main Content Area */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Sidebar */}
        <LeftSidebar />
        
        {/* Canvas Area */}
        <div className="flex-1 flex flex-col">
          {/* Canvas Toolbar */}
          <CanvasToolbar />
          
          {/* Canvas Container */}
          <div className="flex-1 flex items-center justify-center p-8 overflow-auto">
            <div className="bg-white rounded-lg shadow-lg">
              <DesignCanvas />
            </div>
          </div>
          
          {/* Bottom Preview */}
          <BottomPreview />
        </div>

        {/* Right Sidebar - Templates */}
        {showTemplates && <TemplatesPanel />}
      </div>
      
      {/* Keyboard Shortcuts (invisible component) */}
      <KeyboardShortcuts />
      
      {/* Auto-save (invisible component) */}
      <AutoSave />
      
      {/* Zoom Controls */}
      <ZoomControls />

      {/* Templates Toggle Button */}
      <button
        onClick={() => setShowTemplates(!showTemplates)}
        className={`fixed right-4 top-1/2 transform -translate-y-1/2 z-40 p-3 rounded-l-lg shadow-lg transition-all duration-200 ${
          showTemplates 
            ? 'bg-blue-500 text-white translate-x-80' 
            : 'bg-white text-gray-700 border border-gray-200 hover:bg-gray-50'
        }`}
        title="Toggle Templates Panel"
      >
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <rect x="3" y="3" width="7" height="7" />
          <rect x="14" y="3" width="7" height="7" />
          <rect x="14" y="14" width="7" height="7" />
          <rect x="3" y="14" width="7" height="7" />
        </svg>
      </button>
    </div>
  )
}
