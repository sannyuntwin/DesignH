'use client'

import { useState, useEffect, useRef } from 'react'
import { Upload, Image, Search, Grid, List, Trash2, Download, Plus, Folder } from 'lucide-react'

interface MediaFile {
  id: string
  name: string
  url: string
  type: string
  size: number
  uploaded_at: string
  folder?: string
}

interface MediaLibrarySidebarProps {
  isOpen: boolean
  onClose: () => void
  onFileSelect: (file: MediaFile) => void
}

export default function MediaLibrarySidebar({ isOpen, onClose, onFileSelect }: MediaLibrarySidebarProps) {
  const [files, setFiles] = useState<MediaFile[]>([])
  const [loading, setLoading] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')
  const [selectedFolder, setSelectedFolder] = useState('all')
  const [uploadProgress, setUploadProgress] = useState(0)
  const fileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (isOpen) {
      fetchMediaFiles()
    }
  }, [isOpen])

  const fetchMediaFiles = async () => {
    setLoading(true)
    try {
      // In a real app, you'd fetch from an API endpoint that lists user's uploaded files
      // For now, we'll mock some data
      const mockFiles: MediaFile[] = [
        {
          id: '1',
          name: 'logo.png',
          url: '/uploads/demo-user/1.png',
          type: 'image/png',
          size: 245760,
          uploaded_at: '2024-01-15T10:30:00Z',
          folder: 'brand'
        },
        {
          id: '2',
          name: 'hero-image.jpg',
          url: '/uploads/demo-user/2.jpg',
          type: 'image/jpeg',
          size: 1024576,
          uploaded_at: '2024-01-14T15:45:00Z',
          folder: 'marketing'
        },
        {
          id: '3',
          name: 'background.svg',
          url: '/uploads/demo-user/3.svg',
          type: 'image/svg+xml',
          size: 15360,
          uploaded_at: '2024-01-13T09:20:00Z',
          folder: 'assets'
        }
      ]
      setFiles(mockFiles)
    } catch (error) {
      console.error('Failed to fetch media files:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    setUploading(true)
    setUploadProgress(0)

    try {
      const formData = new FormData()
      formData.append('file', file)
      formData.append('userId', 'demo-user') // Replace with actual user ID
      formData.append('folder', selectedFolder === 'all' ? 'general' : selectedFolder)

      // Simulate upload progress
      const progressInterval = setInterval(() => {
        setUploadProgress(prev => {
          if (prev >= 90) {
            clearInterval(progressInterval)
            return 90
          }
          return prev + 10
        })
      }, 100)

      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData
      })

      clearInterval(progressInterval)
      setUploadProgress(100)

      if (response.ok) {
        const uploadData = await response.json()
        const newFile: MediaFile = {
          id: Date.now().toString(),
          name: uploadData.name,
          url: uploadData.url,
          type: uploadData.type,
          size: uploadData.size,
          uploaded_at: new Date().toISOString(),
          folder: selectedFolder === 'all' ? 'general' : selectedFolder
        }

        setFiles(prev => [newFile, ...prev])
        
        // Reset file input
        if (fileInputRef.current) {
          fileInputRef.current.value = ''
        }
      }
    } catch (error) {
      console.error('Upload failed:', error)
    } finally {
      setTimeout(() => {
        setUploading(false)
        setUploadProgress(0)
      }, 500)
    }
  }

  const deleteFile = async (fileId: string) => {
    try {
      // In a real app, you'd call a DELETE API endpoint
      setFiles(prev => prev.filter(file => file.id !== fileId))
    } catch (error) {
      console.error('Failed to delete file:', error)
    }
  }

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  const filteredFiles = files.filter(file => {
    const matchesSearch = file.name.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesFolder = selectedFolder === 'all' || file.folder === selectedFolder
    return matchesSearch && matchesFolder
  })

  const folders = ['all', ...Array.from(new Set(files.map(f => f.folder).filter(Boolean)))]

  if (!isOpen) return null

  return (
    <div className="fixed inset-y-0 right-0 w-80 bg-white border-l shadow-lg z-40 flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b">
        <h2 className="text-lg font-semibold">Media Library</h2>
        <button
          onClick={onClose}
          className="p-2 hover:bg-gray-100 rounded-lg"
        >
          ×
        </button>
      </div>

      {/* Upload Area */}
      <div className="p-4 border-b">
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleFileUpload}
          className="hidden"
          id="file-upload"
        />
        <label
          htmlFor="file-upload"
          className="flex items-center justify-center gap-2 w-full p-4 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:border-gray-400 transition-colors"
        >
          <Upload className="w-5 h-5 text-gray-400" />
          <span className="text-sm text-gray-600">
            {uploading ? `Uploading... ${uploadProgress}%` : 'Click to upload images'}
          </span>
        </label>
        
        {uploading && (
          <div className="mt-2">
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className="bg-blue-500 h-2 rounded-full transition-all duration-300"
                style={{ width: `${uploadProgress}%` }}
              />
            </div>
          </div>
        )}
      </div>

      {/* Search and Filters */}
      <div className="p-4 space-y-3 border-b">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search files..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-3 py-2 border border-gray-200 rounded-lg text-sm"
          />
        </div>

        <div className="flex items-center justify-between">
          <select
            value={selectedFolder}
            onChange={(e) => setSelectedFolder(e.target.value)}
            className="px-3 py-1 border border-gray-200 rounded-lg text-sm"
          >
            {folders.map(folder => (
              <option key={folder} value={folder}>
                {folder === 'all' ? 'All Folders' : folder}
              </option>
            ))}
          </select>

          <div className="flex gap-1">
            <button
              onClick={() => setViewMode('grid')}
              className={`p-2 rounded ${viewMode === 'grid' ? 'bg-gray-100' : 'hover:bg-gray-50'}`}
            >
              <Grid className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`p-2 rounded ${viewMode === 'list' ? 'bg-gray-100' : 'hover:bg-gray-50'}`}
            >
              <List className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Files List */}
      <div className="flex-1 overflow-y-auto p-4">
        {loading ? (
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
          </div>
        ) : filteredFiles.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <Image className="w-12 h-12 mx-auto mb-2 text-gray-300" />
            <p className="text-sm">No files found</p>
            <p className="text-xs mt-1">Upload some images to get started</p>
          </div>
        ) : (
          <div className={
            viewMode === 'grid'
              ? 'grid grid-cols-2 gap-3'
              : 'space-y-2'
          }>
            {filteredFiles.map((file) => (
              <div
                key={file.id}
                className={`group relative border rounded-lg overflow-hidden cursor-pointer hover:shadow-md transition-shadow ${
                  viewMode === 'list' ? 'flex items-center p-3' : ''
                }`}
                onClick={() => onFileSelect(file)}
              >
                {viewMode === 'grid' ? (
                  <>
                    <div className="aspect-square bg-gray-100 relative">
                      <img
                        src={file.url}
                        alt={file.name}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          e.currentTarget.src = `data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='100' height='100'%3E%3Crect width='100' height='100' fill='%23f3f4f6'/%3E%3Ctext x='50' y='50' text-anchor='middle' dy='.3em' fill='%239ca3af' font-size='12' font-family='Arial'%3EImage%3C/text%3E%3C/svg%3E`
                        }}
                      />
                      <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-50 transition-opacity flex items-center justify-center">
                        <Download className="w-6 h-6 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
                      </div>
                    </div>
                    <div className="p-2">
                      <p className="text-xs font-medium truncate">{file.name}</p>
                      <p className="text-xs text-gray-500">{formatFileSize(file.size)}</p>
                    </div>
                  </>
                ) : (
                  <>
                    <img
                      src={file.url}
                      alt={file.name}
                      className="w-12 h-12 object-cover rounded"
                      onError={(e) => {
                        e.currentTarget.src = `data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='48' height='48'%3E%3Crect width='48' height='48' fill='%23f3f4f6'/%3E%3Ctext x='24' y='24' text-anchor='middle' dy='.3em' fill='%239ca3af' font-size='8' font-family='Arial'%3EIMG%3C/text%3E%3C/svg%3E`
                      }}
                    />
                    <div className="flex-1 ml-3">
                      <p className="text-sm font-medium">{file.name}</p>
                      <p className="text-xs text-gray-500">
                        {formatFileSize(file.size)} • {file.folder}
                      </p>
                    </div>
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        deleteFile(file.id)
                      }}
                      className="p-1 text-red-500 hover:bg-red-50 rounded opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="p-4 border-t">
        <div className="text-xs text-gray-500 text-center">
          {files.length} files • {formatFileSize(files.reduce((acc, file) => acc + file.size, 0))}
        </div>
      </div>
    </div>
  )
}
