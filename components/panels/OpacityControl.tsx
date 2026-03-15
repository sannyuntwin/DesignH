'use client'

import React from 'react'

interface OpacityControlProps {
  opacity: number
  onChange: (opacity: number) => void
}

export default function OpacityControl({ opacity, onChange }: OpacityControlProps) {
  const handleIncrease = () => {
    const newOpacity = Math.min(opacity + 0.1, 1)
    onChange(newOpacity)
  }

  const handleDecrease = () => {
    const newOpacity = Math.max(opacity - 0.1, 0)
    onChange(newOpacity)
  }

  const handleSliderChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onChange(parseFloat(e.target.value))
  }

  return (
    <div className="space-y-3">
      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
        Opacity
      </label>
      
      <div className="flex items-center space-x-2">
        <button
          onClick={handleDecrease}
          className="p-2 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-lg transition-colors"
          title="Decrease opacity"
        >
          <svg className="w-4 h-4 text-gray-600 dark:text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
          </svg>
        </button>

        <div className="flex-1 px-3">
          <input
            type="range"
            min="0"
            max="1"
            step="0.01"
            value={opacity}
            onChange={handleSliderChange}
            className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer dark:bg-gray-700"
          />
        </div>

        <button
          onClick={handleIncrease}
          className="p-2 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-lg transition-colors"
          title="Increase opacity"
        >
          <svg className="w-4 h-4 text-gray-600 dark:text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
        </button>
      </div>

      <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
        <span>0%</span>
        <span className="font-medium text-gray-700 dark:text-gray-300">
          {Math.round(opacity * 100)}%
        </span>
        <span>100%</span>
      </div>

      <div className="grid grid-cols-5 gap-1">
        {[0, 0.25, 0.5, 0.75, 1].map((value) => (
          <button
            key={value}
            onClick={() => onChange(value)}
            className={`py-1 text-xs rounded transition-colors ${
              Math.abs(opacity - value) < 0.01
                ? 'bg-blue-500 text-white'
                : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-600'
            }`}
          >
            {Math.round(value * 100)}%
          </button>
        ))}
      </div>
    </div>
  )
}
