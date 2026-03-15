'use client'

import {
  AlignLeft,
  AlignCenter,
  AlignRight,
  AlignStartVertical,
  AlignCenterVertical,
  AlignEndVertical,
  Plus
} from 'lucide-react'
import { useCanvasStore } from '@/store/canvas-store'

const FONT_FAMILIES = [
  'Arial',
  'Helvetica',
  'Times New Roman',
  'Georgia',
  'Courier New',
  'Verdana',
  'Comic Sans MS',
  'Impact',
  'Trebuchet MS',
  'Tahoma',
]

const FONT_SIZES = [8, 10, 12, 14, 16, 18, 20, 24, 28, 32, 36, 48, 64, 72]

const FONT_WEIGHTS = [
  { label: 'Thin', value: '100' },
  { label: 'Light', value: '300' },
  { label: 'Normal', value: '400' },
  { label: 'Medium', value: '500' },
  { label: 'Semibold', value: '600' },
  { label: 'Bold', value: '700' },
  { label: 'Black', value: '900' },
]

const FONT_STYLES = [
  { label: 'Normal', value: 'normal' },
  { label: 'Italic', value: 'italic' },
]

const TEXT_ALIGNMENTS = [
  { label: 'Left', value: 'left', Icon: AlignLeft },
  { label: 'Center', value: 'center', Icon: AlignCenter },
  { label: 'Right', value: 'right', Icon: AlignRight },
]

const VERTICAL_ALIGNMENTS = [
  { label: 'Top', value: 'top', Icon: AlignStartVertical },
  { label: 'Middle', value: 'middle', Icon: AlignCenterVertical },
  { label: 'Bottom', value: 'bottom', Icon: AlignEndVertical },
]

export default function FontStylePanel() {
  const { pages, currentPageId, selectedElement, updateElement, customFonts, addCustomFont } = useCanvasStore()

  const currentPage = pages.find(page => page.id === currentPageId)
  const currentElement = currentPage?.elements.find(el => el.id === selectedElement)

  if (!currentElement || currentElement.type !== 'text') {
    return (
      <div className="p-4">
        <p className="text-gray-500 text-sm">Select a text element to edit font styles</p>
      </div>
    )
  }

  const handleFontFamilyChange = (fontFamily: string) => {
    if (selectedElement) {
      updateElement(selectedElement, { fontFamily })
    }
  }

  const handleFontSizeChange = (fontSize: number) => {
    if (selectedElement) {
      updateElement(selectedElement, { fontSize })
    }
  }

  const handleFontWeightChange = (fontWeight: string) => {
    if (selectedElement) {
      updateElement(selectedElement, { fontWeight })
    }
  }

  const handleFontStyleChange = (fontStyle: string) => {
    if (selectedElement) {
      updateElement(selectedElement, { fontStyle })
    }
  }

  const handleTextAlignChange = (textAlign: 'left' | 'center' | 'right') => {
    if (selectedElement) {
      updateElement(selectedElement, { textAlign })
    }
  }

  const handleVerticalAlignChange = (verticalAlign: 'top' | 'middle' | 'bottom') => {
    if (selectedElement) {
      updateElement(selectedElement, { verticalAlign })
    }
  }

  const handleColorChange = (color: string) => {
    if (selectedElement) {
      updateElement(selectedElement, { color })
    }
  }

  const handleFontUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    try {
      // Use filename as font name (without extension)
      const fontName = file.name.split('.')[0].replace(/[^a-zA-Z0-9]/g, ' ')
      const arrayBuffer = await file.arrayBuffer()

      const fontFace = new FontFace(fontName, arrayBuffer)
      await fontFace.load()
      document.fonts.add(fontFace)

      addCustomFont(fontName)
      handleFontFamilyChange(fontName)

      alert(`Font "${fontName}" added successfully!`)
    } catch (err) {
      console.error('Failed to load font:', err)
      alert('Failed to load font file. Please ensure it is a valid TTF or OTF file.')
    }
  }

  const allFontFamilies = [...FONT_FAMILIES, ...customFonts]

  return (
    <div className="p-4 space-y-4 max-h-[calc(100vh-200px)] overflow-y-auto">
      <h3 className="font-semibold text-lg mb-4">Font Style</h3>

      {/* Font Family */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Font Family
        </label>
        <div className="flex gap-2">
          <select
            value={currentElement.fontFamily || 'Arial'}
            onChange={(e) => handleFontFamilyChange(e.target.value)}
            className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 bg-white"
          >
            {allFontFamilies.map(font => (
              <option key={font} value={font}>
                {font}
              </option>
            ))}
          </select>
          <div className="relative">
            <input
              type="file"
              accept=".ttf,.otf"
              onChange={handleFontUpload}
              className="absolute inset-0 opacity-0 cursor-pointer"
              title="Add Custom Font (.ttf, .otf)"
            />
            <button
              className="px-3 py-2 bg-gray-100 hover:bg-gray-200 border border-gray-300 rounded-md text-gray-700 transition-colors"
              title="Upload Local Font"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
            </button>
          </div>
        </div>
      </div>

      {/* Font Size */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Font Size: {currentElement.fontSize || 16}px
        </label>
        <div className="flex items-center space-x-2">
          <input
            type="range"
            min="8"
            max="72"
            value={currentElement.fontSize || 16}
            onChange={(e) => handleFontSizeChange(Number(e.target.value))}
            className="flex-1"
          />
          <input
            type="number"
            min="8"
            max="72"
            value={currentElement.fontSize || 16}
            onChange={(e) => handleFontSizeChange(Number(e.target.value))}
            className="w-16 px-2 py-1 border border-gray-300 rounded-md text-sm"
          />
        </div>
      </div>

      {/* Font Weight */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Font Weight
        </label>
        <div className="grid grid-cols-3 gap-2">
          {FONT_WEIGHTS.map(weight => (
            <button
              key={weight.value}
              onClick={() => handleFontWeightChange(weight.value)}
              className={`px-3 py-2 text-sm rounded-md border transition-colors ${currentElement.fontWeight === weight.value
                ? 'bg-blue-500 text-white border-blue-500'
                : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                }`}
            >
              {weight.label}
            </button>
          ))}
        </div>
      </div>

      {/* Font Style */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Font Style
        </label>
        <div className="flex space-x-2">
          {FONT_STYLES.map(style => (
            <button
              key={style.value}
              onClick={() => handleFontStyleChange(style.value)}
              className={`flex-1 px-3 py-2 text-sm rounded-md border transition-colors ${currentElement.fontStyle === style.value
                ? 'bg-blue-500 text-white border-blue-500'
                : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                }`}
            >
              {style.label}
            </button>
          ))}
        </div>
      </div>

      {/* Alignment Section */}
      <div className="space-y-4">
        {/* Horizontal Alignment */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Horizontal Alignment
          </label>
          <div className="flex space-x-2">
            {TEXT_ALIGNMENTS.map(align => (
              <button
                key={align.value}
                onClick={() => handleTextAlignChange(align.value as any)}
                className={`flex-1 px-3 py-2 text-sm rounded-md border transition-colors flex items-center justify-center ${currentElement.textAlign === align.value
                  ? 'bg-blue-500 text-white border-blue-500'
                  : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                  }`}
                title={align.label}
              >
                <align.Icon className="w-4 h-4" />
                <span className="ml-2 hidden sm:inline">{align.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Vertical Alignment */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Vertical Alignment
          </label>
          <div className="flex space-x-2">
            {VERTICAL_ALIGNMENTS.map(align => (
              <button
                key={align.value}
                onClick={() => handleVerticalAlignChange(align.value as any)}
                className={`flex-1 px-3 py-2 text-sm rounded-md border transition-colors flex items-center justify-center ${currentElement.verticalAlign === align.value
                  ? 'bg-blue-500 text-white border-blue-500'
                  : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                  }`}
                title={align.label}
              >
                <align.Icon className="w-4 h-4" />
                <span className="ml-2 hidden sm:inline">{align.label}</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Text Color */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Text Color
        </label>
        <div className="flex items-center space-x-2">
          <input
            type="color"
            value={currentElement.color || '#000000'}
            onChange={(e) => handleColorChange(e.target.value)}
            className="w-12 h-12 border border-gray-300 rounded-md cursor-pointer"
          />
          <input
            type="text"
            value={currentElement.color || '#000000'}
            onChange={(e) => handleColorChange(e.target.value)}
            placeholder="#000000"
            className="flex-1 px-3 py-2 border border-gray-300 rounded-md text-sm"
          />
        </div>
      </div>

      {/* Text Spacing Section */}
      <div className="space-y-4 border-t border-gray-200 pt-4">
        <h4 className="font-semibold text-md text-gray-800">Text Spacing</h4>
        
        {/* Line Height */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Line Height: {currentElement.lineHeight || 1.2}
          </label>
          <div className="flex items-center space-x-2">
            <input
              type="range"
              min="0.8"
              max="3"
              step="0.1"
              value={currentElement.lineHeight || 1.2}
              onChange={(e) => {
                if (selectedElement) {
                  updateElement(selectedElement, { lineHeight: Number(e.target.value) })
                }
              }}
              className="flex-1"
            />
            <input
              type="number"
              min="0.8"
              max="3"
              step="0.1"
              value={currentElement.lineHeight || 1.2}
              onChange={(e) => {
                if (selectedElement) {
                  updateElement(selectedElement, { lineHeight: Number(e.target.value) })
                }
              }}
              className="w-16 px-2 py-1 border border-gray-300 rounded-md text-sm"
            />
          </div>
        </div>

        {/* Letter Spacing */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Letter Spacing: {currentElement.letterSpacing || 0}px
          </label>
          <div className="flex items-center space-x-2">
            <input
              type="range"
              min="-2"
              max="10"
              step="0.5"
              value={currentElement.letterSpacing || 0}
              onChange={(e) => {
                if (selectedElement) {
                  updateElement(selectedElement, { letterSpacing: Number(e.target.value) })
                }
              }}
              className="flex-1"
            />
            <input
              type="number"
              min="-2"
              max="10"
              step="0.5"
              value={currentElement.letterSpacing || 0}
              onChange={(e) => {
                if (selectedElement) {
                  updateElement(selectedElement, { letterSpacing: Number(e.target.value) })
                }
              }}
              className="w-16 px-2 py-1 border border-gray-300 rounded-md text-sm"
            />
          </div>
        </div>

        {/* Word Spacing */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Word Spacing: {currentElement.wordSpacing || 0}px
          </label>
          <div className="flex items-center space-x-2">
            <input
              type="range"
              min="-5"
              max="20"
              step="1"
              value={currentElement.wordSpacing || 0}
              onChange={(e) => {
                if (selectedElement) {
                  updateElement(selectedElement, { wordSpacing: Number(e.target.value) })
                }
              }}
              className="flex-1"
            />
            <input
              type="number"
              min="-5"
              max="20"
              step="1"
              value={currentElement.wordSpacing || 0}
              onChange={(e) => {
                if (selectedElement) {
                  updateElement(selectedElement, { wordSpacing: Number(e.target.value) })
                }
              }}
              className="w-16 px-2 py-1 border border-gray-300 rounded-md text-sm"
            />
          </div>
        </div>

        {/* Text Indent */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Text Indent: {currentElement.textIndent || 0}px
          </label>
          <div className="flex items-center space-x-2">
            <input
              type="range"
              min="0"
              max="100"
              step="5"
              value={currentElement.textIndent || 0}
              onChange={(e) => {
                if (selectedElement) {
                  updateElement(selectedElement, { textIndent: Number(e.target.value) })
                }
              }}
              className="flex-1"
            />
            <input
              type="number"
              min="0"
              max="100"
              step="5"
              value={currentElement.textIndent || 0}
              onChange={(e) => {
                if (selectedElement) {
                  updateElement(selectedElement, { textIndent: Number(e.target.value) })
                }
              }}
              className="w-16 px-2 py-1 border border-gray-300 rounded-md text-sm"
            />
          </div>
        </div>
      </div>

      {/* Padding Section */}
      <div className="space-y-4 border-t border-gray-200 pt-4">
        <h4 className="font-semibold text-md text-gray-800">Padding</h4>
        
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Top</label>
            <input
              type="number"
              min="0"
              max="50"
              value={currentElement.paddingTop || 8}
              onChange={(e) => {
                if (selectedElement) {
                  updateElement(selectedElement, { paddingTop: Number(e.target.value) })
                }
              }}
              className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Bottom</label>
            <input
              type="number"
              min="0"
              max="50"
              value={currentElement.paddingBottom || 8}
              onChange={(e) => {
                if (selectedElement) {
                  updateElement(selectedElement, { paddingBottom: Number(e.target.value) })
                }
              }}
              className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Left</label>
            <input
              type="number"
              min="0"
              max="50"
              value={currentElement.paddingLeft || 8}
              onChange={(e) => {
                if (selectedElement) {
                  updateElement(selectedElement, { paddingLeft: Number(e.target.value) })
                }
              }}
              className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Right</label>
            <input
              type="number"
              min="0"
              max="50"
              value={currentElement.paddingRight || 8}
              onChange={(e) => {
                if (selectedElement) {
                  updateElement(selectedElement, { paddingRight: Number(e.target.value) })
                }
              }}
              className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
            />
          </div>
        </div>
      </div>

      {/* Margin Section */}
      <div className="space-y-4 border-t border-gray-200 pt-4">
        <h4 className="font-semibold text-md text-gray-800">Margin</h4>
        
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Top</label>
            <input
              type="number"
              min="0"
              max="50"
              value={currentElement.marginTop || 0}
              onChange={(e) => {
                if (selectedElement) {
                  updateElement(selectedElement, { marginTop: Number(e.target.value) })
                }
              }}
              className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Bottom</label>
            <input
              type="number"
              min="0"
              max="50"
              value={currentElement.marginBottom || 0}
              onChange={(e) => {
                if (selectedElement) {
                  updateElement(selectedElement, { marginBottom: Number(e.target.value) })
                }
              }}
              className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Left</label>
            <input
              type="number"
              min="0"
              max="50"
              value={currentElement.marginLeft || 0}
              onChange={(e) => {
                if (selectedElement) {
                  updateElement(selectedElement, { marginLeft: Number(e.target.value) })
                }
              }}
              className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Right</label>
            <input
              type="number"
              min="0"
              max="50"
              value={currentElement.marginRight || 0}
              onChange={(e) => {
                if (selectedElement) {
                  updateElement(selectedElement, { marginRight: Number(e.target.value) })
                }
              }}
              className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
            />
          </div>
        </div>
      </div>

      {/* Text Formatting Section */}
      <div className="space-y-4 border-t border-gray-200 pt-4">
        <h4 className="font-semibold text-md text-gray-800">Text Formatting</h4>
        
        {/* List Type */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            List Type
          </label>
          <div className="grid grid-cols-3 gap-2">
            <button
              onClick={() => {
                if (selectedElement) {
                  const content = currentElement.content || ''
                  const lines = content.split('\n')
                  const bulletedList = lines.map(line => line ? `• ${line}` : '').join('\n')
                  updateElement(selectedElement, { content: bulletedList })
                }
              }}
              className={`px-3 py-2 text-sm rounded-md border transition-colors ${
                (currentElement.content || '').includes('• ')
                  ? 'bg-blue-500 text-white border-blue-500'
                  : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
              }`}
            >
              • Bullets
            </button>
            <button
              onClick={() => {
                if (selectedElement) {
                  const content = currentElement.content || ''
                  const lines = content.split('\n')
                  const numberedList = lines.map((line, index) => line ? `${index + 1}. ${line}` : '').join('\n')
                  updateElement(selectedElement, { content: numberedList })
                }
              }}
              className={`px-3 py-2 text-sm rounded-md border transition-colors ${
                /^\d+\./.test(currentElement.content || '')
                  ? 'bg-blue-500 text-white border-blue-500'
                  : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
              }`}
            >
              1. Number
            </button>
            <button
              onClick={() => {
                if (selectedElement) {
                  const content = currentElement.content || ''
                  const cleanContent = content.replace(/^•\s|^\d+\.\s/gm, '')
                  updateElement(selectedElement, { content: cleanContent })
                }
              }}
              className={`px-3 py-2 text-sm rounded-md border transition-colors ${
                !(currentElement.content || '').includes('• ') && !/^\d+\./.test(currentElement.content || '')
                  ? 'bg-blue-500 text-white border-blue-500'
                  : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
              }`}
            >
              None
            </button>
          </div>
        </div>

        {/* Text Transform */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Text Transform
          </label>
          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={() => {
                if (selectedElement) {
                  const content = currentElement.content || ''
                  const upperContent = content.toUpperCase()
                  updateElement(selectedElement, { content: upperContent })
                }
              }}
              className={`px-3 py-2 text-sm rounded-md border transition-colors ${
                (currentElement.content || '') === (currentElement.content || '').toUpperCase()
                  ? 'bg-blue-500 text-white border-blue-500'
                  : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
              }`}
            >
              UPPERCASE
            </button>
            <button
              onClick={() => {
                if (selectedElement) {
                  const content = currentElement.content || ''
                  const titleContent = content.replace(/\w\S*/g, (txt) => 
                    txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase()
                  )
                  updateElement(selectedElement, { content: titleContent })
                }
              }}
              className={`px-3 py-2 text-sm rounded-md border transition-colors bg-white text-gray-700 border-gray-300 hover:bg-gray-50`}
            >
              Title Case
            </button>
            <button
              onClick={() => {
                if (selectedElement) {
                  const content = currentElement.content || ''
                  const lowerContent = content.toLowerCase()
                  updateElement(selectedElement, { content: lowerContent })
                }
              }}
              className={`px-3 py-2 text-sm rounded-md border transition-colors ${
                (currentElement.content || '') === (currentElement.content || '').toLowerCase()
                  ? 'bg-blue-500 text-white border-blue-500'
                  : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
              }`}
            >
              lowercase
            </button>
            <button
              onClick={() => {
                if (selectedElement) {
                  const content = currentElement.content || ''
                  const resetContent = content.charAt(0).toUpperCase() + content.slice(1).toLowerCase()
                  updateElement(selectedElement, { content: resetContent })
                }
              }}
              className="px-3 py-2 text-sm rounded-md border transition-colors bg-white text-gray-700 border-gray-300 hover:bg-gray-50"
            >
              Reset
            </button>
          </div>
        </div>

        {/* Special Characters */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Special Characters
          </label>
          <div className="grid grid-cols-4 gap-2">
            {[
              { char: '©', name: 'Copyright' },
              { char: '®', name: 'Registered' },
              { char: '™', name: 'Trademark' },
              { char: '°', name: 'Degree' },
              { char: '±', name: 'Plus/Minus' },
              { char: '×', name: 'Multiply' },
              { char: '÷', name: 'Divide' },
              { char: '∞', name: 'Infinity' },
              { char: '∑', name: 'Sum' },
              { char: '∆', name: 'Delta' },
              { char: 'π', name: 'Pi' },
              { char: 'Ω', name: 'Omega' },
            ].map(({ char, name }) => (
              <button
                key={char}
                onClick={() => {
                  if (selectedElement) {
                    const content = currentElement.content || ''
                    const newContent = content + char
                    updateElement(selectedElement, { content: newContent })
                  }
                }}
                className="px-2 py-1 text-sm rounded-md border border-gray-300 hover:bg-gray-50 transition-colors"
                title={name}
              >
                {char}
              </button>
            ))}
          </div>
        </div>

        {/* Quick Text Templates */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Quick Templates
          </label>
          <div className="space-y-2">
            <button
              onClick={() => {
                if (selectedElement) {
                  updateElement(selectedElement, { 
                    content: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.'
                  })
                }
              }}
              className="w-full px-3 py-2 text-sm rounded-md border border-gray-300 hover:bg-gray-50 transition-colors text-left"
            >
              Lorem Ipsum
            </button>
            <button
              onClick={() => {
                if (selectedElement) {
                  updateElement(selectedElement, { 
                    content: '• First point\n• Second point\n• Third point\n• Fourth point'
                  })
                }
              }}
              className="w-full px-3 py-2 text-sm rounded-md border border-gray-300 hover:bg-gray-50 transition-colors text-left"
            >
              Bullet List
            </button>
            <button
              onClick={() => {
                if (selectedElement) {
                  updateElement(selectedElement, { 
                    content: '1. Step one\n2. Step two\n3. Step three\n4. Step four'
                  })
                }
              }}
              className="w-full px-3 py-2 text-sm rounded-md border border-gray-300 hover:bg-gray-50 transition-colors text-left"
            >
              Numbered List
            </button>
            <button
              onClick={() => {
                if (selectedElement) {
                  updateElement(selectedElement, { 
                    content: 'Contact Us:\n\n📧 Email: info@example.com\n📱 Phone: (555) 123-4567\n📍 Address: 123 Main St, City, State 12345'
                  })
                }
              }}
              className="w-full px-3 py-2 text-sm rounded-md border border-gray-300 hover:bg-gray-50 transition-colors text-left"
            >
              Contact Info
            </button>
          </div>
        </div>
      </div>

      {/* Preview */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Preview
        </label>
        <div className="p-4 border border-gray-200 rounded-md bg-gray-50">
          <div
            style={{
              fontSize: currentElement.fontSize || 16,
              fontFamily: currentElement.fontFamily || 'Arial',
              fontWeight: currentElement.fontWeight || 'normal',
              fontStyle: currentElement.fontStyle || 'normal',
              textAlign: currentElement.textAlign || 'left',
              color: currentElement.color || '#000000',
              lineHeight: currentElement.lineHeight || 1.2,
              letterSpacing: `${currentElement.letterSpacing || 0}px`,
              wordSpacing: `${currentElement.wordSpacing || 0}px`,
              textIndent: `${currentElement.textIndent || 0}px`,
            }}
          >
            {currentElement.content || 'Sample Text'}
          </div>
        </div>
      </div>
    </div>
  )
}
