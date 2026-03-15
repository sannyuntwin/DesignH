'use client'

import React, { useState, useEffect, useRef, useCallback } from 'react'
import { Users, Wifi, WifiOff, Circle } from 'lucide-react'

interface User {
  id: string
  name: string
  email: string
  avatar?: string
  cursor?: { x: number; y: number }
  selection?: string[]
  color: string
}

interface CollaborationEvent {
  type: 'cursor_move' | 'element_select' | 'element_update' | 'element_add' | 'element_delete' | 'user_join' | 'user_leave'
  userId: string
  data: any
  timestamp: number
}

interface CollaborationProviderProps {
  designId: string
  userId: string
  children: React.ReactNode
}

export default function CollaborationProvider({ designId, userId, children }: CollaborationProviderProps) {
  const [socket, setSocket] = useState<WebSocket | null>(null)
  const [connected, setConnected] = useState(false)
  const [users, setUsers] = useState<User[]>([])
  const [currentUser, setCurrentUser] = useState<User | null>(null)
  const [reconnectAttempts, setReconnectAttempts] = useState(0)
  const reconnectTimeoutRef = useRef<NodeJS.Timeout>()

  // Generate a consistent color for each user
  const getUserColor = useCallback((userId: string) => {
    const colors = [
      '#3B82F6', '#EF4444', '#10B981', '#F59E0B', '#8B5CF6',
      '#EC4899', '#14B8A6', '#F97316', '#6366F1', '#84CC16'
    ]
    const hash = userId.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0)
    return colors[hash % colors.length]
  }, [])

  // Initialize WebSocket connection
  useEffect(() => {
    if (!designId || !userId) return

    const connectWebSocket = () => {
      const wsUrl = `${process.env.NEXT_PUBLIC_WS_URL || 'ws://localhost:3001'}/designs/${designId}?userId=${userId}`
      const ws = new WebSocket(wsUrl)

      ws.onopen = () => {
        console.log('Connected to collaboration server')
        setConnected(true)
        setSocket(ws)
        setReconnectAttempts(0)
      }

      ws.onmessage = (event) => {
        try {
          const collaborationEvent: CollaborationEvent = JSON.parse(event.data)
          handleCollaborationEvent(collaborationEvent)
        } catch (error) {
          console.error('Failed to parse collaboration event:', error)
        }
      }

      ws.onclose = () => {
        console.log('Disconnected from collaboration server')
        setConnected(false)
        setSocket(null)

        // Attempt to reconnect with exponential backoff
        const delay = Math.min(1000 * Math.pow(2, reconnectAttempts), 30000)
        reconnectTimeoutRef.current = setTimeout(() => {
          setReconnectAttempts(prev => prev + 1)
          connectWebSocket()
        }, delay)
      }

      ws.onerror = (error) => {
        console.error('WebSocket error:', error)
      }
    }

    connectWebSocket()

    return () => {
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current)
      }
      if (socket) {
        socket.close()
      }
    }
  }, [designId, userId, reconnectAttempts])

  const handleCollaborationEvent = useCallback((event: CollaborationEvent) => {
    switch (event.type) {
      case 'user_join':
        const newUser: User = {
          id: event.userId,
          name: event.data.name,
          email: event.data.email,
          avatar: event.data.avatar,
          color: getUserColor(event.userId)
        }
        setUsers(prev => {
          const existing = prev.find(u => u.id === newUser.id)
          return existing ? prev : [...prev, newUser]
        })
        break

      case 'user_leave':
        setUsers(prev => prev.filter(u => u.id !== event.userId))
        break

      case 'cursor_move':
        setUsers(prev => prev.map(u => 
          u.id === event.userId 
            ? { ...u, cursor: event.data.cursor }
            : u
        ))
        break

      case 'element_select':
        setUsers(prev => prev.map(u => 
          u.id === event.userId 
            ? { ...u, selection: event.data.selection }
            : u
        ))
        break

      default:
        // Handle other collaboration events
        break
    }
  }, [getUserColor])

  const sendCollaborationEvent = useCallback((type: CollaborationEvent['type'], data: any) => {
    if (socket && connected) {
      const event: CollaborationEvent = {
        type,
        userId,
        data,
        timestamp: Date.now()
      }
      socket.send(JSON.stringify(event))
    }
  }, [socket, connected, userId])

  // Update current user info
  useEffect(() => {
    const token = localStorage.getItem('auth_token')
    if (token) {
      try {
        const userData = JSON.parse(localStorage.getItem('user_data') || '{}')
        const user: User = {
          id: userData.id,
          name: userData.name,
          email: userData.email,
          avatar: userData.avatar,
          color: getUserColor(userData.id)
        }
        setCurrentUser(user)
      } catch (error) {
        console.error('Failed to parse user data:', error)
      }
    }
  }, [getUserColor])

  const contextValue = {
    socket,
    connected,
    users,
    currentUser,
    sendCollaborationEvent
  }

  return (
    <CollaborationContext.Provider value={contextValue}>
      {children}
      <CollaborationStatus connected={connected} users={users} />
    </CollaborationContext.Provider>
  )
}

// Context for accessing collaboration state
const CollaborationContext = React.createContext<{
  socket: WebSocket | null
  connected: boolean
  users: User[]
  currentUser: User | null
  sendCollaborationEvent: (type: CollaborationEvent['type'], data: any) => void
}>({
  socket: null,
  connected: false,
  users: [],
  currentUser: null,
  sendCollaborationEvent: () => {}
})

export { CollaborationContext }

// Collaboration Status Component
function CollaborationStatus({ connected, users }: { connected: boolean; users: User[] }) {
  const [showUsers, setShowUsers] = useState(false)

  return (
    <div className="fixed bottom-4 left-4 z-50">
      <div className="bg-white border rounded-lg shadow-lg p-3">
        <div className="flex items-center gap-2">
          <div className={`w-2 h-2 rounded-full ${connected ? 'bg-green-500' : 'bg-red-500'}`} />
          <span className="text-sm font-medium">
            {connected ? 'Connected' : 'Disconnected'}
          </span>
          <button
            onClick={() => setShowUsers(!showUsers)}
            className="p-1 hover:bg-gray-100 rounded"
          >
            {connected ? <Wifi className="w-4 h-4" /> : <WifiOff className="w-4 h-4" />}
          </button>
        </div>

        {showUsers && (
          <div className="mt-3 space-y-2">
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <Users className="w-4 h-4" />
              <span>{users.length} user{users.length !== 1 ? 's' : ''} online</span>
            </div>
            
            <div className="space-y-1">
              {users.map(user => (
                <div key={user.id} className="flex items-center gap-2 text-sm">
                  <div
                    className="w-2 h-2 rounded-full"
                    style={{ backgroundColor: user.color }}
                  />
                  <span className="truncate max-w-32">{user.name}</span>
                  {user.cursor && (
                    <Circle className="w-2 h-2 text-gray-400" />
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

// Hook for using collaboration context
export function useCollaboration() {
  const context = React.useContext(CollaborationContext)
  if (!context) {
    throw new Error('useCollaboration must be used within CollaborationProvider')
  }
  return context
}
