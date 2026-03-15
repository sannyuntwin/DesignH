'use client'

import { useState, useEffect } from 'react'
import { Plus, Search, Grid, List, Filter, MoreVertical, Clock, Star, Trash2, Edit, Share2, Download, Eye } from 'lucide-react'

interface Design {
  id: string
  name: string
  thumbnail?: string
  created_at: string
  updated_at: string
  file_size: number
  is_public: boolean
  is_template: boolean
  tags: string[]
  collaborators_count: number
  views_count: number
  user_id: string
  user_name: string
}

interface DashboardProps {
  onCreateDesign: () => void
  onOpenDesign: (designId: string) => void
}

export default function DesignDashboard({ onCreateDesign, onOpenDesign }: DashboardProps) {
  const [designs, setDesigns] = useState<Design[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')
  const [filter, setFilter] = useState<'all' | 'recent' | 'templates' | 'shared'>('all')
  const [selectedDesigns, setSelectedDesigns] = useState<string[]>([])
  const [showFilters, setShowFilters] = useState(false)

  useEffect(() => {
    fetchDesigns()
  }, [filter])

  const fetchDesigns = async () => {
    setLoading(true)
    try {
      const token = localStorage.getItem('auth_token')
      const response = await fetch(`/api/designs?filter=${filter}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      if (response.ok) {
        const data = await response.json()
        setDesigns(data.designs || [])
      }
    } catch (error) {
      console.error('Failed to fetch designs:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleDeleteDesign = async (designId: string) => {
    if (!confirm('Are you sure you want to delete this design?')) return

    try {
      const token = localStorage.getItem('auth_token')
      const response = await fetch(`/api/designs/${designId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      if (response.ok) {
        setDesigns(prev => prev.filter(d => d.id !== designId))
        setSelectedDesigns(prev => prev.filter(id => id !== designId))
      }
    } catch (error) {
      console.error('Failed to delete design:', error)
    }
  }

  const handleDuplicateDesign = async (designId: string) => {
    try {
      const token = localStorage.getItem('auth_token')
      const response = await fetch(`/api/designs/${designId}/duplicate`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      if (response.ok) {
        const data = await response.json()
        setDesigns(prev => [data.design, ...prev])
      }
    } catch (error) {
      console.error('Failed to duplicate design:', error)
    }
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

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i]
  }

  const filteredDesigns = designs.filter(design =>
    design.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    design.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()))
  )

  const toggleDesignSelection = (designId: string) => {
    setSelectedDesigns(prev =>
      prev.includes(designId)
        ? prev.filter(id => id !== designId)
        : [...prev, designId]
    )
  }

  const handleBulkDelete = async () => {
    if (!confirm(`Delete ${selectedDesigns.length} selected designs?`)) return

    try {
      const token = localStorage.getItem('auth_token')
      await Promise.all(
        selectedDesigns.map(id =>
          fetch(`/api/designs/${id}`, {
            method: 'DELETE',
            headers: { 'Authorization': `Bearer ${token}` }
          })
        )
      )

      setDesigns(prev => prev.filter(d => !selectedDesigns.includes(d.id)))
      setSelectedDesigns([])
    } catch (error) {
      console.error('Failed to delete designs:', error)
    }
  }

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
              <h1 className="text-2xl font-bold text-gray-900">My Designs</h1>
              <div className="flex items-center gap-2 text-sm text-gray-500">
                <span>{designs.length} designs</span>
              </div>
            </div>
            
            <button
              onClick={onCreateDesign}
              className="flex items-center gap-2 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
            >
              <Plus className="w-4 h-4" />
              Create Design
            </button>
          </div>
        </div>
      </div>

      {/* Toolbar */}
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between py-4">
            <div className="flex items-center gap-4 flex-1">
              {/* Search */}
              <div className="relative max-w-md flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search designs..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {/* Filters */}
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
                  value={filter}
                  onChange={(e) => setFilter(e.target.value as any)}
                  className="px-3 py-2 border border-gray-200 rounded-lg"
                >
                  <option value="all">All Designs</option>
                  <option value="recent">Recent</option>
                  <option value="templates">Templates</option>
                  <option value="shared">Shared with me</option>
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
              </div>
            </div>

            {/* Bulk Actions */}
            {selectedDesigns.length > 0 && (
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-500">
                  {selectedDesigns.length} selected
                </span>
                <button
                  onClick={handleBulkDelete}
                  className="flex items-center gap-2 px-3 py-2 text-red-600 border border-red-200 rounded-lg hover:bg-red-50"
                >
                  <Trash2 className="w-4 h-4" />
                  Delete
                </button>
              </div>
            )}
          </div>

          {/* Expanded Filters */}
          {showFilters && (
            <div className="pb-4 border-t pt-4">
              <div className="flex items-center gap-4">
                <span className="text-sm font-medium text-gray-700">Sort by:</span>
                <select className="px-3 py-1 border border-gray-200 rounded-lg text-sm">
                  <option>Last Modified</option>
                  <option>Name</option>
                  <option>Created</option>
                  <option>Size</option>
                </select>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Designs Grid/List */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {filteredDesigns.length === 0 ? (
          <div className="text-center py-12">
            <div className="w-24 h-24 bg-gray-200 rounded-lg mx-auto mb-4 flex items-center justify-center">
              <Grid className="w-8 h-8 text-gray-400" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">No designs yet</h3>
            <p className="text-gray-500 mb-4">Create your first design to get started</p>
            <button
              onClick={onCreateDesign}
              className="flex items-center gap-2 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 mx-auto"
            >
              <Plus className="w-4 h-4" />
              Create Design
            </button>
          </div>
        ) : (
          <div className={
            viewMode === 'grid'
              ? 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6'
              : 'space-y-2'
          }>
            {filteredDesigns.map((design) => (
              <DesignCard
                key={design.id}
                design={design}
                viewMode={viewMode}
                isSelected={selectedDesigns.includes(design.id)}
                onSelect={() => toggleDesignSelection(design.id)}
                onOpen={() => onOpenDesign(design.id)}
                onDelete={() => handleDeleteDesign(design.id)}
                onDuplicate={() => handleDuplicateDesign(design.id)}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

interface DesignCardProps {
  design: Design
  viewMode: 'grid' | 'list'
  isSelected: boolean
  onSelect: () => void
  onOpen: () => void
  onDelete: () => void
  onDuplicate: () => void
}

function DesignCard({
  design,
  viewMode,
  isSelected,
  onSelect,
  onOpen,
  onDelete,
  onDuplicate
}: DesignCardProps) {
  const [showDropdown, setShowDropdown] = useState(false)

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

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i]
  }

  if (viewMode === 'list') {
    return (
      <div className={`flex items-center gap-4 p-4 bg-white rounded-lg border hover:shadow-md transition-shadow ${
        isSelected ? 'border-blue-500 bg-blue-50' : 'border-gray-200'
      }`}>
        <input
          type="checkbox"
          checked={isSelected}
          onChange={onSelect}
          className="rounded"
        />
        
        <div className="w-16 h-12 bg-gray-100 rounded flex items-center justify-center">
          {design.thumbnail ? (
            <img src={design.thumbnail} alt={design.name} className="w-full h-full object-cover rounded" />
          ) : (
            <Grid className="w-6 h-6 text-gray-400" />
          )}
        </div>

        <div className="flex-1">
          <h3 className="font-medium text-gray-900">{design.name}</h3>
          <div className="flex items-center gap-4 text-sm text-gray-500">
            <span className="flex items-center gap-1">
              <Clock className="w-3 h-3" />
              {formatDate(design.updated_at)}
            </span>
            <span>{formatFileSize(design.file_size)}</span>
            {design.collaborators_count > 0 && (
              <span className="flex items-center gap-1">
                <Share2 className="w-3 h-3" />
                {design.collaborators_count}
              </span>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={onOpen}
            className="px-3 py-1 text-sm border border-gray-200 rounded hover:bg-gray-50"
          >
            Open
          </button>
          
          <div className="relative">
            <button
              onClick={() => setShowDropdown(!showDropdown)}
              className="p-1 hover:bg-gray-100 rounded"
            >
              <MoreVertical className="w-4 h-4" />
            </button>
            
            {showDropdown && (
              <div className="absolute right-0 top-8 w-48 bg-white border rounded-lg shadow-lg z-10">
                <button
                  onClick={() => { onDuplicate(); setShowDropdown(false) }}
                  className="w-full px-4 py-2 text-left text-sm hover:bg-gray-50 flex items-center gap-2"
                >
                  <Plus className="w-4 h-4" />
                  Duplicate
                </button>
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
    <div className={`group relative bg-white rounded-lg border hover:shadow-lg transition-all ${
      isSelected ? 'border-blue-500 ring-2 ring-blue-200' : 'border-gray-200'
    }`}>
      <input
        type="checkbox"
        checked={isSelected}
        onChange={onSelect}
        className="absolute top-2 left-2 z-10 rounded"
      />
      
      <div className="aspect-video bg-gray-100 rounded-t-lg relative overflow-hidden">
        {design.thumbnail ? (
          <img src={design.thumbnail} alt={design.name} className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <Grid className="w-12 h-12 text-gray-400" />
          </div>
        )}
        
        <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-40 transition-opacity flex items-center justify-center">
          <button
            onClick={onOpen}
            className="opacity-0 group-hover:opacity-100 transition-opacity bg-white text-gray-900 px-4 py-2 rounded-lg font-medium"
          >
            Open Design
          </button>
        </div>

        {design.is_template && (
          <div className="absolute top-2 right-2 bg-purple-500 text-white text-xs px-2 py-1 rounded">
            Template
          </div>
        )}
      </div>

      <div className="p-4">
        <h3 className="font-medium text-gray-900 mb-2 truncate">{design.name}</h3>
        
        <div className="flex items-center justify-between text-sm text-gray-500 mb-3">
          <span className="flex items-center gap-1">
            <Clock className="w-3 h-3" />
            {formatDate(design.updated_at)}
          </span>
          <span>{formatFileSize(design.file_size)}</span>
        </div>

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-sm text-gray-500">
            {design.collaborators_count > 0 && (
              <span className="flex items-center gap-1">
                <Share2 className="w-3 h-3" />
                {design.collaborators_count}
              </span>
            )}
            {design.views_count > 0 && (
              <span className="flex items-center gap-1">
                <Eye className="w-3 h-3" />
                {design.views_count}
              </span>
            )}
          </div>

          <div className="relative">
            <button
              onClick={() => setShowDropdown(!showDropdown)}
              className="p-1 hover:bg-gray-100 rounded opacity-0 group-hover:opacity-100 transition-opacity"
            >
              <MoreVertical className="w-4 h-4" />
            </button>
            
            {showDropdown && (
              <div className="absolute right-0 top-8 w-48 bg-white border rounded-lg shadow-lg z-10">
                <button
                  onClick={() => { onDuplicate(); setShowDropdown(false) }}
                  className="w-full px-4 py-2 text-left text-sm hover:bg-gray-50 flex items-center gap-2"
                >
                  <Plus className="w-4 h-4" />
                  Duplicate
                </button>
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
    </div>
  )
}
