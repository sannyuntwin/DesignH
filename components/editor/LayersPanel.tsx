'use client'

import { useState, useEffect } from 'react'
import { 
  Layers, Eye, EyeOff, Lock, Unlock, Trash2, ChevronDown, 
  ChevronRight, MoreVertical, Group, Ungroup, Copy, 
  MoveUp, MoveDown, Type, Square, Circle, Triangle, Star, Heart, Image
} from 'lucide-react'

interface Layer {
  id: string
  name: string
  type: 'text' | 'rectangle' | 'circle' | 'triangle' | 'star' | 'heart' | 'image'
  visible: boolean
  locked: boolean
  opacity: number
  zIndex: number
  selected: boolean
  children?: Layer[]
}

interface LayersPanelProps {
  layers: Layer[]
  onLayerSelect: (layerId: string) => void
  onLayerVisibilityToggle: (layerId: string) => void
  onLayerLockToggle: (layerId: string) => void
  onLayerDelete: (layerId: string) => void
  onLayerDuplicate: (layerId: string) => void
  onLayerReorder: (layerId: string, direction: 'up' | 'down') => void
  onLayerGroup: (layerIds: string[]) => void
  onLayerUngroup: (layerId: string) => void
  onLayerRename: (layerId: string, name: string) => void
}

export default function LayersPanel({
  layers,
  onLayerSelect,
  onLayerVisibilityToggle,
  onLayerLockToggle,
  onLayerDelete,
  onLayerDuplicate,
  onLayerReorder,
  onLayerGroup,
  onLayerUngroup,
  onLayerRename
}: LayersPanelProps) {
  const [expandedLayers, setExpandedLayers] = useState<Set<string>>(new Set())
  const [editingLayer, setEditingLayer] = useState<string | null>(null)
  const [editName, setEditName] = useState('')
  const [selectedLayers, setSelectedLayers] = useState<Set<string>>(new Set())

  const toggleLayerExpansion = (layerId: string) => {
    setExpandedLayers(prev => {
      const newSet = new Set(prev)
      if (newSet.has(layerId)) {
        newSet.delete(layerId)
      } else {
        newSet.add(layerId)
      }
      return newSet
    })
  }

  const handleLayerEdit = (layerId: string, currentName: string) => {
    setEditingLayer(layerId)
    setEditName(currentName)
  }

  const handleLayerEditSave = (layerId: string) => {
    if (editName.trim()) {
      onLayerRename(layerId, editName.trim())
    }
    setEditingLayer(null)
    setEditName('')
  }

  const handleLayerEditCancel = () => {
    setEditingLayer(null)
    setEditName('')
  }

  const handleLayerSelection = (layerId: string, event: React.MouseEvent) => {
    event.stopPropagation()
    
    if (event.ctrlKey || event.metaKey) {
      // Multi-select
      setSelectedLayers(prev => {
        const newSet = new Set(prev)
        if (newSet.has(layerId)) {
          newSet.delete(layerId)
        } else {
          newSet.add(layerId)
        }
        return newSet
      })
    } else {
      // Single select
      setSelectedLayers(new Set([layerId]))
    }
    
    onLayerSelect(layerId)
  }

  const getLayerIcon = (type: Layer['type']) => {
    switch (type) {
      case 'text': return Type
      case 'rectangle': return Square
      case 'circle': return Circle
      case 'triangle': return Triangle
      case 'star': return Star
      case 'heart': return Heart
      case 'image': return Image
      default: return Layers
    }
  }

  const renderLayer = (layer: Layer, level: number = 0) => {
    const Icon = getLayerIcon(layer.type)
    const isExpanded = expandedLayers.has(layer.id)
    const isEditing = editingLayer === layer.id
    const isSelected = selectedLayers.has(layer.id)

    return (
      <div key={layer.id} className="select-none">
        <div
          className={`flex items-center gap-2 px-2 py-1 rounded cursor-pointer hover:bg-gray-50 ${
            isSelected ? 'bg-blue-50' : ''
          }`}
          style={{ paddingLeft: `${level * 16 + 8}px` }}
          onClick={(e) => handleLayerSelection(layer.id, e)}
        >
          {/* Expand/Collapse */}
          {layer.children && layer.children.length > 0 && (
            <button
              onClick={(e) => {
                e.stopPropagation()
                toggleLayerExpansion(layer.id)
              }}
              className="p-1 hover:bg-gray-200 rounded"
            >
              {isExpanded ? (
                <ChevronDown className="w-3 h-3" />
              ) : (
                <ChevronRight className="w-3 h-3" />
              )}
            </button>
          )}

          {/* Layer Icon */}
          <Icon className="w-4 h-4 text-gray-500" />

          {/* Layer Name */}
          {isEditing ? (
            <input
              type="text"
              value={editName}
              onChange={(e) => setEditName(e.target.value)}
              onBlur={() => handleLayerEditSave(layer.id)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleLayerEditSave(layer.id)
                if (e.key === 'Escape') handleLayerEditCancel()
              }}
              className="flex-1 px-1 py-0.5 text-sm border border-blue-300 rounded"
              autoFocus
              onClick={(e) => e.stopPropagation()}
            />
          ) : (
            <span
              className="flex-1 text-sm truncate"
              onDoubleClick={() => handleLayerEdit(layer.id, layer.name)}
            >
              {layer.name}
            </span>
          )}

          {/* Opacity */}
          <span className="text-xs text-gray-500">
            {Math.round(layer.opacity * 100)}%
          </span>

          {/* Layer Controls */}
          <div className="flex items-center gap-1">
            {/* Visibility */}
            <button
              onClick={(e) => {
                e.stopPropagation()
                onLayerVisibilityToggle(layer.id)
              }}
              className="p-1 hover:bg-gray-200 rounded"
              title={layer.visible ? 'Hide' : 'Show'}
            >
              {layer.visible ? (
                <Eye className="w-3 h-3" />
              ) : (
                <EyeOff className="w-3 h-3 text-gray-400" />
              )}
            </button>

            {/* Lock */}
            <button
              onClick={(e) => {
                e.stopPropagation()
                onLayerLockToggle(layer.id)
              }}
              className="p-1 hover:bg-gray-200 rounded"
              title={layer.locked ? 'Unlock' : 'Lock'}
            >
              {layer.locked ? (
                <Lock className="w-3 h-3 text-orange-500" />
              ) : (
                <Unlock className="w-3 h-3 text-gray-400" />
              )}
            </button>

            {/* More Options */}
            <LayerOptionsMenu
              layer={layer}
              onDuplicate={() => onLayerDuplicate(layer.id)}
              onDelete={() => onLayerDelete(layer.id)}
              onMoveUp={() => onLayerReorder(layer.id, 'up')}
              onMoveDown={() => onLayerReorder(layer.id, 'down')}
              onGroup={() => onLayerGroup(Array.from(selectedLayers))}
              onUngroup={() => onLayerUngroup(layer.id)}
              onRename={() => handleLayerEdit(layer.id, layer.name)}
            />
          </div>
        </div>

        {/* Render Children */}
        {isExpanded && layer.children && (
          <div>
            {layer.children.map(child => renderLayer(child, level + 1))}
          </div>
        )}
      </div>
    )
  }

  return (
    <div className="bg-white border rounded-lg">
      {/* Header */}
      <div className="flex items-center justify-between p-3 border-b">
        <div className="flex items-center gap-2">
          <Layers className="w-4 h-4" />
          <h3 className="font-medium text-sm">Layers</h3>
          <span className="text-xs text-gray-500">({layers.length})</span>
        </div>
        
        <div className="flex items-center gap-1">
          {selectedLayers.size > 1 && (
            <button
              onClick={() => onLayerGroup(Array.from(selectedLayers))}
              className="p-1 hover:bg-gray-200 rounded"
              title="Group Selected"
            >
              <Group className="w-3 h-3" />
            </button>
          )}
        </div>
      </div>

      {/* Layers List */}
      <div className="max-h-96 overflow-y-auto">
        {layers.length === 0 ? (
          <div className="p-4 text-center text-gray-500 text-sm">
            No layers yet
          </div>
        ) : (
          <div className="py-1">
            {layers.map(layer => renderLayer(layer))}
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="p-2 border-t text-xs text-gray-500">
        <div className="flex items-center justify-between">
          <span>{selectedLayers.size} selected</span>
          <span>Click + Ctrl to multi-select</span>
        </div>
      </div>
    </div>
  )
}

interface LayerOptionsMenuProps {
  layer: Layer
  onDuplicate: () => void
  onDelete: () => void
  onMoveUp: () => void
  onMoveDown: () => void
  onGroup: () => void
  onUngroup: () => void
  onRename: () => void
}

function LayerOptionsMenu({
  layer,
  onDuplicate,
  onDelete,
  onMoveUp,
  onMoveDown,
  onGroup,
  onUngroup,
  onRename
}: LayerOptionsMenuProps) {
  const [isOpen, setIsOpen] = useState(false)

  return (
    <div className="relative">
      <button
        onClick={(e) => {
          e.stopPropagation()
          setIsOpen(!isOpen)
        }}
        className="p-1 hover:bg-gray-200 rounded"
      >
        <MoreVertical className="w-3 h-3" />
      </button>

      {isOpen && (
        <div className="absolute top-full right-0 mt-1 w-48 bg-white border rounded-lg shadow-lg z-10">
          <div className="py-1">
            <button
              onClick={() => { onRename(); setIsOpen(false) }}
              className="w-full px-3 py-1.5 text-left text-xs hover:bg-gray-50 flex items-center gap-2"
            >
              <Type className="w-3 h-3" />
              Rename
            </button>
            <button
              onClick={() => { onDuplicate(); setIsOpen(false) }}
              className="w-full px-3 py-1.5 text-left text-xs hover:bg-gray-50 flex items-center gap-2"
            >
              <Copy className="w-3 h-3" />
              Duplicate
            </button>
            <div className="border-t my-1" />
            <button
              onClick={() => { onMoveUp(); setIsOpen(false) }}
              className="w-full px-3 py-1.5 text-left text-xs hover:bg-gray-50 flex items-center gap-2"
            >
              <MoveUp className="w-3 h-3" />
              Move Up
            </button>
            <button
              onClick={() => { onMoveDown(); setIsOpen(false) }}
              className="w-full px-3 py-1.5 text-left text-xs hover:bg-gray-50 flex items-center gap-2"
            >
              <MoveDown className="w-3 h-3" />
              Move Down
            </button>
            <div className="border-t my-1" />
            <button
              onClick={() => { onGroup(); setIsOpen(false) }}
              className="w-full px-3 py-1.5 text-left text-xs hover:bg-gray-50 flex items-center gap-2"
            >
              <Group className="w-3 h-3" />
              Group
            </button>
            <button
              onClick={() => { onUngroup(); setIsOpen(false) }}
              className="w-full px-3 py-1.5 text-left text-xs hover:bg-gray-50 flex items-center gap-2"
            >
              <Ungroup className="w-3 h-3" />
              Ungroup
            </button>
            <div className="border-t my-1" />
            <button
              onClick={() => { onDelete(); setIsOpen(false) }}
              className="w-full px-3 py-1.5 text-left text-xs hover:bg-red-50 text-red-600 flex items-center gap-2"
            >
              <Trash2 className="w-3 h-3" />
              Delete
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
