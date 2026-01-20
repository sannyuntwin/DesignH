.PHONY: help docker-up docker-down docker-build docker-clean setup dev build test clean

# Default target
help:
	@echo "Canvas Designer - Available commands:"
	@echo ""
	@echo "  Docker Commands:"
	@echo "    docker-up    - Start all services with Docker Compose"
	@echo "    docker-down  - Stop all Docker Compose services"
	@echo "    docker-build - Build Docker images"
	@echo "    docker-clean - Clean Docker containers and images"
	@echo "    docker-logs  - View Docker logs"
	@echo ""
	@echo "  Development Commands:"
	@echo "    setup       - Install dependencies and setup database"
	@echo "    dev         - Start development server"
	@echo "    build       - Build production binary"
	@echo "    test        - Run tests"
	@echo "    clean       - Clean build artifacts"
	@echo "    migrate     - Run database migrations"
	@echo "    generate    - Generate Prisma client"
	@echo ""

# Docker commands
docker-up:
	@echo "🐳 Starting all services with Docker Compose..."
	docker-compose up -d
	@echo "✅ Services started!"
	@echo "📊 Frontend: http://localhost:3000"
	@echo "🔧 Backend: http://localhost:8080"
	@echo "🗄️  Database: postgresql://canvas_user:canvas_password@localhost:5432/canvas_designer"

docker-down:
	@echo "🛑 Stopping all Docker Compose services..."
	docker-compose down
	@echo "✅ Services stopped!"

docker-build:
	@echo "🏗️  Building Docker images..."
	docker-compose build
	@echo "✅ Images built!"

docker-clean:
	@echo "🧹 Cleaning Docker containers and images..."
	docker-compose down -v --rmi all
	docker system prune -f
	@echo "✅ Docker cleanup complete!"

docker-logs:
	@echo "📋 Following Docker logs..."
	docker-compose logs -f

# Backend development
dev:
	@echo "🚀 Starting backend development server..."
	cd backend && go run main.go

# Frontend development
dev-frontend:
	@echo "⚛️  Starting frontend development server..."
	cd frontend && npm run dev

# Full development (both frontend and backend)
dev-full:
	@echo "🚀 Starting full development environment..."
	@echo "🔧 Starting backend..."
	cd backend && go run main.go &
	@echo "⚛️  Starting frontend..."
	cd frontend && npm run dev

# Setup project
setup:
	@echo "🚀 Setting up Canvas Designer..."
	cd backend && go mod download
	cd backend && go install github.com/steebchen/prisma-client-go@latest
	cd backend && go run github.com/steebchen/prisma-client-go generate
	@if [ ! -f backend/.env ]; then cp backend/.env.example backend/.env; echo "📝 Created .env file from template"; fi
	@echo "✅ Setup complete!"

# Build production
build:
	@echo "🏗️  Building production binaries..."
	cd backend && go build -o bin/canvas-designer-backend main.go
	cd frontend && npm run build
	@echo "✅ Build complete!"

# Run tests
test:
	@echo "🧪 Running tests..."
	cd backend && go test ./...
	cd frontend && npm test

# Clean build artifacts
clean:
	@echo "🧹 Cleaning build artifacts..."
	rm -rf backend/bin/
	rm -rf frontend/.next/
	rm -rf frontend/out/
	go clean
	@echo "✅ Clean complete!"

# Database operations
migrate:
	@echo "🗄️  Running database migrations..."
	cd backend && go run github.com/steebchen/prisma-client-go db push

generate:
	@echo "🏗️  Generating Prisma client..."
	cd backend && go run github.com/steebchen/prisma-client-go generate

reset-db:
	@echo "🔄 Resetting database..."
	cd backend && go run github.com/steebchen/prisma-client-go db push --force-reset

# Health checks
health:
	@echo "🏥 Checking service health..."
	@echo "Backend:"
	@curl -s http://localhost:8080/health | jq . || echo "❌ Backend is not running"
	@echo "Frontend:"
	@curl -s http://localhost:3000 | head -1 || echo "❌ Frontend is not running"

# Install dependencies
deps:
	@echo "📦 Installing dependencies..."
	cd backend && go mod download
	cd frontend && npm install
	@echo "✅ Dependencies installed!"

# Production deployment
deploy:
	@echo "🚀 Deploying to production..."
	docker-compose -f docker-compose.prod.yml up -d --build
	@echo "✅ Deployment complete!"

# Development with Docker (backend + database only)
docker-dev:
	@echo "🐳 Starting backend and database with Docker..."
	docker-compose up postgres backend -d
	@echo "✅ Backend and database started!"
	@echo "🔧 Backend: http://localhost:8080"
	@echo "🗄️  Database: postgresql://canvas_user:canvas_password@localhost:5432/canvas_designer"
