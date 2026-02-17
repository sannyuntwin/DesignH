'use client'

import { useState } from 'react'
import DesignCanvas from '../components/DesignCanvas'
import CanvasToolbar from '../components/CanvasToolbar'
import LeftSidebar from '../components/LeftSidebar'
import ToolSidebar from '../components/ToolSidebar'
import PageNavigation from '../components/PageNavigation'
import AlignmentTools from '../components/AlignmentTools'
import KeyboardShortcuts from '../components/KeyboardShortcuts'
import AutoSave from '../components/AutoSave'
import TemplatesPanel from '../components/TemplatesPanel'
import ThemeToggle from '../components/ThemeToggle'
import ShapeToolbar from '../components/ShapeToolbar'
import ZoomControls from '../components/ZoomControls'
import AuthButton from '../components/AuthButton'
import AuthGuard from '../components/AuthGuard'

export default function Home() {
  const [showMobileProperties, setShowMobileProperties] = useState(false)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [activeTab, setActiveTab] = useState('design')

  return (
    <AuthGuard>
      <div className="h-screen flex flex-col bg-gray-50 dark:bg-gray-900 transition-colors">
      {/* Auto-save (invisible component) */}
      <AutoSave />

      {/* Keyboard Shortcuts */}
      <KeyboardShortcuts />

      {/* Zoom Controls */}
      <ZoomControls />

      {/* Mobile Header */}
      <div className="lg:hidden glass-panel px-4 py-3 flex items-center justify-between z-40">
        <button
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="p-2 rounded-xl hover:bg-gray-100/50 dark:hover:bg-gray-800/50 text-gray-700 dark:text-gray-300 transition-all active:scale-90"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>
        <h1 className="text-lg font-bold bg-gradient-to-r from-blue-600 to-indigo-500 bg-clip-text text-transparent">Design Editor</h1>
        <div className="flex items-center space-x-2">
          <AuthButton />
          <button
            onClick={() => setShowMobileProperties(!showMobileProperties)}
            className="p-2 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0 4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
            </svg>
          </button>
          <ThemeToggle />
        </div>
      </div>

      {/* Desktop Toolbar */}
      <div className="hidden lg:block z-30">
        <div className="glass-panel mx-4 mt-4 rounded-2xl shadow-sm border border-gray-200/50 dark:border-gray-700/50">
          <div className="flex items-center justify-between px-6 py-3">
            <CanvasToolbar />
            <AuthButton />
          </div>
        </div>
      </div>

      {/* Mobile Toolbar - Simplified */}
      <div className="lg:hidden glass-panel m-2 rounded-xl px-2 py-1 flex items-center justify-between overflow-x-auto shadow-sm">
        <div className="flex items-center space-x-1">
          <button className="p-2 rounded hover:bg-gray-100 dark:hover:bg-gray-700 text-sm text-gray-700 dark:text-gray-300">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
          </button>
          <button className="p-2 rounded hover:bg-gray-100 dark:hover:bg-gray-700 text-sm text-gray-700 dark:text-gray-300">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
            </svg>
          </button>
          <button className="p-2 rounded hover:bg-gray-100 dark:hover:bg-gray-700 text-sm text-gray-700 dark:text-gray-300">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          </button>
        </div>
      </div>

      <div className="flex flex-1 overflow-hidden p-4 gap-4">
        {/* Left Sidebar - Desktop */}
        <div className="hidden lg:flex sidebar-desktop bg-white/50 dark:bg-gray-900/50 backdrop-blur-md border border-gray-200 dark:border-gray-800 rounded-3xl overflow-hidden shadow-sm transition-all duration-300">
          <LeftSidebar activeTab={activeTab} onTabChange={setActiveTab} />
          {(activeTab === 'design' || activeTab === 'elements') && (
            <div className="w-64 border-l border-gray-200/50 dark:border-gray-800/50 transition-colors bg-white/30 dark:bg-gray-800/20">
              {activeTab === 'elements' ? <ShapeToolbar /> : <TemplatesPanel />}
            </div>
          )}
        </div>

        {/* Mobile Menu Overlay */}
        {mobileMenuOpen && (
          <div
            className="lg:hidden fixed inset-0 bg-black bg-opacity-50 z-40"
            onClick={() => setMobileMenuOpen(false)}
          />
        )}

        {/* Left Sidebar - Mobile */}
        <div className={`lg:hidden sidebar-mobile fixed top-0 left-0 h-full w-64 bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 transform transition-transform duration-300 z-50 ${mobileMenuOpen ? 'translate-x-0' : '-translate-x-full'}`}>
          <div className="lg:hidden flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
            <h2 className="font-semibold text-gray-900 dark:text-gray-100">Tools</h2>
            <button
              onClick={() => setMobileMenuOpen(false)}
              className="p-2 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          <div className="flex-1 overflow-y-auto">
            <LeftSidebar activeTab={activeTab} onTabChange={setActiveTab} />
          </div>
        </div>

        {/* Main Content Area */}
        <div className="flex-1 flex flex-col overflow-hidden bg-white dark:bg-gray-800/40 rounded-3xl border border-gray-200 dark:border-gray-800 shadow-inner group">
          {/* Page Navigation - Responsive */}
          <div className="bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm border-b border-gray-100 dark:border-gray-800/50 px-6 py-3">
            <div className="flex items-center justify-between">
              <div className="flex-1 min-w-0">
                <PageNavigation />
              </div>
              <div className="hidden sm:block ml-4">
                <AlignmentTools />
              </div>
            </div>
          </div>

          {/* Canvas Container - Responsive */}
          <div className="flex-1 overflow-auto p-8 canvas-workspace-grid relative">
            <div className="flex justify-center items-center min-h-full">
              <div className="w-full max-w-4xl">
                <DesignCanvas
                  width={typeof window !== 'undefined' && window.innerWidth < 768
                    ? Math.min(window.innerWidth - 32, 600)
                    : undefined}
                  height={typeof window !== 'undefined' && window.innerWidth < 768
                    ? Math.min(window.innerHeight - 200, 400)
                    : undefined}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Right Sidebar - Desktop */}
        <div className="hidden xl:block w-80 bg-white/50 dark:bg-gray-900/50 backdrop-blur-md border border-gray-200 dark:border-gray-800 rounded-3xl overflow-hidden shadow-sm">
          <ToolSidebar />
        </div>

        {/* Right Sidebar - Mobile (Bottom Sheet) */}
        <div className={`lg:hidden fixed bottom-0 left-0 right-0 bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 transform transition-transform duration-300 z-30 ${showMobileProperties ? 'translate-y-0' : 'translate-y-full'}`}>
          <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
            <h2 className="font-semibold text-gray-900 dark:text-gray-100">Properties</h2>
            <button
              onClick={() => setShowMobileProperties(false)}
              className="p-2 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          <div className="h-64 overflow-y-auto">
            <ToolSidebar />
          </div>
        </div>
      </div>

      {/* Mobile Floating Action Button */}
      <div className="lg:hidden fixed bottom-4 right-4 z-20">
        <button
          onClick={() => setShowMobileProperties(!showMobileProperties)}
          className="bg-blue-500 text-white rounded-full p-4 shadow-lg hover:bg-blue-600 transition-colors"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0 4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
          </svg>
        </button>
      </div>
    </div>
    </AuthGuard>
  )
}
