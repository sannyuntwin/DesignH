'use client'

import { useState, useEffect } from 'react'
import { 
  Users, Plus, Search, Settings, Crown, Shield, Eye, Edit, Trash2, 
  Mail, MoreVertical, UserPlus, UserMinus, Calendar, Activity,
  Building2, Key, CreditCard, CheckCircle, XCircle, AlertCircle, User
} from 'lucide-react'

interface TeamMember {
  id: string
  user_id: string
  name: string
  email: string
  avatar?: string
  role: 'owner' | 'admin' | 'member' | 'viewer'
  status: 'active' | 'pending' | 'inactive'
  invited_at: string
  last_active?: string
  permissions: {
    can_create_designs: boolean
    can_edit_designs: boolean
    can_delete_designs: boolean
    can_manage_team: boolean
    can_view_analytics: boolean
    can_export_designs: boolean
  }
}

interface Team {
  id: string
  name: string
  description?: string
  avatar?: string
  subscription_tier: 'free' | 'pro' | 'enterprise'
  member_count: number
  design_count: number
  storage_used: number
  storage_limit: number
  created_at: string
  owner_id: string
}

interface TeamManagementProps {
  teamId?: string
  onTeamSelect?: (teamId: string) => void
}

export default function TeamManagement({ teamId, onTeamSelect }: TeamManagementProps) {
  const [teams, setTeams] = useState<Team[]>([])
  const [currentTeam, setCurrentTeam] = useState<Team | null>(null)
  const [members, setMembers] = useState<TeamMember[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<'overview' | 'members' | 'settings' | 'billing'>('overview')
  const [showInviteModal, setShowInviteModal] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')

  useEffect(() => {
    fetchTeams()
  }, [])

  useEffect(() => {
    if (teamId) {
      fetchTeamDetails(teamId)
    }
  }, [teamId])

  const fetchTeams = async () => {
    setLoading(true)
    try {
      const token = localStorage.getItem('auth_token')
      const response = await fetch('/api/teams', {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      
      if (response.ok) {
        const data = await response.json()
        setTeams(data.teams || [])
        if (data.teams?.length > 0 && !teamId) {
          setCurrentTeam(data.teams[0])
          fetchTeamDetails(data.teams[0].id)
        }
      }
    } catch (error) {
      console.error('Failed to fetch teams:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchTeamDetails = async (teamId: string) => {
    try {
      const token = localStorage.getItem('auth_token')
      
      // Fetch team details
      const teamResponse = await fetch(`/api/teams/${teamId}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      
      if (teamResponse.ok) {
        const teamData = await teamResponse.json()
        setCurrentTeam(teamData.team)
      }

      // Fetch team members
      const membersResponse = await fetch(`/api/teams/${teamId}/members`, {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      
      if (membersResponse.ok) {
        const membersData = await membersResponse.json()
        setMembers(membersData.members || [])
      }
    } catch (error) {
      console.error('Failed to fetch team details:', error)
    }
  }

  const handleInviteMember = async (email: string, role: TeamMember['role']) => {
    try {
      const token = localStorage.getItem('auth_token')
      const response = await fetch(`/api/teams/${currentTeam?.id}/invite`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ email, role })
      })

      if (response.ok) {
        fetchTeamDetails(currentTeam!.id)
        setShowInviteModal(false)
      }
    } catch (error) {
      console.error('Failed to invite member:', error)
    }
  }

  const handleUpdateMemberRole = async (memberId: string, role: TeamMember['role']) => {
    try {
      const token = localStorage.getItem('auth_token')
      const response = await fetch(`/api/teams/${currentTeam?.id}/members/${memberId}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ role })
      })

      if (response.ok) {
        setMembers(prev => prev.map(m => 
          m.id === memberId ? { ...m, role } : m
        ))
      }
    } catch (error) {
      console.error('Failed to update member role:', error)
    }
  }

  const handleRemoveMember = async (memberId: string) => {
    if (!confirm('Are you sure you want to remove this member?')) return

    try {
      const token = localStorage.getItem('auth_token')
      const response = await fetch(`/api/teams/${currentTeam?.id}/members/${memberId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      })

      if (response.ok) {
        setMembers(prev => prev.filter(m => m.id !== memberId))
      }
    } catch (error) {
      console.error('Failed to remove member:', error)
    }
  }

  const getRoleIcon = (role: TeamMember['role']) => {
    switch (role) {
      case 'owner': return Crown
      case 'admin': return Shield
      case 'member': return Users
      case 'viewer': return Eye
      default: return Users
    }
  }

  const getRoleColor = (role: TeamMember['role']) => {
    switch (role) {
      case 'owner': return 'text-purple-600 bg-purple-100'
      case 'admin': return 'text-blue-600 bg-blue-100'
      case 'member': return 'text-green-600 bg-green-100'
      case 'viewer': return 'text-gray-600 bg-gray-100'
      default: return 'text-gray-600 bg-gray-100'
    }
  }

  const getStatusIcon = (status: TeamMember['status']) => {
    switch (status) {
      case 'active': return CheckCircle
      case 'pending': return AlertCircle
      case 'inactive': return XCircle
      default: return AlertCircle
    }
  }

  const getStatusColor = (status: TeamMember['status']) => {
    switch (status) {
      case 'active': return 'text-green-600'
      case 'pending': return 'text-yellow-600'
      case 'inactive': return 'text-gray-400'
      default: return 'text-gray-400'
    }
  }

  const filteredMembers = members.filter(member =>
    member.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    member.email.toLowerCase().includes(searchQuery.toLowerCase())
  )

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
              <Building2 className="w-6 h-6 text-blue-600" />
              <h1 className="text-xl font-semibold">Team Management</h1>
            </div>
            
            <button
              onClick={() => setShowInviteModal(true)}
              className="flex items-center gap-2 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
            >
              <UserPlus className="w-4 h-4" />
              Invite Member
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Team Selector */}
        {teams.length > 1 && (
          <div className="mb-6">
            <div className="flex items-center gap-4">
              <label className="text-sm font-medium text-gray-700">Select Team:</label>
              <select
                value={currentTeam?.id || ''}
                onChange={(e) => {
                  const team = teams.find(t => t.id === e.target.value)
                  if (team) {
                    setCurrentTeam(team)
                    fetchTeamDetails(team.id)
                    onTeamSelect?.(team.id)
                  }
                }}
                className="px-3 py-2 border border-gray-200 rounded-lg"
              >
                {teams.map(team => (
                  <option key={team.id} value={team.id}>
                    {team.name}
                  </option>
                ))}
              </select>
            </div>
          </div>
        )}

        {/* Team Overview */}
        {currentTeam && (
          <div className="bg-white rounded-lg p-6 mb-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 bg-blue-100 rounded-lg flex items-center justify-center">
                  <Building2 className="w-8 h-8 text-blue-600" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold">{currentTeam.name}</h2>
                  {currentTeam.description && (
                    <p className="text-gray-600">{currentTeam.description}</p>
                  )}
                  <div className="flex items-center gap-4 mt-2 text-sm text-gray-500">
                    <span className="flex items-center gap-1">
                      <Users className="w-4 h-4" />
                      {currentTeam.member_count} members
                    </span>
                    <span className="flex items-center gap-1">
                      <Activity className="w-4 h-4" />
                      {currentTeam.design_count} designs
                    </span>
                    <span className="flex items-center gap-1">
                      <Calendar className="w-4 h-4" />
                      Created {new Date(currentTeam.created_at).toLocaleDateString()}
                    </span>
                  </div>
                </div>
              </div>
              
              <button className="p-2 hover:bg-gray-100 rounded-lg">
                <Settings className="w-5 h-5" />
              </button>
            </div>

            {/* Storage Usage */}
            <div className="mb-4">
              <div className="flex items-center justify-between text-sm mb-2">
                <span>Storage Usage</span>
                <span>
                  {Math.round(currentTeam.storage_used / 1024 / 1024)}MB / {Math.round(currentTeam.storage_limit / 1024 / 1024)}MB
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className="bg-blue-500 h-2 rounded-full"
                  style={{ width: `${(currentTeam.storage_used / currentTeam.storage_limit) * 100}%` }}
                />
              </div>
            </div>
          </div>
        )}

        {/* Tabs */}
        <div className="bg-white rounded-lg">
          <div className="border-b">
            <div className="flex">
              {['overview', 'members', 'settings', 'billing'].map((tab) => (
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

          {/* Tab Content */}
          <div className="p-6">
            {activeTab === 'overview' && (
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="bg-gray-50 rounded-lg p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <Users className="w-5 h-5 text-blue-600" />
                      <h3 className="font-semibold">Team Members</h3>
                    </div>
                    <div className="text-2xl font-bold">{members.length}</div>
                    <p className="text-sm text-gray-600">Active collaborators</p>
                  </div>
                  
                  <div className="bg-gray-50 rounded-lg p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <Activity className="w-5 h-5 text-green-600" />
                      <h3 className="font-semibold">Total Designs</h3>
                    </div>
                    <div className="text-2xl font-bold">{currentTeam?.design_count || 0}</div>
                    <p className="text-sm text-gray-600">Created designs</p>
                  </div>
                  
                  <div className="bg-gray-50 rounded-lg p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <CreditCard className="w-5 h-5 text-purple-600" />
                      <h3 className="font-semibold">Subscription</h3>
                    </div>
                    <div className="text-2xl font-bold capitalize">{currentTeam?.subscription_tier || 'Free'}</div>
                    <p className="text-sm text-gray-600">Current plan</p>
                  </div>
                </div>

                {/* Recent Activity */}
                <div>
                  <h3 className="font-semibold mb-4">Recent Activity</h3>
                  <div className="space-y-3">
                    {members.slice(0, 5).map((member) => (
                      <div key={member.id} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                        <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center">
                          <User className="w-4 h-4 text-gray-600" />
                        </div>
                        <div className="flex-1">
                          <p className="text-sm font-medium">{member.name}</p>
                          <p className="text-xs text-gray-500">
                            {member.status === 'pending' ? 'Invited' : 'Last active ' + (member.last_active ? new Date(member.last_active).toLocaleDateString() : 'Never')}
                          </p>
                        </div>
                        <span className={`text-xs px-2 py-1 rounded-full ${getRoleColor(member.role)}`}>
                          {member.role}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'members' && (
              <div className="space-y-4">
                {/* Search */}
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search members..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-10 pr-3 py-2 border border-gray-200 rounded-lg"
                  />
                </div>

                {/* Members List */}
                <div className="space-y-2">
                  {filteredMembers.map((member) => {
                    const RoleIcon = getRoleIcon(member.role)
                    const StatusIcon = getStatusIcon(member.status)
                    
                    return (
                      <div key={member.id} className="flex items-center justify-between p-4 border rounded-lg">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center">
                            <User className="w-5 h-5 text-gray-600" />
                          </div>
                                                   <div>
                            <div className="flex items-center gap-2">
                              <p className="font-medium">{member.name}</p>
                              <StatusIcon className={`w-4 h-4 ${getStatusColor(member.status)}`} />
                            </div>
                            <p className="text-sm text-gray-500">{member.email}</p>
                            <div className="flex items-center gap-2 text-xs text-gray-500">
                              <span>Joined {new Date(member.invited_at).toLocaleDateString()}</span>
                              {member.last_active && (
                                <span>• Active {new Date(member.last_active).toLocaleDateString()}</span>
                              )}
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          <span className={`text-xs px-2 py-1 rounded-full ${getRoleColor(member.role)}`}>
                            <RoleIcon className="w-3 h-3 inline mr-1" />
                            {member.role}
                          </span>
                          
                          {member.role !== 'owner' && (
                            <div className="relative">
                              <button className="p-1 hover:bg-gray-100 rounded">
                                <MoreVertical className="w-4 h-4" />
                              </button>
                              
                              {/* Dropdown Menu */}
                              <div className="absolute right-0 top-8 w-48 bg-white border rounded-lg shadow-lg z-10">
                                <div className="py-1">
                                  <button className="w-full px-4 py-2 text-left text-sm hover:bg-gray-50">
                                    Edit Permissions
                                  </button>
                                  <button
                                    onClick={() => handleRemoveMember(member.id)}
                                    className="w-full px-4 py-2 text-left text-sm text-red-600 hover:bg-red-50"
                                  >
                                    Remove Member
                                  </button>
                                </div>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            )}

            {activeTab === 'settings' && (
              <div className="space-y-6">
                <div>
                  <h3 className="font-semibold mb-4">Team Settings</h3>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium mb-2">Team Name</label>
                      <input
                        type="text"
                        value={currentTeam?.name || ''}
                        className="w-full px-3 py-2 border border-gray-200 rounded-lg"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-2">Description</label>
                      <textarea
                        value={currentTeam?.description || ''}
                        className="w-full px-3 py-2 border border-gray-200 rounded-lg"
                        rows={3}
                      />
                    </div>
                  </div>
                </div>

                <div>
                  <h3 className="font-semibold mb-4">Default Permissions</h3>
                  <div className="space-y-2">
                    {['can_create_designs', 'can_edit_designs', 'can_delete_designs', 'can_view_analytics', 'can_export_designs'].map((permission) => (
                      <label key={permission} className="flex items-center gap-2">
                        <input type="checkbox" className="rounded" />
                        <span className="text-sm capitalize">{permission.replace(/_/g, ' ')}</span>
                      </label>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'billing' && (
              <div className="space-y-6">
                <div>
                  <h3 className="font-semibold mb-4">Subscription</h3>
                  <div className="bg-gray-50 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-4">
                      <div>
                        <p className="font-medium capitalize">{currentTeam?.subscription_tier || 'Free'} Plan</p>
                        <p className="text-sm text-gray-600">
                          {currentTeam?.subscription_tier === 'free' && 'Perfect for small teams'}
                          {currentTeam?.subscription_tier === 'pro' && 'Advanced features for growing teams'}
                          {currentTeam?.subscription_tier === 'enterprise' && 'Complete solution for large organizations'}
                        </p>
                      </div>
                      <Key className="w-8 h-8 text-blue-600" />
                    </div>
                    
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span>Team Members</span>
                        <span>{members.length} / {currentTeam?.subscription_tier === 'free' ? '5' : 'Unlimited'}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span>Storage</span>
                        <span>{Math.round((currentTeam?.storage_used || 0) / 1024 / 1024)}GB / {Math.round((currentTeam?.storage_limit || 0) / 1024 / 1024)}GB</span>
                      </div>
                    </div>
                  </div>
                </div>

                <button className="w-full px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600">
                  Upgrade Plan
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Invite Modal */}
      {showInviteModal && (
        <InviteModal
          onClose={() => setShowInviteModal(false)}
          onInvite={handleInviteMember}
        />
      )}
    </div>
  )
}

interface InviteModalProps {
  onClose: () => void
  onInvite: (email: string, role: TeamMember['role']) => void
}

function InviteModal({ onClose, onInvite }: InviteModalProps) {
  const [email, setEmail] = useState('')
  const [role, setRole] = useState<TeamMember['role']>('member')
  const [message, setMessage] = useState('')
  const [sending, setSending] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!email.trim()) return
    
    setSending(true)
    try {
      await onInvite(email, role)
      setEmail('')
      setMessage('')
      onClose()
    } catch (error) {
      console.error('Failed to send invite:', error)
    } finally {
      setSending(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg w-full max-w-md mx-4">
        <div className="flex items-center justify-between p-6 border-b">
          <h2 className="text-xl font-semibold">Invite Team Member</h2>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg">
            ×
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">Email Address</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Enter email address"
              className="w-full px-3 py-2 border border-gray-200 rounded-lg"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Role</label>
            <select
              value={role}
              onChange={(e) => setRole(e.target.value as TeamMember['role'])}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg"
            >
              <option value="member">Member</option>
              <option value="admin">Admin</option>
              <option value="viewer">Viewer</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Personal Message (Optional)</label>
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Add a personal message to the invitation..."
              className="w-full px-3 py-2 border border-gray-200 rounded-lg"
              rows={3}
            />
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
              disabled={sending || !email.trim()}
              className="flex-1 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50"
            >
              {sending ? 'Sending...' : 'Send Invite'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
