'use client'

import { useState, useEffect } from 'react'
import { User, Mail, Calendar, Settings, LogOut, Camera, Edit2, Save, X } from 'lucide-react'

interface UserProfile {
  id: string
  name: string
  email: string
  avatar?: string
  created_at: string
  subscription_tier: 'free' | 'pro' | 'enterprise'
  designs_count: number
  storage_used: number
  storage_limit: number
}

interface ProfileModalProps {
  isOpen: boolean
  onClose: () => void
}

export default function ProfileModal({ isOpen, onClose }: ProfileModalProps) {
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [loading, setLoading] = useState(true)
  const [editing, setEditing] = useState(false)
  const [editForm, setEditForm] = useState({ name: '', email: '' })
  const [saving, setSaving] = useState(false)
  const [avatarFile, setAvatarFile] = useState<File | null>(null)
  const [avatarPreview, setAvatarPreview] = useState('')

  useEffect(() => {
    if (isOpen) {
      fetchProfile()
    }
  }, [isOpen])

  const fetchProfile = async () => {
    setLoading(true)
    try {
      const token = localStorage.getItem('auth_token')
      const response = await fetch('/api/user/profile', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      if (response.ok) {
        const data = await response.json()
        setProfile(data.user)
        setEditForm({ name: data.user.name, email: data.user.email })
      }
    } catch (error) {
      console.error('Failed to fetch profile:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleEdit = () => {
    setEditing(true)
    setAvatarPreview(profile?.avatar || '')
  }

  const handleCancel = () => {
    setEditing(false)
    setEditForm({ name: profile?.name || '', email: profile?.email || '' })
    setAvatarFile(null)
    setAvatarPreview('')
  }

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setAvatarFile(file)
      const reader = new FileReader()
      reader.onloadend = () => {
        setAvatarPreview(reader.result as string)
      }
      reader.readAsDataURL(file)
    }
  }

  const handleSave = async () => {
    setSaving(true)
    try {
      const token = localStorage.getItem('auth_token')
      const formData = new FormData()
      formData.append('name', editForm.name)
      formData.append('email', editForm.email)
      
      if (avatarFile) {
        formData.append('avatar', avatarFile)
      }

      const response = await fetch('/api/user/profile', {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formData
      })

      if (response.ok) {
        const data = await response.json()
        setProfile(data.user)
        setEditing(false)
        setAvatarFile(null)
        setAvatarPreview('')
        
        // Update localStorage
        localStorage.setItem('user_data', JSON.stringify(data.user))
      }
    } catch (error) {
      console.error('Failed to update profile:', error)
    } finally {
      setSaving(false)
    }
  }

  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' })
      localStorage.removeItem('auth_token')
      localStorage.removeItem('user_data')
      window.location.href = '/'
    } catch (error) {
      console.error('Logout failed:', error)
    }
  }

  const formatStorage = (bytes: number) => {
    const mb = bytes / (1024 * 1024)
    return mb.toFixed(1)
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  }

  if (!isOpen) return null

  if (loading) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg w-full max-w-md mx-4 p-6">
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
          </div>
        </div>
      </div>
    )
  }

  if (!profile) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg w-full max-w-md mx-4">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b">
          <h2 className="text-xl font-semibold">Profile Settings</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Avatar Section */}
          <div className="flex items-center gap-4">
            <div className="relative">
              <div className="w-20 h-20 bg-gray-200 rounded-full flex items-center justify-center overflow-hidden">
                {avatarPreview || profile.avatar ? (
                  <img
                    src={avatarPreview || profile.avatar}
                    alt="Profile"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <User className="w-8 h-8 text-gray-400" />
                )}
              </div>
              {editing && (
                <label className="absolute bottom-0 right-0 w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center cursor-pointer">
                  <Camera className="w-3 h-3 text-white" />
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleAvatarChange}
                    className="hidden"
                  />
                </label>
              )}
            </div>
            <div className="flex-1">
              {editing ? (
                <input
                  type="text"
                  value={editForm.name}
                  onChange={(e) => setEditForm(prev => ({ ...prev, name: e.target.value }))}
                  className="w-full px-3 py-1 border border-gray-200 rounded-lg text-lg font-medium"
                />
              ) : (
                <h3 className="text-lg font-medium">{profile.name}</h3>
              )}
              <div className="flex items-center gap-2 text-sm text-gray-500">
                <span className={`px-2 py-1 rounded text-xs font-medium ${
                  profile.subscription_tier === 'free' ? 'bg-gray-100 text-gray-700' :
                  profile.subscription_tier === 'pro' ? 'bg-blue-100 text-blue-700' :
                  'bg-purple-100 text-purple-700'
                }`}>
                  {profile.subscription_tier.toUpperCase()}
                </span>
              </div>
            </div>
          </div>

          {/* Email */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Email Address</label>
            {editing ? (
              <input
                type="email"
                value={editForm.email}
                onChange={(e) => setEditForm(prev => ({ ...prev, email: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg"
              />
            ) : (
              <div className="flex items-center gap-2 text-sm">
                <Mail className="w-4 h-4 text-gray-400" />
                {profile.email}
              </div>
            )}
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 gap-4">
            <div className="p-3 bg-gray-50 rounded-lg">
              <div className="text-2xl font-bold text-gray-900">{profile.designs_count}</div>
              <div className="text-sm text-gray-500">Designs Created</div>
            </div>
            <div className="p-3 bg-gray-50 rounded-lg">
              <div className="text-2xl font-bold text-gray-900">
                {formatStorage(profile.storage_used)} / {formatStorage(profile.storage_limit)} MB
              </div>
              <div className="text-sm text-gray-500">Storage Used</div>
              <div className="mt-2 w-full bg-gray-200 rounded-full h-2">
                <div
                  className="bg-blue-500 h-2 rounded-full"
                  style={{ width: `${(profile.storage_used / profile.storage_limit) * 100}%` }}
                />
              </div>
            </div>
          </div>

          {/* Member Since */}
          <div className="flex items-center gap-2 text-sm text-gray-500">
            <Calendar className="w-4 h-4" />
            Member since {formatDate(profile.created_at)}
          </div>

          {/* Actions */}
          <div className="flex gap-2 pt-4 border-t">
            {editing ? (
              <>
                <button
                  onClick={handleSave}
                  disabled={saving}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50"
                >
                  {saving ? (
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  ) : (
                    <Save className="w-4 h-4" />
                  )}
                  {saving ? 'Saving...' : 'Save Changes'}
                </button>
                <button
                  onClick={handleCancel}
                  className="px-4 py-2 border border-gray-200 rounded-lg hover:bg-gray-50"
                >
                  Cancel
                </button>
              </>
            ) : (
              <>
                <button
                  onClick={handleEdit}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-2 border border-gray-200 rounded-lg hover:bg-gray-50"
                >
                  <Edit2 className="w-4 h-4" />
                  Edit Profile
                </button>
                <button className="px-4 py-2 border border-gray-200 rounded-lg hover:bg-gray-50">
                  <Settings className="w-4 h-4" />
                </button>
                <button
                  onClick={handleLogout}
                  className="px-4 py-2 border border-red-200 text-red-600 rounded-lg hover:bg-red-50"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
