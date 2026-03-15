'use client'

// Main dashboard page for DesignPro
// Shows user's designs, recent activity, and quick actions

import { useState, useEffect } from 'react'
import Link from 'next/link'
import {
  Plus,
  Search,
  Filter,
  Grid,
  List,
  Clock,
  Star,
  Download,
  Share2,
  Trash2,
  Edit,
  Copy,
  Eye,
  MoreVertical,
  Folder,
  Image,
  Layout,
  FileText,
  Calendar,
  TrendingUp,
  Users,
  Zap,
} from 'lucide-react'
import AuthButton from '@/components/auth/AuthButton'
import AuthGuard from '@/components/auth/AuthGuard'

interface Design {
  id: string
  name: string
  thumbnail: string
  type: 'social-media' | 'presentation' | 'document' | 'other'
  createdAt: string
  updatedAt: string
  isFavorite: boolean
  views: number
  downloads: number
  collaborators: number
  tags: string[]
  dimensions: { width: number; height: number }
}

interface DashboardStats {
  totalDesigns: number
  totalViews: number
  totalDownloads: number
  collaborators: number
  recentActivity: number
}

export default function Dashboard() {
  const [designs, setDesigns] = useState<Design[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedFilter, setSelectedFilter] = useState('all')
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')
  const [stats, setStats] = useState<DashboardStats>({
    totalDesigns: 0,
    totalViews: 0,
    totalDownloads: 0,
    collaborators: 0,
    recentActivity: 0,
  })

  // Mock data - in production, this would come from an API
  const mockDesigns: Design[] = [
    {
      id: '1',
      name: 'Instagram Post - Summer Sale',
      thumbnail: '/api/placeholder/400/300',
      type: 'social-media',
      createdAt: '2024-01-15T10:30:00Z',
      updatedAt: '2024-01-15T14:20:00Z',
      isFavorite: true,
      views: 245,
      downloads: 12,
      collaborators: 2,
      tags: ['summer', 'sale', 'instagram'],
      dimensions: { width: 1080, height: 1080 }
    },
    {
      id: '2',
      name: 'Business Presentation Q1',
      thumbnail: '/api/placeholder/400/300',
      type: 'presentation',
      createdAt: '2024-01-14T09:15:00Z',
      updatedAt: '2024-01-14T16:45:00Z',
      isFavorite: false,
      views: 89,
      downloads: 5,
      collaborators: 3,
      tags: ['business', 'presentation', 'q1'],
      dimensions: { width: 1920, height: 1080 }
    },
    {
      id: '3',
      name: 'Product Launch Banner',
      thumbnail: '/api/placeholder/400/300',
      type: 'social-media',
      createdAt: '2024-01-13T13:20:00Z',
      updatedAt: '2024-01-13T15:30:00Z',
      isFavorite: true,
      views: 156,
      downloads: 8,
      collaborators: 1,
      tags: ['product', 'launch', 'banner'],
      dimensions: { width: 1200, height: 630 }
    },
    {
      id: '4',
      name: 'Company Newsletter',
      thumbnail: '/api/placeholder/400/300',
      type: 'document',
      createdAt: '2024-01-12T11:00:00Z',
      updatedAt: '2024-01-12T14:15:00Z',
      isFavorite: false,
      views: 67,
      downloads: 3,
      collaborators: 2,
      tags: ['newsletter', 'company', 'monthly'],
      dimensions: { width: 794, height: 1123 }
    },
  ]

  useEffect(() => {
    // Simulate loading data
    setTimeout(() => {
      setDesigns(mockDesigns)
      setStats({
        totalDesigns: mockDesigns.length,
        totalViews: mockDesigns.reduce((sum, d) => sum + d.views, 0),
        totalDownloads: mockDesigns.reduce((sum, d) => sum + d.downloads, 0),
        collaborators: 4,
        recentActivity: 12,
      })
      setLoading(false)
    }, 1000)
  }, [])

  const getTypeIcon = (type: Design['type']) => {
    switch (type) {
      case 'social-media': return <Image className="w-4 h-4" />
      case 'presentation': return <Layout className="w-4 h-4" />
      case 'document': return <FileText className="w-4 h-4" />
      default: return <FileText className="w-4 h-4" />
    }
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60))
    
    if (diffHours < 1) return 'Just now'
    if (diffHours < 24) return `${diffHours}h ago`
    if (diffHours < 48) return 'Yesterday'
    return date.toLocaleDateString()
  }

  const filteredDesigns = designs.filter(design =>
    design.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    design.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()))
  )

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
                <Link href="/" className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-lg flex items-center justify-center">
                    <span className="text-xl">🎨</span>
                  </div>
                  <span className="font-display text-xl text-slate-900">DesignPro</span>
                </Link>
                <nav className="ml-10 flex items-center space-x-4">
                  <Link href="/dashboard" className="text-blue-600 font-medium">Dashboard</Link>
                  <Link href="/templates" className="text-gray-600 hover:text-gray-900">Templates</Link>
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
                <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
                <p className="text-gray-600 mt-1">Manage your designs and projects</p>
              </div>
              <Link
                href="/"
                className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                <Plus className="w-4 h-4" />
                New Design
              </Link>
            </div>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6 mb-8">
            <StatCard
              icon={<Layout className="w-5 h-5" />}
              label="Total Designs"
              value={stats.totalDesigns}
              color="blue"
            />
            <StatCard
              icon={<Eye className="w-5 h-5" />}
              label="Total Views"
              value={stats.totalViews}
              color="green"
            />
            <StatCard
              icon={<Download className="w-5 h-5" />}
              label="Downloads"
              value={stats.totalDownloads}
              color="purple"
            />
            <StatCard
              icon={<Users className="w-5 h-5" />}
              label="Collaborators"
              value={stats.collaborators}
              color="orange"
            />
            <StatCard
              icon={<TrendingUp className="w-5 h-5" />}
              label="Recent Activity"
              value={stats.recentActivity}
              color="pink"
            />
          </div>

          {/* Search and Filters */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-6">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search designs..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              
              <div className="flex items-center gap-2">
                <select
                  value={selectedFilter}
                  onChange={(e) => setSelectedFilter(e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="all">All Types</option>
                  <option value="social-media">Social Media</option>
                  <option value="presentation">Presentation</option>
                  <option value="document">Document</option>
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

          {/* Designs Grid/List */}
          {filteredDesigns.length === 0 ? (
            <div className="text-center py-12">
              <div className="w-16 h-16 bg-gray-200 rounded-lg mx-auto mb-4 flex items-center justify-center">
                <Layout className="w-8 h-8 text-gray-400" />
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">No designs found</h3>
              <p className="text-gray-500 mb-4">Get started by creating your first design</p>
              <Link
                href="/"
                className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                <Plus className="w-4 h-4" />
                Create Design
              </Link>
            </div>
          ) : (
            <div className={
              viewMode === 'grid'
                ? 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6'
                : 'space-y-4'
            }>
              {filteredDesigns.map((design) => (
                <DesignCard
                  key={design.id}
                  design={design}
                  viewMode={viewMode}
                  getTypeIcon={getTypeIcon}
                  formatDate={formatDate}
                />
              ))}
            </div>
          )}
        </main>
      </div>
    </AuthGuard>
  )
}

// Helper Components
interface StatCardProps {
  icon: React.ReactNode
  label: string
  value: number
  color: 'blue' | 'green' | 'purple' | 'orange' | 'pink'
}

function StatCard({ icon, label, value, color }: StatCardProps) {
  const colorClasses = {
    blue: 'bg-blue-50 text-blue-600 border-blue-200',
    green: 'bg-green-50 text-green-600 border-green-200',
    purple: 'bg-purple-50 text-purple-600 border-purple-200',
    orange: 'bg-orange-50 text-orange-600 border-orange-200',
    pink: 'bg-pink-50 text-pink-600 border-pink-200',
  }

  return (
    <div className={`p-4 rounded-lg border ${colorClasses[color]}`}>
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium opacity-80">{label}</p>
          <p className="text-2xl font-bold">{value}</p>
        </div>
        <div className="p-2 rounded-lg bg-white/50">
          {icon}
        </div>
      </div>
    </div>
  )
}

interface DesignCardProps {
  design: Design
  viewMode: 'grid' | 'list'
  getTypeIcon: (type: Design['type']) => React.ReactNode
  formatDate: (dateString: string) => string
}

function DesignCard({ design, viewMode, getTypeIcon, formatDate }: DesignCardProps) {
  const [showActions, setShowActions] = useState(false)

  if (viewMode === 'list') {
    return (
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 hover:shadow-md transition-shadow">
        <div className="flex items-center gap-4">
          <div className="w-16 h-12 bg-gray-100 rounded flex-shrink-0">
            <img src={design.thumbnail} alt={design.name} className="w-full h-full object-cover rounded" />
          </div>
          
          <div className="flex-1">
            <div className="flex items-start justify-between">
              <div>
                <h3 className="font-medium text-gray-900">{design.name}</h3>
                <div className="flex items-center gap-4 mt-1 text-sm text-gray-500">
                  <span className="flex items-center gap-1">
                    {getTypeIcon(design.type)}
                    {design.type.replace('-', ' ')}
                  </span>
                  <span>{design.dimensions.width}×{design.dimensions.height}</span>
                  <span>{formatDate(design.updatedAt)}</span>
                </div>
              </div>
              
              <div className="flex items-center gap-2">
                {design.isFavorite && <Star className="w-4 h-4 text-yellow-500 fill-current" />}
                <button
                  onClick={() => setShowActions(!showActions)}
                  className="p-1 hover:bg-gray-100 rounded"
                >
                  <MoreVertical className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition-shadow group">
      <div className="aspect-video relative bg-gray-100">
        <img src={design.thumbnail} alt={design.name} className="w-full h-full object-cover" />
        
        {/* Overlay Actions */}
        <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-40 transition-opacity flex items-center justify-center">
          <div className="opacity-0 group-hover:opacity-100 transition-opacity flex gap-2">
            <Link
              href={`/editor/${design.id}`}
              className="p-2 bg-white text-gray-900 rounded-lg hover:bg-gray-100"
            >
              <Edit className="w-4 h-4" />
            </Link>
            <button className="p-2 bg-white text-gray-900 rounded-lg hover:bg-gray-100">
              <Copy className="w-4 h-4" />
            </button>
            <button className="p-2 bg-white text-gray-900 rounded-lg hover:bg-gray-100">
              <Share2 className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      <div className="p-4">
        <div className="flex items-start justify-between mb-2">
          <h3 className="font-medium text-gray-900 line-clamp-1">{design.name}</h3>
          {design.isFavorite && <Star className="w-4 h-4 text-yellow-500 fill-current flex-shrink-0" />}
        </div>
        
        <div className="flex items-center gap-3 text-sm text-gray-500 mb-3">
          <span className="flex items-center gap-1">
            {getTypeIcon(design.type)}
            {design.type.replace('-', ' ')}
          </span>
          <span>{formatDate(design.updatedAt)}</span>
        </div>

        <div className="flex items-center justify-between text-xs text-gray-500">
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1">
              <Eye className="w-3 h-3" />
              {design.views}
            </span>
            <span className="flex items-center gap-1">
              <Download className="w-3 h-3" />
              {design.downloads}
            </span>
          </div>
          {design.collaborators > 0 && (
            <span className="flex items-center gap-1">
              <Users className="w-3 h-3" />
              {design.collaborators}
            </span>
          )}
        </div>
      </div>
    </div>
  )
}
