package handlers

import (
	"database/sql"
	"encoding/json"
	"fmt"
	"net/http"

	"github.com/gin-gonic/gin"
	"canvas-designer-backend/internal/models"
)

type SimpleDesignHandler struct {
	db *sql.DB
}

func NewSimpleDesignHandler(db *sql.DB) *SimpleDesignHandler {
	return &SimpleDesignHandler{db: db}
}

func (h *SimpleDesignHandler) GetDesigns(c *gin.Context) {
	userID, exists := c.Get("userID")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "User not authenticated"})
		return
	}

	query := `SELECT id, title, description, canvas_data, thumbnail, created_at, updated_at FROM designs WHERE user_id = $1 ORDER BY updated_at DESC`
	rows, err := h.db.Query(query, userID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch designs"})
		return
	}
	defer rows.Close()

	var designs []models.Design
	for rows.Next() {
		var design models.Design
		var canvasData string
		err := rows.Scan(&design.ID, &design.Title, &design.Description, &canvasData, &design.Thumbnail, &design.CreatedAt, &design.UpdatedAt)
		if err != nil {
			continue
		}
		
		// Parse canvas data
		json.Unmarshal([]byte(canvasData), &design.CanvasData)
		design.UserID = userID.(string)
		designs = append(designs, design)
	}

	c.JSON(http.StatusOK, gin.H{"designs": designs})
}

func (h *SimpleDesignHandler) CreateDesign(c *gin.Context) {
	userID, exists := c.Get("userID")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "User not authenticated"})
		return
	}

	var req models.CreateDesignRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// Convert canvas data to JSON
	canvasDataJSON, err := json.Marshal(req.CanvasData)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid canvas data"})
		return
	}

	query := `INSERT INTO designs (title, description, canvas_data, user_id) VALUES ($1, $2, $3, $4) RETURNING id, title, description, created_at, updated_at`
	var design models.Design
	err = h.db.QueryRow(query, req.Title, req.Description, string(canvasDataJSON), userID).Scan(
		&design.ID, &design.Title, &design.Description, &design.CreatedAt, &design.UpdatedAt,
	)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create design"})
		return
	}

	design.UserID = userID.(string)
	design.CanvasData = req.CanvasData

	c.JSON(http.StatusCreated, gin.H{"design": design})
}

func (h *SimpleDesignHandler) GetDesign(c *gin.Context) {
	userID, exists := c.Get("userID")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "User not authenticated"})
		return
	}

	designID := c.Param("id")
	query := `SELECT id, title, description, canvas_data, thumbnail, created_at, updated_at FROM designs WHERE id = $1 AND user_id = $2`
	var design models.Design
	var canvasData string
	err := h.db.QueryRow(query, designID, userID).Scan(
		&design.ID, &design.Title, &design.Description, &canvasData, &design.Thumbnail, &design.CreatedAt, &design.UpdatedAt,
	)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Design not found"})
		return
	}

	if canvasData != "" {
		json.Unmarshal([]byte(canvasData), &design.CanvasData)
	}
	design.UserID = userID.(string)

	c.JSON(http.StatusOK, gin.H{"design": design})
}

func (h *SimpleDesignHandler) UpdateDesign(c *gin.Context) {
	userID, exists := c.Get("userID")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "User not authenticated"})
		return
	}

	designID := c.Param("id")
	var req models.UpdateDesignRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// Convert canvas data to JSON if provided
	var canvasDataJSON []byte
	var err error
	if req.CanvasData != nil {
		canvasDataJSON, err = json.Marshal(req.CanvasData)
		if err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid canvas data"})
			return
		}
	}

	query := `UPDATE designs SET title = COALESCE($1, title), description = COALESCE($2, description), canvas_data = COALESCE($3, canvas_data), updated_at = NOW() WHERE id = $4 AND user_id = $5 RETURNING id, title, description, created_at, updated_at`
	var design models.Design
	err = h.db.QueryRow(query, req.Title, req.Description, string(canvasDataJSON), designID, userID).Scan(
		&design.ID, &design.Title, &design.Description, &design.CreatedAt, &design.UpdatedAt,
	)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Design not found"})
		return
	}

	design.UserID = userID.(string)
	if req.CanvasData != nil {
		design.CanvasData = *req.CanvasData
	}

	c.JSON(http.StatusOK, gin.H{"design": design})
}

func (h *SimpleDesignHandler) ExportDesign(c *gin.Context) {
	userID, exists := c.Get("userID")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "User not authenticated"})
		return
	}

	designID := c.Param("id")
	format := c.Query("format") // png, jpg, svg
	
	if format == "" {
		format = "png"
	}

	// Get design from database
	query := `SELECT canvas_data FROM designs WHERE id = $1 AND user_id = $2`
	var canvasData string
	err := h.db.QueryRow(query, designID, userID).Scan(&canvasData)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Design not found"})
		return
	}

	// For now, return a mock export response
	// In a real implementation, you would use a library like html2canvas or similar
	c.JSON(http.StatusOK, gin.H{
		"message": "Design exported successfully",
		"format":  format,
		"url":     fmt.Sprintf("/exports/%s.%s", designID, format),
	})
}

func (h *SimpleDesignHandler) DeleteDesign(c *gin.Context) {
	userID, exists := c.Get("userID")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "User not authenticated"})
		return
	}

	designID := c.Param("id")
	query := `DELETE FROM designs WHERE id = $1 AND user_id = $2`
	result, err := h.db.Exec(query, designID, userID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to delete design"})
		return
	}

	rowsAffected, _ := result.RowsAffected()
	if rowsAffected == 0 {
		c.JSON(http.StatusNotFound, gin.H{"error": "Design not found"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Design deleted successfully"})
}
