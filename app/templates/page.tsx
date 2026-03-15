'use client'

// Templates gallery page for DesignPro
// Browse and use professional design templates

import { useState, useEffect } from 'react'
import Link from 'next/link'
import {
  Search,
  Filter,
  Grid,
  List,
  Star,
  Download,
  Eye,
  Heart,
  Clock,
  Tag,
  Layout,
  Image,
  FileText,
  Presentation,
  Users,
  Briefcase,
  GraduationCap,
  Calendar,
} from 'lucide-react'
import AuthButton from '@/components/auth/AuthButton'
import AuthGuard from '@/components/auth/AuthGuard'

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
  canvas_data?: any
}

interface TemplatesPageProps {}

export default function TemplatesPage({}: TemplatesPageProps) {
  const [templates, setTemplates] = useState<Template[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('all')
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')
  const [sortBy, setSortBy] = useState<'popular' | 'newest' | 'rating'>('popular')

  const categories = [
    { id: 'all', name: 'All Templates', icon: <Grid className="w-4 h-4" /> },
    { id: 'social-media', name: 'Social Media', icon: <Users className="w-4 h-4" /> },
    { id: 'business', name: 'Business', icon: <Briefcase className="w-4 h-4" /> },
    { id: 'education', name: 'Education', icon: <GraduationCap className="w-4 h-4" /> },
    { id: 'events', name: 'Events', icon: <Calendar className="w-4 h-4" /> },
    { id: 'presentations', name: 'Presentations', icon: <Presentation className="w-4 h-4" /> },
    { id: 'documents', name: 'Documents', icon: <FileText className="w-4 h-4" /> },
  ]

  // Mock templates data
  const mockTemplates: Template[] = [
    {
      id: '1',
      name: 'Instagram Post - Summer Sale',
      description: 'Eye-catching summer sale template for Instagram posts with vibrant colors',
      thumbnail: '/api/placeholder/400/400',
      category: 'social-media',
      tags: ['summer', 'sale', 'instagram', 'colorful'],
      dimensions: { width: 1080, height: 1080 },
      is_premium: false,
      downloads: 2340,
      rating: 4.8,
      rating_count: 156,
      created_at: '2024-01-10T00:00:00Z',
      author: {
        id: '1',
        name: 'Design Team',
        avatar: '/api/placeholder/40/40'
      }
    },
    {
      id: '2',
      name: 'Business Presentation',
      description: 'Professional business presentation template with clean layout',
      thumbnail: '/api/placeholder/400/300',
      category: 'presentations',
      tags: ['business', 'presentation', 'professional', 'clean'],
      dimensions: { width: 1920, height: 1080 },
      is_premium: true,
      downloads: 892,
      rating: 4.9,
      rating_count: 87,
      created_at: '2024-01-08T00:00:00Z',
      author: {
        id: '2',
        name: 'Pro Designer',
        avatar: '/api/placeholder/40/40'
      }
    },
    {
      id: '3',
      name: 'Event Invitation',
      description: 'Beautiful event invitation template suitable for weddings and parties',
      thumbnail: '/api/placeholder/400/500',
      category: 'events',
      tags: ['event', 'invitation', 'wedding', 'elegant'],
      dimensions: { width: 794, height: 1123 },
      is_premium: false,
      downloads: 1567,
      rating: 4.7,
      rating_count: 234,
      created_at: '2024-01-05T00:00:00Z',
      author: {
        id: '3',
        name: 'Creative Studio',
        avatar: '/api/placeholder/40/40'
      }
    },
    {
      id: '4',
      name: 'Educational Infographic',
      description: 'Educational infographic template perfect for presentations and reports',
      thumbnail: '/api/placeholder/400/600',
      category: 'education',
      tags: ['education', 'infographic', 'learning', 'visual'],
      dimensions: { width: 800, height: 1200 },
      is_premium: true,
      downloads: 445,
      rating: 4.6,
      rating_count: 56,
      created_at: '2024-01-03T00:00:00Z',
      author: {
        id: '4',
        name: 'EduDesign',
        avatar: '/api/placeholder/40/40'
      }
    },
  ]

  useEffect(() => {
    fetchTemplates()
  }, [selectedCategory, sortBy])

  const fetchTemplates = async () => {
    setLoading(true)
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      let filtered = mockTemplates
      
      if (selectedCategory !== 'all') {
        filtered = filtered.filter(template => template.category === selectedCategory)
      }
      
      // Sort templates
      switch (sortBy) {
        case 'popular':
          filtered.sort((a, b) => b.downloads - a.downloads)
          break
        case 'newest':
          filtered.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
          break
        case 'rating':
          filtered.sort((a, b) => b.rating - a.rating)
          break
      }
      
      setTemplates(filtered)
    } catch (error) {
      console.error('Failed to fetch templates:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleUseTemplate = async (template: Template) => {
    try {
      // In production, this would create a new design from the template
      console.log('Using template:', template.id)
      // Redirect to editor with template data
      // window.location.href = `/editor?template=${template.id}`
    } catch (error) {
      console.error('Failed to use template:', error)
    }
  }

  const filteredTemplates = templates.filter(template =>
    template.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    template.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
    template.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()))
  )

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

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
  }

  if (loading) {
    return (
      <AuthGuard>
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
        </div>
      </AuthGuard>
    )
  }

  return (
    <AuthGuard>
      <div className="min-h-screen bg-gray-50">
        {/* Header */}
        <header className="bg-white border-b border-gray-200">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between h-16">
              <div className="flex items-center">
                <Link href="/dashboard" className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-lg flex items-center justify-center">
                    <span className="text-xl">🎨</span>
                  </div>
                  <span className="font-display text-xl text-slate-900">DesignPro</span>
                </Link>
                <nav className="ml-10 flex items-center space-x-4">
                  <Link href="/dashboard" className="text-gray-600 hover:text-gray-900">Dashboard</Link>
                  <Link href="/templates" className="text-blue-600 font-medium">Templates</Link>
                  <Link href="/brand-kits" className="text-gray-600 hover:text-gray-900">Brand Kits</Link>
                </nav>
              </div>
              <AuthButton />
            </div>
          </div>
        </header>

        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Page Header */}
          <div className="mb-8">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold text-gray-900">Templates</h1>
                <p className="text-gray-600 mt-1">Start with a professional template and customize it to your needs</p>
              </div>
              <Link
                href="/"
                className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                <Layout className="w-4 h-4" />
                Create from Scratch
              </Link>
            </div>
          </div>

          {/* Search and Filters */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-6">
            <div className="flex flex-col lg:flex-row gap-4">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search templates..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              
              <div className="flex items-center gap-2">
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as any)}
                  className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="popular">Most Popular</option>
                  <option value="newest">Newest</option>
                  <option value="rating">Highest Rated</option>
                </select>
                
                <div className="flex items-center border border-gray-300 rounded-lg">
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
          </div>

          {/* Categories */}
          <div className="flex items-center gap-2 flex-wrap mb-6">
            {categories.map(category => (
              <button
                key={category.id}
                onClick={() => setSelectedCategory(category.id)}
                className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm transition-colors ${
                  selectedCategory === category.id
                    ? 'bg-blue-500 text-white'
                    : 'bg-white border border-gray-300 text-gray-700 hover:bg-gray-50'
                }`}
              >
                {category.icon}
                {category.name}
              </button>
            ))}
          </div>

          {/* Templates Grid */}
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
            </div>
          ) : filteredTemplates.length === 0 ? (
            <div className="text-center py-12">
              <div className="w-16 h-16 bg-gray-200 rounded-lg mx-auto mb-4 flex items-center justify-center">
                <Layout className="w-8 h-8 text-gray-400" />
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
        </main>
      </div>
    </AuthGuard>
  )
}

// Template Card Component
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
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 hover:shadow-md transition-shadow">
        <div className="flex items-center gap-4">
          <div className="w-24 h-16 bg-gray-100 rounded flex-shrink-0">
            <img src={template.thumbnail} alt={template.name} className="w-full h-full object-cover rounded" />
          </div>
          
          <div className="flex-1">
            <div className="flex items-start justify-between">
              <div>
                <h3 className="font-medium text-gray-900">{template.name}</h3>
                <p className="text-sm text-gray-600 mt-1 line-clamp-2">{template.description}</p>
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
