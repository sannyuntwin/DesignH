'use client'

import { useState, useEffect } from 'react'
import { X, Download, FileImage, FileText, Loader2, CheckCircle, AlertCircle } from 'lucide-react'

interface ExportModalProps {
  isOpen: boolean
  onClose: () => void
  designId: string
  designName: string
}

interface ExportJob {
  id: string
  status: 'processing' | 'completed' | 'failed'
  file_url?: string
  error_message?: string
  created_at: string
}

const EXPORT_FORMATS = [
  {
    id: 'png',
    name: 'PNG',
    description: 'High quality image with transparent background',
    icon: FileImage,
    qualities: ['1x', '2x', '3x']
  },
  {
    id: 'pdf',
    name: 'PDF',
    description: 'Document format for printing and sharing',
    icon: FileText,
    qualities: ['Standard', 'High Quality', 'Print Ready']
  },
  {
    id: 'svg',
    name: 'SVG',
    description: 'Scalable vector format',
    icon: FileImage,
    qualities: ['Original Size']
  }
]

export default function ExportModal({ isOpen, onClose, designId, designName }: ExportModalProps) {
  const [selectedFormat, setSelectedFormat] = useState('png')
  const [selectedQuality, setSelectedQuality] = useState('1x')
  const [exportJob, setExportJob] = useState<ExportJob | null>(null)
  const [isExporting, setIsExporting] = useState(false)
  const [pollInterval, setPollInterval] = useState<NodeJS.Timeout | null>(null)

  useEffect(() => {
    if (!isOpen) {
      // Cleanup when modal closes
      if (pollInterval) {
        clearInterval(pollInterval)
        setPollInterval(null)
      }
      setExportJob(null)
      setIsExporting(false)
    }
    return () => {
      if (pollInterval) {
        clearInterval(pollInterval)
      }
    }
  }, [isOpen, pollInterval])

  const startExport = async () => {
    setIsExporting(true)
    try {
      const userId = 'demo-user' // Replace with actual user ID from auth
      const response = await fetch(`/api/designs/${designId}/export/${selectedFormat}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          user_id: userId,
          quality: selectedQuality
        })
      })

      if (response.ok) {
        const data = await response.json()
        setExportJob({
          id: data.job_id,
          status: 'processing',
          created_at: new Date().toISOString()
        })
        
        // Start polling for job completion
        pollJobStatus(data.job_id)
      } else {
        throw new Error('Failed to start export')
      }
    } catch (error) {
      console.error('Export error:', error)
      setIsExporting(false)
    }
  }

  const pollJobStatus = (jobId: string) => {
    const interval = setInterval(async () => {
      try {
        const response = await fetch(`/api/export/${jobId}`)
        if (response.ok) {
          const job = await response.json()
          setExportJob(job)
          
          if (job.status === 'completed' || job.status === 'failed') {
            clearInterval(interval)
            setPollInterval(null)
            setIsExporting(false)
          }
        }
      } catch (error) {
        console.error('Polling error:', error)
        clearInterval(interval)
        setPollInterval(null)
        setIsExporting(false)
      }
    }, 2000) // Poll every 2 seconds
    
    setPollInterval(interval)
  }

  const downloadFile = () => {
    if (exportJob?.file_url) {
      const link = document.createElement('a')
      link.href = exportJob.file_url
      link.download = `${designName.replace(/[^a-zA-Z0-9]/g, '_')}.${selectedFormat}`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
    }
  }

  const resetExport = () => {
    setExportJob(null)
    setIsExporting(false)
    if (pollInterval) {
      clearInterval(pollInterval)
      setPollInterval(null)
    }
  }

  if (!isOpen) return null

  const currentFormat = EXPORT_FORMATS.find(f => f.id === selectedFormat)

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg w-full max-w-md mx-4">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b">
          <h2 className="text-xl font-semibold">Export Design</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Design Info */}
          <div className="text-sm text-gray-600">
            Exporting: <span className="font-medium text-gray-900">{designName}</span>
          </div>

          {/* Format Selection */}
          {!exportJob && (
            <div className="space-y-3">
              <h3 className="font-medium">Choose Format</h3>
              <div className="grid gap-2">
                {EXPORT_FORMATS.map((format) => {
                  const Icon = format.icon
                  return (
                    <button
                      key={format.id}
                      onClick={() => setSelectedFormat(format.id)}
                      className={`p-3 border rounded-lg text-left transition-colors ${
                        selectedFormat === format.id
                          ? 'border-blue-500 bg-blue-50'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <Icon className="w-5 h-5" />
                        <div>
                          <div className="font-medium">{format.name}</div>
                          <div className="text-sm text-gray-500">{format.description}</div>
                        </div>
                      </div>
                    </button>
                  )
                })}
              </div>
            </div>
          )}

          {/* Quality Selection */}
          {!exportJob && currentFormat && (
            <div className="space-y-3">
              <h3 className="font-medium">Quality</h3>
              <div className="flex gap-2">
                {currentFormat.qualities.map((quality) => (
                  <button
                    key={quality}
                    onClick={() => setSelectedQuality(quality)}
                    className={`px-3 py-2 border rounded-lg text-sm transition-colors ${
                      selectedQuality === quality
                        ? 'border-blue-500 bg-blue-50 text-blue-600'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    {quality}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Export Progress */}
          {exportJob && (
            <div className="space-y-4">
              <div className="flex items-center gap-3 p-4 border rounded-lg">
                {exportJob.status === 'processing' && (
                  <>
                    <Loader2 className="w-5 h-5 text-blue-500 animate-spin" />
                    <div>
                      <div className="font-medium">Exporting...</div>
                      <div className="text-sm text-gray-500">Please wait while we process your design</div>
                    </div>
                  </>
                )}
                
                {exportJob.status === 'completed' && (
                  <>
                    <CheckCircle className="w-5 h-5 text-green-500" />
                    <div>
                      <div className="font-medium">Export Complete!</div>
                      <div className="text-sm text-gray-500">Your design is ready to download</div>
                    </div>
                  </>
                )}
                
                {exportJob.status === 'failed' && (
                  <>
                    <AlertCircle className="w-5 h-5 text-red-500" />
                    <div>
                      <div className="font-medium">Export Failed</div>
                      <div className="text-sm text-gray-500">
                        {exportJob.error_message || 'Something went wrong. Please try again.'}
                      </div>
                    </div>
                  </>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center gap-3 p-6 border-t">
          {exportJob?.status === 'completed' ? (
            <>
              <button
                onClick={downloadFile}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
              >
                <Download className="w-4 h-4" />
                Download
              </button>
              <button
                onClick={resetExport}
                className="px-4 py-2 border border-gray-200 rounded-lg hover:bg-gray-50"
              >
                Export Again
              </button>
            </>
          ) : exportJob?.status === 'failed' ? (
            <>
              <button
                onClick={resetExport}
                className="flex-1 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
              >
                Try Again
              </button>
              <button
                onClick={onClose}
                className="px-4 py-2 border border-gray-200 rounded-lg hover:bg-gray-50"
              >
                Cancel
              </button>
            </>
          ) : (
            <>
              <button
                onClick={startExport}
                disabled={isExporting}
                className="flex-1 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50"
              >
                {isExporting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin inline mr-2" />
                    Exporting...
                  </>
                ) : (
                  'Export'
                )}
              </button>
              <button
                onClick={onClose}
                disabled={isExporting}
                className="px-4 py-2 border border-gray-200 rounded-lg hover:bg-gray-50 disabled:opacity-50"
              >
                Cancel
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
