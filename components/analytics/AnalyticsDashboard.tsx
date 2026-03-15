'use client'

import { useState, useEffect } from 'react'
import { 
  TrendingUp, TrendingDown, Users, Eye, Download, Clock, Calendar,
  BarChart3, PieChart, Activity, Target, Zap, FileText, Share2,
  Filter, ChevronDown, ArrowUp, ArrowDown, MoreVertical
} from 'lucide-react'

interface AnalyticsData {
  overview: {
    total_designs: number
    total_views: number
    total_downloads: number
    total_shares: number
    active_users: number
    storage_used: number
    storage_limit: number
  }
  trends: {
    designs_created: Array<{ date: string; count: number }>
    views: Array<{ date: string; count: number }>
    downloads: Array<{ date: string; count: number }>
    shares: Array<{ date: string; count: number }>
  }
  top_designs: Array<{
    id: string
    name: string
    views: number
    downloads: number
    shares: number
    created_at: string
    thumbnail?: string
  }>
  user_activity: Array<{
    user_id: string
    name: string
    email: string
    designs_created: number
    last_active: string
    activity_score: number
  }>
  performance_metrics: {
    avg_load_time: number
    avg_render_time: number
    error_rate: number
    uptime: number
  }
}

interface AnalyticsDashboardProps {
  teamId?: string
  timeRange?: '7d' | '30d' | '90d' | '1y'
}

export default function AnalyticsDashboard({ teamId, timeRange = '30d' }: AnalyticsDashboardProps) {
  const [data, setData] = useState<AnalyticsData | null>(null)
  const [loading, setLoading] = useState(true)
  const [selectedTimeRange, setSelectedTimeRange] = useState(timeRange)
  const [activeTab, setActiveTab] = useState<'overview' | 'designs' | 'users' | 'performance'>('overview')

  useEffect(() => {
    fetchAnalytics()
  }, [selectedTimeRange, teamId])

  const fetchAnalytics = async () => {
    setLoading(true)
    try {
      const token = localStorage.getItem('auth_token')
      const params = new URLSearchParams({
        time_range: selectedTimeRange,
        team_id: teamId || ''
      })
      
      const response = await fetch(`/api/analytics?${params}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      })

      if (response.ok) {
        const analyticsData = await response.json()
        setData(analyticsData)
      }
    } catch (error) {
      console.error('Failed to fetch analytics:', error)
    } finally {
      setLoading(false)
    }
  }

  const formatNumber = (num: number) => {
    if (num >= 1000000) {
      return (num / 1000000).toFixed(1) + 'M'
    } else if (num >= 1000) {
      return (num / 1000).toFixed(1) + 'K'
    }
    return num.toString()
  }

  const formatPercentage = (value: number, total: number) => {
    if (total === 0) return '0%'
    return ((value / total) * 100).toFixed(1) + '%'
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString()
  }

  const getTrendIcon = (trend: 'up' | 'down' | 'stable') => {
    switch (trend) {
      case 'up': return TrendingUp
      case 'down': return TrendingDown
      default: return Activity
    }
  }

  const getTrendColor = (trend: 'up' | 'down' | 'stable') => {
    switch (trend) {
      case 'up': return 'text-green-600'
      case 'down': return 'text-red-600'
      default: return 'text-gray-600'
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    )
  }

  if (!data) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <BarChart3 className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">No Analytics Data</h2>
          <p className="text-gray-500">Analytics data will appear here once you have activity</p>
        </div>
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
              <BarChart3 className="w-6 h-6 text-blue-600" />
              <h1 className="text-xl font-semibold">Analytics & Insights</h1>
            </div>
            
            <div className="flex items-center gap-4">
              {/* Time Range Selector */}
              <div className="relative">
                <button className="flex items-center gap-2 px-4 py-2 border border-gray-200 rounded-lg hover:bg-gray-50">
                  <Calendar className="w-4 h-4" />
                  <span className="capitalize">{selectedTimeRange}</span>
                  <ChevronDown className="w-4 h-4" />
                </button>
                
                <div className="absolute top-full right-0 mt-1 w-48 bg-white border rounded-lg shadow-lg z-10">
                  {['7d', '30d', '90d', '1y'].map((range) => (
                    <button
                      key={range}
                      onClick={() => setSelectedTimeRange(range as any)}
                      className="w-full px-4 py-2 text-left hover:bg-gray-50 capitalize"
                    >
                      {range === '7d' && 'Last 7 days'}
                      {range === '30d' && 'Last 30 days'}
                      {range === '90d' && 'Last 90 days'}
                      {range === '1y' && 'Last year'}
                    </button>
                  ))}
                </div>
              </div>

              <button className="flex items-center gap-2 px-4 py-2 border border-gray-200 rounded-lg hover:bg-gray-50">
                <Filter className="w-4 h-4" />
                <span>Filter</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex">
            {['overview', 'designs', 'users', 'performance'].map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab as any)}
                className={`px-6 py-3 text-sm font-medium capitalize ${
                  activeTab === tab
                    ? 'text-blue-600 border-b-2 border-blue-600'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                {tab}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {activeTab === 'overview' && (
          <div className="space-y-6">
            {/* Overview Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <MetricCard
                title="Total Designs"
                value={data.overview.total_designs}
                icon={FileText}
                trend="up"
                description="All created designs"
              />
              
              <MetricCard
                title="Total Views"
                value={data.overview.total_views}
                icon={Eye}
                trend="up"
                description="Design views"
              />
              
              <MetricCard
                title="Total Downloads"
                value={data.overview.total_downloads}
                icon={Download}
                trend="up"
                description="Design downloads"
              />
              
              <MetricCard
                title="Total Shares"
                value={data.overview.total_shares}
                icon={Share2}
                trend="up"
                description="Design shares"
              />
            </div>

            {/* Storage Usage */}
            <div className="bg-white rounded-lg p-6">
              <h3 className="text-lg font-semibold mb-4">Storage Usage</h3>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Used Storage</span>
                  <span>{formatNumber(data.overview.storage_used)} / {formatNumber(data.overview.storage_limit)}</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-blue-500 h-2 rounded-full"
                    style={{ width: `${(data.overview.storage_used / data.overview.storage_limit) * 100}%` }}
                  />
                </div>
                <div className="text-xs text-gray-500">
                  {formatPercentage(data.overview.storage_used, data.overview.storage_limit)} used
                </div>
              </div>
            </div>

            {/* Trends Chart */}
            <div className="bg-white rounded-lg p-6">
              <h3 className="text-lg font-semibold mb-4">Activity Trends</h3>
              <div className="h-64 bg-gray-50 rounded-lg flex items-center justify-center">
                <p className="text-gray-500">Chart visualization would go here</p>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'designs' && (
          <div className="space-y-6">
            <div className="bg-white rounded-lg">
              <div className="p-6 border-b">
                <h3 className="text-lg font-semibold">Top Performing Designs</h3>
              </div>
              
              <div className="divide-y">
                {data.top_designs.map((design, index) => (
                  <div key={design.id} className="p-6 flex items-center gap-4">
                    <div className="text-2xl font-bold text-gray-400">#{index + 1}</div>
                    
                    {design.thumbnail ? (
                      <img
                        src={design.thumbnail}
                        alt={design.name}
                        className="w-16 h-16 object-cover rounded-lg"
                      />
                    ) : (
                      <div className="w-16 h-16 bg-gray-200 rounded-lg flex items-center justify-center">
                        <FileText className="w-6 h-6 text-gray-400" />
                      </div>
                    )}
                    
                    <div className="flex-1">
                      <h4 className="font-medium">{design.name}</h4>
                      <p className="text-sm text-gray-500">Created {formatDate(design.created_at)}</p>
                    </div>
                    
                    <div className="flex items-center gap-6 text-sm">
                      <div className="text-center">
                        <div className="font-semibold">{formatNumber(design.views)}</div>
                        <div className="text-gray-500">Views</div>
                      </div>
                      <div className="text-center">
                        <div className="font-semibold">{formatNumber(design.downloads)}</div>
                        <div className="text-gray-500">Downloads</div>
                      </div>
                      <div className="text-center">
                        <div className="font-semibold">{formatNumber(design.shares)}</div>
                        <div className="text-gray-500">Shares</div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'users' && (
          <div className="space-y-6">
            <div className="bg-white rounded-lg">
              <div className="p-6 border-b">
                <h3 className="text-lg font-semibold">User Activity</h3>
              </div>
              
              <div className="divide-y">
                {data.user_activity.map((user) => (
                  <div key={user.user_id} className="p-6 flex items-center gap-4">
                    <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center">
                      <Users className="w-5 h-5 text-gray-600" />
                    </div>
                    
                    <div className="flex-1">
                      <h4 className="font-medium">{user.name}</h4>
                      <p className="text-sm text-gray-500">{user.email}</p>
                      <p className="text-xs text-gray-500">Last active {formatDate(user.last_active)}</p>
                    </div>
                    
                    <div className="flex items-center gap-6 text-sm">
                      <div className="text-center">
                        <div className="font-semibold">{user.designs_created}</div>
                        <div className="text-gray-500">Designs</div>
                      </div>
                      <div className="text-center">
                        <div className="font-semibold">{user.activity_score}</div>
                        <div className="text-gray-500">Score</div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'performance' && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <MetricCard
                title="Avg Load Time"
                value={`${data.performance_metrics.avg_load_time}ms`}
                icon={Zap}
                trend="down"
                description="Page load time"
              />
              
              <MetricCard
                title="Avg Render Time"
                value={`${data.performance_metrics.avg_render_time}ms`}
                icon={Activity}
                trend="down"
                description="Canvas render"
              />
              
              <MetricCard
                title="Error Rate"
                value={`${data.performance_metrics.error_rate}%`}
                icon={Target}
                trend="down"
                description="Error percentage"
              />
              
              <MetricCard
                title="Uptime"
                value={`${data.performance_metrics.uptime}%`}
                icon={Clock}
                trend="up"
                description="System uptime"
              />
            </div>

            <div className="bg-white rounded-lg p-6">
              <h3 className="text-lg font-semibold mb-4">Performance Metrics</h3>
              <div className="space-y-4">
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Average Response Time</span>
                  <span className="font-semibold">{data.performance_metrics.avg_load_time}ms</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Peak Concurrent Users</span>
                  <span className="font-semibold">{data.overview.active_users}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Error Rate (24h)</span>
                  <span className="font-semibold">{data.performance_metrics.error_rate}%</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">System Uptime (30d)</span>
                  <span className="font-semibold">{data.performance_metrics.uptime}%</span>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

interface MetricCardProps {
  title: string
  value: string | number
  icon: any
  trend: 'up' | 'down' | 'stable'
  description: string
}

function MetricCard({ title, value, icon: Icon, trend, description }: MetricCardProps) {
  const getTrendIcon = (trend: 'up' | 'down' | 'stable') => {
    switch (trend) {
      case 'up': return TrendingUp
      case 'down': return TrendingDown
      default: return Activity
    }
  }

  const getTrendColor = (trend: 'up' | 'down' | 'stable') => {
    switch (trend) {
      case 'up': return 'text-green-600'
      case 'down': return 'text-red-600'
      default: return 'text-gray-600'
    }
  }

  const TrendIcon = getTrendIcon(trend)
  const trendColor = getTrendColor(trend)

  return (
    <div className="bg-white rounded-lg p-6">
      <div className="flex items-center justify-between mb-4">
        <div className={`p-2 rounded-lg ${trend === 'up' ? 'bg-green-100' : trend === 'down' ? 'bg-red-100' : 'bg-gray-100'}`}>
          <Icon className={`w-5 h-5 ${trendColor}`} />
        </div>
        <TrendIcon className={`w-4 h-4 ${trendColor}`} />
      </div>
      
      <div>
        <p className="text-2xl font-bold">{value}</p>
        <p className="text-sm text-gray-600">{title}</p>
      </div>
      
      <p className="text-xs text-gray-500 mt-2">{description}</p>
    </div>
  )
}
