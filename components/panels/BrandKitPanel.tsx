'use client'

import { useState, useEffect } from 'react'
import { Plus, Trash2, Upload, Palette, Type } from 'lucide-react'

interface BrandColor {
  id: string
  name: string
  value: string
}

interface BrandFont {
  id: string
  name: string
  family: string
  url?: string
}

interface BrandKit {
  colors: BrandColor[]
  fonts: BrandFont[]
}

export default function BrandKitPanel() {
  const [brandKit, setBrandKit] = useState<BrandKit>({ colors: [], fonts: [] })
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [newColorName, setNewColorName] = useState('')
  const [newColorValue, setNewColorValue] = useState('#000000')
  const [newFontName, setNewFontName] = useState('')
  const [newFontFamily, setNewFontFamily] = useState('')
  const [fontFile, setFontFile] = useState<File | null>(null)

  useEffect(() => {
    fetchBrandKit()
  }, [])

  const fetchBrandKit = async () => {
    try {
      const userId = 'demo-user' // Replace with actual user ID from auth
      const response = await fetch(`/api/brand-kits?userId=${userId}`)
      const data = await response.json()
      
      if (data.brandKit) {
        setBrandKit({
          colors: data.brandKit.colors || [],
          fonts: data.brandKit.fonts || []
        })
      }
    } catch (error) {
      console.error('Failed to fetch brand kit:', error)
    } finally {
      setLoading(false)
    }
  }

  const saveBrandKit = async () => {
    setSaving(true)
    try {
      const userId = 'demo-user' // Replace with actual user ID from auth
      const response = await fetch('/api/brand-kits', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          user_id: userId,
          colors: brandKit.colors,
          fonts: brandKit.fonts
        })
      })

      if (response.ok) {
        // Show success message
        console.log('Brand kit saved successfully')
      }
    } catch (error) {
      console.error('Failed to save brand kit:', error)
    } finally {
      setSaving(false)
    }
  }

  const addColor = () => {
    if (!newColorName.trim()) return

    const newColor: BrandColor = {
      id: Date.now().toString(),
      name: newColorName,
      value: newColorValue
    }

    setBrandKit(prev => ({
      ...prev,
      colors: [...prev.colors, newColor]
    }))

    setNewColorName('')
    setNewColorValue('#000000')
  }

  const removeColor = (id: string) => {
    setBrandKit(prev => ({
      ...prev,
      colors: prev.colors.filter(color => color.id !== id)
    }))
  }

  const addFont = async () => {
    if (!newFontName.trim() || !newFontFamily.trim()) return

    let fontUrl = undefined

    // Handle font file upload
    if (fontFile) {
      const formData = new FormData()
      formData.append('font', fontFile)
      
      try {
        const uploadResponse = await fetch('/api/upload/font', {
          method: 'POST',
          body: formData
        })
        
        if (uploadResponse.ok) {
          const uploadData = await uploadResponse.json()
          fontUrl = uploadData.url
        }
      } catch (error) {
        console.error('Failed to upload font:', error)
      }
    }

    const newFont: BrandFont = {
      id: Date.now().toString(),
      name: newFontName,
      family: newFontFamily,
      url: fontUrl
    }

    setBrandKit(prev => ({
      ...prev,
      fonts: [...prev.fonts, newFont]
    }))

    setNewFontName('')
    setNewFontFamily('')
    setFontFile(null)
  }

  const removeFont = (id: string) => {
    setBrandKit(prev => ({
      ...prev,
      fonts: prev.fonts.filter(font => font.id !== id)
    }))
  }

  if (loading) {
    return (
      <div className="p-4">
        <div className="animate-pulse">
          <div className="h-4 bg-gray-200 rounded w-1/4 mb-4"></div>
          <div className="space-y-2">
            <div className="h-8 bg-gray-200 rounded"></div>
            <div className="h-8 bg-gray-200 rounded"></div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="p-4 space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Brand Kit</h3>
        <button
          onClick={saveBrandKit}
          disabled={saving}
          className="px-3 py-1 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50 text-sm"
        >
          {saving ? 'Saving...' : 'Save'}
        </button>
      </div>

      {/* Colors Section */}
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <Palette className="w-4 h-4" />
          <h4 className="font-medium">Brand Colors</h4>
        </div>

        <div className="space-y-2">
          {brandKit.colors.map((color) => (
            <div key={color.id} className="flex items-center gap-2 p-2 border rounded">
              <div
                className="w-8 h-8 rounded border"
                style={{ backgroundColor: color.value }}
              />
              <span className="flex-1 text-sm">{color.name}</span>
              <span className="text-xs text-gray-500">{color.value}</span>
              <button
                onClick={() => removeColor(color.id)}
                className="p-1 text-red-500 hover:bg-red-50 rounded"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>

        <div className="flex items-center gap-2 p-3 border rounded-lg bg-gray-50">
          <input
            type="text"
            placeholder="Color name"
            value={newColorName}
            onChange={(e) => setNewColorName(e.target.value)}
            className="flex-1 px-2 py-1 border rounded text-sm"
          />
          <input
            type="color"
            value={newColorValue}
            onChange={(e) => setNewColorValue(e.target.value)}
            className="w-10 h-8 border rounded cursor-pointer"
          />
          <button
            onClick={addColor}
            className="p-1 bg-green-500 text-white rounded hover:bg-green-600"
          >
            <Plus className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Fonts Section */}
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <Type className="w-4 h-4" />
          <h4 className="font-medium">Brand Fonts</h4>
        </div>

        <div className="space-y-2">
          {brandKit.fonts.map((font) => (
            <div key={font.id} className="flex items-center gap-2 p-2 border rounded">
              <span className="flex-1 text-sm">{font.name}</span>
              <span className="text-xs text-gray-500">{font.family}</span>
              {font.url && <span className="text-xs text-green-600">Uploaded</span>}
              <button
                onClick={() => removeFont(font.id)}
                className="p-1 text-red-500 hover:bg-red-50 rounded"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>

        <div className="space-y-2 p-3 border rounded-lg bg-gray-50">
          <input
            type="text"
            placeholder="Font name"
            value={newFontName}
            onChange={(e) => setNewFontName(e.target.value)}
            className="w-full px-2 py-1 border rounded text-sm mb-2"
          />
          <input
            type="text"
            placeholder="Font family (e.g., Arial, Georgia)"
            value={newFontFamily}
            onChange={(e) => setNewFontFamily(e.target.value)}
            className="w-full px-2 py-1 border rounded text-sm mb-2"
          />
          <div className="flex items-center gap-2">
            <label className="flex items-center gap-1 text-sm cursor-pointer">
              <Upload className="w-4 h-4" />
              <span>Upload Font File</span>
              <input
                type="file"
                accept=".ttf,.otf,.woff,.woff2"
                onChange={(e) => setFontFile(e.target.files?.[0] || null)}
                className="hidden"
              />
            </label>
            {fontFile && <span className="text-xs text-gray-500">{fontFile.name}</span>}
          </div>
          <button
            onClick={addFont}
            className="w-full mt-2 p-2 bg-green-500 text-white rounded hover:bg-green-600 text-sm"
          >
            Add Font
          </button>
        </div>
      </div>
    </div>
  )
}
