'use client'

import { useState, useEffect } from 'react'
import { Search, Image as ImageIcon, Download, Heart, Eye } from 'lucide-react'
import { useCanvasStore } from '@/store/canvas-store'

interface StockPhoto {
  id: string
  url: string
  thumbnail: string
  description: string
  photographer: string
  width: number
  height: number
  is_premium?: boolean
}

interface StockPhotosProps {
  onClose: () => void
}

export default function StockPhotos({ onClose }: StockPhotosProps) {
  const [photos, setPhotos] = useState<StockPhoto[]>([])
  const [loading, setLoading] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('all')
  
  const { addElement } = useCanvasStore()

  const categories = [
    { id: 'all', name: 'All Photos' },
    { id: 'nature', name: 'Nature' },
    { id: 'business', name: 'Business' },
    { id: 'technology', name: 'Technology' },
    { id: 'people', name: 'People' },
    { id: 'animals', name: 'Animals' },
    { id: 'food', name: 'Food' },
    { id: 'architecture', name: 'Architecture' }
  ]

  // Mock stock photos data (in production, this would call an API like Unsplash, Pexels, etc.)
  const mockPhotos: StockPhoto[] = [
    {
      id: '1',
      url: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800',
      thumbnail: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=400',
      description: 'Mountain landscape at sunset',
      photographer: 'John Doe',
      width: 800,
      height: 600
    },
    {
      id: '2',
      url: 'https://images.unsplash.com/photo-1441974231531-c6227db76b6e?w=800',
      thumbnail: 'https://images.unsplash.com/photo-1441974231531-c6227db76b6e?w=400',
      description: 'Forest pathway',
      photographer: 'Jane Smith',
      width: 800,
      height: 600
    },
    {
      id: '3',
      url: 'https://images.unsplash.com/photo-1469474968028-56623f02e42e?w=800',
      thumbnail: 'https://images.unsplash.com/photo-1469474968028-56623f02e42e?w=400',
      description: 'Mountain valley',
      photographer: 'Mike Johnson',
      width: 800,
      height: 600
    },
    {
      id: '4',
      url: 'https://images.unsplash.com/photo-1426604966848-d7adac402bff?w=800',
      thumbnail: 'https://images.unsplash.com/photo-1426604966848-d7adac402bff?w=400',
      description: 'Mountain lake',
      photographer: 'Sarah Wilson',
      width: 800,
      height: 600
    }
  ]

  useEffect(() => {
    fetchPhotos()
  }, [selectedCategory])

  const fetchPhotos = async () => {
    setLoading(true)
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000))
      setPhotos(mockPhotos)
    } catch (error) {
      console.error('Failed to fetch photos:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleAddPhoto = (photo: StockPhoto) => {
    addElement({
      type: 'image',
      x: 100,
      y: 100,
      width: 400,
      height: 300,
      src: photo.url,
    })
    onClose()
  }

  const filteredPhotos = photos.filter(photo =>
    photo.description.toLowerCase().includes(searchQuery.toLowerCase())
  )

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg w-full max-w-6xl max-h-[90vh] mx-4 flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b">
          <div>
            <h2 className="text-2xl font-semibold">Stock Photos</h2>
            <p className="text-sm text-gray-600 mt-1">
              Choose from thousands of professional stock photos
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg"
          >
            ×
          </button>
        </div>

        {/* Search Bar */}
        <div className="p-4 border-b">
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search photos..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        {/* Categories */}
        <div className="p-4 border-b">
          <div className="flex items-center gap-2 flex-wrap">
            {categories.map(category => (
              <button
                key={category.id}
                onClick={() => setSelectedCategory(category.id)}
                className={`px-3 py-1 rounded-full text-sm transition-colors ${
                  selectedCategory === category.id
                    ? 'bg-blue-500 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {category.name}
              </button>
            ))}
          </div>
        </div>

        {/* Photos Grid */}
        <div className="flex-1 overflow-y-auto p-6">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
            </div>
          ) : filteredPhotos.length === 0 ? (
            <div className="text-center py-12">
              <ImageIcon className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No photos found</h3>
              <p className="text-gray-500">Try adjusting your search</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-6">
              {filteredPhotos.map((photo) => (
                <PhotoCard
                  key={photo.id}
                  photo={photo}
                  onAdd={() => handleAddPhoto(photo)}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

interface PhotoCardProps {
  photo: StockPhoto
  onAdd: () => void
}

function PhotoCard({ photo, onAdd }: PhotoCardProps) {
  return (
    <div className="group relative bg-white border rounded-lg overflow-hidden hover:shadow-lg transition-shadow">
      <div className="aspect-square relative">
        <img
          src={photo.thumbnail}
          alt={photo.description}
          className="w-full h-full object-cover"
        />
        
        {/* Hover Overlay */}
        <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-40 transition-opacity flex items-center justify-center">
          <button
            onClick={onAdd}
            className="opacity-0 group-hover:opacity-100 transition-opacity bg-white text-gray-900 px-4 py-2 rounded-lg font-medium flex items-center gap-2"
          >
            <Download className="w-4 h-4" />
            Add to Design
          </button>
        </div>

        {/* Premium Badge */}
        {photo.is_premium && (
          <div className="absolute top-2 right-2 bg-purple-500 text-white text-xs px-2 py-1 rounded-full">
            Premium
          </div>
        )}
      </div>

      <div className="p-3">
        <h3 className="font-medium text-sm text-gray-900 mb-1 line-clamp-1">
          {photo.description}
        </h3>
        <p className="text-xs text-gray-500">
          {photo.photographer} • {photo.width}×{photo.height}
        </p>
      </div>
    </div>
  )
}
