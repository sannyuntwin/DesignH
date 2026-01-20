.PHONY: help setup dev build test clean migrate generate

# Default target
help:
	@echo "Canvas Designer Backend - Available commands:"
	@echo ""
	@echo "  setup     - Install dependencies and setup database"
	@echo "  dev       - Start development server"
	@echo "  build     - Build production binary"
	@echo "  test      - Run tests"
	@echo "  clean     - Clean build artifacts"
	@echo "  migrate   - Run database migrations"
	@echo "  generate  - Generate Prisma client"
	@echo ""

# Setup project
setup:
	@echo "🚀 Setting up Canvas Designer Backend..."
	go mod download
	go install github.com/steebchen/prisma-client-go@latest
	@if [ ! -f .env ]; then cp .env.example .env; echo "📝 Created .env file from template"; fi
	go run github.com/steebchen/prisma-client-go generate
	go run github.com/steebchen/prisma-client-go db push
	@echo "✅ Setup complete!"

# Development server
dev:
	@echo "🚀 Starting development server..."
	go run main.go

# Build production binary
build:
	@echo "🏗️  Building production binary..."
	go build -o bin/canvas-designer-backend main.go
	@echo "✅ Build complete! Binary: bin/canvas-designer-backend"

# Run tests
test:
	@echo "🧪 Running tests..."
	go test ./...

# Clean build artifacts
clean:
	@echo "🧹 Cleaning build artifacts..."
	rm -rf bin/
	rm -f main
	go clean
	@echo "✅ Clean complete!"

# Database migration
migrate:
	@echo "🗄️  Running database migrations..."
	go run github.com/steebchen/prisma-client-go db push

# Generate Prisma client
generate:
	@echo "🏗️  Generating Prisma client..."
	go run github.com/steebchen/prisma-client-go generate

# Reset database
reset-db:
	@echo "🔄 Resetting database..."
	go run github.com/steebchen/prisma-client-go db push --force-reset

# Health check
health:
	@echo "🏥 Checking server health..."
	curl -s http://localhost:8080/health | jq . || echo "Server is not running or unhealthy"

# Install dependencies
deps:
	@echo "📦 Installing dependencies..."
	go mod download
	go mod tidy

# Format code
fmt:
	@echo "🎨 Formatting code..."
	go fmt ./...

# Run linter
lint:
	@echo "🔍 Running linter..."
	golangci-lint run

# Docker build
docker-build:
	@echo "🐳 Building Docker image..."
	docker build -t canvas-designer-backend .

# Docker run
docker-run:
	@echo "🐳 Running Docker container..."
	docker run -p 8080:8080 --env-file .env canvas-designer-backend
