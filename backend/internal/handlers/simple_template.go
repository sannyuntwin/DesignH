package handlers

import (
	"database/sql"
	"net/http"

	"github.com/gin-gonic/gin"
	"canvas-designer-backend/internal/models"
)

type SimpleTemplateHandler struct {
	db *sql.DB
}

func NewSimpleTemplateHandler(db *sql.DB) *SimpleTemplateHandler {
	return &SimpleTemplateHandler{db: db}
}

func (h *SimpleTemplateHandler) GetTemplates(c *gin.Context) {
	category := c.Query("category")
	
	var query string
	var args []interface{}
	
	if category != "" {
		query = `SELECT id, title, description, category, thumbnail, canvas_data, created_at FROM templates WHERE category = $1 ORDER BY created_at DESC`
		args = append(args, category)
	} else {
		query = `SELECT id, title, description, category, thumbnail, canvas_data, created_at FROM templates ORDER BY created_at DESC`
	}
	
	rows, err := h.db.Query(query, args...)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch templates"})
		return
	}
	defer rows.Close()

	var templates []models.Template
	for rows.Next() {
		var template models.Template
		var canvasData string
		err := rows.Scan(&template.ID, &template.Title, &template.Description, &template.Category, &template.Thumbnail, &canvasData, &template.CreatedAt)
		if err != nil {
			continue
		}
		
		// Parse canvas data
		if canvasData != "" {
			template.CanvasData = &canvasData
		}
		templates = append(templates, template)
	}

	c.JSON(http.StatusOK, gin.H{"templates": templates})
}

func (h *SimpleTemplateHandler) GetTemplate(c *gin.Context) {
	templateID := c.Param("id")
	query := `SELECT id, title, description, category, thumbnail, canvas_data, created_at FROM templates WHERE id = $1`
	var template models.Template
	var canvasData string
	err := h.db.QueryRow(query, templateID).Scan(
		&template.ID, &template.Title, &template.Description, &template.Category, &template.Thumbnail, &canvasData, &template.CreatedAt,
	)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Template not found"})
		return
	}

	if canvasData != "" {
		template.CanvasData = &canvasData
	}

	c.JSON(http.StatusOK, gin.H{"template": template})
}
