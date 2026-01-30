'use client'

import React, { useState } from 'react'
import { 
  Plus, 
  ChevronDown, 
  Grid3X3, 
  Maximize2, 
  Minimize2,
  Layers
} from 'lucide-react'

export default function BottomPreview() {
  const [showGrid, setShowGrid] = useState(false)

  return (
    <div className="h-16 bg-white border-t border-gray-200 flex items-center justify-between px-4">
      {/* Left Section - Preview */}
      <div className="flex items-center gap-3">
        <button className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
          <Plus size={18} />
        </button>
        <button className="p-1 hover:bg-gray-100 rounded transition-colors">
          <ChevronDown size={16} />
        </button>
      </div>

      {/* Right Section - View Controls */}
      <div className="flex items-center gap-2">
        <button 
          onClick={() => setShowGrid(!showGrid)}
          className={`p-2 rounded-lg transition-colors ${
            showGrid ? 'bg-blue-100 text-blue-600' : 'hover:bg-gray-100'
          }`}
        >
          <Grid3X3 size={18} />
        </button>
        <button className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
          <Maximize2 size={18} />
        </button>
      </div>
    </div>
  )
}
