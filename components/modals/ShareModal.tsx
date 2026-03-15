'use client'

import { useState, useEffect } from 'react'
import { X, Share2, Link, Mail, Users, Copy, Eye, Edit, Trash2, Plus, Check } from 'lucide-react'

interface ShareModalProps {
  isOpen: boolean
  onClose: () => void
  designId: string
  designName: string
}

interface Collaborator {
  id: string
  user_id: string
  email: string
  user_name: string
  permission: 'view' | 'edit'
  invited_by: string
  created_at: string
}

interface PublicShareLink {
  id: string
  token: string
  permission: 'view' | 'edit'
  expires_at?: string
  created_at: string
}

export default function ShareModal({ isOpen, onClose, designId, designName }: ShareModalProps) {
  const [activeTab, setActiveTab] = useState<'link' | 'invite'>('link')
  const [collaborators, setCollaborators] = useState<Collaborator[]>([])
  const [publicLinks, setPublicLinks] = useState<PublicShareLink[]>([])
  const [loading, setLoading] = useState(false)
  const [emailInput, setEmailInput] = useState('')
  const [selectedPermission, setSelectedPermission] = useState<'view' | 'edit'>('view')
  const [linkPermission, setLinkPermission] = useState<'view' | 'edit'>('view')
  const [linkExpiry, setLinkExpiry] = useState<'never' | '7days' | '30days'>('never')
  const [copiedLink, setCopiedLink] = useState('')
  const [inviteLoading, setInviteLoading] = useState(false)

  useEffect(() => {
    if (isOpen) {
      fetchCollaborators()
      generatePublicLink()
    }
  }, [isOpen])

  const fetchCollaborators = async () => {
    setLoading(true)
    try {
      const response = await fetch(`/api/designs/${designId}/share`)
      const data = await response.json()
      
      if (data.collaborators) {
        setCollaborators(data.collaborators)
      }
    } catch (error) {
      console.error('Failed to fetch collaborators:', error)
    } finally {
      setLoading(false)
    }
  }

  const generatePublicLink = async () => {
    try {
      const token = generateShareToken()
      const newLink: PublicShareLink = {
        id: Date.now().toString(),
        token,
        permission: 'view',
        created_at: new Date().toISOString()
      }
      
      if (linkExpiry !== 'never') {
        const expiryDate = new Date()
        expiryDate.setDate(expiryDate.getDate() + (linkExpiry === '7days' ? 7 : 30))
        newLink.expires_at = expiryDate.toISOString()
      }
      
      setPublicLinks([newLink])
    } catch (error) {
      console.error('Failed to generate public link:', error)
    }
  }

  const generateShareToken = () => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'
    let token = ''
    for (let i = 0; i < 12; i++) {
      token += chars.charAt(Math.floor(Math.random() * chars.length))
    }
    return token
  }

  const inviteUser = async () => {
    if (!emailInput.trim()) return

    setInviteLoading(true)
    try {
      // In a real app, you'd look up user by email first
      const userId = 'user-' + Date.now() // Mock user ID
      
      const response = await fetch(`/api/designs/${designId}/share`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          user_id: userId,
          permission: selectedPermission,
          invited_by: 'current-user' // Replace with actual user ID
        })
      })

      if (response.ok) {
        const data = await response.json()
        const newCollaborator: Collaborator = {
          id: data.collaboration.id,
          user_id: userId,
          email: emailInput,
          user_name: emailInput.split('@')[0],
          permission: selectedPermission,
          invited_by: 'current-user',
          created_at: new Date().toISOString()
        }
        
        setCollaborators(prev => [newCollaborator, ...prev])
        setEmailInput('')
      }
    } catch (error) {
      console.error('Failed to invite user:', error)
    } finally {
      setInviteLoading(false)
    }
  }

  const removeCollaborator = async (collaboratorId: string) => {
    try {
      // In a real app, you'd have a DELETE endpoint
      setCollaborators(prev => prev.filter(c => c.id !== collaboratorId))
    } catch (error) {
      console.error('Failed to remove collaborator:', error)
    }
  }

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
    setCopiedLink(text)
    setTimeout(() => setCopiedLink(''), 2000)
  }

  const getShareUrl = (token: string) => {
    return `${window.location.origin}/shared/${token}`
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg w-full max-w-lg mx-4">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b">
          <div className="flex items-center gap-2">
            <Share2 className="w-5 h-5" />
            <h2 className="text-xl font-semibold">Share Design</h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Design Info */}
        <div className="px-6 pt-4">
          <div className="text-sm text-gray-600">
            Sharing: <span className="font-medium text-gray-900">{designName}</span>
          </div>
        </div>

        {/* Tabs */}
        <div className="px-6 pt-4">
          <div className="flex gap-1 p-1 bg-gray-100 rounded-lg">
            <button
              onClick={() => setActiveTab('link')}
              className={`flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                activeTab === 'link'
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <Link className="w-4 h-4" />
              Public Link
            </button>
            <button
              onClick={() => setActiveTab('invite')}
              className={`flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                activeTab === 'invite'
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <Mail className="w-4 h-4" />
              Invite People
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6">
          {activeTab === 'link' && (
            <div className="space-y-4">
              {/* Link Settings */}
              <div className="space-y-3">
                <div>
                  <label className="block text-sm font-medium mb-2">Permission Level</label>
                  <div className="flex gap-2">
                    <button
                      onClick={() => setLinkPermission('view')}
                      className={`flex items-center gap-2 px-3 py-2 border rounded-lg text-sm ${
                        linkPermission === 'view'
                          ? 'border-blue-500 bg-blue-50 text-blue-600'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <Eye className="w-4 h-4" />
                      Can view
                    </button>
                    <button
                      onClick={() => setLinkPermission('edit')}
                      className={`flex items-center gap-2 px-3 py-2 border rounded-lg text-sm ${
                        linkPermission === 'edit'
                          ? 'border-blue-500 bg-blue-50 text-blue-600'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <Edit className="w-4 h-4" />
                      Can edit
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Link Expiry</label>
                  <select
                    value={linkExpiry}
                    onChange={(e) => setLinkExpiry(e.target.value as any)}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm"
                  >
                    <option value="never">Never expires</option>
                    <option value="7days">Expires in 7 days</option>
                    <option value="30days">Expires in 30 days</option>
                  </select>
                </div>
              </div>

              {/* Generated Links */}
              <div className="space-y-2">
                {publicLinks.map((link) => (
                  <div key={link.id} className="p-3 border rounded-lg bg-gray-50">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium">
                        {link.permission === 'view' ? 'View-only link' : 'Edit link'}
                      </span>
                      <button
                        onClick={() => copyToClipboard(getShareUrl(link.token))}
                        className="p-1 text-gray-500 hover:text-gray-700"
                      >
                        {copiedLink === getShareUrl(link.token) ? (
                          <Check className="w-4 h-4 text-green-500" />
                        ) : (
                          <Copy className="w-4 h-4" />
                        )}
                      </button>
                    </div>
                    <div className="text-xs text-gray-500 font-mono break-all">
                      {getShareUrl(link.token)}
                    </div>
                    {link.expires_at && (
                      <div className="text-xs text-gray-500 mt-1">
                        Expires: {new Date(link.expires_at).toLocaleDateString()}
                      </div>
                    )}
                  </div>
                ))}
              </div>

              <button
                onClick={generatePublicLink}
                className="w-full px-4 py-2 border border-gray-200 rounded-lg hover:bg-gray-50 text-sm"
              >
                Generate New Link
              </button>
            </div>
          )}

          {activeTab === 'invite' && (
            <div className="space-y-4">
              {/* Invite Form */}
              <div className="space-y-3">
                <div>
                  <label className="block text-sm font-medium mb-2">Email address</label>
                  <div className="flex gap-2">
                    <input
                      type="email"
                      value={emailInput}
                      onChange={(e) => setEmailInput(e.target.value)}
                      placeholder="Enter email address"
                      className="flex-1 px-3 py-2 border border-gray-200 rounded-lg text-sm"
                      onKeyPress={(e) => e.key === 'Enter' && inviteUser()}
                    />
                    <select
                      value={selectedPermission}
                      onChange={(e) => setSelectedPermission(e.target.value as any)}
                      className="px-3 py-2 border border-gray-200 rounded-lg text-sm"
                    >
                      <option value="view">Can view</option>
                      <option value="edit">Can edit</option>
                    </select>
                  </div>
                </div>
                <button
                  onClick={inviteUser}
                  disabled={!emailInput.trim() || inviteLoading}
                  className="w-full px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50 text-sm"
                >
                  {inviteLoading ? 'Inviting...' : 'Send Invite'}
                </button>
              </div>

              {/* Collaborators List */}
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm font-medium">
                  <Users className="w-4 h-4" />
                  People with access
                </div>
                {collaborators.length === 0 ? (
                  <div className="text-sm text-gray-500 text-center py-4">
                    No collaborators yet
                  </div>
                ) : (
                  <div className="space-y-2">
                    {collaborators.map((collaborator) => (
                      <div
                        key={collaborator.id}
                        className="flex items-center justify-between p-3 border rounded-lg"
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center">
                            <span className="text-sm font-medium">
                              {collaborator.user_name.charAt(0).toUpperCase()}
                            </span>
                          </div>
                          <div>
                            <div className="text-sm font-medium">{collaborator.user_name}</div>
                            <div className="text-xs text-gray-500">{collaborator.email}</div>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className={`text-xs px-2 py-1 rounded ${
                            collaborator.permission === 'edit'
                              ? 'bg-blue-100 text-blue-700'
                              : 'bg-gray-100 text-gray-700'
                          }`}>
                            {collaborator.permission}
                          </span>
                          <button
                            onClick={() => removeCollaborator(collaborator.id)}
                            className="p-1 text-red-500 hover:bg-red-50 rounded"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
