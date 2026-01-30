'use client'

import React from 'react'
import { Heart } from 'lucide-react'

export default function TopNavigation() {
  return (
    <div className="h-14 bg-white border-b border-gray-200 flex items-center justify-between px-6">
      {/* Left Section - Logo */}
      <div className="flex items-center gap-2">
        <Heart size={20} className="text-red-500" />
        <span className="text-xl font-bold text-gray-800">DesignH</span>
      </div>

      {/* Center Section - Empty */}
      <div className="flex items-center gap-4">
      </div>

      {/* Right Section - Empty */}
      <div className="flex items-center gap-2">
      </div>
    </div>
  )
}
