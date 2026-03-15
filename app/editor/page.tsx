'use client'

// Main application page component for the DesignPro editor
// This is the primary layout that contains all design editing functionality
// including canvas, toolbars, sidebars, and responsive design

import React, { useState, useEffect } from 'react'
import DesignCanvas from '@/components/editor/DesignCanvas'
import CanvasToolbar from '@/components/editor/CanvasToolbar'
import LeftSidebar from '@/components/layout/LeftSidebar'
import ToolSidebar from '@/components/layout/ToolSidebar'
import PageNavigation from '@/components/editor/PageNavigation'
import KeyboardShortcuts from '@/components/editor/KeyboardShortcuts'
import AutoSave from '@/components/editor/AutoSave'
import ThemeToggle from '@/components/layout/ThemeToggle'
import ZoomControls from '@/components/editor/ZoomControls'
import AuthButton from '@/components/auth/AuthButton'
import AuthGuard from '@/components/auth/AuthGuard'
import Rulers from '@/components/editor/Rulers'
import { useCanvasStore } from '@/store/canvas-store'
import Link from 'next/link'

export default function EditorPage() {
  // Get canvas state from Zustand store
  const { pages, currentPageId, zoomLevel, panOffset } = useCanvasStore()
  const currentPage = pages.find(page => page.id === currentPageId)
  
  // UI state management for responsive layout
  const [showMobileProperties, setShowMobileProperties] = useState(false)
  const [activeTab, setActiveTab] = useState('design')
  const [leftSidebarOpen, setLeftSidebarOpen] = useState(true)
  const [rightSidebarOpen, setRightSidebarOpen] = useState(true)
  
  // Rulers visibility state with localStorage persistence
  const [showRulers, setShowRulers] = useState(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('rulers-visible')
      return saved !== null ? saved === 'true' : true
    }
    return true
  })

  // Listen for ruler visibility changes across browser tabs/windows
  React.useEffect(() => {
    const handleStorageChange = () => {
      const saved = localStorage.getItem('rulers-visible')
      if (saved !== null) {
        setShowRulers(saved === 'true')
      }
    }

    window.addEventListener('storage', handleStorageChange)
    return () => window.removeEventListener('storage', handleStorageChange)
  }, [])

  return (
    <AuthGuard>
      <div className="app-layout">
        {/* Global components that work across the entire app */}
        <AutoSave />
        <KeyboardShortcuts />

        {/* Mobile Responsive Layout */}
        <div className="lg:hidden">
          {/* Mobile Header */}
          <header className="h-14 bg-white border-b border-gray-200 flex items-center justify-between px-4 shadow-sm">
            <div className="flex items-center gap-3">
              <button
                onClick={() => setLeftSidebarOpen(!leftSidebarOpen)}
                className="p-2 rounded-lg hover:bg-gray-100"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              </button>
              <div className="w-8 h-8 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-lg flex items-center justify-center">
                <span className="text-xl">🎨</span>
              </div>
              <span className="font-display text-slate-900">DesignPro</span>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setShowMobileProperties(!showMobileProperties)}
                className="p-2 rounded-lg hover:bg-gray-100"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
                </svg>
              </button>
            </div>
          </header>

          {/* Mobile Canvas */}
          <div className="canvas-container-mobile">
            <div className="bg-white rounded-xl shadow-2xl mx-auto hover:shadow-3xl transition-all duration-300 hover:shadow-indigo-500/10 w-full max-w-[600px]">
              <DesignCanvas
                width={currentPage?.canvasWidth || 794}
                height={currentPage?.canvasHeight || 1123}
              />
            </div>
          </div>

          {/* Mobile Sidebar Overlay */}
          {leftSidebarOpen && (
            <div className="fixed inset-0 z-50 flex">
              <div className="fixed inset-0 bg-black/50" onClick={() => setLeftSidebarOpen(false)} />
              <div className="relative w-72 bg-white shadow-xl">
                <div className="h-14 flex items-center px-4 border-b border-gray-200">
                  <span className="font-semibold text-slate-900">Tools</span>
                </div>
                <div className="flex-1 overflow-y-auto py-4">
                  <LeftSidebar 
                    activeTab={activeTab} 
                    onTabChange={setActiveTab}
                    onSidebarToggle={(open) => setLeftSidebarOpen(open)}
                    isCollapsed={false}
                  />
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Desktop Layout */}
        <div className="hidden lg:flex h-full">

        {/* Left Sidebar - Design Tools */}
        <aside className={`${leftSidebarOpen ? 'w-72' : 'w-16'} flex-shrink-0 sidebar transition-all duration-300 ease-in-out shadow-lg`}>
          <div className="h-16 flex items-center px-4 border-b border-border bg-gradient-to-r from-slate-50 to-white">
            {leftSidebarOpen ? (
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl flex items-center justify-center shadow-lg shadow-indigo-500/20">
                  <span className="text-2xl">🎨</span>
                </div>
                <div>
                  <span className="font-display text-slate-900 text-lg">DesignPro</span>
                  <p className="text-xs text-slate-500">Professional Editor</p>
                </div>
              </div>
            ) : (
              <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl flex items-center justify-center mx-auto shadow-lg shadow-indigo-500/20">
                <span className="text-2xl">🎨</span>
              </div>
            )}
          </div>
          
          <div className="flex-1 overflow-y-auto py-4 bg-gradient-to-b from-white to-slate-50">
            <LeftSidebar 
              activeTab={activeTab} 
              onTabChange={setActiveTab}
              onSidebarToggle={(open) => setLeftSidebarOpen(open)}
              isCollapsed={!leftSidebarOpen}
            />
          </div>
          
          <div className="p-4 border-t border-border bg-gradient-to-r from-slate-50 to-white space-y-2">
            <Link
              href="/dashboard"
              className="w-full px-3 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg text-sm text-gray-700 transition-colors text-center"
            >
              📊 Dashboard
            </Link>
            <ThemeToggle />
          </div>
        </aside>

        {/* Main Content Area */}
        <main className="flex-1 flex flex-col overflow-hidden bg-gradient-to-br from-slate-50 via-white to-slate-50">
          {/* Top Toolbar */}
          <header className="h-16 toolbar bg-white/80 backdrop-blur-xl border-b border-border/50 shadow-sm">
            <div className="flex items-center gap-4 px-6">
              <button
                onClick={() => setLeftSidebarOpen(!leftSidebarOpen)}
                className={`btn btn-ghost btn-icon hover:bg-slate-100 ${leftSidebarOpen ? '' : 'bg-slate-100'}`}
                title={leftSidebarOpen ? 'Hide sidebar' : 'Show sidebar'}
              >
                <svg className={`w-5 h-5 transition-transform duration-300 ${!leftSidebarOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 19l-7-7 7-7m8 14l-7-7 7-7" />
                </svg>
              </button>
              
              <div className="toolbar-divider h-8 bg-gradient-to-b from-border to-transparent" />
              
              <div className="flex-1">
                <CanvasToolbar />
              </div>
            </div>
            
            <div className="flex items-center gap-4 px-6">
              <div className="flex items-center gap-2 bg-slate-50 rounded-lg px-3 py-2">
                <ZoomControls />
              </div>
              <div className="toolbar-divider h-8 bg-gradient-to-b from-border to-transparent" />
              <AuthButton />
            </div>
          </header>

          {/* Canvas Area with Rulers */}
          <div className="canvas-container relative flex-1 bg-gradient-to-br from-slate-100/50 via-white to-slate-100/50 min-h-[600px]">
            {/* Rulers overlay */}
            {showRulers && (
              <div className="absolute top-0 left-0 right-0 z-10">
                <Rulers
                  width={currentPage?.canvasWidth || 794}
                  height={currentPage?.canvasHeight || 1123}
                  zoomLevel={zoomLevel}
                  panOffset={panOffset}
                />
              </div>
            )}
            
            {/* Main Canvas */}
            <div className="canvas-wrapper w-full h-full min-h-[500px] overflow-auto z-0 p-4 lg:p-8">
              <div className="min-h-full w-full flex justify-center items-start">
                <div className="canvas relative shadow-2xl ring-1 ring-black/5 hover:shadow-3xl transition-all duration-300 hover:shadow-indigo-500/10 hover:ring-2 hover:ring-indigo-500/20">
                  <DesignCanvas
                    width={currentPage?.canvasWidth || 794}
                    height={currentPage?.canvasHeight || 1123}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Bottom Page Navigation */}
          <div className="h-12 bg-gradient-to-r from-white to-slate-50 border-t border-border/50 flex items-center px-6 shadow-lg">
            <PageNavigation />
          </div>
        </main>

        {/* Right Sidebar - Properties Panel */}
        <aside className={`${rightSidebarOpen ? 'w-80' : 'w-14'} flex-shrink-0 properties-panel transition-all duration-300 ease-in-out bg-white shadow-xl border-l border-border/50`}>
          <div className="h-16 flex items-center justify-center border-b border-border/50 bg-gradient-to-r from-white to-slate-50">
            <button
              onClick={() => setRightSidebarOpen(!rightSidebarOpen)}
              className="btn btn-ghost btn-icon hover:bg-slate-100 rounded-xl"
              title={rightSidebarOpen ? 'Hide properties' : 'Show properties'}
            >
              <svg className={`w-5 h-5 transition-transform duration-300 ${rightSidebarOpen ? '' : 'rotate-180'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </div>
          
          {rightSidebarOpen && (
            <div className="flex-1 overflow-y-auto bg-gradient-to-b from-white to-slate-50">
              <ToolSidebar />
            </div>
          )}
        </aside>

        {/* Mobile Properties Panel (Bottom Sheet) */}
        {showMobileProperties && (
          <div className="fixed bottom-0 left-0 right-0 bg-white/95 backdrop-blur-xl border-t border-gray-100/50 z-50 animate-slide-up shadow-2xl">
            <div className="flex items-center justify-between p-4 border-b border-gray-100/50 bg-gradient-to-r from-white to-slate-50">
              <h3 className="font-semibold text-slate-800">Properties</h3>
              <button
                onClick={() => setShowMobileProperties(false)}
                className="btn btn-ghost btn-icon hover:bg-slate-100 rounded-xl"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="h-80 overflow-y-auto bg-gradient-to-b from-white to-slate-50">
              <ToolSidebar />
            </div>
          </div>
        )}
        </div>
      </div>
    </AuthGuard>
  )
}
