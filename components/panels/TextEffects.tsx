'use client'

import { useState } from 'react'
import { Type, Zap, Palette, RotateCw, Move } from 'lucide-react'
import { useCanvasStore } from '@/store/canvas-store'

interface TextEffectsProps {
  onClose: () => void
}

export default function TextEffects({ onClose }: TextEffectsProps) {
  const [effect, setEffect] = useState('shadow')
  const [curveAmount, setCurveAmount] = useState(50)
  const [shadowBlur, setShadowBlur] = useState(4)
  const [shadowColor, setShadowColor] = useState('#000000')
  const [glowIntensity, setGlowIntensity] = useState(20)
  const [glowColor, setGlowColor] = useState('#3B82F6')
  
  const { selectedElement, updateElement } = useCanvasStore()

  const applyEffect = () => {
    if (!selectedElement) return

    switch (effect) {
      case 'shadow':
        updateElement(selectedElement, {
          boxShadow: `2px 2px ${shadowBlur}px ${shadowColor}`,
        })
        break
      case 'glow':
        updateElement(selectedElement, {
          boxShadow: `0 0 ${glowIntensity}px ${glowColor}`,
        })
        break
      case 'outline':
        updateElement(selectedElement, {
          textStroke: '2px',
          textStrokeColor: '#000000',
        })
        break
      case 'gradient':
        updateElement(selectedElement, {
          background: 'linear-gradient(45deg, #667eea 0%, #764ba2 100%)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
        })
        break
    }
  }

  const addCurvedText = () => {
    const { addElement } = useCanvasStore()
    addElement({
      type: 'text',
      x: 200,
      y: 200,
      width: 400,
      height: 100,
      content: 'Curved Text Example',
      fontSize: 24,
      fontFamily: 'Inter',
      color: '#111827',
      // Custom curved text properties
      curvePath: `M 50 50 Q 200 0 350 50`,
      isCurved: true,
    })
  }

  const add3DText = () => {
    const { addElement } = useCanvasStore()
    addElement({
      type: 'text',
      x: 200,
      y: 200,
      width: 300,
      height: 80,
      content: '3D TEXT',
      fontSize: 32,
      fontFamily: 'Arial Black',
      color: '#111827',
      fontWeight: 'bold',
      // 3D effect properties
      textShadow: '3px 3px 0px #ccc, 6px 6px 0px #999',
      is3D: true,
    })
  }

  const addNeonText = () => {
    const { addElement } = useCanvasStore()
    addElement({
      type: 'text',
      x: 200,
      y: 200,
      width: 300,
      height: 80,
      content: 'NEON GLOW',
      fontSize: 28,
      fontFamily: 'Arial',
      color: '#fff',
      backgroundColor: '#000',
      // Neon effect properties
      textShadow: '0 0 10px #fff, 0 0 20px #fff, 0 0 30px #e60073, 0 0 40px #e60073',
      isNeon: true,
    })
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg w-full max-w-4xl max-h-[90vh] mx-4 flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b">
          <div>
            <h2 className="text-2xl font-semibold flex items-center gap-2">
              <Zap className="w-6 h-6" />
              Text Effects
            </h2>
            <p className="text-sm text-gray-600 mt-1">
              Add advanced text effects and styling
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg"
          >
            ×
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Text Effects */}
            <div>
              <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <Palette className="w-5 h-5" />
                Text Effects
              </h3>
              
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <button
                    onClick={() => setEffect('shadow')}
                    className={`p-4 border rounded-lg text-left transition-colors ${
                      effect === 'shadow' ? 'border-blue-500 bg-blue-50' : 'hover:bg-gray-50'
                    }`}
                  >
                    <div className="font-medium">Shadow</div>
                    <div className="text-sm text-gray-500">Add drop shadow</div>
                  </button>
                  
                  <button
                    onClick={() => setEffect('glow')}
                    className={`p-4 border rounded-lg text-left transition-colors ${
                      effect === 'glow' ? 'border-blue-500 bg-blue-50' : 'hover:bg-gray-50'
                    }`}
                  >
                    <div className="font-medium">Glow</div>
                    <div className="text-sm text-gray-500">Add glowing effect</div>
                  </button>
                  
                  <button
                    onClick={() => setEffect('outline')}
                    className={`p-4 border rounded-lg text-left transition-colors ${
                      effect === 'outline' ? 'border-blue-500 bg-blue-50' : 'hover:bg-gray-50'
                    }`}
                  >
                    <div className="font-medium">Outline</div>
                    <div className="text-sm text-gray-500">Add text outline</div>
                  </button>
                  
                  <button
                    onClick={() => setEffect('gradient')}
                    className={`p-4 border rounded-lg text-left transition-colors ${
                      effect === 'gradient' ? 'border-blue-500 bg-blue-50' : 'hover:bg-gray-50'
                    }`}
                  >
                    <div className="font-medium">Gradient</div>
                    <div className="text-sm text-gray-500">Gradient fill</div>
                  </button>
                </div>

                {/* Effect Controls */}
                {effect === 'shadow' && (
                  <div className="space-y-3 p-4 bg-gray-50 rounded-lg">
                    <div>
                      <label className="block text-sm font-medium mb-1">Shadow Blur</label>
                      <input
                        type="range"
                        min="0"
                        max="20"
                        value={shadowBlur}
                        onChange={(e) => setShadowBlur(Number(e.target.value))}
                        className="w-full"
                      />
                      <span className="text-xs text-gray-500">{shadowBlur}px</span>
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1">Shadow Color</label>
                      <input
                        type="color"
                        value={shadowColor}
                        onChange={(e) => setShadowColor(e.target.value)}
                        className="w-full h-8 border rounded"
                      />
                    </div>
                  </div>
                )}

                {effect === 'glow' && (
                  <div className="space-y-3 p-4 bg-gray-50 rounded-lg">
                    <div>
                      <label className="block text-sm font-medium mb-1">Glow Intensity</label>
                      <input
                        type="range"
                        min="0"
                        max="50"
                        value={glowIntensity}
                        onChange={(e) => setGlowIntensity(Number(e.target.value))}
                        className="w-full"
                      />
                      <span className="text-xs text-gray-500">{glowIntensity}px</span>
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1">Glow Color</label>
                      <input
                        type="color"
                        value={glowColor}
                        onChange={(e) => setGlowColor(e.target.value)}
                        className="w-full h-8 border rounded"
                      />
                    </div>
                  </div>
                )}

                <button
                  onClick={applyEffect}
                  disabled={!selectedElement}
                  className="w-full px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:bg-gray-300 disabled:cursor-not-allowed"
                >
                  Apply Effect
                </button>
              </div>
            </div>

            {/* Special Text Types */}
            <div>
              <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <Type className="w-5 h-5" />
                Special Text
              </h3>
              
              <div className="space-y-4">
                <button
                  onClick={addCurvedText}
                  className="w-full p-4 border rounded-lg text-left hover:bg-gray-50 transition-colors"
                >
                  <div className="font-medium flex items-center gap-2">
                    <RotateCw className="w-4 h-4" />
                    Curved Text
                  </div>
                  <div className="text-sm text-gray-500">Text that follows a curved path</div>
                </button>
                
                <button
                  onClick={add3DText}
                  className="w-full p-4 border rounded-lg text-left hover:bg-gray-50 transition-colors"
                >
                  <div className="font-medium">3D Text</div>
                  <div className="text-sm text-gray-500">Text with 3D depth effect</div>
                </button>
                
                <button
                  onClick={addNeonText}
                  className="w-full p-4 border rounded-lg text-left hover:bg-gray-50 transition-colors"
                >
                  <div className="font-medium">Neon Text</div>
                  <div className="text-sm text-gray-500">Glowing neon-style text</div>
                </button>

                {/* Curve Controls */}
                <div className="p-4 bg-gray-50 rounded-lg">
                  <label className="block text-sm font-medium mb-2">Curve Amount</label>
                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={curveAmount}
                    onChange={(e) => setCurveAmount(Number(e.target.value))}
                    className="w-full"
                  />
                  <span className="text-xs text-gray-500">{curveAmount}%</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
