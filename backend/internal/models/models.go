package models

import (
	"time"
)

type User struct {
	ID        string    `json:"id"`
	Email     string    `json:"email"`
	Password  string    `json:"-"`
	Name      string    `json:"name"`
	CreatedAt time.Time `json:"created_at"`
	UpdatedAt time.Time `json:"updated_at"`
}

type Design struct {
	ID          string     `json:"id"`
	Title       string     `json:"title"`
	Description string     `json:"description"`
	CanvasData  interface{} `json:"canvas_data"`
	Thumbnail   string     `json:"thumbnail"`
	UserID      string     `json:"user_id"`
	CreatedAt   time.Time  `json:"created_at"`
	UpdatedAt   time.Time  `json:"updated_at"`
}

type Template struct {
	ID          string     `json:"id"`
	Title       string     `json:"title"`
	Description string     `json:"description"`
	Category    string     `json:"category"`
	Thumbnail   string     `json:"thumbnail"`
	CanvasData  *string    `json:"canvas_data"`
	CreatedAt   time.Time  `json:"created_at"`
}

type Element struct {
	ID         string    `json:"id"`
	Type       string    `json:"type"`
	Properties string    `json:"properties"`
	DesignID   string    `json:"design_id"`
	CreatedAt  time.Time `json:"created_at"`
}

// Request/Response DTOs
type RegisterRequest struct {
	Email    string `json:"email" binding:"required,email"`
	Password string `json:"password" binding:"required,min=6"`
	Name     string `json:"name" binding:"required"`
}

type LoginRequest struct {
	Email    string `json:"email" binding:"required,email"`
	Password string `json:"password" binding:"required"`
}

type UpdateProfileRequest struct {
	Name string `json:"name" binding:"required"`
}

type CreateDesignRequest struct {
	Title       string     `json:"title" binding:"required"`
	Description string     `json:"description"`
	CanvasData  interface{} `json:"canvas_data"`
}

type UpdateDesignRequest struct {
	Title       *string    `json:"title"`
	Description *string    `json:"description"`
	CanvasData  *interface{} `json:"canvas_data"`
}
