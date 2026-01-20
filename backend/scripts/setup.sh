#!/bin/bash

# Canvas Designer Backend Setup Script

echo "🚀 Setting up Canvas Designer Backend with Prisma..."

# Check if Go is installed
if ! command -v go &> /dev/null; then
    echo "❌ Go is not installed. Please install Go 1.21 or higher."
    exit 1
fi

# Check if PostgreSQL is installed
if ! command -v psql &> /dev/null; then
    echo "❌ PostgreSQL is not installed. Please install PostgreSQL."
    exit 1
fi

# Install Go dependencies
echo "📦 Installing Go dependencies..."
go mod download

# Install Prisma CLI
echo "🔧 Installing Prisma CLI..."
go install github.com/steebchen/prisma-client-go@latest

# Generate Prisma client
echo "🏗️  Generating Prisma client..."
go run github.com/steebchen/prisma-client-go generate

# Check if .env file exists
if [ ! -f .env ]; then
    echo "📝 Creating .env file from template..."
    cp .env.example .env
    echo "⚠️  Please update the DATABASE_URL and JWT_SECRET in your .env file"
fi

# Push database schema
echo "🗄️  Pushing database schema..."
go run github.com/steebchen/prisma-client-go db push

echo "✅ Setup complete!"
echo ""
echo "🎯 Next steps:"
echo "1. Update your .env file with your PostgreSQL credentials"
echo "2. Run 'go run main.go' to start the server"
echo "3. Visit http://localhost:8080/health to check if the server is running"
