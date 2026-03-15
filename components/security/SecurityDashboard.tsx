'use client'

import { useState, useEffect } from 'react'
import { 
  Shield, Lock, Key, Eye, EyeOff, AlertTriangle, Check, X,
  Smartphone, Mail, Clock, Activity, Users, FileText,
  RefreshCw, Download, Settings, LogOut, User, Plus
} from 'lucide-react'

interface SecuritySettings {
  twoFactorEnabled: boolean
  emailNotifications: boolean
  sessionTimeout: number
  loginAlerts: boolean
  apiKeys: Array<{
    id: string
    name: string
    key: string
    permissions: string[]
    created_at: string
    last_used?: string
  }>
  activeSessions: Array<{
    id: string
    device: string
    browser: string
    ip_address: string
    location: string
    created_at: string
    last_active: string
  }>
  securityLogs: Array<{
    id: string
    type: 'login' | 'logout' | 'api_access' | 'security_event'
    description: string
    ip_address: string
    user_agent: string
    success: boolean
    created_at: string
  }>
}

export default function SecurityDashboard() {
  const [settings, setSettings] = useState<SecuritySettings | null>(null)
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<'overview' | 'sessions' | 'api-keys' | 'logs'>('overview')
  const [show2FAModal, setShow2FAModal] = useState(false)
  const [showApiKeyModal, setShowApiKeyModal] = useState(false)

  useEffect(() => {
    fetchSecuritySettings()
  }, [])

  const fetchSecuritySettings = async () => {
    setLoading(true)
    try {
      const token = localStorage.getItem('auth_token')
      const response = await fetch('/api/security', {
        headers: { 'Authorization': `Bearer ${token}` }
      })

      if (response.ok) {
        const data = await response.json()
        setSettings(data)
      }
    } catch (error) {
      console.error('Failed to fetch security settings:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleToggle2FA = async () => {
    try {
      const token = localStorage.getItem('auth_token')
      const response = await fetch('/api/security/2fa', {
        method: 'POST',
        headers: { 
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          enabled: !settings?.twoFactorEnabled
        })
      })

      if (response.ok) {
        setSettings(prev => prev ? {
          ...prev,
          twoFactorEnabled: !prev.twoFactorEnabled
        } : null)
        setShow2FAModal(true)
      }
    } catch (error) {
      console.error('Failed to toggle 2FA:', error)
    }
  }

  const handleRevokeSession = async (sessionId: string) => {
    if (!confirm('Are you sure you want to revoke this session?')) return

    try {
      const token = localStorage.getItem('auth_token')
      const response = await fetch(`/api/security/sessions/${sessionId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      })

      if (response.ok) {
        setSettings(prev => prev ? {
          ...prev,
          activeSessions: prev.activeSessions.filter(s => s.id !== sessionId)
        } : null)
      }
    } catch (error) {
      console.error('Failed to revoke session:', error)
    }
  }

  const handleCreateApiKey = async (name: string, permissions: string[]) => {
    try {
      const token = localStorage.getItem('auth_token')
      const response = await fetch('/api/security/api-keys', {
        method: 'POST',
        headers: { 
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ name, permissions })
      })

      if (response.ok) {
        fetchSecuritySettings()
        setShowApiKeyModal(false)
      }
    } catch (error) {
      console.error('Failed to create API key:', error)
    }
  }

  const handleRevokeApiKey = async (keyId: string) => {
    if (!confirm('Are you sure you want to revoke this API key?')) return

    try {
      const token = localStorage.getItem('auth_token')
      const response = await fetch(`/api/security/api-keys/${keyId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      })

      if (response.ok) {
        setSettings(prev => prev ? {
          ...prev,
          apiKeys: prev.apiKeys.filter(k => k.id !== keyId)
        } : null)
      }
    } catch (error) {
      console.error('Failed to revoke API key:', error)
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString()
  }

  const formatDateTime = (dateString: string) => {
    return new Date(dateString).toLocaleString()
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    )
  }

  if (!settings) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Shield className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Security Settings Unavailable</h2>
          <p className="text-gray-500">Unable to load security settings</p>
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
              <Shield className="w-6 h-6 text-blue-600" />
              <h1 className="text-xl font-semibold">Security Settings</h1>
            </div>
            
            <button className="flex items-center gap-2 px-4 py-2 border border-gray-200 rounded-lg hover:bg-gray-50">
              <RefreshCw className="w-4 h-4" />
              <span>Refresh</span>
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Security Overview */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-lg p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className={`p-2 rounded-lg ${settings.twoFactorEnabled ? 'bg-green-100' : 'bg-red-100'}`}>
                <Lock className={`w-5 h-5 ${settings.twoFactorEnabled ? 'text-green-600' : 'text-red-600'}`} />
              </div>
              <h3 className="font-semibold">2FA Status</h3>
            </div>
            <p className={`text-sm ${settings.twoFactorEnabled ? 'text-green-600' : 'text-red-600'}`}>
              {settings.twoFactorEnabled ? 'Enabled' : 'Disabled'}
            </p>
          </div>

          <div className="bg-white rounded-lg p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Smartphone className="w-5 h-5 text-blue-600" />
              </div>
              <h3 className="font-semibold">Active Sessions</h3>
            </div>
            <p className="text-2xl font-bold">{settings.activeSessions.length}</p>
          </div>

          <div className="bg-white rounded-lg p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-purple-100 rounded-lg">
                <Key className="w-5 h-5 text-purple-600" />
              </div>
              <h3 className="font-semibold">API Keys</h3>
            </div>
            <p className="text-2xl font-bold">{settings.apiKeys.length}</p>
          </div>

          <div className="bg-white rounded-lg p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-orange-100 rounded-lg">
                <Activity className="w-5 h-5 text-orange-600" />
              </div>
              <h3 className="font-semibold">Security Score</h3>
            </div>
            <p className="text-2xl font-bold text-green-600">85%</p>
          </div>
        </div>

        {/* Tabs */}
        <div className="bg-white rounded-lg">
          <div className="border-b">
            <div className="flex">
              {['overview', 'sessions', 'api-keys', 'logs'].map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab as any)}
                  className={`px-6 py-3 text-sm font-medium capitalize ${
                    activeTab === tab
                      ? 'text-blue-600 border-b-2 border-blue-600'
                      : 'text-gray-500 hover:text-gray-700'
                  }`}
                >
                  {tab.replace('-', ' ')}
                </button>
              ))}
            </div>
          </div>

          {/* Tab Content */}
          <div className="p-6">
            {activeTab === 'overview' && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-semibold mb-4">Authentication</h3>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex items-center gap-3">
                        <Lock className="w-5 h-5 text-gray-600" />
                        <div>
                          <p className="font-medium">Two-Factor Authentication</p>
                          <p className="text-sm text-gray-500">Add an extra layer of security to your account</p>
                        </div>
                      </div>
                      <button
                        onClick={handleToggle2FA}
                        className={`px-4 py-2 rounded-lg ${
                          settings.twoFactorEnabled
                            ? 'bg-red-100 text-red-600 hover:bg-red-200'
                            : 'bg-blue-500 text-white hover:bg-blue-600'
                        }`}
                      >
                        {settings.twoFactorEnabled ? 'Disable' : 'Enable'}
                      </button>
                    </div>

                    <div className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex items-center gap-3">
                        <Mail className="w-5 h-5 text-gray-600" />
                        <div>
                          <p className="font-medium">Email Notifications</p>
                          <p className="text-sm text-gray-500">Get notified of security events</p>
                        </div>
                      </div>
                      <button className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600">
                        Configure
                      </button>
                    </div>

                    <div className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex items-center gap-3">
                        <Clock className="w-5 h-5 text-gray-600" />
                        <div>
                          <p className="font-medium">Session Timeout</p>
                          <p className="text-sm text-gray-500">Automatically log out after inactivity</p>
                        </div>
                      </div>
                      <select className="px-3 py-2 border border-gray-200 rounded-lg">
                        <option value="30">30 minutes</option>
                        <option value="60">1 hour</option>
                        <option value="240">4 hours</option>
                        <option value="1440">1 day</option>
                      </select>
                    </div>
                  </div>
                </div>

                <div>
                  <h3 className="text-lg font-semibold mb-4">Login Alerts</h3>
                  <div className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center gap-3">
                      <AlertTriangle className="w-5 h-5 text-gray-600" />
                      <div>
                        <p className="font-medium">Suspicious Login Detection</p>
                        <p className="text-sm text-gray-500">Alert on unusual login activity</p>
                      </div>
                    </div>
                    <button className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600">
                      Configure
                    </button>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'sessions' && (
              <div className="space-y-4">
                <h3 className="text-lg font-semibold mb-4">Active Sessions</h3>
                {settings.activeSessions.map((session) => (
                  <div key={session.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center">
                        <Smartphone className="w-5 h-5 text-gray-600" />
                      </div>
                      <div>
                        <p className="font-medium">{session.device}</p>
                        <p className="text-sm text-gray-500">{session.browser} • {session.location}</p>
                        <p className="text-xs text-gray-400">Last active: {formatDateTime(session.last_active)}</p>
                      </div>
                    </div>
                    <button
                      onClick={() => handleRevokeSession(session.id)}
                      className="px-3 py-1 text-red-600 hover:bg-red-50 rounded"
                    >
                      Revoke
                    </button>
                  </div>
                ))}
              </div>
            )}

            {activeTab === 'api-keys' && (
              <div className="space-y-4">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold">API Keys</h3>
                  <button
                    onClick={() => setShowApiKeyModal(true)}
                    className="flex items-center gap-2 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Create Key</span>
                  </button>
                </div>

                {settings.apiKeys.map((apiKey) => (
                  <div key={apiKey.id} className="p-4 border rounded-lg">
                    <div className="flex items-center justify-between mb-3">
                      <div>
                        <p className="font-medium">{apiKey.name}</p>
                        <p className="text-sm text-gray-500">Created {formatDate(apiKey.created_at)}</p>
                        {apiKey.last_used && (
                          <p className="text-xs text-gray-400">Last used: {formatDate(apiKey.last_used)}</p>
                        )}
                      </div>
                      <button
                        onClick={() => handleRevokeApiKey(apiKey.id)}
                        className="px-3 py-1 text-red-600 hover:bg-red-50 rounded"
                      >
                        Revoke
                      </button>
                    </div>
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <Key className="w-4 h-4 text-gray-400" />
                        <code className="text-sm bg-gray-100 px-2 py-1 rounded font-mono">
                          {apiKey.key.substring(0, 20)}...
                        </code>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {apiKey.permissions.map((permission) => (
                          <span key={permission} className="px-2 py-1 bg-blue-100 text-blue-600 text-xs rounded">
                            {permission}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {activeTab === 'logs' && (
              <div className="space-y-4">
                <h3 className="text-lg font-semibold mb-4">Security Logs</h3>
                {settings.securityLogs.map((log) => (
                  <div key={log.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center gap-4">
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                        log.success ? 'bg-green-100' : 'bg-red-100'
                      }`}>
                        {log.success ? (
                          <Check className="w-5 h-5 text-green-600" />
                        ) : (
                          <X className="w-5 h-5 text-red-600" />
                        )}
                      </div>
                      <div>
                        <p className="font-medium">{log.description}</p>
                        <p className="text-sm text-gray-500">
                          {log.ip_address} • {formatDateTime(log.created_at)}
                        </p>
                      </div>
                    </div>
                    <span className={`px-2 py-1 text-xs rounded ${
                      log.type === 'login' ? 'bg-blue-100 text-blue-600' :
                      log.type === 'logout' ? 'bg-gray-100 text-gray-600' :
                      log.type === 'api_access' ? 'bg-purple-100 text-purple-600' :
                      'bg-orange-100 text-orange-600'
                    }`}>
                      {log.type.replace('_', ' ')}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 2FA Setup Modal */}
      {show2FAModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg w-full max-w-md mx-4">
            <div className="flex items-center justify-between p-6 border-b">
              <h3 className="text-xl font-semibold">
                {settings.twoFactorEnabled ? '2FA Disabled' : '2FA Enabled'}
              </h3>
              <button
                onClick={() => setShow2FAModal(false)}
                className="p-2 hover:bg-gray-100 rounded-lg"
              >
                ×
              </button>
            </div>

            <div className="p-6">
              <div className="text-center">
                {settings.twoFactorEnabled ? (
                  <div>
                    <X className="w-16 h-16 text-red-600 mx-auto mb-4" />
                    <p className="text-lg font-medium mb-2">Two-factor authentication has been disabled</p>
                    <p className="text-gray-500">Your account is now less secure</p>
                  </div>
                ) : (
                  <div>
                    <Check className="w-16 h-16 text-green-600 mx-auto mb-4" />
                    <p className="text-lg font-medium mb-2">Two-factor authentication is now enabled</p>
                    <p className="text-gray-500">Your account is more secure</p>
                  </div>
                )}
              </div>

              <button
                onClick={() => setShow2FAModal(false)}
                className="w-full px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
              >
                Got it
              </button>
            </div>
          </div>
        </div>
      )}

      {/* API Key Creation Modal */}
      {showApiKeyModal && (
        <ApiKeyModal
          onClose={() => setShowApiKeyModal(false)}
          onCreateKey={handleCreateApiKey}
        />
      )}
    </div>
  )
}

interface ApiKeyModalProps {
  onClose: () => void
  onCreateKey: (name: string, permissions: string[]) => void
}

function ApiKeyModal({ onClose, onCreateKey }: ApiKeyModalProps) {
  const [name, setName] = useState('')
  const [permissions, setPermissions] = useState<string[]>([])
  const [creating, setCreating] = useState(false)

  const availablePermissions = [
    'read_designs',
    'write_designs',
    'delete_designs',
    'read_assets',
    'write_assets',
    'delete_assets',
    'read_analytics',
    'manage_team'
  ]

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!name.trim() || permissions.length === 0) return

    setCreating(true)
    try {
      await onCreateKey(name, permissions)
    } finally {
      setCreating(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg w-full max-w-md mx-4">
        <div className="flex items-center justify-between p-6 border-b">
          <h3 className="text-xl font-semibold">Create API Key</h3>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg"
          >
            ×
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">Key Name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g., Mobile App API"
              className="w-full px-3 py-2 border border-gray-200 rounded-lg"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Permissions</label>
            <div className="space-y-2 max-h-40 overflow-y-auto border border-gray-200 rounded-lg p-3">
              {availablePermissions.map((permission) => (
                <label key={permission} className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    value={permission}
                    checked={permissions.includes(permission)}
                    onChange={(e) => {
                      if (e.target.checked) {
                        setPermissions(prev => [...prev, permission])
                      } else {
                        setPermissions(prev => prev.filter(p => p !== permission))
                      }
                    }}
                    className="rounded"
                  />
                  <span className="text-sm">{permission.replace('_', ' ')}</span>
                </label>
              ))}
            </div>
          </div>

          <div className="flex gap-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-gray-200 rounded-lg hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={creating || !name.trim() || permissions.length === 0}
              className="flex-1 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50"
            >
              {creating ? 'Creating...' : 'Create Key'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
