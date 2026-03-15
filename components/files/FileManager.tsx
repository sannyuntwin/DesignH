'use client'

import { useState, useEffect } from 'react'
import { 
  Upload, Search, Filter, Grid, List, Folder, File, Image, 
  Trash2, Download, Share2, MoreVertical, Eye, EyeOff, Lock,
  Unlock, Copy, Move, FolderPlus, FilePlus, ChevronDown, ChevronRight,
  Calendar, HardDrive, Users, Tag, Star, Clock
} from 'lucide-react'

interface FileItem {
  id: string
  name: string
  type: 'file' | 'folder'
  mime_type?: string
  size?: number
  url?: string
  thumbnail?: string
  parent_id?: string
  user_id: string
  is_public: boolean
  is_encrypted: boolean
  tags: string[]
  metadata?: any
  created_at: string
  updated_at: string
  shared_with?: Array<{
    user_id: string
    user_name: string
    permission: 'view' | 'edit'
  }>
  children?: FileItem[]
}

interface FileManagerProps {
  onSelectFile?: (file: FileItem) => void
  onClose?: () => void
  embedMode?: boolean
}

export default function FileManager({ onSelectFile, onClose, embedMode = false }: FileManagerProps) {
  const [files, setFiles] = useState<FileItem[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')
  const [selectedFiles, setSelectedFiles] = useState<Set<string>>(new Set())
  const [currentFolder, setCurrentFolder] = useState<string | null>(null)
  const [breadcrumb, setBreadcrumb] = useState<FileItem[]>([])
  const [showFilters, setShowFilters] = useState(false)
  const [sortBy, setSortBy] = useState<'name' | 'size' | 'modified' | 'created'>('name')
  const [filterType, setFilterType] = useState<string>('all')
  const [uploadProgress, setUploadProgress] = useState<Map<string, number>>(new Map())
  const [dragOver, setDragOver] = useState(false)

  useEffect(() => {
    fetchFiles()
  }, [currentFolder, sortBy, filterType])

  const fetchFiles = async () => {
    setLoading(true)
    try {
      const token = localStorage.getItem('auth_token')
      const params = new URLSearchParams({
        folder_id: currentFolder || '',
        sort: sortBy,
        type: filterType
      })
      
      const response = await fetch(`/api/files?${params}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      if (response.ok) {
        const data = await response.json()
        setFiles(data.files || [])
        setBreadcrumb(data.breadcrumb || [])
      }
    } catch (error) {
      console.error('Failed to fetch files:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleFileUpload = async (uploadedFiles: FileList) => {
    const token = localStorage.getItem('auth_token')
    
    for (let i = 0; i < uploadedFiles.length; i++) {
      const file = uploadedFiles[i]
      const formData = new FormData()
      formData.append('file', file)
      formData.append('parent_id', currentFolder || '')

      try {
        setUploadProgress(prev => new Map(prev.set(file.name, 0)))

        const xhr = new XMLHttpRequest()
        xhr.upload.addEventListener('progress', (e) => {
          if (e.lengthComputable) {
            const progress = Math.round((e.loaded / e.total) * 100)
            setUploadProgress(prev => new Map(prev.set(file.name, progress)))
          }
        })

        xhr.addEventListener('load', () => {
          if (xhr.status === 200) {
            setUploadProgress(prev => {
              const newMap = new Map(prev)
              newMap.delete(file.name)
              return newMap
            })
            fetchFiles()
          }
        })

        xhr.open('POST', '/api/files/upload')
        xhr.setRequestHeader('Authorization', `Bearer ${token}`)
        xhr.send(formData)
      } catch (error) {
        console.error('Upload failed:', error)
        setUploadProgress(prev => {
          const newMap = new Map(prev)
          newMap.delete(file.name)
          return newMap
        })
      }
    }
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    setDragOver(true)
  }

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault()
    setDragOver(false)
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setDragOver(false)
    
    const files = e.dataTransfer.files
    if (files.length > 0) {
      handleFileUpload(files)
    }
  }

  const handleFileSelect = (fileId: string, event: React.MouseEvent) => {
    event.stopPropagation()
    
    if (event.ctrlKey || event.metaKey) {
      // Multi-select
      setSelectedFiles(prev => {
        const newSet = new Set(prev)
        if (newSet.has(fileId)) {
          newSet.delete(fileId)
        } else {
          newSet.add(fileId)
        }
        return newSet
      })
    } else {
      // Single select
      setSelectedFiles(new Set([fileId]))
      
      const file = files.find(f => f.id === fileId)
      if (file && file.type === 'file' && onSelectFile) {
        onSelectFile(file)
      }
    }
  }

  const handleFolderClick = (folder: FileItem) => {
    setCurrentFolder(folder.id)
    setSelectedFiles(new Set())
  }

  const handleBreadcrumbClick = (folder: FileItem | null) => {
    setCurrentFolder(folder?.id || null)
    setSelectedFiles(new Set())
  }

  const handleDelete = async () => {
    if (selectedFiles.size === 0) return
    
    if (!confirm(`Delete ${selectedFiles.size} selected item${selectedFiles.size > 1 ? 's' : ''}?`)) return

    try {
      const token = localStorage.getItem('auth_token')
      await Promise.all(
        Array.from(selectedFiles).map(id =>
          fetch(`/api/files/${id}`, {
            method: 'DELETE',
            headers: { 'Authorization': `Bearer ${token}` }
          })
        )
      )

      setFiles(prev => prev.filter(f => !selectedFiles.has(f.id)))
      setSelectedFiles(new Set())
    } catch (error) {
      console.error('Failed to delete files:', error)
    }
  }

  const handleShare = async (fileId: string) => {
    try {
      const token = localStorage.getItem('auth_token')
      const response = await fetch(`/api/files/${fileId}/share`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ is_public: true })
      })

      if (response.ok) {
        fetchFiles()
      }
    } catch (error) {
      console.error('Failed to share file:', error)
    }
  }

  const handleDownload = async (file: FileItem) => {
    if (file.url) {
      const link = document.createElement('a')
      link.href = file.url
      link.download = file.name
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
    }
  }

  const formatFileSize = (bytes?: number) => {
    if (!bytes) return '—'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i]
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))

    if (diffDays === 0) return 'Today'
    if (diffDays === 1) return 'Yesterday'
    if (diffDays < 7) return `${diffDays} days ago`
    return date.toLocaleDateString()
  }

  const getFileIcon = (file: FileItem) => {
    if (file.type === 'folder') return Folder
    
    if (file.mime_type?.startsWith('image/')) return Image
    if (file.mime_type?.startsWith('video/')) return File
    if (file.mime_type?.startsWith('audio/')) return File
    if (file.mime_type?.includes('pdf')) return File
    if (file.mime_type?.includes('text')) return File
    
    return File
  }

  const filteredFiles = files.filter(file =>
    file.name.toLowerCase().includes(searchQuery.toLowerCase())
  )

  if (embedMode && onClose) {
    return (
      <div className="bg-white border rounded-lg">
        <FileManagerContent />
      </div>
    )
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg w-full max-w-6xl max-h-[90vh] mx-4 flex flex-col">
        <FileManagerContent />
      </div>
    </div>
  )

  function FileManagerContent() {
    return (
      <>
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b">
          <div className="flex items-center gap-3">
            <h2 className="text-xl font-semibold">File Manager</h2>
            <div className="flex items-center gap-2 text-sm text-gray-500">
              <HardDrive className="w-4 h-4" />
              <span>{files.length} items</span>
            </div>
          </div>
          
          {onClose && (
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-lg"
            >
              ×
            </button>
          )}
        </div>

        {/* Toolbar */}
        <div className="p-4 border-b space-y-3">
          {/* Breadcrumb */}
          <div className="flex items-center gap-2 text-sm">
            <button
              onClick={() => handleBreadcrumbClick(null)}
              className="hover:text-blue-600"
            >
              Home
            </button>
            {breadcrumb.map((folder, index) => (
              <div key={folder.id} className="flex items-center gap-2">
                <span>/</span>
                <button
                  onClick={() => handleBreadcrumbClick(folder)}
                  className="hover:text-blue-600"
                >
                  {folder.name}
                </button>
              </div>
            ))}
          </div>

          {/* Search and Actions */}
          <div className="flex items-center gap-4">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search files..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => setShowFilters(!showFilters)}
                className={`flex items-center gap-2 px-3 py-2 border rounded-lg ${
                  showFilters ? 'border-blue-500 bg-blue-50' : 'border-gray-200'
                }`}
              >
                <Filter className="w-4 h-4" />
                Filters
              </button>

              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                className="px-3 py-2 border border-gray-200 rounded-lg"
              >
                <option value="name">Name</option>
                <option value="size">Size</option>
                <option value="modified">Modified</option>
                <option value="created">Created</option>
              </select>

              <div className="flex items-center gap-1 border border-gray-200 rounded-lg">
                <button
                  onClick={() => setViewMode('grid')}
                  className={`p-2 ${viewMode === 'grid' ? 'bg-gray-100' : 'hover:bg-gray-50'}`}
                >
                  <Grid className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setViewMode('list')}
                  className={`p-2 ${viewMode === 'list' ? 'bg-gray-100' : 'hover:bg-gray-50'}`}
                >
                  <List className="w-4 h-4" />
                </button>
              </div>

              {selectedFiles.size > 0 && (
                <div className="flex items-center gap-2">
                  <span className="text-sm text-gray-500">
                    {selectedFiles.size} selected
                  </span>
                  <button
                    onClick={handleDelete}
                    className="p-2 text-red-600 border border-red-200 rounded-lg hover:bg-red-50"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Filters */}
          {showFilters && (
            <div className="flex items-center gap-4">
              <select
                value={filterType}
                onChange={(e) => setFilterType(e.target.value)}
                className="px-3 py-1 border border-gray-200 rounded-lg text-sm"
              >
                <option value="all">All Files</option>
                <option value="image">Images</option>
                <option value="document">Documents</option>
                <option value="video">Videos</option>
                <option value="audio">Audio</option>
              </select>
            </div>
          )}
        </div>

        {/* File Upload Area */}
        <div
          className={`mx-4 p-8 border-2 border-dashed rounded-lg text-center transition-colors ${
            dragOver ? 'border-blue-500 bg-blue-50' : 'border-gray-300'
          }`}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
        >
          <input
            type="file"
            multiple
            onChange={(e) => e.target.files && handleFileUpload(e.target.files)}
            className="hidden"
            id="file-upload"
          />
          <label htmlFor="file-upload" className="cursor-pointer">
            <Upload className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <p className="text-lg font-medium text-gray-700 mb-2">
              Drop files here or click to upload
            </p>
            <p className="text-sm text-gray-500">
              Support for images, documents, videos, and more
            </p>
          </label>
        </div>

        {/* Upload Progress */}
        {uploadProgress.size > 0 && (
          <div className="mx-4 space-y-2">
            {Array.from(uploadProgress.entries()).map(([filename, progress]) => (
              <div key={filename} className="flex items-center gap-2">
                <span className="text-sm text-gray-600 flex-1 truncate">{filename}</span>
                <div className="w-32 bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-blue-500 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${progress}%` }}
                  />
                </div>
                <span className="text-xs text-gray-500">{progress}%</span>
              </div>
            ))}
          </div>
        )}

        {/* Files List */}
        <div className="flex-1 overflow-y-auto p-4">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
            </div>
          ) : filteredFiles.length === 0 ? (
            <div className="text-center py-12">
              <File className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No files found</h3>
              <p className="text-gray-500">Upload some files to get started</p>
            </div>
          ) : (
            <div className={
              viewMode === 'grid'
                ? 'grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4'
                : 'space-y-2'
            }>
              {filteredFiles.map((file) => (
                <FileItemComponent
                  key={file.id}
                  file={file}
                  viewMode={viewMode}
                  isSelected={selectedFiles.has(file.id)}
                  onSelect={(e) => handleFileSelect(file.id, e)}
                  onFolderClick={() => file.type === 'folder' && handleFolderClick(file)}
                  onShare={() => handleShare(file.id)}
                  onDownload={() => handleDownload(file)}
                  onDelete={() => {
                    setSelectedFiles(new Set([file.id]))
                    handleDelete()
                  }}
                />
              ))}
            </div>
          )}
        </div>
      </>
    )
  }
}

interface FileItemComponentProps {
  file: FileItem
  viewMode: 'grid' | 'list'
  isSelected: boolean
  onSelect: (event: React.MouseEvent) => void
  onFolderClick: () => void
  onShare: () => void
  onDownload: () => void
  onDelete: () => void
}

function FileItemComponent({
  file,
  viewMode,
  isSelected,
  onSelect,
  onFolderClick,
  onShare,
  onDownload,
  onDelete
}: FileItemComponentProps) {
  const [showDropdown, setShowDropdown] = useState(false)
  
  const getFileIcon = (file: FileItem) => {
    if (file.type === 'folder') return Folder
    
    if (file.mime_type?.startsWith('image/')) return Image
    if (file.mime_type?.startsWith('video/')) return File
    if (file.mime_type?.startsWith('audio/')) return File
    if (file.mime_type?.includes('pdf')) return File
    if (file.mime_type?.includes('text')) return File
    
    return File
  }

  const formatFileSize = (bytes?: number) => {
    if (!bytes) return '—'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i]
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))

    if (diffDays === 0) return 'Today'
    if (diffDays === 1) return 'Yesterday'
    if (diffDays < 7) return `${diffDays} days ago`
    return date.toLocaleDateString()
  }

  const Icon = getFileIcon(file)

  if (viewMode === 'list') {
    return (
      <div
        className={`flex items-center gap-3 p-3 border rounded-lg cursor-pointer hover:bg-gray-50 ${
          isSelected ? 'border-blue-500 bg-blue-50' : 'border-gray-200'
        }`}
        onClick={file.type === 'folder' ? onFolderClick : onSelect}
      >
        <input
          type="checkbox"
          checked={isSelected}
          onChange={() => {}}
          className="rounded"
          onClick={(e) => e.stopPropagation()}
        />
        
        <Icon className="w-8 h-8 text-gray-400" />
        
        <div className="flex-1 min-w-0">
          <div className="font-medium text-gray-900 truncate">{file.name}</div>
          <div className="text-sm text-gray-500">
            {formatFileSize(file.size)} • {formatDate(file.updated_at)}
          </div>
        </div>

        <div className="flex items-center gap-2">
          {file.is_public && (
            <div className="w-2 h-2 bg-green-500 rounded-full" />
          )}
          {file.is_encrypted && (
            <Lock className="w-4 h-4 text-orange-500" />
          )}
          
          <div className="relative">
            <button
              onClick={(e) => {
                e.stopPropagation()
                setShowDropdown(!showDropdown)
              }}
              className="p-1 hover:bg-gray-200 rounded"
            >
              <MoreVertical className="w-4 h-4" />
            </button>
            
            {showDropdown && (
              <div className="absolute right-0 top-8 w-48 bg-white border rounded-lg shadow-lg z-10">
                {file.type === 'file' && (
                  <>
                    <button
                      onClick={() => { onDownload(); setShowDropdown(false) }}
                      className="w-full px-4 py-2 text-left text-sm hover:bg-gray-50 flex items-center gap-2"
                    >
                      <Download className="w-4 h-4" />
                      Download
                    </button>
                    <button
                      onClick={() => { onShare(); setShowDropdown(false) }}
                      className="w-full px-4 py-2 text-left text-sm hover:bg-gray-50 flex items-center gap-2"
                    >
                      <Share2 className="w-4 h-4" />
                      Share
                    </button>
                  </>
                )}
                <button
                  onClick={() => { onDelete(); setShowDropdown(false) }}
                  className="w-full px-4 py-2 text-left text-sm text-red-600 hover:bg-red-50 flex items-center gap-2"
                >
                  <Trash2 className="w-4 h-4" />
                  Delete
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div
      className={`group relative bg-white border rounded-lg overflow-hidden cursor-pointer hover:shadow-lg transition-shadow ${
        isSelected ? 'border-blue-500 ring-2 ring-blue-200' : 'border-gray-200'
      }`}
      onClick={file.type === 'folder' ? onFolderClick : onSelect}
    >
      <input
        type="checkbox"
        checked={isSelected}
        onChange={() => {}}
        className="absolute top-2 left-2 z-10 rounded"
        onClick={(e) => e.stopPropagation()}
      />
      
      <div className="aspect-square bg-gray-50 flex items-center justify-center">
        {file.type === 'folder' ? (
          <Folder className="w-16 h-16 text-blue-500" />
        ) : file.thumbnail ? (
          <img
            src={file.thumbnail}
            alt={file.name}
            className="w-full h-full object-cover"
          />
        ) : (
          <Icon className="w-16 h-16 text-gray-400" />
        )}
      </div>

      <div className="p-3">
        <div className="font-medium text-sm text-gray-900 truncate mb-1">
          {file.name}
        </div>
        <div className="text-xs text-gray-500">
          {formatFileSize(file.size)}
        </div>
        
        <div className="flex items-center gap-1 mt-2">
          {file.is_public && (
            <div className="w-2 h-2 bg-green-500 rounded-full" />
          )}
          {file.is_encrypted && (
            <Lock className="w-3 h-3 text-orange-500" />
          )}
        </div>
      </div>
    </div>
  )
}
