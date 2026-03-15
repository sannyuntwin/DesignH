'use client'

import { useState } from 'react'
import { 
  Palette, Sparkles, Layers, Eye, Trash2, Plus, Grid, Type
} from 'lucide-react'

interface AdvancedStyle {
  id: string
  name: string
  type: 'gradient' | 'shadow' | 'filter'
  data: any
}

interface StylePreset {
  id: string
  name: string
  thumbnail?: string
  styles: Record<string, any>
}

interface AdvancedStylingProps {
  selectedElement: any
  onUpdate: (updates: Record<string, any>) => void
}

export default function AdvancedStyling({ selectedElement, onUpdate }: AdvancedStylingProps) {
  const [activeTab, setActiveTab] = useState<'colors' | 'gradients' | 'shadows' | 'filters'>('colors')
  const [activeStyles, setActiveStyles] = useState<AdvancedStyle[]>([])
  const [showPresets, setShowPresets] = useState(false)

  const stylePresets: StylePreset[] = [
    {
      id: 'modern',
      name: 'Modern',
      styles: {
        borderRadius: '8px',
        boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
        fontFamily: 'Inter, sans-serif'
      }
    },
    {
      id: 'classic',
      name: 'Classic',
      styles: {
        borderRadius: '4px',
        boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
        fontFamily: 'Georgia, serif'
      }
    },
    {
      id: 'minimal',
      name: 'Minimal',
      styles: {
        borderRadius: '2px',
        boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
        fontFamily: 'system-ui, sans-serif'
      }
    }
  ]

  const handleAddStyle = (type: AdvancedStyle['type']) => {
    const newStyle: AdvancedStyle = {
      id: Date.now().toString(),
      name: `${type.charAt(0).toUpperCase() + type.slice(1)} Style`,
      type,
      data: getDefaultStyleData(type)
    }

    setActiveStyles(prev => [...prev, newStyle])
    onUpdate({ [type]: newStyle.data })
  }

  const getDefaultStyleData = (type: AdvancedStyle['type']) => {
    switch (type) {
      case 'gradient':
        return {
          type: 'linear',
          angle: 45,
          colors: ['#3B82F6', '#10B981', '#EF4444']
        }
      case 'shadow':
        return {
          x: 0,
          y: 0,
          blur: 4,
          spread: 2,
          color: 'rgba(0,0,0,0.2)'
        }
      case 'filter':
        return {
          type: 'blur',
          value: 0
        }
      default:
        return {}
    }
  }

  const renderStyleEditor = (style: AdvancedStyle) => {
    switch (style.type) {
      case 'gradient':
        return (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">Type</label>
              <select
                value={style.data.type || 'linear'}
                onChange={(e) => {
                  const updatedStyles = activeStyles.map(s => 
                    s.id === style.id ? { ...s, data: { ...s.data, type: e.target.value } } : s
                  )
                  setActiveStyles(updatedStyles)
                  onUpdate({ [style.type]: { ...style.data, type: e.target.value } })
                }}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg"
              >
                <option value="linear">Linear</option>
                <option value="radial">Radial</option>
                <option value="conic">Conic</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Angle</label>
              <input
                type="range"
                min="0"
                max="360"
                value={style.data.angle || 45}
                onChange={(e) => {
                  const updatedStyles = activeStyles.map(s => 
                    s.id === style.id ? { ...s, data: { ...s.data, angle: Number(e.target.value) } } : s
                  )
                  setActiveStyles(updatedStyles)
                  onUpdate({ [style.type]: { ...style.data, angle: Number(e.target.value) } })
                }}
                className="w-full"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Color</label>
              <input
                type="color"
                value={style.data.color || '#000000'}
                onChange={(e) => {
                  const updatedStyles = activeStyles.map(s => 
                    s.id === style.id ? { ...s, data: { ...s.data, color: e.target.value } } : s
                  )
                  setActiveStyles(updatedStyles)
                  onUpdate({ [style.type]: { ...style.data, color: e.target.value } })
                }}
                className="w-12 h-12 border border-gray-200 rounded cursor-pointer"
              />
            </div>
          </div>
        )

      case 'shadow':
        return (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">X Offset</label>
              <input
                type="range"
                min="-20"
                max="20"
                value={style.data.x || 0}
                onChange={(e) => {
                  const updatedStyles = activeStyles.map(s => 
                    s.id === style.id ? { ...s, data: { ...s.data, x: Number(e.target.value) } } : s
                  )
                  setActiveStyles(updatedStyles)
                  onUpdate({ [style.type]: { ...style.data, x: Number(e.target.value) } })
                }}
                className="w-full"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Y Offset</label>
              <input
                type="range"
                min="-20"
                max="20"
                value={style.data.y || 0}
                onChange={(e) => {
                  const updatedStyles = activeStyles.map(s => 
                    s.id === style.id ? { ...s, data: { ...s.data, y: Number(e.target.value) } } : s
                  )
                  setActiveStyles(updatedStyles)
                  onUpdate({ [style.type]: { ...style.data, y: Number(e.target.value) } })
                }}
                className="w-full"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Blur</label>
              <input
                type="range"
                min="0"
                max="20"
                value={style.data.blur || 0}
                onChange={(e) => {
                  const updatedStyles = activeStyles.map(s => 
                    s.id === style.id ? { ...s, data: { ...s.data, blur: Number(e.target.value) } } : s
                  )
                  setActiveStyles(updatedStyles)
                  onUpdate({ [style.type]: { ...style.data, blur: Number(e.target.value) } })
                }}
                className="w-full"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Spread</label>
              <input
                type="range"
                min="0"
                max="20"
                value={style.data.spread || 2}
                onChange={(e) => {
                  const updatedStyles = activeStyles.map(s => 
                    s.id === style.id ? { ...s, data: { ...s.data, spread: Number(e.target.value) } } : s
                  )
                  setActiveStyles(updatedStyles)
                  onUpdate({ [style.type]: { ...style.data, spread: Number(e.target.value) } })
                }}
                className="w-full"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Color</label>
              <input
                type="color"
                value={style.data.color || '#000000'}
                onChange={(e) => {
                  const updatedStyles = activeStyles.map(s => 
                    s.id === style.id ? { ...s, data: { ...s.data, color: e.target.value } } : s
                  )
                  setActiveStyles(updatedStyles)
                  onUpdate({ [style.type]: { ...style.data, color: e.target.value } })
                }}
                className="w-12 h-12 border border-gray-200 rounded cursor-pointer"
              />
            </div>
          </div>
        )

      default:
        return null
    }
  }

  return (
    <div className="bg-white rounded-lg p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-xl font-semibold">Advanced Styling</h3>
        <button
          onClick={() => setShowPresets(true)}
          className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
        >
          <Grid className="w-4 h-4" />
          <span>Presets</span>
        </button>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 mb-6">
        <button
          onClick={() => setActiveTab('colors')}
          className={`px-4 py-2 border-b-2 ${
            activeTab === 'colors' ? 'text-blue-600 border-blue-600' : 'text-gray-500'
          }`}
        >
          <Palette className="w-4 h-4" />
          <span>Colors</span>
        </button>
        <button
          onClick={() => setActiveTab('gradients')}
          className={`px-4 py-2 border-b-2 ${
            activeTab === 'gradients' ? 'text-blue-600 border-blue-600' : 'text-gray-500'
          }`}
        >
          <Sparkles className="w-4 h-4" />
          <span>Gradients</span>
        </button>
        <button
          onClick={() => setActiveTab('shadows')}
          className={`px-4 py-2 border-b-2 ${
            activeTab === 'shadows' ? 'text-blue-600 border-blue-600' : 'text-gray-500'
          }`}
        >
          <Layers className="w-4 h-4" />
          <span>Shadows</span>
        </button>
        <button
          onClick={() => setActiveTab('filters')}
          className={`px-4 py-2 border-b-2 ${
            activeTab === 'filters' ? 'text-blue-600 border-blue-600' : 'text-gray-500'
          }`}
        >
          <Eye className="w-4 h-4" />
          <span>Filters</span>
        </button>
      </div>

      {/* Content */}
      <div className="space-y-6">
        {activeTab === 'colors' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between mb-4">
              <h4 className="text-lg font-semibold">Colors</h4>
              <button
                onClick={() => setActiveStyles([])}
                className="text-sm text-gray-500 hover:text-gray-700"
              >
                Clear All
              </button>
            </div>

            <div className="grid grid-cols-1 gap-4">
              {stylePresets.map((preset) => (
                <button
                  key={preset.id}
                  onClick={() => {
                    Object.entries(preset.styles).forEach(([key, value]) => {
                      onUpdate({ [key]: value })
                    })
                  }}
                  className="bg-white rounded-lg p-4 hover:shadow-md transition-shadow"
                >
                  <div className="w-full h-16 bg-gray-100 rounded-lg mb-2 flex items-center justify-center">
                    <Type className="w-6 h-6 text-gray-400" />
                    <span className="text-sm font-medium">{preset.name}</span>
                  </div>
                  <p className="text-xs text-gray-500">{preset.name}</p>
                </button>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'gradients' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between mb-4">
              <h4 className="text-lg font-semibold">Gradients</h4>
              <div className="flex gap-2">
                <button
                  onClick={() => handleAddStyle('gradient')}
                  className="px-3 py-1 bg-blue-500 text-white rounded hover:bg-blue-600"
                >
                  <Plus className="w-4 h-4" />
                  Add Gradient
                </button>
                <button
                  onClick={() => setActiveStyles([])}
                  className="text-sm text-gray-500 hover:text-gray-700"
                >
                  Clear All
                </button>
              </div>
            </div>

            <div className="space-y-4">
              {activeStyles.filter(style => style.type === 'gradient').map((style) => (
                <div key={style.id} className="bg-white rounded-lg p-4">
                  <div className="flex items-center justify-between mb-4">
                    <h4 className="text-lg font-medium">{style.name}</h4>
                    <button
                      onClick={() => {
                        setActiveStyles(prev => prev.filter(s => s.id !== style.id))
                        onUpdate({ [style.type]: null })
                      }}
                      className="text-red-500 hover:text-red-600"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>

                  {renderStyleEditor(style)}
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'shadows' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between mb-4">
              <h4 className="text-lg font-semibold">Shadows</h4>
              <div className="flex gap-2">
                <button
                  onClick={() => handleAddStyle('shadow')}
                  className="px-3 py-1 bg-blue-500 text-white rounded hover:bg-blue-600"
                >
                  <Plus className="w-4 h-4" />
                  Add Shadow
                </button>
                <button
                  onClick={() => setActiveStyles([])}
                  className="text-sm text-gray-500 hover:text-gray-700"
                >
                  Clear All
                </button>
              </div>
            </div>

            <div className="space-y-4">
              {activeStyles.filter(style => style.type === 'shadow').map((style) => (
                <div key={style.id} className="bg-white rounded-lg p-4">
                  <div className="flex items-center justify-between mb-4">
                    <h4 className="text-lg font-medium">{style.name}</h4>
                    <button
                      onClick={() => {
                        setActiveStyles(prev => prev.filter(s => s.id !== style.id))
                        onUpdate({ [style.type]: null })
                      }}
                      className="text-red-500 hover:text-red-600"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>

                  {renderStyleEditor(style)}
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'filters' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between mb-4">
              <h4 className="text-lg font-semibold">Filters</h4>
              <div className="flex gap-2">
                <button
                  onClick={() => handleAddStyle('filter')}
                  className="px-3 py-1 bg-blue-500 text-white rounded hover:bg-blue-600"
                >
                  <Plus className="w-4 h-4" />
                  Add Filter
                </button>
                <button
                  onClick={() => setActiveStyles([])}
                  className="text-sm text-gray-500 hover:text-gray-700"
                >
                  Clear All
                </button>
              </div>
            </div>

            <div className="space-y-4">
              {activeStyles.filter(style => style.type === 'filter').map((style) => (
                <div key={style.id} className="bg-white rounded-lg p-4">
                  <div className="flex items-center justify-between mb-4">
                    <h4 className="text-lg font-medium">{style.name}</h4>
                    <button
                      onClick={() => {
                        setActiveStyles(prev => prev.filter(s => s.id !== style.id))
                        onUpdate({ [style.type]: null })
                      }}
                      className="text-red-500 hover:text-red-600"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>

                  <div className="space-y-4">
                    <label className="block text-sm font-medium mb-2">Pattern Type</label>
                    <select
                      value={style.data.type || 'dots'}
                      onChange={(e) => {
                        const updatedStyles = activeStyles.map(s => 
                          s.id === style.id ? { ...s, data: { ...s.data, type: e.target.value } } : s
                        )
                        setActiveStyles(updatedStyles)
                        onUpdate({ [style.id]: { ...style.data, type: e.target.value } })
                      }}
                      className="w-full px-3 py-2 border border-gray-200 rounded-lg"
                    >
                      <option value="dots">Dots</option>
                      <option value="lines">Lines</option>
                      <option value="crosshatch">Crosshatch</option>
                      <option value="diagonal">Diagonal</option>
                      <option value="zigzag">Zigzag</option>
                      <option value="spiral">Spiral</option>
                      <option value="displacement">Displacement</option>
                    </select>
                  </div>

                  {style.data.type === 'dots' && (
                    <div>
                      <label className="block text-sm font-medium mb-2">Size</label>
                      <input
                        type="range"
                        min="1"
                        max="10"
                        value={style.data.size || 2}
                        onChange={(e) => {
                          const updatedStyles = activeStyles.map(s => 
                            s.id === style.id ? { ...s, data: { ...s.data, size: Number(e.target.value) } } : s
                          )
                          setActiveStyles(updatedStyles)
                          onUpdate({ [style.id]: { ...style.data, size: Number(e.target.value) } })
                        }}
                        className="w-full"
                      />
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Presets Modal */}
      {showPresets && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg w-full max-w-md mx-4">
            <div className="flex items-center justify-between p-6 border-b">
              <h3 className="text-xl font-semibold">Style Presets</h3>
              <button
                onClick={() => setShowPresets(false)}
                className="p-2 hover:bg-gray-100 rounded-lg"
              >
                ×
              </button>
            </div>

            <div className="p-6">
              <div className="grid grid-cols-1 gap-4">
                {stylePresets.map((preset) => (
                  <button
                    key={preset.id}
                    onClick={() => {
                      Object.entries(preset.styles).forEach(([key, value]) => {
                        onUpdate({ [key]: value })
                      })
                    }}
                    className="bg-white rounded-lg p-4 hover:shadow-md transition-shadow"
                  >
                    {preset.thumbnail ? (
                      <img
                        src={preset.thumbnail}
                        alt={preset.name}
                        className="w-full h-16 object-cover rounded-lg mb-2"
                      />
                    ) : (
                      <div className="w-full h-16 bg-gray-100 rounded-lg mb-2 flex items-center justify-center">
                        <Type className="w-6 h-6 text-gray-400" />
                        <span className="text-sm font-medium">{preset.name}</span>
                      </div>
                    )}
                    <p className="text-xs text-gray-500">{preset.name}</p>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
