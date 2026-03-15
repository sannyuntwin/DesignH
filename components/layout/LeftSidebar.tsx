import React, { useState } from 'react'
import {
  Palette,
  Shapes,
  Type,
  Image,
  Sparkles,
  FolderOpen,
  Zap,
  Maximize2,
  Wand2,
} from 'lucide-react'
import { useCanvasStore } from '@/store/canvas-store'
import ToolModal from './ToolModal'
import { DesignToolsContent, ShapeToolsContent, TextToolContent, ImageToolContent } from './ToolContent'
import StockPhotos from '@/components/assets/StockPhotos'
import BrandKits from '@/components/panels/BrandKits'
import TextEffects from '@/components/panels/TextEffects'
import MagicResize from '@/components/panels/MagicResize'
import BackgroundRemoval from '@/components/panels/BackgroundRemoval'

interface LeftSidebarProps {
  activeTab?: string
  onTabChange?: (tabId: string) => void
  onSidebarToggle?: (isOpen: boolean) => void
  isCollapsed?: boolean
}

export default function LeftSidebar({ activeTab: externalActiveTab, onTabChange, onSidebarToggle, isCollapsed = false }: LeftSidebarProps) {
  const [internalActiveTab, setInternalActiveTab] = useState('design')
  const [expandedSubmenu, setExpandedSubmenu] = useState<string | null>(null)
  const [activeModal, setActiveModal] = useState<string | null>(null)
  const activeTab = externalActiveTab || internalActiveTab
  const setActiveTab = onTabChange || setInternalActiveTab

  const { addElement } = useCanvasStore()

  const tools = [
    { id: 'design', label: 'Design', icon: <Palette className="sidebar-icon" /> },
    { id: 'elements', label: 'Elements', icon: <Shapes className="sidebar-icon" /> },
    { id: 'text', label: 'Text', icon: <Type className="sidebar-icon" /> },
    { id: 'text-effects', label: 'Text Effects', icon: <Zap className="sidebar-icon" /> },
    { id: 'images', label: 'Images', icon: <Image className="sidebar-icon" /> },
    { id: 'stock-photos', label: 'Stock Photos', icon: <Image className="sidebar-icon" /> },
    { id: 'brand-kits', label: 'Brand Kits', icon: <FolderOpen className="sidebar-icon" /> },
    { id: 'magic-resize', label: 'Magic Resize', icon: <Maximize2 className="sidebar-icon" /> },
    { id: 'bg-removal', label: 'BG Remover', icon: <Wand2 className="sidebar-icon" /> },
  ]

  
  const handleToolClick = (toolId: string) => {
    // Close any existing modal
    setActiveModal(null)
    
    // Open modal for the clicked tool
    setActiveModal(toolId)
    
    // Activate the tool
    setActiveTab(toolId)
    if (onSidebarToggle) onSidebarToggle(true)
  }

  return (
    <div className="flex flex-col h-full bg-white border-r border-gray-100/50">
      {/* Main Tools */}
      <div className="flex-1 py-6">
        <div className={`${isCollapsed ? 'px-2' : 'px-4'} space-y-1`}>
          {tools.map((tool) => (
            <div key={tool.id} className="relative group">
              <button
                onClick={() => handleToolClick(tool.id)}
                className={`sidebar-item group relative w-full flex items-center ${isCollapsed ? 'justify-center' : 'gap-3'} px-3 py-3 rounded-xl transition-all duration-300 ease-out overflow-hidden ${
                  activeTab === tool.id 
                    ? 'bg-gradient-to-r from-indigo-500 via-purple-500 to-indigo-600 text-white shadow-xl shadow-indigo-500/25 transform scale-[1.02] ring-2 ring-indigo-500/20' 
                    : 'hover:bg-gradient-to-r hover:from-slate-50 hover:to-slate-100 text-gray-600 hover:text-gray-900 hover:shadow-md'
                }`}
                title={tool.label}
              >
                {/* Background gradient overlay */}
                <div className={`absolute inset-0 transition-all duration-300 ${
                  activeTab === tool.id 
                    ? 'bg-gradient-to-r from-white/10 to-transparent' 
                    : 'bg-gradient-to-r from-transparent to-transparent group-hover:from-white/50'
                }`}></div>
                
                {/* Icon container - Always visible */}
                <div className={`relative flex-shrink-0 transition-all duration-300 z-10 ${
                  activeTab === tool.id ? 'text-white' : 'text-gray-500 group-hover:text-gray-700'
                }`}>
                  <div className={`w-9 h-9 rounded-xl flex items-center justify-center transition-all duration-300 ${
                    activeTab === tool.id 
                      ? 'bg-white/20 backdrop-blur-sm ring-2 ring-white/30' 
                      : 'bg-gradient-to-br from-gray-100 to-gray-200 group-hover:from-indigo-50 group-hover:to-purple-50'
                  }`}>
                    {tool.icon}
                  </div>
                </div>
                
                {/* Label - Only show when sidebar is not collapsed */}
                {!isCollapsed && (
                  <span className={`sidebar-label font-semibold text-sm transition-all duration-300 z-10 ${
                    activeTab === tool.id ? 'text-white' : 'text-gray-700 group-hover:text-gray-900'
                  }`}>
                    {tool.label}
                  </span>
                )}
                
                {/* Active state effects */}
                {activeTab === tool.id && (
                  <>
                    {/* Shimmer effect */}
                    <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-white/0 via-white/20 to-white/0 animate-shimmer"></div>
                    
                    {/* Side accent */}
                    <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-10 bg-gradient-to-b from-white/70 via-white to-white/50 rounded-r-full shadow-lg"></div>
                    
                    {/* Glow effect */}
                    <div className="absolute -inset-1 rounded-xl bg-gradient-to-r from-indigo-500/20 to-purple-500/20 blur-xl"></div>
                  </>
                )}
                
                {/* Hover glow */}
                <div className={`absolute inset-0 rounded-xl transition-all duration-300 opacity-0 group-hover:opacity-100 ${
                  activeTab === tool.id 
                    ? 'shadow-xl shadow-indigo-500/30' 
                    : 'shadow-lg shadow-gray-200/50 group-hover:shadow-indigo-200/25'
                }`}></div>
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Tool Modals */}
      <ToolModal
        isOpen={activeModal === 'design'}
        onClose={() => setActiveModal(null)}
        title="Design Tools"
      >
        <DesignToolsContent />
      </ToolModal>

      <ToolModal
        isOpen={activeModal === 'elements'}
        onClose={() => setActiveModal(null)}
        title="Shape Tools"
      >
        <ShapeToolsContent />
      </ToolModal>

      <ToolModal
        isOpen={activeModal === 'text'}
        onClose={() => setActiveModal(null)}
        title="Text Tool"
      >
        <TextToolContent />
      </ToolModal>

      <ToolModal
        isOpen={activeModal === 'images'}
        onClose={() => setActiveModal(null)}
        title="Image Tool"
      >
        <ImageToolContent />
      </ToolModal>

      {/* Text Effects Modal */}
      {activeModal === 'text-effects' && (
        <TextEffects onClose={() => setActiveModal(null)} />
      )}

      {/* Stock Photos Modal */}
      {activeModal === 'stock-photos' && (
        <StockPhotos onClose={() => setActiveModal(null)} />
      )}

      {/* Brand Kits Modal */}
      {activeModal === 'brand-kits' && (
        <BrandKits onClose={() => setActiveModal(null)} />
      )}

      {/* Magic Resize Modal */}
      {activeModal === 'magic-resize' && (
        <MagicResize onClose={() => setActiveModal(null)} />
      )}

      {/* Background Removal Modal */}
      {activeModal === 'bg-removal' && (
        <BackgroundRemoval onClose={() => setActiveModal(null)} />
      )}
    </div>
  )
}
