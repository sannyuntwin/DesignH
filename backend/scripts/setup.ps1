# Canvas Designer Backend Setup Script (PowerShell)

Write-Host "🚀 Setting up Canvas Designer Backend with Prisma..." -ForegroundColor Green

# Check if Go is installed
try {
    $goVersion = go version
    Write-Host "✅ Go is installed: $goVersion" -ForegroundColor Green
} catch {
    Write-Host "❌ Go is not installed. Please install Go 1.21 or higher." -ForegroundColor Red
    exit 1
}

# Check if PostgreSQL is installed
try {
    $psqlVersion = psql --version
    Write-Host "✅ PostgreSQL is installed: $psqlVersion" -ForegroundColor Green
} catch {
    Write-Host "❌ PostgreSQL is not installed. Please install PostgreSQL." -ForegroundColor Red
    exit 1
}

# Install Go dependencies
Write-Host "📦 Installing Go dependencies..." -ForegroundColor Yellow
go mod download

# Install Prisma CLI
Write-Host "🔧 Installing Prisma CLI..." -ForegroundColor Yellow
go install github.com/steebchen/prisma-client-go@latest

# Generate Prisma client
Write-Host "🏗️  Generating Prisma client..." -ForegroundColor Yellow
go run github.com/steebchen/prisma-client-go generate

# Check if .env file exists
if (-not (Test-Path .env)) {
    Write-Host "📝 Creating .env file from template..." -ForegroundColor Yellow
    Copy-Item .env.example .env
    Write-Host "⚠️  Please update the DATABASE_URL and JWT_SECRET in your .env file" -ForegroundColor Yellow
}

# Push database schema
Write-Host "🗄️  Pushing database schema..." -ForegroundColor Yellow
try {
    go run github.com/steebchen/prisma-client-go db push
    Write-Host "✅ Database schema pushed successfully!" -ForegroundColor Green
} catch {
    Write-Host "❌ Failed to push database schema. Please check your DATABASE_URL." -ForegroundColor Red
    exit 1
}

Write-Host "✅ Setup complete!" -ForegroundColor Green
Write-Host ""
Write-Host "🎯 Next steps:" -ForegroundColor Cyan
Write-Host "1. Update your .env file with your PostgreSQL credentials" -ForegroundColor White
Write-Host "2. Run 'go run main.go' to start the server" -ForegroundColor White
Write-Host "3. Visit http://localhost:8080/health to check if the server is running" -ForegroundColor White
