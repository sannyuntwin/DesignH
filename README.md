<!-- docker-compose up postgres backend -d -->
# Canvas Designer - A Canva-like Application

A powerful design tool built with Next.js frontend and Golang backend, featuring real-time collaboration, templates, and export capabilities.

## 🚀 Features

- **Modern UI/UX**: Clean, intuitive interface built with TailwindCSS
- **Real-time Collaboration**: WebSocket-based multi-user editing
- **Design Tools**: Text, shapes, drawing, image upload
- **Templates**: Pre-designed templates for various use cases
- **Export Options**: PNG, JPG, SVG export
- **Authentication**: Secure JWT-based user system
- **Responsive Design**: Works on desktop and mobile devices
- **Database**: PostgreSQL with Prisma ORM

## 🛠 Tech Stack

### Frontend
- **Next.js 14** - React framework with App Router
- **TypeScript** - Type-safe development
- **TailwindCSS** - Utility-first CSS framework
- **Fabric.js** - Canvas manipulation library
- **Zustand** - State management
- **Lucide React** - Icon library

### Backend
- **Go 1.21+** - High-performance backend
- **Gin** - HTTP web framework
- **Prisma** - Modern database toolkit
- **PostgreSQL** - Primary database
- **JWT** - Authentication
- **WebSocket** - Real-time communication

## 📋 Prerequisites

- Node.js 18+ 
- Go 1.21+
- PostgreSQL 14+
- Git

## 🚀 Quick Start

### 1. Clone the Repository

```bash
git clone <repository-url>
cd canvas-designer
```

### 2. Docker Setup (Recommended)

#### Option A: Using Docker Compose (Easiest)

```bash
# Start all services (database + backend + frontend)
docker-compose up -d

# View logs
docker-compose logs -f

# Stop services
docker-compose down
```

#### Option B: Using Docker Compose (Backend + Database Only)

```bash
# Start backend and database only
docker-compose up postgres backend -d

# Frontend runs locally
cd frontend
npm install
npm run dev
```

#### Option C: Manual Setup

```bash
cd backend

# Install Go dependencies
go mod download

# Install Prisma CLI
go install github.com/steebchen/prisma-client-go@latest

# Copy environment file
cp .env.example .env

# Update .env with your database credentials
# DATABASE_URL=postgres://user:password@localhost/canvas_designer?sslmode=disable
# JWT_SECRET=your-super-secret-jwt-key

# Generate Prisma client
go run github.com/steebchen/prisma-client-go generate

# Push database schema
go run github.com/steebchen/prisma-client-go db push

# Run development server
go run main.go
```

### 3. Frontend Setup

```bash
cd frontend

# Install Node.js dependencies
npm install

# Run development server
npm run dev
```

### 4. Access the Application

- Frontend: http://localhost:3000
- Backend API: http://localhost:8080
- API Health Check: http://localhost:8080/health
- PostgreSQL: localhost:5432 (if using Docker)

## 📁 Project Structure

```
canvas-designer/
├── frontend/                 # Next.js frontend application
│   ├── app/                 # App Router pages
│   ├── components/          # React components
│   ├── store/              # Zustand state management
│   └── public/             # Static assets
├── backend/                 # Go backend application
│   ├── internal/
│   │   ├── api/           # API routes
│   │   ├── handlers/      # Request handlers
│   │   ├── middleware/    # HTTP middleware
│   │   ├── models/        # Database models
│   │   ├── utils/         # Utility functions
│   │   ├── config/        # Configuration
│   │   └── database/     # Database connection
│   ├── prisma/           # Prisma schema and migrations
│   ├── scripts/          # Setup scripts
│   ├── uploads/          # File upload directory
│   ├── Makefile          # Build commands
│   └── main.go          # Application entry point
└── README.md
```

## 🔧 Development

### Frontend Development

```bash
cd frontend
npm run dev          # Start development server
npm run build        # Build for production
npm run start        # Start production server
npm run lint         # Run ESLint
```

### Backend Development

```bash
cd backend

# Using Makefile (recommended)
make dev             # Start development server
make build           # Build production binary
make test            # Run tests
make migrate         # Run database migrations
make generate        # Generate Prisma client

# Or using Go commands directly
go run main.go       # Start development server
go build             # Build binary
go test ./...        # Run tests
```

### Database Management

```bash
cd backend

# Generate Prisma client
make generate

# Push schema changes
make migrate

# Reset database (destructive)
make reset-db

# View database in Prisma Studio
npx prisma studio --schema=./prisma/schema.prisma
```

## 📚 API Documentation

### Authentication Endpoints

- `POST /api/register` - Register new user
- `POST /api/login` - User login
- `GET /api/profile` - Get user profile (protected)
- `PUT /api/profile` - Update user profile (protected)

### Design Endpoints

- `GET /api/designs` - Get user designs (protected)
- `POST /api/designs` - Create new design (protected)
- `GET /api/designs/:id` - Get specific design (protected)
- `PUT /api/designs/:id` - Update design (protected)
- `DELETE /api/designs/:id` - Delete design (protected)
- `POST /api/designs/:id/export` - Export design (protected)

### Template Endpoints

- `GET /api/templates` - Get all templates
- `GET /api/templates/:id` - Get specific template

### Upload Endpoints

- `POST /api/upload` - Upload image (protected)

### WebSocket

- `GET /ws` - WebSocket connection for real-time collaboration

## 🎨 Design Features

### Tools Available
- **Select Tool** - Select and manipulate objects
- **Text Tool** - Add and edit text
- **Shape Tools** - Rectangle, Circle, Line
- **Drawing Tool** - Freehand drawing
- **Image Tool** - Upload and place images

### Properties Panel
- Fill color picker
- Stroke color picker
- Stroke width adjustment
- Font size and family controls
- Opacity and rotation controls

### Templates
- Poster templates
- Flyer templates
- Social media templates
- Business card templates

## 🗄️ Database Schema

The application uses Prisma with PostgreSQL. Key models:

- **User** - User authentication and profiles
- **Design** - User-created designs
- **Template** - Pre-designed templates
- **Element** - Individual elements within designs

View the complete schema in `backend/prisma/schema.prisma`.

## 🚀 Deployment

### Frontend Deployment (Vercel)

```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
cd frontend
vercel --prod
```

### Backend Deployment (Docker)

```dockerfile
# Dockerfile
FROM golang:1.21-alpine AS builder
WORKDIR /app
COPY . .
RUN go mod download
RUN go run github.com/steebchen/prisma-client-go generate
RUN go build -o main .

FROM alpine:latest
RUN apk --no-cache add ca-certificates
WORKDIR /root/
COPY --from=builder /app/main .
COPY --from=builder /app/prisma ./prisma
EXPOSE 8080
CMD ["./main"]
```

```bash
# Build and run
docker build -t canvas-designer-backend .
docker run -p 8080:8080 --env-file .env canvas-designer-backend
```

### Environment Variables

Backend environment variables (`.env`):

```env
# Database Configuration
DATABASE_URL=postgres://user:password@localhost/canvas_designer?sslmode=disable

# JWT Configuration
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production

# Server Configuration
PORT=8080

# File Upload Configuration
UPLOAD_DIR=uploads
MAX_FILE_SIZE=10485760
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🆘 Troubleshooting

### Common Issues

1. **Database Connection Error**
   - Ensure PostgreSQL is running
   - Check DATABASE_URL in .env file
   - Verify database exists
   - Run `make migrate` to create tables

2. **Prisma Client Generation Error**
   - Run `make generate` or `go run github.com/steebchen/prisma-client-go generate`
   - Ensure Prisma CLI is installed: `go install github.com/steebchen/prisma-client-go@latest`

3. **CORS Issues**
   - Backend CORS is configured for development
   - Update CORS settings for production domains

4. **WebSocket Connection Issues**
   - Check firewall settings
   - Verify WebSocket endpoint is accessible

5. **File Upload Issues**
   - Ensure uploads directory has write permissions
   - Check file size limits

### Getting Help

- Open an issue on GitHub
- Check the documentation
- Review existing issues

## 🎯 Roadmap

- [ ] Advanced export options (PDF, SVG)
- [ ] More template categories
- [ ] Advanced shape tools
- [ ] Layer management
- [ ] Version history
- [ ] Team collaboration features
- [ ] Plugin system
- [ ] Mobile app

---

Built with ❤️ using Next.js, Go, and Prisma
