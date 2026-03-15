'use client'

import { useState, useEffect } from 'react'
import { 
  Image, Video, Music, FileText, Archive, Download, Upload, Search, Filter,
  Grid, List, Plus, Trash2, Copy, Share2, Eye, Edit, Star,
  Folder, FolderOpen, ChevronRight, MoreVertical, X, Check
} from 'lucide-react'

interface Asset {
  id: string
  name: string
  type: 'image' | 'video' | 'audio' | 'document' | 'archive'
  url: string
  thumbnail?: string
  size: number
  created_at: string
  tags: string[]
  category: string
  isFavorite: boolean
  metadata?: {
    width?: number
    height?: number
    duration?: number
    format?: string
  }
}

interface AssetLibraryProps {
  onSelectAsset?: (asset: Asset) => void
  multiSelect?: boolean
  maxSelections?: number
}

export default function AssetLibrary({ 
  onSelectAsset, 
  multiSelect = false, 
  maxSelections = 10 
}: AssetLibraryProps) {
  const [assets, setAssets] = useState<Asset[]>([])
  const [selectedAssets, setSelectedAssets] = useState<Asset[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('all')
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')
  const [showUploadModal, setShowUploadModal] = useState(false)
  const [sortBy, setSortBy] = useState<'name' | 'date' | 'size'>('date')
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc')

  const categories = [
    { id: 'all', name: 'All Assets', icon: Grid },
    { id: 'image', name: 'Images', icon: Image },
    { id: 'video', name: 'Videos', icon: Video },
    { id: 'audio', name: 'Audio', icon: Music },
    { id: 'document', name: 'Documents', icon: FileText },
    { id: 'archive', name: 'Archives', icon: Archive }
  ]

  useEffect(() => {
    fetchAssets()
  }, [selectedCategory, searchQuery, sortBy, sortOrder])

  const fetchAssets = async () => {
    setLoading(true)
    try {
      const token = localStorage.getItem('auth_token')
      const params = new URLSearchParams({
        category: selectedCategory === 'all' ? '' : selectedCategory,
        search: searchQuery,
        sort_by: sortBy,
        sort_order: sortOrder
      })
      
      const response = await fetch(`/api/assets?${params}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      })

      if (response.ok) {
        const data = await response.json()
        setAssets(data.assets || [])
      }
    } catch (error) {
      console.error('Failed to fetch assets:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleAssetSelect = (asset: Asset) => {
    if (multiSelect) {
      const isSelected = selectedAssets.some(a => a.id === asset.id)
      
      if (isSelected) {
        setSelectedAssets(prev => prev.filter(a => a.id !== asset.id))
      } else if (selectedAssets.length < maxSelections) {
        setSelectedAssets(prev => [...prev, asset])
      }
    } else {
      onSelectAsset?.(asset)
    }
  }

  const handleAssetDelete = async (assetId: string) => {
    if (!confirm('Are you sure you want to delete this asset?')) return

    try {
      const token = localStorage.getItem('auth_token')
      const response = await fetch(`/api/assets/${assetId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      })

      if (response.ok) {
        setAssets(prev => prev.filter(a => a.id !== assetId))
        setSelectedAssets(prev => prev.filter(a => a.id !== assetId))
      }
    } catch (error) {
      console.error('Failed to delete asset:', error)
    }
  }

  const handleToggleFavorite = async (asset: Asset) => {
    try {
      const token = localStorage.getItem('auth_token')
      const response = await fetch(`/api/assets/${asset.id}/favorite`, {
        method: 'POST',
        headers: { 
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ isFavorite: !asset.isFavorite })
      })

      if (response.ok) {
        setAssets(prev => prev.map(a => 
          a.id === asset.id ? { ...a, isFavorite: !a.isFavorite } : a
        ))
      }
    } catch (error) {
      console.error('Failed to toggle favorite:', error)
    }
  }

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  const getAssetIcon = (type: Asset['type']) => {
    switch (type) {
      case 'image': return Image
      case 'video': return Video
      case 'audio': return Music
      case 'document': return FileText
      case 'archive': return Archive
      default: return FileText
    }
  }

  const filteredAssets = assets.filter(asset => {
    const matchesSearch = asset.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         asset.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()))
    const matchesCategory = selectedCategory === 'all' || asset.type === selectedCategory
    return matchesSearch && matchesCategory
  })

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-4">
              <h1 className="text-xl font-semibold">Asset Library</h1>
              
              {/* Category Filter */}
              <div className="flex items-center gap-2">
                {categories.map((category) => {
                  const Icon = category.icon
                  return (
                    <button
                      key={category.id}
                      onClick={() => setSelectedCategory(category.id)}
                      className={`flex items-center gap-2 px-3 py-1 rounded-lg ${
                        selectedCategory === category.id
                          ? 'bg-blue-100 text-blue-600'
                          : 'text-gray-600 hover:bg-gray-100'
                      }`}
                    >
                      <Icon className="w-4 h-4" />
                      <span className="text-sm">{category.name}</span>
                    </button>
                  )
                })}
              </div>
            </div>

            <div className="flex items-center gap-4">
              {/* Search */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search assets..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 pr-4 py-2 border border-gray-200 rounded-lg w-64"
                />
              </div>

              {/* Sort */}
              <select
                value={`${sortBy}-${sortOrder}`}
                onChange={(e) => {
                  const [sort, order] = e.target.value.split('-')
                  setSortBy(sort as any)
                  setSortOrder(order as any)
                }}
                className="px-3 py-2 border border-gray-200 rounded-lg"
              >
                <option value="date-desc">Newest First</option>
                <option value="date-asc">Oldest First</option>
                <option value="name-asc">Name (A-Z)</option>
                <option value="name-desc">Name (Z-A)</option>
                <option value="size-desc">Largest First</option>
                <option value="size-asc">Smallest First</option>
              </select>

              {/* View Mode */}
              <div className="flex items-center gap-1 border border-gray-200 rounded-lg">
                <button
                  onClick={() => setViewMode('grid')}
                  className={`p-2 ${viewMode === 'grid' ? 'bg-gray-100' : ''}`}
                >
                  <Grid className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setViewMode('list')}
                  className={`p-2 ${viewMode === 'list' ? 'bg-gray-100' : ''}`}
                >
                  <List className="w-4 h-4" />
                </button>
              </div>

              {/* Upload */}
              <button
                onClick={() => setShowUploadModal(true)}
                className="flex items-center gap-2 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
              >
                <Upload className="w-4 h-4" />
                <span>Upload</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Selection Bar */}
      {selectedAssets.length > 0 && (
        <div className="bg-blue-50 border-b">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between h-12">
              <div className="flex items-center gap-4">
                <span className="text-sm font-medium">
                  {selectedAssets.length} asset{selectedAssets.length !== 1 ? 's' : ''} selected
                </span>
                <button
                  onClick={() => setSelectedAssets([])}
                  className="text-sm text-blue-600 hover:text-blue-700"
                >
                  Clear selection
                </button>
              </div>

              <div className="flex items-center gap-2">
                <button className="p-2 hover:bg-blue-100 rounded">
                  <Download className="w-4 h-4" />
                </button>
                <button className="p-2 hover:bg-blue-100 rounded">
                  <Share2 className="w-4 h-4" />
                </button>
                <button className="p-2 hover:bg-blue-100 rounded">
                  <Copy className="w-4 h-4" />
                </button>
                <button
                  onClick={() => {
                    selectedAssets.forEach(asset => handleAssetDelete(asset.id))
                  }}
                  className="p-2 hover:bg-red-100 rounded text-red-600"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Assets Grid/List */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {filteredAssets.length === 0 ? (
          <div className="text-center py-12">
            <div className="w-16 h-16 bg-gray-200 rounded-full flex items-center justify-center mx-auto mb-4">
              <Image className="w-8 h-8 text-gray-400" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">No assets found</h3>
            <p className="text-gray-500">
              {searchQuery ? 'Try adjusting your search terms' : 'Upload your first asset to get started'}
            </p>
          </div>
        ) : (
          <>
            {viewMode === 'grid' ? (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
                {filteredAssets.map((asset) => {
                  const Icon = getAssetIcon(asset.type)
                  const isSelected = selectedAssets.some(a => a.id === asset.id)
                  
                  return (
                    <div
                      key={asset.id}
                      onClick={() => handleAssetSelect(asset)}
                      className={`relative group cursor-pointer rounded-lg overflow-hidden border-2 transition-all ${
                        isSelected ? 'border-blue-500 ring-2 ring-blue-200' : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      {/* Thumbnail */}
                      <div className="aspect-square bg-gray-100 flex items-center justify-center">
                        {asset.thumbnail ? (
                          <img
                            src={asset.thumbnail}
                            alt={asset.name}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <Icon className="w-12 h-12 text-gray-400" />
                        )}
                      </div>

                      {/* Overlay */}
                      <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-50 transition-all flex items-center justify-center">
                        <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-all">
                          <button
                            onClick={(e) => {
                              e.stopPropagation()
                              handleAssetSelect(asset)
                            }}
                            className="p-2 bg-white rounded-full hover:bg-gray-100"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation()
                              handleToggleFavorite(asset)
                            }}
                            className="p-2 bg-white rounded-full hover:bg-gray-100"
                          >
                            <Star className={`w-4 h-4 ${asset.isFavorite ? 'fill-yellow-400 text-yellow-400' : ''}`} />
                          </button>
                        </div>
                      </div>

                      {/* Selection Indicator */}
                      {isSelected && (
                        <div className="absolute top-2 right-2 w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center">
                          <Check className="w-4 h-4 text-white" />
                        </div>
                      )}

                      {/* Favorite Indicator */}
                      {asset.isFavorite && (
                        <div className="absolute top-2 left-2">
                          <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                        </div>
                      )}

                      {/* Asset Info */}
                      <div className="p-3 bg-white">
                        <h4 className="font-medium text-sm truncate mb-1">{asset.name}</h4>
                        <div className="flex items-center justify-between text-xs text-gray-500">
                          <span>{formatFileSize(asset.size)}</span>
                          <span>{new Date(asset.created_at).toLocaleDateString()}</span>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            ) : (
              <div className="space-y-2">
                {filteredAssets.map((asset) => {
                  const Icon = getAssetIcon(asset.type)
                  const isSelected = selectedAssets.some(a => a.id === asset.id)
                  
                  return (
                    <div
                      key={asset.id}
                      onClick={() => handleAssetSelect(asset)}
                      className={`flex items-center gap-4 p-4 border rounded-lg cursor-pointer ${
                        isSelected ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:bg-gray-50'
                      }`}
                    >
                      {/* Thumbnail */}
                      <div className="w-12 h-12 bg-gray-100 rounded flex items-center justify-center flex-shrink-0">
                        {asset.thumbnail ? (
                          <img
                            src={asset.thumbnail}
                            alt={asset.name}
                            className="w-full h-full object-cover rounded"
                          />
                        ) : (
                          <Icon className="w-6 h-6 text-gray-400" />
                        )}
                      </div>

                      {/* Asset Info */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <h4 className="font-medium truncate">{asset.name}</h4>
                          {asset.isFavorite && (
                            <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                          )}
                        </div>
                        <div className="flex items-center gap-4 text-sm text-gray-500">
                          <span>{formatFileSize(asset.size)}</span>
                          <span>{new Date(asset.created_at).toLocaleDateString()}</span>
                          <span className="capitalize">{asset.type}</span>
                        </div>
                      </div>

                      {/* Actions */}
                      <div className="flex items-center gap-2">
                        <button
                          onClick={(e) => {
                            e.stopPropagation()
                            handleToggleFavorite(asset)
                          }}
                          className="p-1 hover:bg-gray-100 rounded"
                        >
                          <Star className={`w-4 h-4 ${asset.isFavorite ? 'fill-yellow-400 text-yellow-400' : ''}`} />
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation()
                            handleAssetDelete(asset.id)
                          }}
                          className="p-1 hover:bg-red-100 rounded text-red-600"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </>
        )}
      </div>

      {/* Upload Modal */}
      {showUploadModal && (
        <UploadModal
          onClose={() => setShowUploadModal(false)}
          onUploadComplete={() => {
            fetchAssets()
            setShowUploadModal(false)
          }}
        />
      )}
    </div>
  )
}

interface UploadModalProps {
  onClose: () => void
  onUploadComplete: () => void
}

function UploadModal({ onClose, onUploadComplete }: UploadModalProps) {
  const [files, setFiles] = useState<File[]>([])
  const [uploading, setUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState<Record<string, number>>({})

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = Array.from(e.target.files || [])
    setFiles(prev => [...prev, ...selectedFiles])
  }

  const handleUpload = async () => {
    if (files.length === 0) return

    setUploading(true)
    const token = localStorage.getItem('auth_token')

    try {
      for (const file of files) {
        const formData = new FormData()
        formData.append('file', file)

        const response = await fetch('/api/assets/upload', {
          method: 'POST',
          headers: { 'Authorization': `Bearer ${token}` },
          body: formData
        })

        if (response.ok) {
          setUploadProgress(prev => ({ ...prev, [file.name]: 100 }))
        }
      }

      onUploadComplete()
    } catch (error) {
      console.error('Upload failed:', error)
    } finally {
      setUploading(false)
      setFiles([])
      setUploadProgress({})
    }
  }

  const removeFile = (index: number) => {
    setFiles(prev => prev.filter((_, i) => i !== index))
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg w-full max-w-2xl mx-4 max-h-[80vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b">
          <h2 className="text-xl font-semibold">Upload Assets</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6">
          {/* Drop Zone */}
          <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center mb-6">
            <Upload className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <p className="text-lg font-medium mb-2">Drop files here or click to browse</p>
            <input
              type="file"
              multiple
              onChange={handleFileSelect}
              className="hidden"
              id="file-upload"
            />
            <label
              htmlFor="file-upload"
              className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 cursor-pointer"
            >
              Select Files
            </label>
          </div>

          {/* File List */}
          {files.length > 0 && (
            <div className="space-y-2 mb-6">
              <h3 className="font-medium">Files to upload:</h3>
              {files.map((file, index) => (
                <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <FileText className="w-4 h-4 text-gray-400" />
                    <span className="text-sm">{file.name}</span>
                    <span className="text-xs text-gray-500">
                      ({(file.size / 1024 / 1024).toFixed(2)} MB)
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    {uploadProgress[file.name] !== undefined && (
                      <div className="w-20">
                        <div className="text-xs text-gray-500 mb-1">
                          {uploadProgress[file.name]}%
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-1">
                          <div
                            className="bg-blue-500 h-1 rounded-full"
                            style={{ width: `${uploadProgress[file.name]}%` }}
                          />
                        </div>
                      </div>
                    )}
                    <button
                      onClick={() => removeFile(index)}
                      className="p-1 hover:bg-red-100 rounded text-red-600"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Actions */}
          <div className="flex justify-end gap-3">
            <button
              onClick={onClose}
              className="px-4 py-2 border border-gray-200 rounded-lg hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              onClick={handleUpload}
              disabled={files.length === 0 || uploading}
              className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50"
            >
              {uploading ? 'Uploading...' : `Upload ${files.length} file${files.length !== 1 ? 's' : ''}`}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
