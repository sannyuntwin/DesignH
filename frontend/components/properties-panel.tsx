'use client';

import { useState } from 'react';
import { useCanvasStore } from '@/store/canvas-store';

export default function PropertiesPanel() {
  const {
    selectedObject,
    fillColor,
    strokeColor,
    strokeWidth,
    fontSize,
    fontFamily,
    setFillColor,
    setStrokeColor,
    setStrokeWidth,
    setFontSize,
    setFontFamily,
  } = useCanvasStore();

  const [activeTab, setActiveTab] = useState<'fill' | 'stroke' | 'text'>('fill');

  const isText = selectedObject && selectedObject.type === 'text';

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm">
      <h3 className="text-lg font-medium text-gray-900 mb-4">Properties</h3>
      
      {!selectedObject ? (
        <p className="text-gray-500 text-sm">No object selected</p>
      ) : (
        <div className="space-y-4">
          {/* Object Info */}
          <div className="pb-4 border-b border-gray-200">
            <p className="text-sm font-medium text-gray-700">
              Type: <span className="text-gray-500 capitalize">{selectedObject.type}</span>
            </p>
          </div>

          {/* Tabs */}
          <div className="flex space-x-1 bg-gray-100 rounded-lg p-1">
            <button
              onClick={() => setActiveTab('fill')}
              className={`flex-1 py-2 px-3 rounded-md text-sm font-medium transition-colors ${
                activeTab === 'fill'
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Fill
            </button>
            <button
              onClick={() => setActiveTab('stroke')}
              className={`flex-1 py-2 px-3 rounded-md text-sm font-medium transition-colors ${
                activeTab === 'stroke'
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Stroke
            </button>
            {isText && (
              <button
                onClick={() => setActiveTab('text')}
                className={`flex-1 py-2 px-3 rounded-md text-sm font-medium transition-colors ${
                  activeTab === 'text'
                    ? 'bg-white text-gray-900 shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                Text
              </button>
            )}
          </div>

          {/* Fill Properties */}
          {activeTab === 'fill' && (
            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Fill Color
                </label>
                <div className="flex items-center space-x-2">
                  <input
                    type="color"
                    value={fillColor}
                    onChange={(e) => setFillColor(e.target.value)}
                    className="w-12 h-12 border border-gray-300 rounded cursor-pointer"
                  />
                  <input
                    type="text"
                    value={fillColor}
                    onChange={(e) => setFillColor(e.target.value)}
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-md text-sm"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Stroke Properties */}
          {activeTab === 'stroke' && (
            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Stroke Color
                </label>
                <div className="flex items-center space-x-2">
                  <input
                    type="color"
                    value={strokeColor}
                    onChange={(e) => setStrokeColor(e.target.value)}
                    className="w-12 h-12 border border-gray-300 rounded cursor-pointer"
                  />
                  <input
                    type="text"
                    value={strokeColor}
                    onChange={(e) => setStrokeColor(e.target.value)}
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-md text-sm"
                  />
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Stroke Width
                </label>
                <div className="flex items-center space-x-2">
                  <input
                    type="range"
                    min="0"
                    max="20"
                    value={strokeWidth}
                    onChange={(e) => setStrokeWidth(Number(e.target.value))}
                    className="flex-1"
                  />
                  <input
                    type="number"
                    min="0"
                    max="20"
                    value={strokeWidth}
                    onChange={(e) => setStrokeWidth(Number(e.target.value))}
                    className="w-16 px-2 py-1 border border-gray-300 rounded-md text-sm"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Text Properties */}
          {activeTab === 'text' && isText && (
            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Font Family
                </label>
                <select
                  value={fontFamily}
                  onChange={(e) => setFontFamily(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                >
                  <option value="Arial">Arial</option>
                  <option value="Helvetica">Helvetica</option>
                  <option value="Times New Roman">Times New Roman</option>
                  <option value="Georgia">Georgia</option>
                  <option value="Verdana">Verdana</option>
                  <option value="Courier New">Courier New</option>
                  <option value="Impact">Impact</option>
                  <option value="Comic Sans MS">Comic Sans MS</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Font Size
                </label>
                <div className="flex items-center space-x-2">
                  <input
                    type="range"
                    min="8"
                    max="72"
                    value={fontSize}
                    onChange={(e) => setFontSize(Number(e.target.value))}
                    className="flex-1"
                  />
                  <input
                    type="number"
                    min="8"
                    max="72"
                    value={fontSize}
                    onChange={(e) => setFontSize(Number(e.target.value))}
                    className="w-16 px-2 py-1 border border-gray-300 rounded-md text-sm"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Transform Properties */}
          <div className="space-y-3 pt-4 border-t border-gray-200">
            <h4 className="text-sm font-medium text-gray-700">Transform</h4>
            
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">X Position</label>
                <input
                  type="number"
                  value={Math.round(selectedObject.left || 0)}
                  onChange={(e) => {
                    selectedObject.set('left', Number(e.target.value));
                    useCanvasStore.getState().canvas?.renderAll();
                  }}
                  className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
                />
              </div>
              
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Y Position</label>
                <input
                  type="number"
                  value={Math.round(selectedObject.top || 0)}
                  onChange={(e) => {
                    selectedObject.set('top', Number(e.target.value));
                    useCanvasStore.getState().canvas?.renderAll();
                  }}
                  className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
                />
              </div>
            </div>

            {selectedObject.type !== 'line' && (
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Width</label>
                  <input
                    type="number"
                    value={Math.round(selectedObject.width || 0)}
                    onChange={(e) => {
                      selectedObject.set('width', Number(e.target.value));
                      useCanvasStore.getState().canvas?.renderAll();
                    }}
                    className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
                  />
                </div>
                
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Height</label>
                  <input
                    type="number"
                    value={Math.round(selectedObject.height || 0)}
                    onChange={(e) => {
                      selectedObject.set('height', Number(e.target.value));
                      useCanvasStore.getState().canvas?.renderAll();
                    }}
                    className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
                  />
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
