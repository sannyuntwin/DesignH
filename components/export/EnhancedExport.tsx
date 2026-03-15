'use client'

import { useState, useEffect } from 'react'
import { 
  Download, FileText, Image, Video, Code, Archive, Settings, 
  Check, X, AlertCircle, Clock, Zap, Layers, Palette,
  ChevronDown, Plus, Trash2, Eye, Share2, Copy
} from 'lucide-react'

interface ExportPreset {
  id: string
  name: string
  format: string
  settings: {
    quality?: number
    resolution?: number
    backgroundColor?: string
    includeLayers?: boolean
    compression?: number
  }
}

interface ExportJob {
  id: string
  designId: string
  format: string
  settings: any
  status: 'pending' | 'processing' | 'completed' | 'failed'
  progress: number
  downloadUrl?: string
  createdAt: string
  completedAt?: string
  fileSize?: number
}

interface EnhancedExportProps {
  designId: string
  onExportComplete?: (job: ExportJob) => void
}

export default function EnhancedExport({ designId, onExportComplete }: EnhancedExportProps) {
  const [exportJobs, setExportJobs] = useState<ExportJob[]>([])
  const [showExportModal, setShowExportModal] = useState(false)
  const [selectedFormat, setSelectedFormat] = useState('png')
  const [exportSettings, setExportSettings] = useState({
    quality: 90,
    resolution: 2, // 2x for retina displays
    backgroundColor: '#ffffff',
    includeLayers: false,
    compression: 80
  })
  const [loading, setLoading] = useState(false)

  const exportFormats = [
    {
      id: 'png',
      name: 'PNG',
      description: 'Best for web use with transparency',
      icon: Image,
      settings: ['quality', 'resolution', 'backgroundColor']
    },
    {
      id: 'jpg',
      name: 'JPEG',
      description: 'Compressed format for photos',
      icon: Image,
      settings: ['quality', 'resolution', 'backgroundColor']
    },
    {
      id: 'svg',
      name: 'SVG',
      description: 'Vector format for scalability',
      icon: Code,
      settings: ['includeLayers']
    },
    {
      id: 'pdf',
      name: 'PDF',
      description: 'Document format for printing',
      icon: FileText,
      settings: ['quality', 'resolution', 'backgroundColor']
    },
    {
      id: 'webp',
      name: 'WebP',
      description: 'Modern web format with compression',
      icon: Image,
      settings: ['quality', 'resolution', 'backgroundColor', 'compression']
    },
    {
      id: 'mp4',
      name: 'MP4 Video',
      description: 'Video format for animations',
      icon: Video,
      settings: ['quality', 'resolution', 'backgroundColor']
    },
    {
      id: 'zip',
      name: 'ZIP Archive',
      description: 'All assets and design files',
      icon: Archive,
      settings: []
    }
  ]

  const exportPresets: ExportPreset[] = [
    {
      id: 'web-optimized',
      name: 'Web Optimized',
      format: 'png',
      settings: {
        quality: 80,
        resolution: 1,
        backgroundColor: 'transparent'
      }
    },
    {
      id: 'print-ready',
      name: 'Print Ready',
      format: 'pdf',
      settings: {
        quality: 100,
        resolution: 3,
        backgroundColor: '#ffffff'
      }
    },
    {
      id: 'social-media',
      name: 'Social Media',
      format: 'jpg',
      settings: {
        quality: 85,
        resolution: 2,
        backgroundColor: '#ffffff'
      }
    },
    {
      id: 'development',
      name: 'Development',
      format: 'svg',
      settings: {
        includeLayers: true
      }
    }
  ]

  useEffect(() => {
    fetchExportJobs()
  }, [designId])

  const fetchExportJobs = async () => {
    try {
      const token = localStorage.getItem('auth_token')
      const response = await fetch(`/api/designs/${designId}/exports`, {
        headers: { 'Authorization': `Bearer ${token}` }
      })

      if (response.ok) {
        const data = await response.json()
        setExportJobs(data.jobs || [])
      }
    } catch (error) {
      console.error('Failed to fetch export jobs:', error)
    }
  }

  const handleExport = async () => {
    setLoading(true)
    try {
      const token = localStorage.getItem('auth_token')
      const response = await fetch(`/api/designs/${designId}/export/${selectedFormat}`, {
        method: 'POST',
        headers: { 
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(exportSettings)
      })

      if (response.ok) {
        const data = await response.json()
        setExportJobs(prev => [data.job, ...prev])
        setShowExportModal(false)
        onExportComplete?.(data.job)
      }
    } catch (error) {
      console.error('Export failed:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleDownload = async (job: ExportJob) => {
    if (!job.downloadUrl) return

    try {
      const token = localStorage.getItem('auth_token')
      const response = await fetch(job.downloadUrl, {
        headers: { 'Authorization': `Bearer ${token}` }
      })

      if (response.ok) {
        const blob = await response.blob()
        const url = window.URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `design-${job.format}.${job.format}`
        document.body.appendChild(a)
        a.click()
        document.body.removeChild(a)
        window.URL.revokeObjectURL(url)
      }
    } catch (error) {
      console.error('Download failed:', error)
    }
  }

  const handleDeleteJob = async (jobId: string) => {
    if (!confirm('Are you sure you want to delete this export job?')) return

    try {
      const token = localStorage.getItem('auth_token')
      const response = await fetch(`/api/exports/${jobId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      })

      if (response.ok) {
        setExportJobs(prev => prev.filter(job => job.id !== jobId))
      }
    } catch (error) {
      console.error('Failed to delete export job:', error)
    }
  }

  const getStatusIcon = (status: ExportJob['status']) => {
    switch (status) {
      case 'pending': return Clock
      case 'processing': return Zap
      case 'completed': return Check
      case 'failed': return X
      default: return AlertCircle
    }
  }

  const getStatusColor = (status: ExportJob['status']) => {
    switch (status) {
      case 'pending': return 'text-yellow-600'
      case 'processing': return 'text-blue-600'
      case 'completed': return 'text-green-600'
      case 'failed': return 'text-red-600'
      default: return 'text-gray-600'
    }
  }

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  const currentFormat = exportFormats.find(f => f.id === selectedFormat)

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-4">
              <Download className="w-6 h-6 text-blue-600" />
              <h1 className="text-xl font-semibold">Export Design</h1>
            </div>
            
            <button
              onClick={() => setShowExportModal(true)}
              className="flex items-center gap-2 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
            >
              <Plus className="w-4 h-4" />
              <span>New Export</span>
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Export Jobs */}
        <div className="bg-white rounded-lg">
          <div className="p-6 border-b">
            <h2 className="text-lg font-semibold">Export History</h2>
          </div>

          {exportJobs.length === 0 ? (
            <div className="text-center py-12">
              <Download className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No exports yet</h3>
              <p className="text-gray-500">Create your first export to get started</p>
            </div>
          ) : (
            <div className="divide-y">
              {exportJobs.map((job) => {
                const StatusIcon = getStatusIcon(job.status)
                return (
                  <div key={job.id} className="p-4 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className={`p-2 rounded-lg ${
                        job.status === 'completed' ? 'bg-green-100' :
                        job.status === 'processing' ? 'bg-blue-100' :
                        job.status === 'failed' ? 'bg-red-100' :
                        'bg-yellow-100'
                      }`}>
                        <StatusIcon className={`w-5 h-5 ${getStatusColor(job.status)}`} />
                      </div>
                      
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-medium uppercase">{job.format}</span>
                          <span className={`px-2 py-1 text-xs rounded ${
                            job.status === 'completed' ? 'bg-green-100 text-green-600' :
                            job.status === 'processing' ? 'bg-blue-100 text-blue-600' :
                            job.status === 'failed' ? 'bg-red-100 text-red-600' :
                            'bg-yellow-100 text-yellow-600'
                          }`}>
                            {job.status}
                          </span>
                        </div>
                        <p className="text-sm text-gray-500">
                          Created {new Date(job.createdAt).toLocaleString()}
                        </p>
                        {job.completedAt && (
                          <p className="text-sm text-gray-500">
                            Completed {new Date(job.completedAt).toLocaleString()}
                          </p>
                        )}
                        {job.fileSize && (
                          <p className="text-sm text-gray-500">
                            Size: {formatFileSize(job.fileSize)}
                          </p>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      {job.status === 'processing' && (
                        <div className="w-32">
                          <div className="flex items-center justify-between text-xs text-gray-500 mb-1">
                            <span>{job.progress}%</span>
                          </div>
                          <div className="w-full bg-gray-200 rounded-full h-2">
                            <div
                              className="bg-blue-500 h-2 rounded-full transition-all"
                              style={{ width: `${job.progress}%` }}
                            />
                          </div>
                        </div>
                      )}
                      
                      {job.status === 'completed' && job.downloadUrl && (
                        <button
                          onClick={() => handleDownload(job)}
                          className="p-2 hover:bg-gray-100 rounded"
                        >
                          <Download className="w-4 h-4" />
                        </button>
                      )}
                      
                      <button
                        onClick={() => handleDeleteJob(job.id)}
                        className="p-2 hover:bg-red-100 rounded text-red-600"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>

      {/* Export Modal */}
      {showExportModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg w-full max-w-2xl mx-4 max-h-[80vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b">
              <h2 className="text-xl font-semibold">Export Design</h2>
              <button
                onClick={() => setShowExportModal(false)}
                className="p-2 hover:bg-gray-100 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6">
              {/* Format Selection */}
              <div className="mb-6">
                <h3 className="text-lg font-medium mb-4">Choose Format</h3>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  {exportFormats.map((format) => {
                    const Icon = format.icon
                    return (
                      <button
                        key={format.id}
                        onClick={() => setSelectedFormat(format.id)}
                        className={`p-4 border rounded-lg text-left ${
                          selectedFormat === format.id
                            ? 'border-blue-500 bg-blue-50'
                            : 'border-gray-200 hover:border-gray-300'
                        }`}
                      >
                        <div className="flex items-center gap-3 mb-2">
                          <Icon className="w-6 h-6 text-gray-600" />
                          <span className="font-medium">{format.name}</span>
                        </div>
                        <p className="text-sm text-gray-500">{format.description}</p>
                      </button>
                    )
                  })}
                </div>
              </div>

              {/* Export Settings */}
              {currentFormat && (
                <div className="mb-6">
                  <h3 className="text-lg font-medium mb-4">Export Settings</h3>
                  
                  {currentFormat.settings.includes('quality') && (
                    <div className="mb-4">
                      <label className="block text-sm font-medium mb-2">
                        Quality: {exportSettings.quality}%
                      </label>
                      <input
                        type="range"
                        min="10"
                        max="100"
                        value={exportSettings.quality}
                        onChange={(e) => setExportSettings(prev => ({
                          ...prev,
                          quality: Number(e.target.value)
                        }))}
                        className="w-full"
                      />
                    </div>
                  )}

                  {currentFormat.settings.includes('resolution') && (
                    <div className="mb-4">
                      <label className="block text-sm font-medium mb-2">
                        Resolution: {exportSettings.resolution}x
                      </label>
                      <select
                        value={exportSettings.resolution}
                        onChange={(e) => setExportSettings(prev => ({
                          ...prev,
                          resolution: Number(e.target.value)
                        }))}
                        className="w-full px-3 py-2 border border-gray-200 rounded-lg"
                      >
                        <option value="1">1x (Standard)</option>
                        <option value="2">2x (Retina)</option>
                        <option value="3">3x (High DPI)</option>
                      </select>
                    </div>
                  )}

                  {currentFormat.settings.includes('backgroundColor') && (
                    <div className="mb-4">
                      <label className="block text-sm font-medium mb-2">Background Color</label>
                      <div className="flex items-center gap-2">
                        <input
                          type="color"
                          value={exportSettings.backgroundColor}
                          onChange={(e) => setExportSettings(prev => ({
                            ...prev,
                            backgroundColor: e.target.value
                          }))}
                          className="w-12 h-12 border border-gray-200 rounded cursor-pointer"
                        />
                        <input
                          type="text"
                          value={exportSettings.backgroundColor}
                          onChange={(e) => setExportSettings(prev => ({
                            ...prev,
                            backgroundColor: e.target.value
                          }))}
                          className="flex-1 px-3 py-2 border border-gray-200 rounded-lg"
                        />
                      </div>
                    </div>
                  )}

                  {currentFormat.settings.includes('compression') && (
                    <div className="mb-4">
                      <label className="block text-sm font-medium mb-2">
                        Compression: {exportSettings.compression}%
                      </label>
                      <input
                        type="range"
                        min="0"
                        max="100"
                        value={exportSettings.compression}
                        onChange={(e) => setExportSettings(prev => ({
                          ...prev,
                          compression: Number(e.target.value)
                        }))}
                        className="w-full"
                      />
                    </div>
                  )}

                  {currentFormat.settings.includes('includeLayers') && (
                    <div className="mb-4">
                      <label className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          checked={exportSettings.includeLayers}
                          onChange={(e) => setExportSettings(prev => ({
                            ...prev,
                            includeLayers: e.target.checked
                          }))}
                          className="rounded"
                        />
                        <span className="text-sm font-medium">Include layers</span>
                      </label>
                    </div>
                  )}
                </div>
              )}

              {/* Export Presets */}
              <div className="mb-6">
                <h3 className="text-lg font-medium mb-4">Quick Presets</h3>
                <div className="grid grid-cols-2 gap-3">
                  {exportPresets.map((preset) => (
                    <button
                      key={preset.id}
                      onClick={() => {
                        setSelectedFormat(preset.format)
                        setExportSettings(prev => ({ ...prev, ...preset.settings }))
                      }}
                      className="p-3 border border-gray-200 rounded-lg hover:border-gray-300 text-left"
                    >
                      <div className="font-medium">{preset.name}</div>
                      <div className="text-sm text-gray-500 uppercase">{preset.format}</div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Actions */}
              <div className="flex justify-end gap-3">
                <button
                  onClick={() => setShowExportModal(false)}
                  className="px-4 py-2 border border-gray-200 rounded-lg hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleExport}
                  disabled={loading}
                  className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50"
                >
                  {loading ? 'Exporting...' : `Export as ${currentFormat?.name.toUpperCase()}`}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
