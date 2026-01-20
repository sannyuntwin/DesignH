package api

import (
	"database/sql"

	"github.com/gin-gonic/gin"
	"canvas-designer-backend/internal/handlers"
	"canvas-designer-backend/internal/middleware"
)

func SetupSimpleRoutes(r *gin.Engine, db *sql.DB) {
	// Initialize handlers
	authHandler := handlers.NewSimpleAuthHandler(db)
	designHandler := handlers.NewSimpleDesignHandler(db)
	templateHandler := handlers.NewSimpleTemplateHandler(db)
	uploadHandler := handlers.NewUploadHandler()

	// Public routes
	public := r.Group("/api")
	{
		public.POST("/register", authHandler.Register)
		public.POST("/login", authHandler.Login)
		public.GET("/templates", templateHandler.GetTemplates)
		public.GET("/templates/:id", templateHandler.GetTemplate)
	}

	// Protected routes
	protected := r.Group("/api")
	protected.Use(middleware.AuthMiddleware())
	{
		// User routes
		protected.GET("/profile", authHandler.GetProfile)
		protected.PUT("/profile", authHandler.UpdateProfile)

		// Design routes
		protected.GET("/designs", designHandler.GetDesigns)
		protected.POST("/designs", designHandler.CreateDesign)
		protected.GET("/designs/:id", designHandler.GetDesign)
		protected.PUT("/designs/:id", designHandler.UpdateDesign)
		protected.DELETE("/designs/:id", designHandler.DeleteDesign)
		protected.POST("/designs/:id/export", designHandler.ExportDesign)

		// Upload routes
		protected.POST("/upload", uploadHandler.UploadImage)
	}

	// Health check
	r.GET("/health", func(c *gin.Context) {
		c.JSON(200, gin.H{
			"status":  "ok",
			"message": "Canvas Designer API is running",
		})
	})
}
