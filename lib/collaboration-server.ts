import { WebSocketServer, WebSocket } from 'ws'
import { IncomingMessage } from 'http'
import { parse } from 'url'
import jwt from 'jsonwebtoken'

interface User {
  id: string
  name: string
  email: string
  avatar?: string
  color: string
}

interface CollaborationClient {
  id: string
  ws: WebSocket
  user: User
  designId: string
  lastActivity: number
}

interface CollaborationEvent {
  type: 'cursor_move' | 'element_select' | 'element_update' | 'element_add' | 'element_delete' | 'user_join' | 'user_leave'
  userId: string
  data: any
  timestamp: number
}

class CollaborationServer {
  private wss: WebSocketServer
  private clients: Map<string, CollaborationClient> = new Map()
  private designClients: Map<string, Set<string>> = new Map()
  private JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key'

  constructor() {
    this.wss = new WebSocketServer({ noServer: true })
    this.setupWebSocketServer()
    this.startCleanupInterval()
  }

  private setupWebSocketServer() {
    this.wss.on('connection', (ws: WebSocket, request: IncomingMessage) => {
      this.handleConnection(ws, request)
    })
  }

  private handleConnection(ws: WebSocket, request: IncomingMessage) {
    try {
      const parsedUrl = parse(request.url || '', true)
      const query = new URLSearchParams(parsedUrl.search || '')
      
      const designId = query.get('designId')
      const token = query.get('token')
      const userId = query.get('userId')

      if (!designId || !userId) {
        ws.close(1008, 'Missing required parameters')
        return
      }

      // Verify token if provided
      let user: User | null = null
      if (token) {
        try {
          const decoded = jwt.verify(token, this.JWT_SECRET) as any
          user = {
            id: decoded.userId,
            name: decoded.name || 'Unknown User',
            email: decoded.email || '',
            color: this.getUserColor(decoded.userId)
          }
        } catch (error) {
          console.error('Invalid token:', error)
          ws.close(1008, 'Invalid token')
          return
        }
      } else {
        // For development, allow connections without token
        user = {
          id: userId,
          name: `User ${userId}`,
          email: `${userId}@example.com`,
          color: this.getUserColor(userId)
        }
      }

      if (!user) {
        ws.close(1008, 'Invalid user')
        return
      }

      const clientId = this.generateClientId()
      const client: CollaborationClient = {
        id: clientId,
        ws,
        user,
        designId,
        lastActivity: Date.now()
      }

      this.clients.set(clientId, client)
      
      // Add client to design group
      if (!this.designClients.has(designId)) {
        this.designClients.set(designId, new Set())
      }
      this.designClients.get(designId)!.add(clientId)

      console.log(`Client ${clientId} connected to design ${designId}`)

      // Notify other users in the same design
      this.broadcastToDesign(designId, clientId, {
        type: 'user_join',
        userId: user.id,
        data: {
          name: user.name,
          email: user.email,
          avatar: user.avatar
        },
        timestamp: Date.now()
      })

      // Send current users list to new client
      this.sendUsersList(client, designId)

      // Setup message handlers
      this.setupClientHandlers(client, clientId, designId)

    } catch (error) {
      console.error('Connection error:', error)
      ws.close(1011, 'Internal server error')
    }
  }

  private setupClientHandlers(client: CollaborationClient, clientId: string, designId: string) {
    client.ws.on('message', (data: WebSocket.Data) => {
      try {
        const event: CollaborationEvent = JSON.parse(data.toString())
        this.handleCollaborationEvent(client, clientId, designId, event)
      } catch (error) {
        console.error('Invalid message format:', error)
      }
    })

    client.ws.on('close', () => {
      this.handleDisconnection(clientId, designId)
    })

    client.ws.on('error', (error) => {
      console.error(`Client ${clientId} error:`, error)
      this.handleDisconnection(clientId, designId)
    })

    // Ping/pong for connection health
    client.ws.on('pong', () => {
      client.lastActivity = Date.now()
    })
  }

  private handleCollaborationEvent(client: CollaborationClient, clientId: string, designId: string, event: CollaborationEvent) {
    // Update last activity
    client.lastActivity = Date.now()

    // Validate event
    if (!this.isValidEvent(event)) {
      console.warn('Invalid event received:', event)
      return
    }

    // Broadcast to other clients in the same design
    this.broadcastToDesign(designId, clientId, event)

    // Handle specific event types
    switch (event.type) {
      case 'cursor_move':
        // Update user cursor position
        break
      case 'element_update':
        // Could persist to database here
        break
      case 'element_add':
        // Could persist to database here
        break
      case 'element_delete':
        // Could persist to database here
        break
    }
  }

  private handleDisconnection(clientId: string, designId: string) {
    const client = this.clients.get(clientId)
    if (!client) return

    console.log(`Client ${clientId} disconnected from design ${designId}`)

    // Remove client from design group
    const designClientSet = this.designClients.get(designId)
    if (designClientSet) {
      designClientSet.delete(clientId)
      if (designClientSet.size === 0) {
        this.designClients.delete(designId)
      }
    }

    // Remove client
    this.clients.delete(clientId)

    // Notify other users
    this.broadcastToDesign(designId, clientId, {
      type: 'user_leave',
      userId: client.user.id,
      data: {},
      timestamp: Date.now()
    })
  }

  private broadcastToDesign(designId: string, excludeClientId: string, event: CollaborationEvent) {
    const designClientSet = this.designClients.get(designId)
    if (!designClientSet) return

    const message = JSON.stringify(event)

    designClientSet.forEach(clientId => {
      if (clientId !== excludeClientId) {
        const client = this.clients.get(clientId)
        if (client && client.ws.readyState === WebSocket.OPEN) {
          client.ws.send(message)
        }
      }
    })
  }

  private sendUsersList(client: CollaborationClient, designId: string) {
    const designClientSet = this.designClients.get(designId)
    if (!designClientSet) return

    const users: User[] = []
    designClientSet.forEach(clientId => {
      const otherClient = this.clients.get(clientId)
      if (otherClient && otherClient.id !== client.id) {
        users.push(otherClient.user)
      }
    })

    client.ws.send(JSON.stringify({
      type: 'users_list',
      userId: client.user.id,
      data: { users },
      timestamp: Date.now()
    }))
  }

  private isValidEvent(event: CollaborationEvent): boolean {
    const validTypes = ['cursor_move', 'element_select', 'element_update', 'element_add', 'element_delete', 'user_join', 'user_leave']
    return validTypes.includes(event.type) && !!event.userId && !!event.timestamp
  }

  private getUserColor(userId: string): string {
    const colors = [
      '#3B82F6', '#EF4444', '#10B981', '#F59E0B', '#8B5CF6',
      '#EC4899', '#14B8A6', '#F97316', '#6366F1', '#84CC16'
    ]
    const hash = userId.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0)
    return colors[hash % colors.length]
  }

  private generateClientId(): string {
    return Math.random().toString(36).substr(2, 9)
  }

  private startCleanupInterval() {
    // Clean up inactive clients every 30 seconds
    setInterval(() => {
      const now = Date.now()
      const timeout = 60000 // 1 minute timeout

      this.clients.forEach((client, clientId) => {
        if (now - client.lastActivity > timeout) {
          console.log(`Cleaning up inactive client ${clientId}`)
          client.ws.terminate()
          this.handleDisconnection(clientId, client.designId)
        }
      })
    }, 30000)
  }

  // Handle WebSocket upgrade for HTTP server
  public handleUpgrade(request: IncomingMessage, socket: any, head: Buffer) {
    this.wss.handleUpgrade(request, socket, head, (ws) => {
      this.wss.emit('connection', ws, request)
    })
  }

  // Get server statistics
  public getStats() {
    return {
      totalClients: this.clients.size,
      designs: Array.from(this.designClients.entries()).map(([designId, clients]) => ({
        designId,
        clientCount: clients.size
      }))
    }
  }
}

export default CollaborationServer
