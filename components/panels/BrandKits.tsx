'use client'

import { useState } from 'react'
import { Palette, Type, Download, Plus, Trash2, Edit } from 'lucide-react'
import { useCanvasStore } from '@/store/canvas-store'

interface BrandColor {
  id: string
  name: string
  hex: string
}

interface BrandFont {
  id: string
  name: string
  family: string
  weights: string[]
}

interface BrandLogo {
  id: string
  name: string
  url: string
}

interface BrandKit {
  id: string
  name: string
  colors: BrandColor[]
  fonts: BrandFont[]
  logos: BrandLogo[]
  createdAt: string
}

interface BrandKitsProps {
  onClose: () => void
}

export default function BrandKits({ onClose }: BrandKitsProps) {
  const [brandKits, setBrandKits] = useState<BrandKit[]>([])
  const [selectedKit, setSelectedKit] = useState<BrandKit | null>(null)
  const [isCreating, setIsCreating] = useState(false)
  const [newKitName, setNewKitName] = useState('')
  
  const { addElement, addCustomFont } = useCanvasStore()

  // Mock brand kits data
  const mockKits: BrandKit[] = [
    {
      id: '1',
      name: 'My Company Brand',
      colors: [
        { id: '1', name: 'Primary Blue', hex: '#3B82F6' },
        { id: '2', name: 'Secondary Gray', hex: '#6B7280' },
        { id: '3', name: 'Accent Orange', hex: '#F97316' },
      ],
      fonts: [
        { id: '1', name: 'Brand Sans', family: 'Inter', weights: ['400', '600', '700'] },
        { id: '2', name: 'Brand Serif', family: 'Merriweather', weights: ['400', '700'] },
      ],
      logos: [
        { id: '1', name: 'Main Logo', url: '/api/placeholder/200/100' },
      ],
      createdAt: '2024-01-15'
    }
  ]

  useState(() => {
    setBrandKits(mockKits)
    if (mockKits.length > 0) {
      setSelectedKit(mockKits[0])
    }
  })

  const createBrandKit = () => {
    if (!newKitName.trim()) return

    const newKit: BrandKit = {
      id: Date.now().toString(),
      name: newKitName,
      colors: [],
      fonts: [],
      logos: [],
      createdAt: new Date().toISOString()
    }

    setBrandKits([...brandKits, newKit])
    setSelectedKit(newKit)
    setNewKitName('')
    setIsCreating(false)
  }

  const addColorToKit = (color: string) => {
    if (!selectedKit) return

    const newColor: BrandColor = {
      id: Date.now().toString(),
      name: `Color ${selectedKit.colors.length + 1}`,
      hex: color
    }

    const updatedKits = brandKits.map(kit =>
      kit.id === selectedKit.id
        ? { ...kit, colors: [...kit.colors, newColor] }
        : kit
    )

    setBrandKits(updatedKits)
    setSelectedKit({ ...selectedKit, colors: [...selectedKit.colors, newColor] })
  }

  const addFontToKit = (font: BrandFont) => {
    if (!selectedKit) return

    const updatedKits = brandKits.map(kit =>
      kit.id === selectedKit.id
        ? { ...kit, fonts: [...kit.fonts, font] }
        : kit
    )

    setBrandKits(updatedKits)
    setSelectedKit({ ...selectedKit, fonts: [...selectedKit.fonts, font] })
    addCustomFont(font.family)
  }

  const addLogoToKit = (logoUrl: string) => {
    if (!selectedKit) return

    const newLogo: BrandLogo = {
      id: Date.now().toString(),
      name: `Logo ${selectedKit.logos.length + 1}`,
      url: logoUrl
    }

    const updatedKits = brandKits.map(kit =>
      kit.id === selectedKit.id
        ? { ...kit, logos: [...kit.logos, newLogo] }
        : kit
    )

    setBrandKits(updatedKits)
    setSelectedKit({ ...selectedKit, logos: [...selectedKit.logos, newLogo] })
  }

  const applyColor = (color: BrandColor) => {
    const { selectedElement, updateElement } = useCanvasStore.getState()
    if (selectedElement) {
      updateElement(selectedElement, { color: color.hex })
    }
  }

  const applyFont = (font: BrandFont) => {
    const { selectedElement, updateElement } = useCanvasStore.getState()
    if (selectedElement) {
      updateElement(selectedElement, { fontFamily: font.family })
    }
  }

  const addLogoToCanvas = (logo: BrandLogo) => {
    addElement({
      type: 'image',
      x: 100,
      y: 100,
      width: 200,
      height: 100,
      src: logo.url,
    })
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg w-full max-w-6xl max-h-[90vh] mx-4 flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b">
          <div>
            <h2 className="text-2xl font-semibold">Brand Kits</h2>
            <p className="text-sm text-gray-600 mt-1">
              Manage your brand colors, fonts, and assets
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg"
          >
            ×
          </button>
        </div>

        <div className="flex flex-1 overflow-hidden">
          {/* Sidebar */}
          <div className="w-64 border-r bg-gray-50 p-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold">Brand Kits</h3>
              <button
                onClick={() => setIsCreating(true)}
                className="p-1 hover:bg-gray-200 rounded"
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>

            {isCreating && (
              <div className="mb-4 p-3 bg-white border rounded-lg">
                <input
                  type="text"
                  placeholder="Kit name"
                  value={newKitName}
                  onChange={(e) => setNewKitName(e.target.value)}
                  className="w-full px-2 py-1 border rounded mb-2"
                  onKeyPress={(e) => e.key === 'Enter' && createBrandKit()}
                />
                <div className="flex gap-2">
                  <button
                    onClick={createBrandKit}
                    className="px-2 py-1 bg-blue-500 text-white rounded text-sm"
                  >
                    Create
                  </button>
                  <button
                    onClick={() => setIsCreating(false)}
                    className="px-2 py-1 bg-gray-200 rounded text-sm"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}

            <div className="space-y-2">
              {brandKits.map(kit => (
                <button
                  key={kit.id}
                  onClick={() => setSelectedKit(kit)}
                  className={`w-full text-left p-3 rounded-lg transition-colors ${
                    selectedKit?.id === kit.id
                      ? 'bg-blue-50 border border-blue-200'
                      : 'bg-white hover:bg-gray-50'
                  }`}
                >
                  <div className="font-medium">{kit.name}</div>
                  <div className="text-xs text-gray-500">
                    {kit.colors.length} colors, {kit.fonts.length} fonts
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Main Content */}
          <div className="flex-1 overflow-y-auto p-6">
            {selectedKit ? (
              <div className="space-y-8">
                {/* Colors */}
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold flex items-center gap-2">
                      <Palette className="w-5 h-5" />
                      Brand Colors
                    </h3>
                    <ColorPicker onColorAdd={addColorToKit} />
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                    {selectedKit.colors.map(color => (
                      <ColorCard
                        key={color.id}
                        color={color}
                        onApply={() => applyColor(color)}
                      />
                    ))}
                  </div>
                </div>

                {/* Fonts */}
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold flex items-center gap-2">
                      <Type className="w-5 h-5" />
                      Brand Fonts
                    </h3>
                    <FontPicker onFontAdd={addFontToKit} />
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {selectedKit.fonts.map(font => (
                      <FontCard
                        key={font.id}
                        font={font}
                        onApply={() => applyFont(font)}
                      />
                    ))}
                  </div>
                </div>

                {/* Logos */}
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold">Brand Logos</h3>
                    <LogoPicker onLogoAdd={addLogoToKit} />
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                    {selectedKit.logos.map(logo => (
                      <LogoCard
                        key={logo.id}
                        logo={logo}
                        onAddToCanvas={() => addLogoToCanvas(logo)}
                      />
                    ))}
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-center py-12">
                <Palette className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No brand kit selected</h3>
                <p className="text-gray-500">Select a brand kit or create a new one</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

// Helper Components
function ColorPicker({ onColorAdd }: { onColorAdd: (color: string) => void }) {
  const [color, setColor] = useState('#3B82F6')

  return (
    <div className="flex items-center gap-2">
      <input
        type="color"
        value={color}
        onChange={(e) => setColor(e.target.value)}
        className="w-8 h-8 border rounded cursor-pointer"
      />
      <button
        onClick={() => onColorAdd(color)}
        className="px-3 py-1 bg-blue-500 text-white rounded text-sm"
      >
        Add Color
      </button>
    </div>
  )
}

function ColorCard({ color, onApply }: { color: BrandColor; onApply: () => void }) {
  return (
    <div className="bg-white border rounded-lg p-3 hover:shadow-md transition-shadow">
      <div
        className="w-full h-16 rounded mb-2 border"
        style={{ backgroundColor: color.hex }}
      />
      <div className="text-sm font-medium">{color.name}</div>
      <div className="text-xs text-gray-500">{color.hex}</div>
      <button
        onClick={onApply}
        className="mt-2 w-full px-2 py-1 bg-gray-100 hover:bg-gray-200 rounded text-xs"
      >
        Apply
      </button>
    </div>
  )
}

function FontPicker({ onFontAdd }: { onFontAdd: (font: BrandFont) => void }) {
  const [fontName, setFontName] = useState('')
  const [fontFamily, setFontFamily] = useState('Inter')

  const fonts = ['Inter', 'Roboto', 'Open Sans', 'Montserrat', 'Merriweather', 'Playfair Display']

  return (
    <div className="flex items-center gap-2">
      <select
        value={fontFamily}
        onChange={(e) => setFontFamily(e.target.value)}
        className="px-2 py-1 border rounded text-sm"
      >
        {fonts.map(font => (
          <option key={font} value={font}>{font}</option>
        ))}
      </select>
      <input
        type="text"
        placeholder="Font name"
        value={fontName}
        onChange={(e) => setFontName(e.target.value)}
        className="px-2 py-1 border rounded text-sm"
      />
      <button
        onClick={() => onFontAdd({
          id: Date.now().toString(),
          name: fontName || fontFamily,
          family: fontFamily,
          weights: ['400', '600', '700']
        })}
        className="px-3 py-1 bg-blue-500 text-white rounded text-sm"
      >
        Add Font
      </button>
    </div>
  )
}

function FontCard({ font, onApply }: { font: BrandFont; onApply: () => void }) {
  return (
    <div className="bg-white border rounded-lg p-4 hover:shadow-md transition-shadow">
      <div
        className="text-lg font-medium mb-2"
        style={{ fontFamily: font.family }}
      >
        {font.name}
      </div>
      <div className="text-sm text-gray-500 mb-3">{font.family}</div>
      <div className="text-xs text-gray-400 mb-3">
        Weights: {font.weights.join(', ')}
      </div>
      <button
        onClick={onApply}
        className="w-full px-3 py-1 bg-gray-100 hover:bg-gray-200 rounded text-sm"
      >
        Apply Font
      </button>
    </div>
  )
}

function LogoPicker({ onLogoAdd }: { onLogoAdd: (url: string) => void }) {
  const handleUpload = () => {
    const input = document.createElement('input')
    input.type = 'file'
    input.accept = 'image/*'
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0]
      if (file) {
        const reader = new FileReader()
        reader.onload = (event) => {
          onLogoAdd(event.target?.result as string)
        }
        reader.readAsDataURL(file)
      }
    }
    input.click()
  }

  return (
    <button
      onClick={handleUpload}
      className="px-3 py-1 bg-blue-500 text-white rounded text-sm"
    >
      Upload Logo
    </button>
  )
}

function LogoCard({ logo, onAddToCanvas }: { logo: BrandLogo; onAddToCanvas: () => void }) {
  return (
    <div className="bg-white border rounded-lg overflow-hidden hover:shadow-md transition-shadow">
      <div className="aspect-video bg-gray-100 flex items-center justify-center">
        <img
          src={logo.url}
          alt={logo.name}
          className="max-w-full max-h-full object-contain"
        />
      </div>
      <div className="p-3">
        <div className="text-sm font-medium mb-2">{logo.name}</div>
        <button
          onClick={onAddToCanvas}
          className="w-full px-3 py-1 bg-blue-500 text-white rounded text-sm flex items-center justify-center gap-1"
        >
          <Download className="w-3 h-3" />
          Add to Canvas
        </button>
      </div>
    </div>
  )
}
