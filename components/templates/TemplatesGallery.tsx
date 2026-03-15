'use client'

import { useState, useEffect } from 'react'
import { Search, Filter, Grid, List, Star, Download, Eye, Plus, Heart, Clock } from 'lucide-react'

interface Template {
  id: string
  name: string
  description: string
  thumbnail: string
  category: string
  tags: string[]
  dimensions: { width: number; height: number }
  is_premium: boolean
  downloads: number
  rating: number
  rating_count: number
  created_at: string
  author: {
    id: string
    name: string
    avatar?: string
  }
  canvas_data: any
}

interface TemplatesGalleryProps {
  onSelectTemplate: (template: Template) => void
  onClose: () => void
}

export default function TemplatesGallery({ onSelectTemplate, onClose }: TemplatesGalleryProps) {
  const [templates, setTemplates] = useState<Template[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('all')
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')
  const [sortBy, setSortBy] = useState<'popular' | 'newest' | 'rating'>('popular')
  const [showFilters, setShowFilters] = useState(false)

  const categories = [
    { id: 'all', name: 'All Templates' },
    { id: 'social-media', name: 'Social Media' },
    { id: 'marketing', name: 'Marketing' },
    { id: 'business', name: 'Business' },
    { id: 'education', name: 'Education' },
    { id: 'events', name: 'Events' },
    { id: 'presentations', name: 'Presentations' },
    { id: 'infographics', name: 'Infographics' }
  ]

  useEffect(() => {
    fetchTemplates()
  }, [selectedCategory, sortBy])

  const fetchTemplates = async () => {
    setLoading(true)
    try {
      const response = await fetch(
        `/api/templates?category=${selectedCategory}&sort=${sortBy}&limit=20`
      )
      const data = await response.json()
      setTemplates(data.templates || [])
    } catch (error) {
      console.error('Failed to fetch templates:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleUseTemplate = async (template: Template) => {
    try {
      const token = localStorage.getItem('auth_token')
      const response = await fetch('/api/designs', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          name: `${template.name} - Copy`,
          width: template.dimensions.width,
          height: template.dimensions.height,
          template_id: template.id
        })
      })

      if (response.ok) {
        const data = await response.json()
        onSelectTemplate(data.design)
        onClose()
      }
    } catch (error) {
      console.error('Failed to create design from template:', error)
    }
  }

  const filteredTemplates = templates.filter(template =>
    template.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    template.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
    template.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()))
  )

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

  const renderStars = (rating: number, count: number) => {
    return (
      <div className="flex items-center gap-1">
        <div className="flex">
          {[1, 2, 3, 4, 5].map(star => (
            <Star
              key={star}
              className={`w-3 h-3 ${
                star <= rating ? 'text-yellow-400 fill-current' : 'text-gray-300'
              }`}
            />
          ))}
        </div>
        <span className="text-xs text-gray-500">({count})</span>
      </div>
    )
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg w-full max-w-6xl max-h-[90vh] mx-4 flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b">
          <div>
            <h2 className="text-2xl font-semibold">Design Templates</h2>
            <p className="text-sm text-gray-600 mt-1">
              Start with a professional template and customize it to your needs
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg"
          >
            ×
          </button>
        </div>

        {/* Toolbar */}
        <div className="p-4 border-b space-y-4">
          {/* Search and Filters */}
          <div className="flex items-center gap-4">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search templates..."
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
                <option value="popular">Most Popular</option>
                <option value="newest">Newest</option>
                <option value="rating">Highest Rated</option>
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

          {/* Category Filter */}
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

        {/* Templates Grid */}
        <div className="flex-1 overflow-y-auto p-6">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
            </div>
          ) : filteredTemplates.length === 0 ? (
            <div className="text-center py-12">
              <div className="w-16 h-16 bg-gray-200 rounded-lg mx-auto mb-4 flex items-center justify-center">
                <Grid className="w-8 h-8 text-gray-400" />
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">No templates found</h3>
              <p className="text-gray-500">Try adjusting your search or filters</p>
            </div>
          ) : (
            <div className={
              viewMode === 'grid'
                ? 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6'
                : 'space-y-4'
            }>
              {filteredTemplates.map((template) => (
                <TemplateCard
                  key={template.id}
                  template={template}
                  viewMode={viewMode}
                  onUse={() => handleUseTemplate(template)}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

interface TemplateCardProps {
  template: Template
  viewMode: 'grid' | 'list'
  onUse: () => void
}

function TemplateCard({ template, viewMode, onUse }: TemplateCardProps) {
  const renderStars = (rating: number, count: number) => {
    return (
      <div className="flex items-center gap-1">
        <div className="flex">
          {[1, 2, 3, 4, 5].map(star => (
            <Star
              key={star}
              className={`w-3 h-3 ${
                star <= rating ? 'text-yellow-400 fill-current' : 'text-gray-300'
              }`}
            />
          ))}
        </div>
        <span className="text-xs text-gray-500">({count})</span>
      </div>
    )
  }

  if (viewMode === 'list') {
    return (
      <div className="flex items-center gap-4 p-4 bg-white border rounded-lg hover:shadow-md transition-shadow">
        <img
          src={template.thumbnail}
          alt={template.name}
          className="w-24 h-16 object-cover rounded"
        />
        
        <div className="flex-1">
          <div className="flex items-start justify-between">
            <div>
              <h3 className="font-medium text-gray-900">{template.name}</h3>
              <p className="text-sm text-gray-600 mt-1">{template.description}</p>
              <div className="flex items-center gap-4 mt-2 text-sm text-gray-500">
                <span>{template.dimensions.width} × {template.dimensions.height}</span>
                <span>{template.author.name}</span>
                {renderStars(template.rating, template.rating_count)}
              </div>
            </div>
            
            <div className="flex flex-col items-end gap-2">
              {template.is_premium && (
                <span className="px-2 py-1 bg-purple-100 text-purple-700 text-xs rounded-full">
                  Premium
                </span>
              )}
              <button
                onClick={onUse}
                className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 text-sm"
              >
                Use Template
              </button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-white border rounded-lg overflow-hidden hover:shadow-lg transition-shadow group">
      <div className="aspect-video relative bg-gray-100">
        <img
          src={template.thumbnail}
          alt={template.name}
          className="w-full h-full object-cover"
        />
        {template.is_premium && (
          <div className="absolute top-2 right-2 bg-purple-500 text-white text-xs px-2 py-1 rounded-full">
            Premium
          </div>
        )}
        <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-40 transition-opacity flex items-center justify-center">
          <button
            onClick={onUse}
            className="opacity-0 group-hover:opacity-100 transition-opacity bg-white text-gray-900 px-4 py-2 rounded-lg font-medium"
          >
            Use Template
          </button>
        </div>
      </div>

      <div className="p-4">
        <h3 className="font-medium text-gray-900 mb-1">{template.name}</h3>
        <p className="text-sm text-gray-600 mb-3 line-clamp-2">{template.description}</p>
        
        <div className="flex items-center justify-between text-xs text-gray-500 mb-3">
          <span>{template.dimensions.width} × {template.dimensions.height}</span>
          <span>{template.author.name}</span>
        </div>

        <div className="flex items-center justify-between">
          {renderStars(template.rating, template.rating_count)}
          <div className="flex items-center gap-2 text-xs text-gray-500">
            <Download className="w-3 h-3" />
            {template.downloads}
          </div>
        </div>
      </div>
    </div>
  )
}
