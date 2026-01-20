'use client';

import { MousePointer, Type, Square, Circle, Minus, Pen, Image, Trash2, Download } from 'lucide-react';
import { useCanvasStore, Tool } from '@/store/canvas-store';

const tools: { id: Tool; icon: any; label: string }[] = [
  { id: 'select', icon: MousePointer, label: 'Select' },
  { id: 'text', icon: Type, label: 'Text' },
  { id: 'rectangle', icon: Square, label: 'Rectangle' },
  { id: 'circle', icon: Circle, label: 'Circle' },
  { id: 'line', icon: Minus, label: 'Line' },
  { id: 'drawing', icon: Pen, label: 'Drawing' },
  { id: 'image', icon: Image, label: 'Image' },
];

export default function Toolbar() {
  const { 
    currentTool, 
    setCurrentTool, 
    addText, 
    addRectangle, 
    addCircle, 
    addLine, 
    deleteSelected, 
    clearCanvas, 
    exportCanvas 
  } = useCanvasStore();

  const handleToolClick = (toolId: Tool) => {
    setCurrentTool(toolId);
    // Don't create shapes here - let user click on canvas to create them
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const imgElement = document.createElement('img');
      imgElement.src = event.target?.result as string;
      
      imgElement.onload = () => {
        const fabric = require('fabric');
        const image = new fabric.Image(imgElement, {
          left: 100,
          top: 100,
          scaleX: 0.5,
          scaleY: 0.5,
        });
        
        const { canvas } = useCanvasStore.getState();
        if (canvas) {
          canvas.add(image);
          canvas.setActiveObject(image);
          canvas.renderAll();
        }
      };
    };
    reader.readAsDataURL(file);
  };

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm">
      <div className="space-y-4">
        {/* Tools */}
        <div>
          <h3 className="text-sm font-medium text-gray-700 mb-2">Tools</h3>
          <div className="grid grid-cols-4 gap-2">
            {tools.map((tool) => {
              const Icon = tool.icon;
              return (
                <button
                  key={tool.id}
                  onClick={() => handleToolClick(tool.id)}
                  className={`p-3 rounded-lg border transition-colors ${
                    currentTool === tool.id
                      ? 'bg-blue-50 border-blue-200 text-blue-600'
                      : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50'
                  }`}
                  title={tool.label}
                >
                  <Icon className="w-5 h-5" />
                </button>
              );
            })}
          </div>
        </div>

        {/* Image Upload */}
        <div>
          <h3 className="text-sm font-medium text-gray-700 mb-2">Add Image</h3>
          <label className="block">
            <input
              type="file"
              accept="image/*"
              onChange={handleImageUpload}
              className="hidden"
            />
            <div className="p-3 border border-gray-200 rounded-lg cursor-pointer hover:bg-gray-50 text-gray-600 text-center">
              <Image className="w-5 h-5 mx-auto mb-1" />
              <span className="text-xs">Upload Image</span>
            </div>
          </label>
        </div>

        {/* Actions */}
        <div>
          <h3 className="text-sm font-medium text-gray-700 mb-2">Actions</h3>
          <div className="space-y-2">
            <button
              onClick={deleteSelected}
              className="w-full p-2 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition-colors flex items-center justify-center gap-2"
            >
              <Trash2 className="w-4 h-4" />
              <span className="text-sm">Delete Selected</span>
            </button>
            
            <button
              onClick={clearCanvas}
              className="w-full p-2 bg-gray-100 text-gray-600 rounded-lg hover:bg-gray-200 transition-colors flex items-center justify-center gap-2"
            >
              <Trash2 className="w-4 h-4" />
              <span className="text-sm">Clear Canvas</span>
            </button>
          </div>
        </div>

        {/* Export */}
        <div>
          <h3 className="text-sm font-medium text-gray-700 mb-2">Export</h3>
          <div className="grid grid-cols-3 gap-2">
            <button
              onClick={() => exportCanvas('png')}
              className="p-2 bg-green-50 text-green-600 rounded-lg hover:bg-green-100 transition-colors text-xs"
            >
              <Download className="w-4 h-4 mx-auto mb-1" />
              PNG
            </button>
            <button
              onClick={() => exportCanvas('jpg')}
              className="p-2 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition-colors text-xs"
            >
              <Download className="w-4 h-4 mx-auto mb-1" />
              JPG
            </button>
            <button
              onClick={() => exportCanvas('svg')}
              className="p-2 bg-purple-50 text-purple-600 rounded-lg hover:bg-purple-100 transition-colors text-xs"
            >
              <Download className="w-4 h-4 mx-auto mb-1" />
              SVG
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
