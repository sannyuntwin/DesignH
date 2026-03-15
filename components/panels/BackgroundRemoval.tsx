'use client'

import { useState, useRef } from 'react'
import { Upload, Wand2, Download, Image as ImageIcon } from 'lucide-react'
import { useCanvasStore } from '@/store/canvas-store'

interface BackgroundRemovalProps {
  onClose: () => void
}

export default function BackgroundRemoval({ onClose }: BackgroundRemovalProps) {
  const [selectedImage, setSelectedImage] = useState<string | null>(null)
  const [isProcessing, setIsProcessing] = useState(false)
  const [processedImage, setProcessedImage] = useState<string | null>(null)
  const [threshold, setThreshold] = useState(128)
  const fileInputRef = useRef<HTMLInputElement>(null)
  
  const { addElement } = useCanvasStore()

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file && file.type.startsWith('image/')) {
      const reader = new FileReader()
      reader.onload = (event) => {
        setSelectedImage(event.target?.result as string)
        setProcessedImage(null)
      }
      reader.readAsDataURL(file)
    }
  }

  const removeBackground = async () => {
    if (!selectedImage) return

    setIsProcessing(true)

    try {
      // Create canvas for image processing
      const img = new Image()
      img.crossOrigin = 'anonymous'
      
      img.onload = () => {
        const canvas = document.createElement('canvas')
        const ctx = canvas.getContext('2d')
        
        if (!ctx) return

        canvas.width = img.width
        canvas.height = img.height
        
        // Draw original image
        ctx.drawImage(img, 0, 0)
        
        // Get image data
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height)
        const data = imageData.data
        
        // Simple background removal algorithm
        // This is a basic implementation - in production, you'd use a more sophisticated algorithm
        // or integrate with a service like Remove.bg or Cloudinary AI
        for (let i = 0; i < data.length; i += 4) {
          const r = data[i]
          const g = data[i + 1]
          const b = data[i + 2]
          
          // Calculate brightness
          const brightness = (r + g + b) / 3
          
          // If pixel is brighter than threshold, make it transparent
          // This works well for removing white/light backgrounds
          if (brightness > threshold) {
            data[i + 3] = 0 // Set alpha to 0 (transparent)
          }
          
          // Alternative: Remove pixels that are close to white
          const distanceFromWhite = Math.sqrt(
            Math.pow(255 - r, 2) +
            Math.pow(255 - g, 2) +
            Math.pow(255 - b, 2)
          )
          
          if (distanceFromWhite < threshold) {
            data[i + 3] = 0
          }
        }
        
        // Put the processed image data back
        ctx.putImageData(imageData, 0, 0)
        
        // Convert to data URL
        const processedDataUrl = canvas.toDataURL('image/png')
        setProcessedImage(processedDataUrl)
        setIsProcessing(false)
      }
      
      img.src = selectedImage
    } catch (error) {
      console.error('Background removal failed:', error)
      setIsProcessing(false)
    }
  }

  const addProcessedImageToCanvas = () => {
    if (processedImage) {
      addElement({
        type: 'image',
        x: 100,
        y: 100,
        width: 300,
        height: 300,
        src: processedImage,
      })
      onClose()
    }
  }

  const resetImage = () => {
    setSelectedImage(null)
    setProcessedImage(null)
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg w-full max-w-4xl max-h-[90vh] mx-4 flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b">
          <div>
            <h2 className="text-2xl font-semibold flex items-center gap-2">
              <Wand2 className="w-6 h-6" />
              Background Removal
            </h2>
            <p className="text-sm text-gray-600 mt-1">
              Remove backgrounds from your images instantly
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
          {!selectedImage ? (
            <div className="text-center py-12">
              <div className="w-24 h-24 bg-gray-100 rounded-full mx-auto mb-6 flex items-center justify-center">
                <ImageIcon className="w-12 h-12 text-gray-400" />
              </div>
              
              <h3 className="text-xl font-semibold mb-4">Upload an Image</h3>
              <p className="text-gray-500 mb-6">
                Upload an image to remove its background automatically
              </p>
              
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleImageUpload}
                className="hidden"
                id="image-upload"
              />
              
              <label
                htmlFor="image-upload"
                className="inline-flex items-center gap-2 px-6 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 cursor-pointer"
              >
                <Upload className="w-5 h-5" />
                Choose Image
              </label>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Image Preview */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Original Image */}
                <div>
                  <h3 className="font-semibold mb-3">Original Image</h3>
                  <div className="bg-gray-100 rounded-lg p-4">
                    <img
                      src={selectedImage}
                      alt="Original"
                      className="w-full h-auto rounded"
                    />
                  </div>
                </div>

                {/* Processed Image */}
                <div>
                  <h3 className="font-semibold mb-3">Background Removed</h3>
                  <div className="bg-gray-100 rounded-lg p-4 min-h-[200px] flex items-center justify-center">
                    {isProcessing ? (
                      <div className="text-center">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto mb-4"></div>
                        <p className="text-gray-600">Removing background...</p>
                      </div>
                    ) : processedImage ? (
                      <img
                        src={processedImage}
                        alt="Processed"
                        className="w-full h-auto rounded"
                      />
                    ) : (
                      <div className="text-center text-gray-500">
                        <Wand2 className="w-12 h-12 mx-auto mb-2" />
                        <p>Click "Remove Background" to process</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Controls */}
              <div className="bg-gray-50 rounded-lg p-6">
                <h3 className="font-semibold mb-4">Settings</h3>
                
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">
                      Background Sensitivity: {threshold}
                    </label>
                    <input
                      type="range"
                      min="0"
                      max="255"
                      value={threshold}
                      onChange={(e) => setThreshold(Number(e.target.value))}
                      className="w-full"
                    />
                    <div className="flex justify-between text-xs text-gray-500">
                      <span>More Sensitive</span>
                      <span>Less Sensitive</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center justify-between">
                <div className="flex gap-3">
                  <button
                    onClick={resetImage}
                    className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg"
                  >
                    Upload Different Image
                  </button>
                </div>
                
                <div className="flex gap-3">
                  <button
                    onClick={removeBackground}
                    disabled={isProcessing}
                    className="px-6 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:bg-gray-300 disabled:cursor-not-allowed flex items-center gap-2"
                  >
                    <Wand2 className="w-4 h-4" />
                    {isProcessing ? 'Processing...' : 'Remove Background'}
                  </button>
                  
                  {processedImage && (
                    <button
                      onClick={addProcessedImageToCanvas}
                      className="px-6 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 flex items-center gap-2"
                    >
                      <Download className="w-4 h-4" />
                      Add to Canvas
                    </button>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
