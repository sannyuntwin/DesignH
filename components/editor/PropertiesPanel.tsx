'use client'

import { useState, useEffect } from 'react'
import { 
  Palette, Type, Square, Circle, Triangle, Star, Heart,
  Move, RotateCw, Sliders, Layers, Eye, EyeOff, Lock, Unlock,
  ChevronDown, ChevronRight, Plus, Trash2, Copy
} from 'lucide-react'

interface DesignElement {
  id: string
  type: 'text' | 'rectangle' | 'circle' | 'triangle' | 'star' | 'heart' | 'image'
  x: number
  y: number
  width: number
  height: number
  rotation: number
  opacity: number
  visible: boolean
  locked: boolean
  zIndex: number
  // Text properties
  content?: string
  fontSize?: number
  fontFamily?: string
  fontWeight?: string
  fontStyle?: string
  textAlign?: 'left' | 'center' | 'right'
  color?: string
  backgroundColor?: string
  // Shape properties
  fill?: string
  stroke?: string
  strokeWidth?: number
  // Gradient
  gradient?: {
    colors: string[]
    direction: 'horizontal' | 'vertical' | 'diagonal'
  }
  // Shadow
  shadow?: {
    x: number
    y: number
    blur: number
    color: string
  }
}

interface PropertiesPanelProps {
  selectedElements: DesignElement[]
  onElementUpdate: (elementId: string, updates: Partial<DesignElement>) => void
  onElementsUpdate: (updates: Partial<DesignElement>) => void
}

export default function PropertiesPanel({
  selectedElements,
  onElementUpdate,
  onElementsUpdate
}: PropertiesPanelProps) {
  const [expandedSections, setExpandedSections] = useState<Set<string>>(
    new Set(['transform', 'appearance', 'text', 'effects'])
  )

  const toggleSection = (section: string) => {
    setExpandedSections(prev => {
      const newSet = new Set(prev)
      if (newSet.has(section)) {
        newSet.delete(section)
      } else {
        newSet.add(section)
      }
      return newSet
    })
  }

  const handlePropertyChange = (property: keyof DesignElement, value: any) => {
    if (selectedElements.length === 1) {
      onElementUpdate(selectedElements[0].id, { [property]: value })
    } else {
      onElementsUpdate({ [property]: value })
    }
  }

  const handleMultiplePropertyChange = (updates: Partial<DesignElement>) => {
    if (selectedElements.length === 1) {
      onElementUpdate(selectedElements[0].id, updates)
    } else {
      onElementsUpdate(updates)
    }
  }

  const getCommonValue = (property: keyof DesignElement) => {
    if (selectedElements.length === 0) return null
    if (selectedElements.length === 1) return selectedElements[0][property] as any
    
    const firstValue = selectedElements[0][property]
    const allSame = selectedElements.every(el => el[property] === firstValue)
    return allSame ? firstValue as any : null
  }

  const renderSectionHeader = (title: string, section: string, icon: any) => {
    const Icon = icon
    const isExpanded = expandedSections.has(section)
    
    return (
      <button
        onClick={() => toggleSection(section)}
        className="w-full flex items-center justify-between p-3 hover:bg-gray-50 border-b"
      >
        <div className="flex items-center gap-2">
          <Icon className="w-4 h-4" />
          <span className="font-medium text-sm">{title}</span>
        </div>
        {isExpanded ? (
          <ChevronDown className="w-4 h-4" />
        ) : (
          <ChevronRight className="w-4 h-4" />
        )}
      </button>
    )
  }

  const renderTransformSection = () => {
    const commonX = getCommonValue('x')
    const commonY = getCommonValue('y')
    const commonWidth = getCommonValue('width')
    const commonHeight = getCommonValue('height')
    const commonRotation = getCommonValue('rotation')

    return (
      <div className="p-4 space-y-4">
        {/* Position */}
        <div>
          <label className="block text-xs font-medium text-gray-700 mb-2">Position</label>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block text-xs text-gray-500 mb-1">X</label>
              <input
                type="number"
                value={commonX || ''}
                onChange={(e) => handlePropertyChange('x', Number(e.target.value))}
                className="w-full px-2 py-1 border border-gray-200 rounded text-sm"
                placeholder="Mixed"
              />
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">Y</label>
              <input
                type="number"
                value={commonY || ''}
                onChange={(e) => handlePropertyChange('y', Number(e.target.value))}
                className="w-full px-2 py-1 border border-gray-200 rounded text-sm"
                placeholder="Mixed"
              />
            </div>
          </div>
        </div>

        {/* Size */}
        <div>
          <label className="block text-xs font-medium text-gray-700 mb-2">Size</label>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block text-xs text-gray-500 mb-1">Width</label>
              <input
                type="number"
                value={commonWidth || ''}
                onChange={(e) => handlePropertyChange('width', Number(e.target.value))}
                className="w-full px-2 py-1 border border-gray-200 rounded text-sm"
                placeholder="Mixed"
              />
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">Height</label>
              <input
                type="number"
                value={commonHeight || ''}
                onChange={(e) => handlePropertyChange('height', Number(e.target.value))}
                className="w-full px-2 py-1 border border-gray-200 rounded text-sm"
                placeholder="Mixed"
              />
            </div>
          </div>
        </div>

        {/* Rotation */}
        <div>
          <label className="block text-xs font-medium text-gray-700 mb-2">Rotation</label>
          <div className="flex items-center gap-2">
            <input
              type="range"
              min="0"
              max="360"
              value={commonRotation || 0}
              onChange={(e) => handlePropertyChange('rotation', Number(e.target.value))}
              className="flex-1"
            />
            <input
              type="number"
              min="0"
              max="360"
              value={commonRotation || ''}
              onChange={(e) => handlePropertyChange('rotation', Number(e.target.value))}
              className="w-16 px-2 py-1 border border-gray-200 rounded text-sm"
              placeholder="Mixed"
            />
            <span className="text-xs text-gray-500">°</span>
          </div>
        </div>
      </div>
    )
  }

  const renderAppearanceSection = () => {
    const commonOpacity = getCommonValue('opacity')
    const commonVisible = getCommonValue('visible')
    const commonLocked = getCommonValue('locked')

    return (
      <div className="p-4 space-y-4">
        {/* Opacity */}
        <div>
          <label className="block text-xs font-medium text-gray-700 mb-2">Opacity</label>
          <div className="flex items-center gap-2">
            <input
              type="range"
              min="0"
              max="1"
              step="0.1"
              value={commonOpacity || 1}
              onChange={(e) => handlePropertyChange('opacity', Number(e.target.value))}
              className="flex-1"
            />
            <input
              type="number"
              min="0"
              max="100"
              value={commonOpacity ? Math.round((commonOpacity as number) * 100) : ''}
              onChange={(e) => handlePropertyChange('opacity', Number(e.target.value) / 100)}
              className="w-16 px-2 py-1 border border-gray-200 rounded text-sm"
              placeholder="Mixed"
            />
            <span className="text-xs text-gray-500">%</span>
          </div>
        </div>

        {/* Visibility */}
        <div className="flex items-center justify-between">
          <label className="text-xs font-medium text-gray-700">Visible</label>
          <button
            onClick={() => handlePropertyChange('visible', !commonVisible)}
            className={`p-1 rounded ${commonVisible ? 'bg-blue-100 text-blue-600' : 'bg-gray-100 text-gray-400'}`}
          >
            {commonVisible ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
          </button>
        </div>

        {/* Lock */}
        <div className="flex items-center justify-between">
          <label className="text-xs font-medium text-gray-700">Locked</label>
          <button
            onClick={() => handlePropertyChange('locked', !commonLocked)}
            className={`p-1 rounded ${commonLocked ? 'bg-orange-100 text-orange-600' : 'bg-gray-100 text-gray-400'}`}
          >
            {commonLocked ? <Lock className="w-4 h-4" /> : <Unlock className="w-4 h-4" />}
          </button>
        </div>
      </div>
    )
  }

  const renderTextSection = () => {
    const hasTextElements = selectedElements.some(el => el.type === 'text')
    if (!hasTextElements) return null

    const textElements = selectedElements.filter(el => el.type === 'text')
    const commonContent = textElements.length === 1 ? textElements[0].content : null
    const commonFontSize = getCommonValue('fontSize')
    const commonFontFamily = getCommonValue('fontFamily')
    const commonColor = getCommonValue('color')

    return (
      <div className="p-4 space-y-4">
        {/* Text Content */}
        {textElements.length === 1 && (
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-2">Text</label>
            <textarea
              value={commonContent || ''}
              onChange={(e) => handlePropertyChange('content', e.target.value)}
              className="w-full px-2 py-1 border border-gray-200 rounded text-sm"
              rows={3}
              placeholder="Enter text..."
            />
          </div>
        )}

        {/* Font Size */}
        <div>
          <label className="block text-xs font-medium text-gray-700 mb-2">Font Size</label>
          <input
            type="number"
            value={commonFontSize || ''}
            onChange={(e) => handlePropertyChange('fontSize', Number(e.target.value))}
            className="w-full px-2 py-1 border border-gray-200 rounded text-sm"
            placeholder="Mixed"
          />
        </div>

        {/* Font Family */}
        <div>
          <label className="block text-xs font-medium text-gray-700 mb-2">Font Family</label>
          <select
            value={commonFontFamily || ''}
            onChange={(e) => handlePropertyChange('fontFamily', e.target.value)}
            className="w-full px-2 py-1 border border-gray-200 rounded text-sm"
          >
            <option value="">Mixed</option>
            <option value="Arial">Arial</option>
            <option value="Helvetica">Helvetica</option>
            <option value="Times New Roman">Times New Roman</option>
            <option value="Georgia">Georgia</option>
            <option value="Courier New">Courier New</option>
          </select>
        </div>

        {/* Color */}
        <div>
          <label className="block text-xs font-medium text-gray-700 mb-2">Color</label>
          <div className="flex items-center gap-2">
            <input
              type="color"
              value={commonColor || '#000000'}
              onChange={(e) => handlePropertyChange('color', e.target.value)}
              className="w-8 h-8 border border-gray-200 rounded cursor-pointer"
            />
            <input
              type="text"
              value={commonColor || ''}
              onChange={(e) => handlePropertyChange('color', e.target.value)}
              className="flex-1 px-2 py-1 border border-gray-200 rounded text-sm"
              placeholder="Mixed"
            />
          </div>
        </div>
      </div>
    )
  }

  const renderEffectsSection = () => {
    const commonFill = getCommonValue('fill')
    const commonStroke = getCommonValue('stroke')
    const commonStrokeWidth = getCommonValue('strokeWidth')

    return (
      <div className="p-4 space-y-4">
        {/* Fill */}
        <div>
          <label className="block text-xs font-medium text-gray-700 mb-2">Fill</label>
          <div className="flex items-center gap-2">
            <input
              type="color"
              value={commonFill || '#000000'}
              onChange={(e) => handlePropertyChange('fill', e.target.value)}
              className="w-8 h-8 border border-gray-200 rounded cursor-pointer"
            />
            <input
              type="text"
              value={commonFill || ''}
              onChange={(e) => handlePropertyChange('fill', e.target.value)}
              className="flex-1 px-2 py-1 border border-gray-200 rounded text-sm"
              placeholder="Mixed"
            />
          </div>
        </div>

        {/* Stroke */}
        <div>
          <label className="block text-xs font-medium text-gray-700 mb-2">Stroke</label>
          <div className="flex items-center gap-2">
            <input
              type="color"
              value={commonStroke || '#000000'}
              onChange={(e) => handlePropertyChange('stroke', e.target.value)}
              className="w-8 h-8 border border-gray-200 rounded cursor-pointer"
            />
            <input
              type="text"
              value={commonStroke || ''}
              onChange={(e) => handlePropertyChange('stroke', e.target.value)}
              className="flex-1 px-2 py-1 border border-gray-200 rounded text-sm"
              placeholder="Mixed"
            />
          </div>
        </div>

        {/* Stroke Width */}
        <div>
          <label className="block text-xs font-medium text-gray-700 mb-2">Stroke Width</label>
          <input
            type="number"
            min="0"
            value={commonStrokeWidth || ''}
            onChange={(e) => handlePropertyChange('strokeWidth', Number(e.target.value))}
            className="w-full px-2 py-1 border border-gray-200 rounded text-sm"
            placeholder="Mixed"
          />
        </div>
      </div>
    )
  }

  if (selectedElements.length === 0) {
    return (
      <div className="bg-white border rounded-lg">
        <div className="p-4 text-center text-gray-500 text-sm">
          Select an element to edit properties
        </div>
      </div>
    )
  }

  return (
    <div className="bg-white border rounded-lg">
      {/* Header */}
      <div className="flex items-center justify-between p-3 border-b">
        <h3 className="font-medium text-sm">
          {selectedElements.length === 1 ? 'Properties' : `${selectedElements.length} Elements`}
        </h3>
        <div className="flex items-center gap-1">
          <button
            onClick={() => {
              // Duplicate selected elements
              selectedElements.forEach(el => {
                // This would call a duplicate function
              })
            }}
            className="p-1 hover:bg-gray-200 rounded"
            title="Duplicate"
          >
            <Copy className="w-3 h-3" />
          </button>
          <button
            onClick={() => {
              // Delete selected elements
              selectedElements.forEach(el => {
                // This would call a delete function
              })
            }}
            className="p-1 hover:bg-gray-200 rounded text-red-500"
            title="Delete"
          >
            <Trash2 className="w-3 h-3" />
          </button>
        </div>
      </div>

      {/* Sections */}
      <div className="divide-y">
        {renderSectionHeader('Transform', 'transform', Move)}
        {expandedSections.has('transform') && renderTransformSection()}

        {renderSectionHeader('Appearance', 'appearance', Eye)}
        {expandedSections.has('appearance') && renderAppearanceSection()}

        {selectedElements.some(el => el.type === 'text') && (
          <>
            {renderSectionHeader('Text', 'text', Type)}
            {expandedSections.has('text') && renderTextSection()}
          </>
        )}

        {renderSectionHeader('Effects', 'effects', Sliders)}
        {expandedSections.has('effects') && renderEffectsSection()}
      </div>
    </div>
  )
}
