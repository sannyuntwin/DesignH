package handlers

import (
	"log"
	"net/http"

	"github.com/gin-gonic/gin"
	"github.com/gorilla/websocket"
)

var upgrader = websocket.Upgrader{
	CheckOrigin: func(r *http.Request) bool {
		return true // Allow all origins in development
	},
}

type WebSocketMessage struct {
	Type      string      `json:"type"`
	Data      interface{} `json:"data"`
	DesignID  string      `json:"design_id,omitempty"`
	UserID    string      `json:"user_id,omitempty"`
	Timestamp int64       `json:"timestamp"`
}

type Client struct {
	hub    *Hub
	conn   *websocket.Conn
	send   chan WebSocketMessage
	userID string
	roomID string
}

type Hub struct {
	clients    map[*Client]bool
	broadcast  chan WebSocketMessage
	register   chan *Client
	unregister chan *Client
	rooms      map[string]map[*Client]bool
}

func NewHub() *Hub {
	return &Hub{
		clients:    make(map[*Client]bool),
		broadcast:  make(chan WebSocketMessage),
		register:   make(chan *Client),
		unregister: make(chan *Client),
		rooms:      make(map[string]map[*Client]bool),
	}
}

func (h *Hub) Run() {
	for {
		select {
		case client := <-h.register:
			h.clients[client] = true
			if h.rooms[client.roomID] == nil {
				h.rooms[client.roomID] = make(map[*Client]bool)
			}
			h.rooms[client.roomID][client] = true
			log.Printf("Client %s joined room %s", client.userID, client.roomID)

		case client := <-h.unregister:
			if _, ok := h.clients[client]; ok {
				delete(h.clients, client)
				if h.rooms[client.roomID] != nil {
					delete(h.rooms[client.roomID], client)
					if len(h.rooms[client.roomID]) == 0 {
						delete(h.rooms, client.roomID)
					}
				}
				close(client.send)
				log.Printf("Client %s left room %s", client.userID, client.roomID)
			}

		case message := <-h.broadcast:
			// Broadcast to all clients in the same room
			if room, ok := h.rooms[message.DesignID]; ok {
				for client := range room {
					select {
					case client.send <- message:
					default:
						close(client.send)
						delete(h.clients, client)
						delete(room, client)
					}
				}
			}
		}
	}
}

var hub = NewHub()

func init() {
	go hub.Run()
}

func HandleWebSocket(c *gin.Context) {
	conn, err := upgrader.Upgrade(c.Writer, c.Request, nil)
	if err != nil {
		log.Printf("WebSocket upgrade error: %v", err)
		return
	}

	// Get query parameters
	userID := c.Query("user_id")
	designID := c.Query("design_id")

	if userID == "" || designID == "" {
		conn.Close()
		return
	}

	client := &Client{
		hub:    hub,
		conn:   conn,
		send:   make(chan WebSocketMessage, 256),
		userID: userID,
		roomID: designID,
	}

	client.hub.register <- client

	// Start goroutines for reading and writing
	go client.writePump()
	go client.readPump()
}

func (c *Client) readPump() {
	defer func() {
		c.hub.unregister <- c
		c.conn.Close()
	}()

	for {
		var message WebSocketMessage
		err := c.conn.ReadJSON(&message)
		if err != nil {
			if websocket.IsUnexpectedCloseError(err, websocket.CloseGoingAway, websocket.CloseAbnormalClosure) {
				log.Printf("WebSocket error: %v", err)
			}
			break
		}

		// Set message metadata
		message.UserID = c.userID
		message.Timestamp = getCurrentTimestamp()

		// Broadcast to room
		c.hub.broadcast <- message
	}
}

func (c *Client) writePump() {
	defer c.conn.Close()

	for {
		select {
		case message, ok := <-c.send:
			if !ok {
				c.conn.WriteMessage(websocket.CloseMessage, []byte{})
				return
			}

			if err := c.conn.WriteJSON(message); err != nil {
				log.Printf("WebSocket write error: %v", err)
				return
			}
		}
	}
}

func getCurrentTimestamp() int64 {
	// In a real implementation, you would use time.Now().Unix()
	return 1234567890
}

// Helper functions for different message types
func BroadcastDesignUpdate(designID string, data interface{}) {
	message := WebSocketMessage{
		Type:      "design_update",
		Data:      data,
		DesignID:  designID,
		Timestamp: getCurrentTimestamp(),
	}
	hub.broadcast <- message
}

func BroadcastCursorMove(designID, userID string, x, y float64) {
	message := WebSocketMessage{
		Type:     "cursor_move",
		Data: map[string]interface{}{
			"user_id": userID,
			"x":       x,
			"y":       y,
		},
		DesignID:  designID,
		UserID:    userID,
		Timestamp: getCurrentTimestamp(),
	}
	hub.broadcast <- message
}

func BroadcastUserJoined(designID, userID string) {
	message := WebSocketMessage{
		Type:     "user_joined",
		Data:     map[string]interface{}{"user_id": userID},
		DesignID: designID,
		UserID:   userID,
		Timestamp: getCurrentTimestamp(),
	}
	hub.broadcast <- message
}
