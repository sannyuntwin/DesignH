'use client'

import { useState } from 'react'
import { 
  MousePointer, Square, Circle, Triangle, Star, Heart, Type, 
  Image, Pen, Move, RotateCw, ZoomIn, ZoomOut, Maximize2,
  Layers, Undo, Redo, Copy, Trash2, Eye, EyeOff, Lock, Unlock,
  Grid, AlignLeft, AlignCenter, AlignRight, AlignStartVertical,
  AlignCenterVertical, AlignEndVertical, Group, Ungroup
} from 'lucide-react'

interface Tool {
  id: string
  name: string
  icon: any
  category: 'select' | 'shape' | 'text' | 'draw' | 'image' | 'transform' | 'view'
  shortcut?: string
}

interface AdvancedToolbarProps {
  activeTool: string
  onToolChange: (toolId: string) => void
  zoom: number
  onZoomChange: (zoom: number) => void
  onUndo: () => void
  onRedo: () => void
  canUndo: boolean
  canRedo: boolean
  onGroup: () => void
  onUngroup: () => void
  onDuplicate: () => void
  onDelete: () => void
  onToggleGrid: () => void
  showGrid: boolean
}

const TOOLS: Tool[] = [
  // Selection Tools
  { id: 'select', name: 'Select', icon: MousePointer, category: 'select', shortcut: 'V' },
  { id: 'move', name: 'Move', icon: Move, category: 'select', shortcut: 'M' },
  
  // Shape Tools
  { id: 'rectangle', name: 'Rectangle', icon: Square, category: 'shape', shortcut: 'R' },
  { id: 'circle', name: 'Circle', icon: Circle, category: 'shape', shortcut: 'C' },
  { id: 'triangle', name: 'Triangle', icon: Triangle, category: 'shape', shortcut: 'T' },
  { id: 'star', name: 'Star', icon: Star, category: 'shape' },
  { id: 'heart', name: 'Heart', icon: Heart, category: 'shape' },
  
  // Text Tools
  { id: 'text', name: 'Text', icon: Type, category: 'text', shortcut: 'T' },
  
  // Drawing Tools
  { id: 'pen', name: 'Pen', icon: Pen, category: 'draw', shortcut: 'P' },
  
  // Image Tools
  { id: 'image', name: 'Image', icon: Image, category: 'image', shortcut: 'I' },
  
  // Transform Tools
  { id: 'rotate', name: 'Rotate', icon: RotateCw, category: 'transform', shortcut: 'R' },
]

export default function AdvancedToolbar({
  activeTool,
  onToolChange,
  zoom,
  onZoomChange,
  onUndo,
  onRedo,
  canUndo,
  canRedo,
  onGroup,
  onUngroup,
  onDuplicate,
  onDelete,
  onToggleGrid,
  showGrid
}: AdvancedToolbarProps) {
  const [showMoreOptions, setShowMoreOptions] = useState(false)

  const handleZoomIn = () => {
    onZoomChange(Math.min(zoom * 1.2, 500))
  }

  const handleZoomOut = () => {
    onZoomChange(Math.max(zoom / 1.2, 10))
  }

  const handleZoomReset = () => {
    onZoomChange(100)
  }

  const handleZoomFit = () => {
    onZoomChange(100) // This would calculate fit-to-screen in real implementation
  }

  return (
    <div className="bg-white border-b border-gray-200 px-4 py-2">
      <div className="flex items-center gap-4">
        {/* Tool Categories */}
        <div className="flex items-center gap-1 border-r pr-4">
          {TOOLS.filter(tool => tool.category === 'select').map(tool => (
            <ToolButton
              key={tool.id}
              tool={tool}
              isActive={activeTool === tool.id}
              onClick={() => onToolChange(tool.id)}
            />
          ))}
        </div>

        <div className="flex items-center gap-1 border-r pr-4">
          {TOOLS.filter(tool => tool.category === 'shape').map(tool => (
            <ToolButton
              key={tool.id}
              tool={tool}
              isActive={activeTool === tool.id}
              onClick={() => onToolChange(tool.id)}
            />
          ))}
        </div>

        <div className="flex items-center gap-1 border-r pr-4">
          {TOOLS.filter(tool => tool.category === 'text' || tool.category === 'draw' || tool.category === 'image').map(tool => (
            <ToolButton
              key={tool.id}
              tool={tool}
              isActive={activeTool === tool.id}
              onClick={() => onToolChange(tool.id)}
            />
          ))}
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-1 border-r pr-4">
          <button
            onClick={onUndo}
            disabled={!canUndo}
            className="p-2 rounded hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
            title="Undo (Ctrl+Z)"
          >
            <Undo className="w-4 h-4" />
          </button>
          <button
            onClick={onRedo}
            disabled={!canRedo}
            className="p-2 rounded hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
            title="Redo (Ctrl+Y)"
          >
            <Redo className="w-4 h-4" />
          </button>
          <button
            onClick={onDuplicate}
            className="p-2 rounded hover:bg-gray-100"
            title="Duplicate (Ctrl+D)"
          >
            <Copy className="w-4 h-4" />
          </button>
          <button
            onClick={onDelete}
            className="p-2 rounded hover:bg-gray-100 text-red-500"
            title="Delete (Delete)"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>

        {/* Group/Layer Controls */}
        <div className="flex items-center gap-1 border-r pr-4">
          <button
            onClick={onGroup}
            className="p-2 rounded hover:bg-gray-100"
            title="Group (Ctrl+G)"
          >
            <Group className="w-4 h-4" />
          </button>
          <button
            onClick={onUngroup}
            className="p-2 rounded hover:bg-gray-100"
            title="Ungroup (Ctrl+Shift+G)"
          >
            <Ungroup className="w-4 h-4" />
          </button>
          <button
            onClick={onToggleGrid}
            className={`p-2 rounded hover:bg-gray-100 ${showGrid ? 'bg-blue-100 text-blue-600' : ''}`}
            title="Toggle Grid"
          >
            <Grid className="w-4 h-4" />
          </button>
        </div>

        {/* Zoom Controls */}
        <div className="flex items-center gap-2">
          <button
            onClick={handleZoomOut}
            className="p-2 rounded hover:bg-gray-100"
            title="Zoom Out"
          >
            <ZoomOut className="w-4 h-4" />
          </button>
          <div className="flex items-center gap-1">
            <input
              type="number"
              value={Math.round(zoom)}
              onChange={(e) => onZoomChange(Number(e.target.value))}
              className="w-12 px-2 py-1 text-sm border border-gray-200 rounded text-center"
              min="10"
              max="500"
            />
            <span className="text-sm text-gray-500">%</span>
          </div>
          <button
            onClick={handleZoomIn}
            className="p-2 rounded hover:bg-gray-100"
            title="Zoom In"
          >
            <ZoomIn className="w-4 h-4" />
          </button>
          <button
            onClick={handleZoomReset}
            className="p-2 rounded hover:bg-gray-100"
            title="Reset Zoom"
          >
            <span className="text-xs">100%</span>
          </button>
          <button
            onClick={handleZoomFit}
            className="p-2 rounded hover:bg-gray-100"
            title="Fit to Screen"
          >
            <Maximize2 className="w-4 h-4" />
          </button>
        </div>

        {/* More Options */}
        <div className="relative">
          <button
            onClick={() => setShowMoreOptions(!showMoreOptions)}
            className="p-2 rounded hover:bg-gray-100"
          >
            <span className="text-gray-500">⋯</span>
          </button>
          
          {showMoreOptions && (
            <div className="absolute top-full left-0 mt-1 w-48 bg-white border rounded-lg shadow-lg z-10">
              <div className="py-1">
                <button className="w-full px-4 py-2 text-left text-sm hover:bg-gray-50 flex items-center gap-2">
                  <Layers className="w-4 h-4" />
                  Layer Panel
                </button>
                <button className="w-full px-4 py-2 text-left text-sm hover:bg-gray-50 flex items-center gap-2">
                  <Grid className="w-4 h-4" />
                  Snap to Grid
                </button>
                <button className="w-full px-4 py-2 text-left text-sm hover:bg-gray-50 flex items-center gap-2">
                  <Eye className="w-4 h-4" />
                  Show Guides
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

interface ToolButtonProps {
  tool: Tool
  isActive: boolean
  onClick: () => void
}

function ToolButton({ tool, isActive, onClick }: ToolButtonProps) {
  const Icon = tool.icon
  
  return (
    <button
      onClick={onClick}
      className={`p-2 rounded transition-colors ${
        isActive 
          ? 'bg-blue-500 text-white' 
          : 'hover:bg-gray-100 text-gray-700'
      }`}
      title={`${tool.name}${tool.shortcut ? ` (${tool.shortcut})` : ''}`}
    >
      <Icon className="w-4 h-4" />
    </button>
  )
}
